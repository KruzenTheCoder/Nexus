import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Shared config store for Vercel serverless functions.
 * 
 * Bootstrapping: Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY as
 * Vercel environment variables. All other keys (Twilio, OpenAI, etc.)
 * are saved/loaded from a Supabase `system_config` table via the UI.
 * 
 * Required Supabase table:
 *   CREATE TABLE system_config (
 *     key TEXT PRIMARY KEY,
 *     value TEXT NOT NULL,
 *     updated_at TIMESTAMPTZ DEFAULT now()
 *   );
 */

let supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient | null {
  if (supabase) return supabase;

  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  supabase = createClient(url, key);
  return supabase;
}

// In-memory cache with TTL to avoid hitting Supabase on every request
let configCache: Record<string, string> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 30_000; // 30 seconds

/**
 * Load all config from Supabase system_config table.
 * Falls back to process.env if Supabase is unavailable.
 */
export async function loadAllConfig(): Promise<Record<string, string>> {
  // Return cache if fresh
  if (configCache && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
    return configCache;
  }

  const sb = getSupabase();
  if (!sb) {
    console.warn('[configStore] No Supabase credentials - using process.env only');
    return {};
  }

  try {
    const { data, error } = await sb
      .from('system_config')
      .select('key, value');

    if (error) {
      console.error('[configStore] Failed to load config:', error.message);
      return configCache || {};
    }

    const config: Record<string, string> = {};
    for (const row of data || []) {
      config[row.key] = row.value;
    }

    configCache = config;
    cacheTimestamp = Date.now();
    return config;
  } catch (err) {
    console.error('[configStore] Error loading config:', err);
    return configCache || {};
  }
}

/**
 * Save config key-value pairs to Supabase system_config table.
 * Uses upsert so existing keys are updated and new ones are inserted.
 */
export async function saveConfig(settings: Record<string, any>): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) {
    console.error('[configStore] No Supabase credentials - cannot save config');
    return false;
  }

  try {
    const rows = Object.entries(settings)
      .filter(([_, v]) => v !== undefined && v !== '')
      .map(([key, value]) => ({
        key,
        value: String(value),
        updated_at: new Date().toISOString(),
      }));

    if (rows.length === 0) return true;

    const { error } = await sb
      .from('system_config')
      .upsert(rows, { onConflict: 'key' });

    if (error) {
      console.error('[configStore] Failed to save config:', error.message);
      return false;
    }

    // Invalidate cache so next read picks up new values
    configCache = null;
    cacheTimestamp = 0;

    return true;
  } catch (err) {
    console.error('[configStore] Error saving config:', err);
    return false;
  }
}

/**
 * Get a single config value. Checks Supabase config first, then process.env.
 */
export async function getConfigValue(key: string, envFallback?: string): Promise<string | undefined> {
  const config = await loadAllConfig();
  return config[key] || (envFallback ? process.env[envFallback] : undefined) || process.env[key];
}

/**
 * Mapping from frontend config keys to process.env variable names.
 * Used by getConfigValue to check env fallbacks.
 */
export const CONFIG_TO_ENV: Record<string, string> = {
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

/**
 * Get a config value by its frontend key name.
 * Resolves: Supabase config → env var (mapped name) → undefined
 */
export async function getConfig(frontendKey: string): Promise<string | undefined> {
  const config = await loadAllConfig();
  const envKey = CONFIG_TO_ENV[frontendKey];
  return config[frontendKey] || (envKey ? process.env[envKey] : undefined);
}

/**
 * Load all config values needed for Twilio.
 */
export async function getTwilioConfig() {
  const config = await loadAllConfig();
  return {
    accountSid: config.twilioAccountSid || process.env.TWILIO_ACCOUNT_SID || '',
    authToken: config.twilioAuthToken || process.env.TWILIO_AUTH_TOKEN || '',
    apiKey: config.twilioApiKey || process.env.TWILIO_API_KEY || '',
    apiSecret: config.twilioApiSecret || process.env.TWILIO_API_SECRET || '',
    twimlAppSid: config.twilioTwimlAppSid || process.env.TWILIO_TWIML_APP_SID || '',
    callerId: config.twilioCallerId || process.env.TWILIO_CALLER_ID || '',
  };
}

/**
 * Load OpenAI API key.
 */
export async function getOpenAIKey(): Promise<string> {
  const config = await loadAllConfig();
  return config.openaiApiKey || process.env.OPENAI_API_KEY || '';
}
