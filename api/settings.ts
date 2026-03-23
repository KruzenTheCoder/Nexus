import type { VercelRequest, VercelResponse } from '@vercel/node';
import { loadAllConfig, saveConfig } from './_lib/configStore';

// Mask a secret string for safe display
function mask(value: string | undefined): string {
  if (!value || value.length < 8) return '';
  return value.slice(0, 4) + '••••' + value.slice(-4);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // ── GET /api/settings ─────────────────────────────────────
  if (req.method === 'GET') {
    const config = await loadAllConfig();

    // Return with secrets masked
    const safe: Record<string, any> = { ...config };
    const secretKeys = ['twilioAuthToken', 'twilioApiKey', 'twilioApiSecret', 'openaiApiKey', 'supabaseKey'];
    for (const key of secretKeys) {
      if (safe[key]) {
        safe[key + '_masked'] = mask(safe[key]);
        safe[key] = ''; // Don't send the real value to frontend
      }
    }

    return res.status(200).json({ success: true, settings: safe });
  }

  // ── POST /api/settings ────────────────────────────────────
  if (req.method === 'POST') {
    try {
      const incoming = req.body;

      // Save to Supabase config store (persists across all serverless functions)
      const saved = await saveConfig(incoming);

      // Validate Twilio credentials if provided
      let twilioValidation: any = null;
      const allConfig = await loadAllConfig();
      const sid = incoming.twilioAccountSid || allConfig.twilioAccountSid || process.env.TWILIO_ACCOUNT_SID;
      const token = incoming.twilioAuthToken || allConfig.twilioAuthToken || process.env.TWILIO_AUTH_TOKEN;

      if (sid && token && !sid.startsWith('your_') && !token.startsWith('your_')) {
        try {
          const twilio = (await import('twilio')).default;
          const client = twilio(sid, token);
          const account = await client.api.v2010.accounts(sid).fetch();
          twilioValidation = {
            valid: true,
            accountName: account.friendlyName,
            accountStatus: account.status,
          };
        } catch (err: any) {
          twilioValidation = {
            valid: false,
            error: err.status === 401
              ? 'Authentication failed — invalid Account SID or Auth Token'
              : err.message || 'Failed to connect to Twilio',
          };
        }
      }

      return res.status(200).json({
        success: true,
        message: saved
          ? 'Settings saved successfully'
          : 'Settings validated but could not persist (check Supabase connection)',
        twilioValidation,
      });
    } catch (error: any) {
      console.error('Error saving settings:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to save settings: ' + (error.message || 'Unknown error'),
      });
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}
