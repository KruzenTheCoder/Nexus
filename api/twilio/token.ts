import type { VercelRequest, VercelResponse } from '@vercel/node';
import twilio from 'twilio';
import { getTwilioConfig } from '../_lib/configStore';

const AccessToken = twilio.jwt.AccessToken;
const VoiceGrant = AccessToken.VoiceGrant;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const identity = (req.query.identity as string) || 'anonymous_agent';

  // Load credentials from Supabase config store (falls back to env vars)
  const cfg = await getTwilioConfig();

  if (!cfg.accountSid || !cfg.apiKey || !cfg.apiSecret || !cfg.twimlAppSid) {
    return res.status(500).json({
      error: 'Twilio credentials not fully configured. Please update them in System Configuration.',
    });
  }

  try {
    const token = new AccessToken(cfg.accountSid, cfg.apiKey, cfg.apiSecret, { identity });

    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: cfg.twimlAppSid,
      incomingAllow: true,
    });
    token.addGrant(voiceGrant);

    return res.json({ token: token.toJwt(), identity });
  } catch (error) {
    console.error('Error generating token:', error);
    return res.status(500).json({ error: 'Failed to generate token' });
  }
}
