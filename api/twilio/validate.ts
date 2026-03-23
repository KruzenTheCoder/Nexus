import type { VercelRequest, VercelResponse } from '@vercel/node';
import twilio from 'twilio';
import { getTwilioConfig } from '../_lib/configStore';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const cfg = await getTwilioConfig();
  const { accountSid, authToken } = req.body;
  const sid = accountSid || cfg.accountSid;
  const token = authToken || cfg.authToken;

  if (!sid || !token) {
    return res.status(400).json({ success: false, error: 'Account SID and Auth Token are required' });
  }

  if (!sid.startsWith('AC') || sid.length !== 34) {
    return res.status(400).json({ success: false, error: 'Invalid Account SID format.' });
  }

  try {
    const client = twilio(sid, token);
    const account = await client.api.v2010.accounts(sid).fetch();

    return res.json({
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
    if (statusCode === 401) message = 'Authentication failed — invalid Account SID or Auth Token';
    else if (statusCode === 404) message = 'Account not found — check your Account SID';
    else if (error.message) message = error.message;

    return res.status(statusCode).json({ success: false, error: message });
  }
}
