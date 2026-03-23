import { Router } from 'express';
import twilio from 'twilio';

const router = Router();
const AccessToken = twilio.jwt.AccessToken;
const VoiceGrant = AccessToken.VoiceGrant;

// ── Validate Twilio credentials ────────────────────────────
router.post('/validate', async (req, res) => {
  const accountSid = req.body.accountSid || process.env.TWILIO_ACCOUNT_SID;
  const authToken = req.body.authToken || process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    return res.status(400).json({
      success: false,
      error: 'Account SID and Auth Token are required',
    });
  }

  // Basic format validation
  if (!accountSid.startsWith('AC') || accountSid.length !== 34) {
    return res.status(400).json({
      success: false,
      error: 'Invalid Account SID format. Must start with "AC" and be 34 characters.',
    });
  }

  try {
    const client = twilio(accountSid, authToken);
    const account = await client.api.v2010.accounts(accountSid).fetch();

    res.json({
      success: true,
      account: {
        friendlyName: account.friendlyName,
        status: account.status,
        type: account.type,
        dateCreated: account.dateCreated,
      },
    });
  } catch (error: any) {
    const statusCode = error.status || 500;
    let message = 'Failed to connect to Twilio';

    if (statusCode === 401) {
      message = 'Authentication failed — invalid Account SID or Auth Token';
    } else if (statusCode === 404) {
      message = 'Account not found — check your Account SID';
    } else if (error.message) {
      message = error.message;
    }

    res.status(statusCode).json({
      success: false,
      error: message,
    });
  }
});

router.get('/token', (req, res) => {
  const identity = req.query.identity as string || 'anonymous_agent';

  // Used when generating any kind of tokens
  const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioApiKey = process.env.TWILIO_API_KEY;
  const twilioApiSecret = process.env.TWILIO_API_SECRET;

  // Used specifically for creating Voice tokens
  const outgoingApplicationSid = process.env.TWILIO_TWIML_APP_SID;

  if (!twilioAccountSid || !twilioApiKey || !twilioApiSecret || !outgoingApplicationSid || 
      twilioAccountSid === 'your_twilio_account_sid_here') {
    return res.status(500).json({ error: 'Twilio credentials not fully configured in .env' });
  }

  try {
    // Create an access token which we will sign and return to the client,
    // containing the grant we just created
    const token = new AccessToken(
      twilioAccountSid,
      twilioApiKey,
      twilioApiSecret,
      { identity }
    );

    // Create a Voice grant and add it to the token
    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: outgoingApplicationSid,
      incomingAllow: true, // Optional: add to allow incoming calls
    });
    token.addGrant(voiceGrant);

    // Serialize the token to a JWT string
    res.json({ token: token.toJwt(), identity });
  } catch (error) {
    console.error('Error generating token:', error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

// TwiML webhook for outgoing calls
router.post('/voice', (req, res) => {
  const To = req.body.To;
  const callerId = process.env.TWILIO_CALLER_ID;

  const response = new twilio.twiml.VoiceResponse();
  const dial = response.dial({ callerId });

  if (To) {
    // Dial the actual number
    dial.number(To);
  } else {
    response.say('Thanks for calling NexusCRM!');
  }

  res.set('Content-Type', 'text/xml');
  res.send(response.toString());
});

export default router;
