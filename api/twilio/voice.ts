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
}
