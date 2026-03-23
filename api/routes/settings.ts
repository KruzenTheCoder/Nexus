import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_PATH = path.join(__dirname, '..', 'config.json');

const router = Router();

// Helper: load config from disk
function loadConfig(): Record<string, any> {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    }
  } catch (e) {
    console.error('Failed to read config.json:', e);
  }
  return {};
}

// Helper: save config to disk AND update process.env
function saveConfig(config: Record<string, any>) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
  applyConfigToEnv(config);
}

// Apply config values to process.env so the Twilio token endpoint picks them up
export function applyConfigToEnv(config: Record<string, any>) {
  const envMap: Record<string, string> = {
    twilioAccountSid: 'TWILIO_ACCOUNT_SID',
    twilioAuthToken: 'TWILIO_AUTH_TOKEN',
    twilioApiKey: 'TWILIO_API_KEY',
    twilioApiSecret: 'TWILIO_API_SECRET',
    twilioTwimlAppSid: 'TWILIO_TWIML_APP_SID',
    twilioCallerId: 'TWILIO_CALLER_ID',
    openaiApiKey: 'OPENAI_API_KEY',
    supabaseUrl: 'VITE_SUPABASE_URL',
    supabaseKey: 'VITE_SUPABASE_ANON_KEY',
  };

  for (const [configKey, envKey] of Object.entries(envMap)) {
    if (config[configKey] && config[configKey] !== '') {
      process.env[envKey] = config[configKey];
    }
  }
}

// Load config on module import (called at server startup)
export function loadConfigOnStartup() {
  const config = loadConfig();
  if (Object.keys(config).length > 0) {
    console.log('Loaded saved settings from config.json');
    applyConfigToEnv(config);
  }
}

// Mask a secret string for safe display
function mask(value: string | undefined): string {
  if (!value || value.length < 8 || value.startsWith('your_')) return '';
  return value.slice(0, 4) + '••••' + value.slice(-4);
}

// ── GET /api/settings ─────────────────────────────────────
router.get('/', (_req, res) => {
  const config = loadConfig();
  
  // Return with secrets masked
  const safe: Record<string, any> = { ...config };
  const secretKeys = ['twilioAuthToken', 'twilioApiKey', 'twilioApiSecret', 'openaiApiKey', 'supabaseKey'];
  for (const key of secretKeys) {
    if (safe[key]) {
      safe[key + '_masked'] = mask(safe[key]);
      safe[key] = ''; // Don't send the real value to frontend
    }
  }

  res.json({ success: true, settings: safe });
});

// ── POST /api/settings ────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const incoming = req.body;
    
    // Merge with existing config (so partial saves work)
    const existing = loadConfig();
    const merged: Record<string, any> = { ...existing };

    // Only overwrite keys that were actually sent and are non-empty
    for (const [key, value] of Object.entries(incoming)) {
      if (value !== undefined && value !== '') {
        merged[key] = value;
      }
    }

    // Save to disk + update process.env
    saveConfig(merged);

    // Validate Twilio credentials if they were provided
    let twilioValidation: any = null;
    const sid = merged.twilioAccountSid;
    const token = merged.twilioAuthToken;
    
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

    res.json({
      success: true,
      message: 'Settings saved successfully',
      twilioValidation,
    });
  } catch (error: any) {
    console.error('Error saving settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save settings: ' + (error.message || 'Unknown error'),
    });
  }
});

export default router;
