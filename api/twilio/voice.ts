import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const twilio = (await import('twilio')).default;
    const { getTwilioConfig } = await import('../_lib/configStore');

    const cfg = await getTwilioConfig();
    const { To } = req.body;
    const callerId = cfg.callerId;

    const response = new twilio.twiml.VoiceResponse();
    const dial = response.dial({ callerId });

    if (To) {
      dial.number(To);
    } else {
      response.say('Thanks for calling NexusCRM!');
    }

    res.setHeader('Content-Type', 'text/xml');
    return res.send(response.toString());
  } catch (error: any) {
    console.error('Error in /api/twilio/voice:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate TwiML' });
  }
}
