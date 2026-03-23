import React, { useState, useEffect } from 'react';
import {
  Settings, Phone, Shield, Bot, Volume2, Globe, Key, Server, Radio, Hash,
  Mic, Save, ChevronRight, AlertTriangle, CheckCircle, RefreshCw, Wifi,
  Lock, Database, Bell, Zap, Monitor, Users, Clock, MessageSquare, Mail,
  Inbox, MessageCircle, Loader2, XCircle
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4444';

const TABS = [
  { id: 'sip', label: 'SIP / Trunk', icon: Phone, color: 'text-blue-600' },
  { id: 'voice_ai', label: 'Voice AI Engine', icon: Bot, color: 'text-violet-600' },
  { id: 'sms', label: 'SMS Channel', icon: MessageSquare, color: 'text-blue-500' },
  { id: 'email', label: 'Email Channel', icon: Mail, color: 'text-rose-500' },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: 'text-emerald-500' },
  { id: 'livechat', label: 'Live Chat', icon: Inbox, color: 'text-amber-500' },
  { id: 'telephony', label: 'Telephony', icon: Radio, color: 'text-emerald-600' },
  { id: 'cli', label: 'CLI Management', icon: Hash, color: 'text-amber-600' },
  { id: 'recording', label: 'Recording & Storage', icon: Mic, color: 'text-rose-600' },
  { id: 'security', label: 'Security & Auth', icon: Shield, color: 'text-slate-600' },
  { id: 'integrations', label: 'API & Integrations', icon: Zap, color: 'text-indigo-600' },
  { id: 'agents', label: 'Agent Defaults', icon: Users, color: 'text-cyan-600' },
  { id: 'system', label: 'System & Logs', icon: Server, color: 'text-slate-500' },
];

function Toggle({ checked, onChange, label, desc }: { checked: boolean; onChange: (v: boolean) => void; label: string; desc?: string }) {
  return (
    <label className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-white hover:border-blue-200 transition-colors cursor-pointer">
      <div><p className="text-sm font-semibold text-slate-900">{label}</p>{desc && <p className="text-xs text-slate-500 mt-0.5">{desc}</p>}</div>
      <div className={`relative w-10 h-5 rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-slate-200'}`} onClick={() => onChange(!checked)}>
        <div className={`absolute top-0.5 left-0.5 h-4 w-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </div>
    </label>
  );
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}

const inputCls = "block w-full rounded-lg border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2.5 border bg-white";

export default function SystemConfig() {
  const [tab, setTab] = useState('sip');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [twilioValidation, setTwilioValidation] = useState<{ valid: boolean; accountName?: string; error?: string } | null>(null);

  const [sip, setSip] = useState({ provider: 'twilio', host: '', port: '5060', transport: 'UDP', username: '', password: '', realm: '', reg_enabled: true, codec: 'opus', concurrent: 100 });
  const [voiceAi, setVoiceAi] = useState({ provider: 'openai', apiKey: '', model: 'gpt-4o', ttsProvider: 'elevenlabs', ttsKey: '', ttsVoice: 'rachel', ttsStability: 0.5, ttsSimilarity: 0.75, ttsStyle: 0.3, ttsSpeed: 1.0, ttsPitch: 0, sttProvider: 'deepgram', sttKey: '', realtime: true, latencyTarget: 500, interruptionSensitivity: 0.7, bargeInBuffer: 250, responseDelay: 400, enableNaturalSpeech: true, enableBargeIn: true });
  const [telephony, setTelephony] = useState({ dtmfMode: 'rfc2833', nat: true, jitterBuffer: 60, echoCancel: true, noiseGate: true, vadSensitivity: 3, silenceTimeout: 30 });
  const [cli, setCli] = useState({ defaultCli: '', cnamEnabled: true, reputation: true, healthCheck: true, healthInterval: 24, maxUsage: 200 });
  const [recording, setRecording] = useState({ enabled: true, format: 'mp3', stereo: true, storage: 'supabase', retention: 90, autoTranscribe: true, pciRedact: false });
  const [security, setSecurity] = useState({ mfa: false, sessionTimeout: 30, ipWhitelist: '', passwordPolicy: 'strong', auditLog: true, encryption: true });
  const [integrations, setIntegrations] = useState({ webhookUrl: '', crmSync: 'realtime', supabaseUrl: '', supabaseKey: '', slackWebhook: '', twilioSid: '', twilioToken: '', twilioApiKey: '', twilioApiSecret: '', twilioTwimlAppSid: '', twilioCallerId: '' });
  const [agents, setAgents] = useState({ defaultWrapUp: 15, autoAnswer: false, forcedDisposition: true, breakMax: 15, idleTimeout: 300, screenPop: true });
  const [system, setSystem] = useState({ logLevel: 'info', metricsInterval: 30, timezone: 'UTC', maintenanceMode: false, backupEnabled: true, backupFreq: 'daily' });

  // Omni-channel states
  const [sms, setSms] = useState({ enabled: true, provider: 'twilio', accountSid: '', authToken: '', senderId: '', messagingServiceSid: '', maxSegments: 3, optOutKeywords: 'STOP,UNSUBSCRIBE,CANCEL', optInKeyword: 'START', deliveryReports: true, mmsEnabled: false, rateLimitPerSecond: 10, templateApproval: true, defaultTemplate: '' });
  const [email, setEmail] = useState({ enabled: true, provider: 'sendgrid', apiKey: '', fromAddress: '', fromName: 'NexusCRM', replyTo: '', smtpHost: '', smtpPort: '587', smtpUser: '', smtpPass: '', smtpTls: true, trackOpens: true, trackClicks: true, unsubscribeLink: true, dailySendLimit: 10000, bounceAction: 'disable', spamScoreThreshold: 5.0, dkimEnabled: true, customDomain: '' });
  const [whatsapp, setWhatsapp] = useState({ enabled: false, provider: 'meta', businessId: '', phoneNumberId: '', accessToken: '', webhookVerifyToken: '', webhookUrl: '', displayName: '', category: 'MARKETING', qualityRating: 'GREEN', messagingLimit: 1000, sessionWindow: 24, templateNamespace: '', interactiveEnabled: true, catalogEnabled: false, readReceipts: true });
  const [livechat, setLivechat] = useState({ enabled: false, widgetColor: '#2563eb', widgetPosition: 'bottom-right', greetingMessage: 'Hi! How can we help you today?', offlineMessage: "We're currently offline. Leave a message and we'll get back to you!", autoAssign: true, maxConcurrent: 5, idleTimeout: 300, transferEnabled: true, fileUpload: true, maxFileSize: 10, allowedDomains: '', preChatForm: true, preChatFields: 'name,email', cobrowseEnabled: false, typingIndicator: true, soundNotifications: true });

  // Load saved settings on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch(`${API_URL}/api/settings`);
        if (res.ok) {
          const { settings } = await res.json();
          if (settings) {
            // Map backend settings to integrations state
            setIntegrations(prev => ({
              ...prev,
              twilioSid: settings.twilioAccountSid || prev.twilioSid,
              twilioToken: settings.twilioAuthToken || prev.twilioToken,
              twilioApiKey: settings.twilioApiKey || prev.twilioApiKey,
              twilioApiSecret: settings.twilioApiSecret || prev.twilioApiSecret,
              twilioTwimlAppSid: settings.twilioTwimlAppSid || prev.twilioTwimlAppSid,
              twilioCallerId: settings.twilioCallerId || prev.twilioCallerId,
              supabaseUrl: settings.supabaseUrl || prev.supabaseUrl,
              supabaseKey: settings.supabaseKey || prev.supabaseKey,
              webhookUrl: settings.webhookUrl || prev.webhookUrl,
              slackWebhook: settings.slackWebhook || prev.slackWebhook,
            }));
            // Map voice AI TTS settings
            setVoiceAi(prev => ({
              ...prev,
              ttsProvider: settings.ttsProvider || prev.ttsProvider,
              ttsVoice: settings.ttsVoice || prev.ttsVoice,
              ttsStability: settings.ttsStability !== undefined ? settings.ttsStability : prev.ttsStability,
              ttsSimilarity: settings.ttsSimilarity !== undefined ? settings.ttsSimilarity : prev.ttsSimilarity,
              ttsStyle: settings.ttsStyle !== undefined ? settings.ttsStyle : prev.ttsStyle,
              ttsSpeed: settings.ttsSpeed !== undefined ? settings.ttsSpeed : prev.ttsSpeed,
              interruptionSensitivity: settings.interruptionSensitivity !== undefined ? settings.interruptionSensitivity : prev.interruptionSensitivity,
              bargeInBuffer: settings.bargeInBuffer !== undefined ? settings.bargeInBuffer : prev.bargeInBuffer,
              responseDelay: settings.responseDelay !== undefined ? settings.responseDelay : prev.responseDelay,
              enableNaturalSpeech: settings.enableNaturalSpeech !== undefined ? settings.enableNaturalSpeech : prev.enableNaturalSpeech,
              enableBargeIn: settings.enableBargeIn !== undefined ? settings.enableBargeIn : prev.enableBargeIn,
            }));
          }
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    setTwilioValidation(null);

    try {
      // Map frontend state to backend config keys
      const payload: Record<string, any> = {
        twilioAccountSid: integrations.twilioSid,
        twilioAuthToken: integrations.twilioToken,
        twilioApiKey: integrations.twilioApiKey,
        twilioApiSecret: integrations.twilioApiSecret,
        twilioTwimlAppSid: integrations.twilioTwimlAppSid,
        twilioCallerId: integrations.twilioCallerId,
        supabaseUrl: integrations.supabaseUrl,
        supabaseKey: integrations.supabaseKey,
        webhookUrl: integrations.webhookUrl,
        slackWebhook: integrations.slackWebhook,
        openaiApiKey: voiceAi.apiKey,
        // Voice AI TTS settings
        ttsProvider: voiceAi.ttsProvider,
        ttsVoice: voiceAi.ttsVoice,
        ttsStability: voiceAi.ttsStability,
        ttsSimilarity: voiceAi.ttsSimilarity,
        ttsStyle: voiceAi.ttsStyle,
        ttsSpeed: voiceAi.ttsSpeed,
        // Barge-in / Interruption settings
        interruptionSensitivity: voiceAi.interruptionSensitivity,
        bargeInBuffer: voiceAi.bargeInBuffer,
        responseDelay: voiceAi.responseDelay,
        enableNaturalSpeech: voiceAi.enableNaturalSpeech,
        enableBargeIn: voiceAi.enableBargeIn,
      };

      const res = await fetch(`${API_URL}/api/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setSaveError(data.error || 'Failed to save settings');
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 4000);

        if (data.twilioValidation) {
          setTwilioValidation(data.twilioValidation);
        }
      }
    } catch (err: any) {
      setSaveError(err.message?.includes('Failed to fetch')
        ? 'Cannot reach the API server. Make sure it is running (npm run server:dev).'
        : err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">System Configuration</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage SIP trunks, voice AI, telephony, security, and all platform settings</p>
        </div>
        <button onClick={handleSave} disabled={saving} className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-all gap-2 ${saved ? 'bg-emerald-600 text-white' : saving ? 'bg-blue-400 text-white cursor-wait' : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800'}`}>
          {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : saved ? <><CheckCircle className="h-4 w-4" /> Saved!</> : <><Save className="h-4 w-4" /> Save All Settings</>}
        </button>
      </div>

      {/* Save feedback banners */}
      {saveError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800 flex items-start gap-3">
          <XCircle className="h-5 w-5 flex-shrink-0 mt-0.5 text-red-500" />
          <div><p className="font-semibold">Save failed</p><p className="mt-0.5">{saveError}</p></div>
        </div>
      )}
      {twilioValidation && (
        <div className={`border rounded-xl p-4 text-sm flex items-start gap-3 ${
          twilioValidation.valid
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-amber-50 border-amber-200 text-amber-800'
        }`}>
          {twilioValidation.valid
            ? <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5 text-emerald-500" />
            : <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5 text-amber-500" />}
          <div>
            <p className="font-semibold">{twilioValidation.valid ? 'Twilio Connected' : 'Twilio Validation Issue'}</p>
            <p className="mt-0.5">{twilioValidation.valid ? `Account: ${twilioValidation.accountName}` : twilioValidation.error}</p>
          </div>
        </div>
      )}

      <div className="flex gap-6">
        {/* Tab sidebar */}
        <div className="w-52 flex-shrink-0 space-y-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === t.id ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-600 hover:bg-white/60'}`}>
              <t.icon className={`h-4 w-4 ${tab === t.id ? t.color : 'text-slate-400'}`} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 glass-card p-6 hover:translate-y-0 min-h-[520px] animate-fade-in">

          {/* ── SIP / TRUNK ───────────────────────────── */}
          {tab === 'sip' && (
            <div className="space-y-5" key="sip">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-200"><Phone className="h-5 w-5 text-blue-500" /> SIP Trunk Configuration</h3>
              <Field label="SIP Provider">
                <select value={sip.provider} onChange={e => setSip({...sip, provider: e.target.value})} className={inputCls}>
                  <option value="twilio">Twilio Elastic SIP</option><option value="vonage">Vonage / Nexmo</option><option value="telnyx">Telnyx</option><option value="custom">Custom SIP Server</option>
                </select>
              </Field>
              {sip.provider === 'custom' && (
                <div className="grid grid-cols-2 gap-4">
                  <Field label="SIP Host / IP"><input value={sip.host} onChange={e => setSip({...sip, host: e.target.value})} className={inputCls} placeholder="sip.example.com" /></Field>
                  <Field label="Port"><input value={sip.port} onChange={e => setSip({...sip, port: e.target.value})} className={inputCls} /></Field>
                  <Field label="Username / Auth ID"><input value={sip.username} onChange={e => setSip({...sip, username: e.target.value})} className={inputCls} /></Field>
                  <Field label="Password"><input type="password" value={sip.password} onChange={e => setSip({...sip, password: e.target.value})} className={inputCls} /></Field>
                  <Field label="Transport"><select value={sip.transport} onChange={e => setSip({...sip, transport: e.target.value})} className={inputCls}><option>UDP</option><option>TCP</option><option>TLS</option><option>WSS</option></select></Field>
                  <Field label="Realm"><input value={sip.realm} onChange={e => setSip({...sip, realm: e.target.value})} className={inputCls} placeholder="Optional SIP realm" /></Field>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <Field label="Preferred Codec"><select value={sip.codec} onChange={e => setSip({...sip, codec: e.target.value})} className={inputCls}><option value="opus">Opus (HD)</option><option value="g722">G.722</option><option value="g711u">G.711 μ-law</option><option value="g711a">G.711 A-law</option></select></Field>
                <Field label="Max Concurrent Channels"><input type="number" value={sip.concurrent} onChange={e => setSip({...sip, concurrent: parseInt(e.target.value)})} className={inputCls} /></Field>
              </div>
              <Toggle checked={sip.reg_enabled} onChange={v => setSip({...sip, reg_enabled: v})} label="SIP Registration" desc="Register with the SIP provider on startup for inbound calls" />
            </div>
          )}

          {/* ── SMS CHANNEL ─────────────────────────── */}
          {tab === 'sms' && (
            <div className="space-y-5" key="sms">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-200"><MessageSquare className="h-5 w-5 text-blue-500" /> SMS Channel Configuration</h3>
              <Toggle checked={sms.enabled} onChange={v => setSms({...sms, enabled: v})} label="Enable SMS Channel" desc="Allow sending and receiving SMS messages through the omni-channel inbox" />
              {sms.enabled && (<>
              <Field label="SMS Provider">
                <select value={sms.provider} onChange={e => setSms({...sms, provider: e.target.value})} className={inputCls}>
                  <option value="twilio">Twilio</option><option value="vonage">Vonage / Nexmo</option><option value="plivo">Plivo</option><option value="telnyx">Telnyx</option><option value="sinch">Sinch</option><option value="messagebird">MessageBird</option>
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Account SID / API Key"><input value={sms.accountSid} onChange={e => setSms({...sms, accountSid: e.target.value})} className={inputCls} placeholder="ACxxxxxxxxxxxxxxx" /></Field>
                <Field label="Auth Token / Secret"><input type="password" value={sms.authToken} onChange={e => setSms({...sms, authToken: e.target.value})} className={inputCls} /></Field>
                <Field label="Sender ID / From Number" hint="Phone number or alphanumeric sender ID"><input value={sms.senderId} onChange={e => setSms({...sms, senderId: e.target.value})} className={inputCls} placeholder="+1 555-000-0000 or NEXUSCRM" /></Field>
                <Field label="Messaging Service SID" hint="Optional — used for number pool delivery"><input value={sms.messagingServiceSid} onChange={e => setSms({...sms, messagingServiceSid: e.target.value})} className={inputCls} placeholder="MGxxxxxxx" /></Field>
                <Field label="Max SMS Segments" hint="Split long messages into this many segments"><input type="number" min="1" max="10" value={sms.maxSegments} onChange={e => setSms({...sms, maxSegments: parseInt(e.target.value)})} className={inputCls} /></Field>
                <Field label="Rate Limit (messages/second)"><input type="number" min="1" max="100" value={sms.rateLimitPerSecond} onChange={e => setSms({...sms, rateLimitPerSecond: parseInt(e.target.value)})} className={inputCls} /></Field>
              </div>
              <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider pt-2">Compliance & Opt-Out</h4>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Opt-Out Keywords" hint="Comma-separated keywords that trigger unsubscribe"><input value={sms.optOutKeywords} onChange={e => setSms({...sms, optOutKeywords: e.target.value})} className={inputCls} /></Field>
                <Field label="Opt-In Keyword"><input value={sms.optInKeyword} onChange={e => setSms({...sms, optInKeyword: e.target.value})} className={inputCls} /></Field>
              </div>
              <Toggle checked={sms.deliveryReports} onChange={v => setSms({...sms, deliveryReports: v})} label="Delivery Reports" desc="Track SMS delivery status (delivered, failed, undelivered)" />
              <Toggle checked={sms.mmsEnabled} onChange={v => setSms({...sms, mmsEnabled: v})} label="MMS Support" desc="Allow sending images and rich media via MMS" />
              <Toggle checked={sms.templateApproval} onChange={v => setSms({...sms, templateApproval: v})} label="Require Template Approval" desc="All outbound SMS templates must be approved before use" />
              </>)}
            </div>
          )}

          {/* ── EMAIL CHANNEL ────────────────────────── */}
          {tab === 'email' && (
            <div className="space-y-5" key="email">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-200"><Mail className="h-5 w-5 text-rose-500" /> Email Channel Configuration</h3>
              <Toggle checked={email.enabled} onChange={v => setEmail({...email, enabled: v})} label="Enable Email Channel" desc="Send and receive email through the omni-channel inbox" />
              {email.enabled && (<>
              <Field label="Email Service Provider">
                <select value={email.provider} onChange={e => setEmail({...email, provider: e.target.value})} className={inputCls}>
                  <option value="sendgrid">SendGrid</option><option value="ses">Amazon SES</option><option value="mailgun">Mailgun</option><option value="postmark">Postmark</option><option value="smtp">Custom SMTP</option>
                </select>
              </Field>
              {email.provider === 'smtp' ? (
                <div className="grid grid-cols-2 gap-4">
                  <Field label="SMTP Host"><input value={email.smtpHost} onChange={e => setEmail({...email, smtpHost: e.target.value})} className={inputCls} placeholder="smtp.example.com" /></Field>
                  <Field label="SMTP Port"><input value={email.smtpPort} onChange={e => setEmail({...email, smtpPort: e.target.value})} className={inputCls} /></Field>
                  <Field label="SMTP Username"><input value={email.smtpUser} onChange={e => setEmail({...email, smtpUser: e.target.value})} className={inputCls} /></Field>
                  <Field label="SMTP Password"><input type="password" value={email.smtpPass} onChange={e => setEmail({...email, smtpPass: e.target.value})} className={inputCls} /></Field>
                  <Toggle checked={email.smtpTls} onChange={v => setEmail({...email, smtpTls: v})} label="Use TLS" desc="Encrypt SMTP connection" />
                </div>
              ) : (
                <Field label="API Key"><input type="password" value={email.apiKey} onChange={e => setEmail({...email, apiKey: e.target.value})} className={inputCls} placeholder="SG.xxxx or key-xxxx" /></Field>
              )}
              <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider pt-2">Sender Identity</h4>
              <div className="grid grid-cols-2 gap-4">
                <Field label="From Address"><input type="email" value={email.fromAddress} onChange={e => setEmail({...email, fromAddress: e.target.value})} className={inputCls} placeholder="outreach@yourdomain.com" /></Field>
                <Field label="From Name"><input value={email.fromName} onChange={e => setEmail({...email, fromName: e.target.value})} className={inputCls} /></Field>
                <Field label="Reply-To Address"><input type="email" value={email.replyTo} onChange={e => setEmail({...email, replyTo: e.target.value})} className={inputCls} placeholder="support@yourdomain.com" /></Field>
                <Field label="Custom Sending Domain" hint="Required for DKIM/SPF — add DNS records"><input value={email.customDomain} onChange={e => setEmail({...email, customDomain: e.target.value})} className={inputCls} placeholder="mail.yourdomain.com" /></Field>
              </div>
              <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider pt-2">Deliverability & Tracking</h4>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Daily Send Limit"><input type="number" value={email.dailySendLimit} onChange={e => setEmail({...email, dailySendLimit: parseInt(e.target.value)})} className={inputCls} /></Field>
                <Field label="Spam Score Threshold" hint="Reject emails with score above this"><input type="number" step="0.5" value={email.spamScoreThreshold} onChange={e => setEmail({...email, spamScoreThreshold: parseFloat(e.target.value)})} className={inputCls} /></Field>
                <Field label="Bounce Action"><select value={email.bounceAction} onChange={e => setEmail({...email, bounceAction: e.target.value})} className={inputCls}><option value="disable">Disable contact email</option><option value="retry">Retry once then disable</option><option value="ignore">Ignore (keep active)</option></select></Field>
              </div>
              <Toggle checked={email.trackOpens} onChange={v => setEmail({...email, trackOpens: v})} label="Track Email Opens" desc="Insert tracking pixel to monitor open rates" />
              <Toggle checked={email.trackClicks} onChange={v => setEmail({...email, trackClicks: v})} label="Track Link Clicks" desc="Rewrite URLs to track click-through rates" />
              <Toggle checked={email.unsubscribeLink} onChange={v => setEmail({...email, unsubscribeLink: v})} label="Auto-Insert Unsubscribe Link" desc="CAN-SPAM compliance — add unsubscribe footer" />
              <Toggle checked={email.dkimEnabled} onChange={v => setEmail({...email, dkimEnabled: v})} label="DKIM Signing" desc="Authenticate outbound emails with DKIM signature" />
              </>)}
            </div>
          )}

          {/* ── WHATSAPP ─────────────────────────────── */}
          {tab === 'whatsapp' && (
            <div className="space-y-5" key="whatsapp">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-200"><MessageCircle className="h-5 w-5 text-emerald-500" /> WhatsApp Business API</h3>
              <Toggle checked={whatsapp.enabled} onChange={v => setWhatsapp({...whatsapp, enabled: v})} label="Enable WhatsApp Channel" desc="Connect to WhatsApp Business API for messaging" />
              {whatsapp.enabled && (<>
              <Field label="API Provider">
                <select value={whatsapp.provider} onChange={e => setWhatsapp({...whatsapp, provider: e.target.value})} className={inputCls}>
                  <option value="meta">Meta Cloud API (Direct)</option><option value="twilio_wa">Twilio for WhatsApp</option><option value="360dialog">360dialog</option><option value="messagebird_wa">MessageBird</option><option value="vonage_wa">Vonage</option>
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Business Account ID"><input value={whatsapp.businessId} onChange={e => setWhatsapp({...whatsapp, businessId: e.target.value})} className={inputCls} placeholder="10xxxxxxxxxx" /></Field>
                <Field label="Phone Number ID"><input value={whatsapp.phoneNumberId} onChange={e => setWhatsapp({...whatsapp, phoneNumberId: e.target.value})} className={inputCls} /></Field>
                <Field label="Permanent Access Token"><input type="password" value={whatsapp.accessToken} onChange={e => setWhatsapp({...whatsapp, accessToken: e.target.value})} className={inputCls} /></Field>
                <Field label="Display Name" hint="Name shown to customers"><input value={whatsapp.displayName} onChange={e => setWhatsapp({...whatsapp, displayName: e.target.value})} className={inputCls} placeholder="NexusCRM Support" /></Field>
              </div>
              <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider pt-2">Webhooks</h4>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Webhook Callback URL" hint="Copy this into Meta Developer Console"><input value={whatsapp.webhookUrl || 'https://api.yourapp.com/webhooks/whatsapp'} onChange={e => setWhatsapp({...whatsapp, webhookUrl: e.target.value})} className={inputCls} /></Field>
                <Field label="Webhook Verify Token"><input value={whatsapp.webhookVerifyToken} onChange={e => setWhatsapp({...whatsapp, webhookVerifyToken: e.target.value})} className={inputCls} placeholder="your-secret-verify-token" /></Field>
              </div>
              <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider pt-2">Messaging Limits</h4>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Messaging Tier Limit (per day)"><input type="number" value={whatsapp.messagingLimit} onChange={e => setWhatsapp({...whatsapp, messagingLimit: parseInt(e.target.value)})} className={inputCls} /></Field>
                <Field label="Session Window (hours)" hint="Free-form replies allowed within this window"><input type="number" value={whatsapp.sessionWindow} onChange={e => setWhatsapp({...whatsapp, sessionWindow: parseInt(e.target.value)})} className={inputCls} /></Field>
                <Field label="Message Category"><select value={whatsapp.category} onChange={e => setWhatsapp({...whatsapp, category: e.target.value})} className={inputCls}><option value="MARKETING">Marketing</option><option value="UTILITY">Utility</option><option value="AUTHENTICATION">Authentication</option><option value="SERVICE">Service</option></select></Field>
                <Field label="Template Namespace"><input value={whatsapp.templateNamespace} onChange={e => setWhatsapp({...whatsapp, templateNamespace: e.target.value})} className={inputCls} placeholder="e.g. nexuscrm_templates" /></Field>
              </div>
              <Toggle checked={whatsapp.interactiveEnabled} onChange={v => setWhatsapp({...whatsapp, interactiveEnabled: v})} label="Interactive Messages" desc="Enable buttons, list messages, and quick replies" />
              <Toggle checked={whatsapp.catalogEnabled} onChange={v => setWhatsapp({...whatsapp, catalogEnabled: v})} label="Product Catalog" desc="Allow sending product catalog messages" />
              <Toggle checked={whatsapp.readReceipts} onChange={v => setWhatsapp({...whatsapp, readReceipts: v})} label="Read Receipts" desc="Show blue checkmarks when messages are read" />
              </>)}
            </div>
          )}

          {/* ── LIVE CHAT ────────────────────────────── */}
          {tab === 'livechat' && (
            <div className="space-y-5" key="livechat">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-200"><Inbox className="h-5 w-5 text-amber-500" /> Live Chat Widget</h3>
              <Toggle checked={livechat.enabled} onChange={v => setLivechat({...livechat, enabled: v})} label="Enable Live Chat Widget" desc="Deploy a chat widget on your website for real-time customer messaging" />
              {livechat.enabled && (<>
              <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Appearance</h4>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Widget Color"><div className="flex gap-2 items-center"><input type="color" value={livechat.widgetColor} onChange={e => setLivechat({...livechat, widgetColor: e.target.value})} className="h-10 w-14 rounded-lg border border-slate-200 cursor-pointer" /><input value={livechat.widgetColor} onChange={e => setLivechat({...livechat, widgetColor: e.target.value})} className={inputCls + ' flex-1'} /></div></Field>
                <Field label="Widget Position"><select value={livechat.widgetPosition} onChange={e => setLivechat({...livechat, widgetPosition: e.target.value})} className={inputCls}><option value="bottom-right">Bottom Right</option><option value="bottom-left">Bottom Left</option></select></Field>
              </div>
              <Field label="Greeting Message"><textarea rows={2} value={livechat.greetingMessage} onChange={e => setLivechat({...livechat, greetingMessage: e.target.value})} className={inputCls} /></Field>
              <Field label="Offline Message" hint="Displayed when no agents are online"><textarea rows={2} value={livechat.offlineMessage} onChange={e => setLivechat({...livechat, offlineMessage: e.target.value})} className={inputCls} /></Field>
              <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider pt-2">Routing & Limits</h4>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Max Concurrent Chats Per Agent"><input type="number" min="1" max="20" value={livechat.maxConcurrent} onChange={e => setLivechat({...livechat, maxConcurrent: parseInt(e.target.value)})} className={inputCls} /></Field>
                <Field label="Idle Timeout (seconds)" hint="Auto-close chat after customer inactivity"><input type="number" value={livechat.idleTimeout} onChange={e => setLivechat({...livechat, idleTimeout: parseInt(e.target.value)})} className={inputCls} /></Field>
                <Field label="Max File Upload Size (MB)"><input type="number" value={livechat.maxFileSize} onChange={e => setLivechat({...livechat, maxFileSize: parseInt(e.target.value)})} className={inputCls} /></Field>
                <Field label="Allowed Domains" hint="Comma-separated; blank = all domains"><input value={livechat.allowedDomains} onChange={e => setLivechat({...livechat, allowedDomains: e.target.value})} className={inputCls} placeholder="yourdomain.com, app.yourdomain.com" /></Field>
              </div>
              <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider pt-2">Pre-Chat Form</h4>
              <Toggle checked={livechat.preChatForm} onChange={v => setLivechat({...livechat, preChatForm: v})} label="Require Pre-Chat Form" desc="Collect visitor info before starting chat" />
              {livechat.preChatForm && (
                <Field label="Required Fields" hint="Comma-separated: name, email, phone, company"><input value={livechat.preChatFields} onChange={e => setLivechat({...livechat, preChatFields: e.target.value})} className={inputCls} /></Field>
              )}
              <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider pt-2">Features</h4>
              <Toggle checked={livechat.autoAssign} onChange={v => setLivechat({...livechat, autoAssign: v})} label="Auto-Assign to Agents" desc="Automatically route new chats to available agents" />
              <Toggle checked={livechat.transferEnabled} onChange={v => setLivechat({...livechat, transferEnabled: v})} label="Chat Transfer" desc="Allow agents to transfer chats to other agents or departments" />
              <Toggle checked={livechat.fileUpload} onChange={v => setLivechat({...livechat, fileUpload: v})} label="File Upload" desc="Allow customers to send files and images" />
              <Toggle checked={livechat.typingIndicator} onChange={v => setLivechat({...livechat, typingIndicator: v})} label="Typing Indicator" desc="Show 'Agent is typing...' to customers" />
              <Toggle checked={livechat.soundNotifications} onChange={v => setLivechat({...livechat, soundNotifications: v})} label="Sound Notifications" desc="Play audio alert when new chat arrives" />
              <Toggle checked={livechat.cobrowseEnabled} onChange={v => setLivechat({...livechat, cobrowseEnabled: v})} label="Co-Browse" desc="Allow agents to view the customer's screen in real-time" />
              </>)}
            </div>
          )}

          {/* ── VOICE AI ENGINE ───────────────────────── */}
          {tab === 'voice_ai' && (
            <div className="space-y-5" key="voice_ai">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-200"><Bot className="h-5 w-5 text-violet-500" /> Voice AI Engine Settings</h3>
              <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 text-xs text-violet-800 flex items-start gap-2"><Zap className="h-4 w-4 mt-0.5 flex-shrink-0" /><span>Configure the language model, text-to-speech, and speech-to-text providers used by your AI voice agents and real-time call analysis.</span></div>
              <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Language Model (LLM)</h4>
              <div className="grid grid-cols-2 gap-4">
                <Field label="LLM Provider"><select value={voiceAi.provider} onChange={e => setVoiceAi({...voiceAi, provider: e.target.value})} className={inputCls}><option value="openai">OpenAI</option><option value="anthropic">Anthropic (Claude)</option><option value="google">Google Gemini</option></select></Field>
                <Field label="Model"><select value={voiceAi.model} onChange={e => setVoiceAi({...voiceAi, model: e.target.value})} className={inputCls}><option value="gpt-4o">GPT-4o</option><option value="gpt-4-turbo">GPT-4 Turbo</option><option value="gpt-3.5-turbo">GPT-3.5 Turbo</option></select></Field>
                <Field label="API Key" hint="Encrypted at rest"><input type="password" value={voiceAi.apiKey} onChange={e => setVoiceAi({...voiceAi, apiKey: e.target.value})} className={inputCls} placeholder="sk-..." /></Field>
                <Field label="Target Latency (ms)"><input type="number" value={voiceAi.latencyTarget} onChange={e => setVoiceAi({...voiceAi, latencyTarget: parseInt(e.target.value)})} className={inputCls} /></Field>
              </div>
              <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider pt-2">Text-to-Speech (TTS)</h4>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 mb-3 flex items-start gap-2"><Zap className="h-4 w-4 mt-0.5 flex-shrink-0" /><span>Adjust <strong>Stability</strong> for consistency, <strong>Clarity</strong> for natural tone, and <strong>Style</strong> for expressiveness. Lower stability = more variable, human-like speech.</span></div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="TTS Provider"><select value={voiceAi.ttsProvider} onChange={e => setVoiceAi({...voiceAi, ttsProvider: e.target.value})} className={inputCls}><option value="elevenlabs">ElevenLabs (Most Natural)</option><option value="openai_tts">OpenAI TTS</option><option value="google_tts">Google Cloud TTS</option><option value="azure_tts">Azure Neural TTS</option><option value="browser">Browser (Web Speech API)</option></select></Field>
                <Field label="TTS API Key"><input type="password" value={voiceAi.ttsKey} onChange={e => setVoiceAi({...voiceAi, ttsKey: e.target.value})} className={inputCls} placeholder="API key for TTS provider" /></Field>
                <Field label="Voice"><select value={voiceAi.ttsVoice} onChange={e => setVoiceAi({...voiceAi, ttsVoice: e.target.value})} className={inputCls}><option value="rachel">Rachel (Female, warm)</option><option value="adam">Adam (Male, professional)</option><option value="bella">Bella (Female, friendly)</option><option value="josh">Josh (Male, authoritative)</option><option value="elli">Elli (Female, young)</option><option value="antonio">Antonio (Male, Spanish)</option><option value="sarah">Sarah (Female, soft)</option><option value="matthew">Matthew (Male, calm)</option></select></Field>
                <Field label="Speaking Speed" hint="0.5 = slow, 1.0 = normal, 1.5 = fast"><input type="range" min="0.5" max="1.5" step="0.1" value={voiceAi.ttsSpeed} onChange={e => setVoiceAi({...voiceAi, ttsSpeed: parseFloat(e.target.value)})} className="w-full accent-violet-500" /><div className="flex justify-between text-xs text-slate-500 mt-1"><span>Slow</span><span>{voiceAi.ttsSpeed}x</span><span>Fast</span></div></Field>
              </div>
              <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider pt-4">Voice Characteristics (ElevenLabs)</h4>
              <div className="grid grid-cols-3 gap-4">
                <Field label="Stability" hint="Lower = more emotional variation"><input type="range" min="0" max="1" step="0.05" value={voiceAi.ttsStability} onChange={e => setVoiceAi({...voiceAi, ttsStability: parseFloat(e.target.value)})} className="w-full accent-blue-500" /><div className="flex justify-between text-xs text-slate-500 mt-1"><span>Variable</span><span>{voiceAi.ttsStability}</span><span>Stable</span></div></Field>
                <Field label="Clarity + Similarity" hint="Higher = clearer, more natural"><input type="range" min="0" max="1" step="0.05" value={voiceAi.ttsSimilarity} onChange={e => setVoiceAi({...voiceAi, ttsSimilarity: parseFloat(e.target.value)})} className="w-full accent-emerald-500" /><div className="flex justify-between text-xs text-slate-500 mt-1"><span>Loose</span><span>{voiceAi.ttsSimilarity}</span><span>Clear</span></div></Field>
                <Field label="Style Exaggeration" hint="Higher = more expressive"><input type="range" min="0" max="1" step="0.05" value={voiceAi.ttsStyle} onChange={e => setVoiceAi({...voiceAi, ttsStyle: parseFloat(e.target.value)})} className="w-full accent-rose-500" /><div className="flex justify-between text-xs text-slate-500 mt-1"><span>Flat</span><span>{voiceAi.ttsStyle}</span><span>Expressive</span></div></Field>
              </div>
              <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider pt-4">Barge-in & Interruption Handling (VAD)</h4>
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-xs text-indigo-800 mb-3 flex items-start gap-2"><Zap className="h-4 w-4 mt-0.5 flex-shrink-0" /><span>Configure how the AI handles being interrupted. <strong>Barge-in</strong> allows users to talk over the AI. The AI will stop, listen, and respond naturally.</span></div>
              <Toggle checked={voiceAi.enableBargeIn} onChange={v => setVoiceAi({...voiceAi, enableBargeIn: v})} label="Enable Barge-in (Allow Interruptions)" desc="Users can interrupt the AI mid-sentence. AI will stop speaking and listen." />
              <Toggle checked={voiceAi.enableNaturalSpeech} onChange={v => setVoiceAi({...voiceAi, enableNaturalSpeech: v})} label="Enable Natural Speech Mode" desc="AI uses fillers, contractions, and conversational pacing. No robotic paragraphs." />
              <div className="grid grid-cols-3 gap-4">
                <Field label="Interruption Sensitivity" hint="How easily user can interrupt"><input type="range" min="0" max="1" step="0.1" value={voiceAi.interruptionSensitivity} onChange={e => setVoiceAi({...voiceAi, interruptionSensitivity: parseFloat(e.target.value)})} className="w-full accent-orange-500" /><div className="flex justify-between text-xs text-slate-500 mt-1"><span>Low</span><span>{voiceAi.interruptionSensitivity}</span><span>High</span></div></Field>
                <Field label="Barge-in Buffer (ms)" hint="Ignore noise shorter than this"><input type="number" min="100" max="1000" step="50" value={voiceAi.bargeInBuffer} onChange={e => setVoiceAi({...voiceAi, bargeInBuffer: parseInt(e.target.value)})} className={inputCls} /></Field>
                <Field label="Response Delay (ms)" hint="Thinking time before response"><input type="number" min="0" max="1000" step="50" value={voiceAi.responseDelay} onChange={e => setVoiceAi({...voiceAi, responseDelay: parseInt(e.target.value)})} className={inputCls} /></Field>
              </div>
              <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider pt-2">Speech-to-Text (STT)</h4>
              <div className="grid grid-cols-2 gap-4">
                <Field label="STT Provider"><select value={voiceAi.sttProvider} onChange={e => setVoiceAi({...voiceAi, sttProvider: e.target.value})} className={inputCls}><option value="deepgram">Deepgram</option><option value="whisper">OpenAI Whisper</option><option value="google_stt">Google Cloud STT</option><option value="azure_stt">Azure Speech</option><option value="browser">Browser (Web Speech API)</option></select></Field>
                <Field label="STT API Key"><input type="password" value={voiceAi.sttKey} onChange={e => setVoiceAi({...voiceAi, sttKey: e.target.value})} className={inputCls} /></Field>
              </div>
              <Toggle checked={voiceAi.realtime} onChange={v => setVoiceAi({...voiceAi, realtime: v})} label="Real-time Streaming Mode" desc="Stream audio for lowest-latency transcription and TTS (requires WebSocket support)" />
            </div>
          )}

          {/* ── TELEPHONY ─────────────────────────────── */}
          {tab === 'telephony' && (
            <div className="space-y-5" key="telephony">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-200"><Radio className="h-5 w-5 text-emerald-500" /> Telephony & Audio</h3>
              <div className="grid grid-cols-2 gap-4">
                <Field label="DTMF Mode"><select value={telephony.dtmfMode} onChange={e => setTelephony({...telephony, dtmfMode: e.target.value})} className={inputCls}><option value="rfc2833">RFC 2833 (Out-of-band)</option><option value="inband">In-band</option><option value="info">SIP INFO</option></select></Field>
                <Field label="Jitter Buffer (ms)"><input type="number" value={telephony.jitterBuffer} onChange={e => setTelephony({...telephony, jitterBuffer: parseInt(e.target.value)})} className={inputCls} /></Field>
                <Field label="VAD Sensitivity (1-5)"><input type="range" min="1" max="5" value={telephony.vadSensitivity} onChange={e => setTelephony({...telephony, vadSensitivity: parseInt(e.target.value)})} className="w-full accent-emerald-500" /><div className="flex justify-between text-xs text-slate-400"><span>Less sensitive</span><span>{telephony.vadSensitivity}</span><span>More sensitive</span></div></Field>
                <Field label="Silence Timeout (seconds)"><input type="number" value={telephony.silenceTimeout} onChange={e => setTelephony({...telephony, silenceTimeout: parseInt(e.target.value)})} className={inputCls} /></Field>
              </div>
              <Toggle checked={telephony.nat} onChange={v => setTelephony({...telephony, nat: v})} label="NAT Traversal" desc="Enable STUN/TURN for agents behind firewalls" />
              <Toggle checked={telephony.echoCancel} onChange={v => setTelephony({...telephony, echoCancel: v})} label="Echo Cancellation" desc="Reduce audio echo on calls" />
              <Toggle checked={telephony.noiseGate} onChange={v => setTelephony({...telephony, noiseGate: v})} label="Background Noise Suppression" desc="Filter ambient noise from agent's microphone" />
            </div>
          )}

          {/* ── CLI MANAGEMENT ────────────────────────── */}
          {tab === 'cli' && (
            <div className="space-y-5" key="cli">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-200"><Hash className="h-5 w-5 text-amber-500" /> CLI Number Management</h3>
              <Field label="Default Outbound CLI"><input value={cli.defaultCli} onChange={e => setCli({...cli, defaultCli: e.target.value})} className={inputCls} placeholder="+1 (555) 000-0000" /></Field>
              <Toggle checked={cli.cnamEnabled} onChange={v => setCli({...cli, cnamEnabled: v})} label="CNAM (Caller Name) Delivery" desc="Send business name with outbound caller ID where supported" />
              <Toggle checked={cli.reputation} onChange={v => setCli({...cli, reputation: v})} label="Number Reputation Monitoring" desc="Track SPAM/Scam labels on your outbound numbers via carrier APIs" />
              <Toggle checked={cli.healthCheck} onChange={v => setCli({...cli, healthCheck: v})} label="CLI Health Check" desc="Periodically test outbound numbers for connectivity and answer rates" />
              {cli.healthCheck && (
                <Field label="Health Check Interval (hours)"><input type="number" value={cli.healthInterval} onChange={e => setCli({...cli, healthInterval: parseInt(e.target.value)})} className={inputCls} /></Field>
              )}
              <Field label="Max Calls Per Number Per Day"><input type="number" value={cli.maxUsage} onChange={e => setCli({...cli, maxUsage: parseInt(e.target.value)})} className={inputCls} /><p className="text-xs text-slate-500 mt-1">Prevents over-use which can trigger SPAM labels.</p></Field>
            </div>
          )}

          {/* ── RECORDING ─────────────────────────────── */}
          {tab === 'recording' && (
            <div className="space-y-5" key="recording">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-200"><Mic className="h-5 w-5 text-rose-500" /> Recording & Storage</h3>
              <Toggle checked={recording.enabled} onChange={v => setRecording({...recording, enabled: v})} label="Call Recording (Global)" desc="Record all calls system-wide (can be overridden per campaign)" />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Recording Format"><select value={recording.format} onChange={e => setRecording({...recording, format: e.target.value})} className={inputCls}><option value="mp3">MP3 (Compressed)</option><option value="wav">WAV (Lossless)</option><option value="ogg">OGG Vorbis</option></select></Field>
                <Field label="Storage Backend"><select value={recording.storage} onChange={e => setRecording({...recording, storage: e.target.value})} className={inputCls}><option value="supabase">Supabase Storage</option><option value="s3">Amazon S3</option><option value="gcs">Google Cloud Storage</option><option value="local">Local Filesystem</option></select></Field>
                <Field label="Retention Period (days)" hint="0 = keep forever"><input type="number" value={recording.retention} onChange={e => setRecording({...recording, retention: parseInt(e.target.value)})} className={inputCls} /></Field>
              </div>
              <Toggle checked={recording.stereo} onChange={v => setRecording({...recording, stereo: v})} label="Stereo Recording" desc="Record agent and customer on separate channels for QA analysis" />
              <Toggle checked={recording.autoTranscribe} onChange={v => setRecording({...recording, autoTranscribe: v})} label="Auto-Transcribe Recordings" desc="Automatically transcribe calls using STT engine after call ends" />
              <Toggle checked={recording.pciRedact} onChange={v => setRecording({...recording, pciRedact: v})} label="PCI-DSS Audio Redaction" desc="Pause recording automatically when payment card data is detected" />
            </div>
          )}

          {/* ── SECURITY ──────────────────────────────── */}
          {tab === 'security' && (
            <div className="space-y-5" key="security">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-200"><Shield className="h-5 w-5 text-slate-600" /> Security & Authentication</h3>
              <Toggle checked={security.mfa} onChange={v => setSecurity({...security, mfa: v})} label="Multi-Factor Authentication (MFA)" desc="Require TOTP or SMS verification for all agent logins" />
              <Toggle checked={security.auditLog} onChange={v => setSecurity({...security, auditLog: v})} label="Audit Logging" desc="Log all admin actions for compliance and forensics" />
              <Toggle checked={security.encryption} onChange={v => setSecurity({...security, encryption: v})} label="End-to-End Encryption" desc="Encrypt all API traffic and stored credentials at rest (AES-256)" />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Session Timeout (minutes)"><input type="number" value={security.sessionTimeout} onChange={e => setSecurity({...security, sessionTimeout: parseInt(e.target.value)})} className={inputCls} /></Field>
                <Field label="Password Policy"><select value={security.passwordPolicy} onChange={e => setSecurity({...security, passwordPolicy: e.target.value})} className={inputCls}><option value="basic">Basic (8+ chars)</option><option value="moderate">Moderate (upper, lower, number)</option><option value="strong">Strong (upper, lower, number, symbol)</option></select></Field>
              </div>
              <Field label="IP Whitelist (comma-separated)" hint="Leave blank to allow all IPs"><input value={security.ipWhitelist} onChange={e => setSecurity({...security, ipWhitelist: e.target.value})} className={inputCls} placeholder="203.0.113.0/24, 198.51.100.5" /></Field>
            </div>
          )}

          {/* ── INTEGRATIONS ──────────────────────────── */}
          {tab === 'integrations' && (
            <div className="space-y-5" key="integrations">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-200"><Zap className="h-5 w-5 text-indigo-500" /> API Keys & Integrations</h3>
              <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Supabase</h4>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Supabase Project URL"><input value={integrations.supabaseUrl} onChange={e => setIntegrations({...integrations, supabaseUrl: e.target.value})} className={inputCls} placeholder="https://xxx.supabase.co" /></Field>
                <Field label="Supabase Anon Key"><input type="password" value={integrations.supabaseKey} onChange={e => setIntegrations({...integrations, supabaseKey: e.target.value})} className={inputCls} /></Field>
              </div>
              <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider pt-2">Twilio</h4>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800 flex items-start gap-2"><Zap className="h-4 w-4 mt-0.5 flex-shrink-0" /><span>Enter your Twilio credentials below. You need an <strong>Account SID</strong>, <strong>Auth Token</strong>, <strong>API Key + Secret</strong>, a <strong>TwiML App SID</strong>, and a <strong>Caller ID</strong> phone number. Get these from <a href="https://console.twilio.com" target="_blank" rel="noopener" className="underline font-semibold">console.twilio.com</a>.</span></div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Account SID" hint="Starts with AC, 34 characters"><input value={integrations.twilioSid} onChange={e => setIntegrations({...integrations, twilioSid: e.target.value})} className={inputCls} placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" /></Field>
                <Field label="Auth Token"><input type="password" value={integrations.twilioToken} onChange={e => setIntegrations({...integrations, twilioToken: e.target.value})} className={inputCls} /></Field>
                <Field label="API Key SID" hint="Starts with SK — create at Twilio Console → API Keys"><input value={integrations.twilioApiKey} onChange={e => setIntegrations({...integrations, twilioApiKey: e.target.value})} className={inputCls} placeholder="SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" /></Field>
                <Field label="API Secret"><input type="password" value={integrations.twilioApiSecret} onChange={e => setIntegrations({...integrations, twilioApiSecret: e.target.value})} className={inputCls} /></Field>
                <Field label="TwiML App SID" hint="Starts with AP — create a TwiML App in Twilio Console"><input value={integrations.twilioTwimlAppSid} onChange={e => setIntegrations({...integrations, twilioTwimlAppSid: e.target.value})} className={inputCls} placeholder="APxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" /></Field>
                <Field label="Caller ID (Phone Number)" hint="Your Twilio phone number for outbound calls"><input value={integrations.twilioCallerId} onChange={e => setIntegrations({...integrations, twilioCallerId: e.target.value})} className={inputCls} placeholder="+15551234567" /></Field>
              </div>
              <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider pt-2">Webhooks & Notifications</h4>
              <Field label="Event Webhook URL" hint="POST events (call.started, call.ended, etc.)"><input value={integrations.webhookUrl} onChange={e => setIntegrations({...integrations, webhookUrl: e.target.value})} className={inputCls} placeholder="https://hooks.example.com/events" /></Field>
              <Field label="Slack Webhook" hint="Send alerts to a Slack channel"><input value={integrations.slackWebhook} onChange={e => setIntegrations({...integrations, slackWebhook: e.target.value})} className={inputCls} placeholder="https://hooks.slack.com/services/..." /></Field>
              <Field label="CRM Sync Mode"><select value={integrations.crmSync} onChange={e => setIntegrations({...integrations, crmSync: e.target.value})} className={inputCls}><option value="realtime">Real-time (WebSocket)</option><option value="batch">Batch (every 5 min)</option><option value="manual">Manual Only</option></select></Field>
            </div>
          )}

          {/* ── AGENT DEFAULTS ────────────────────────── */}
          {tab === 'agents' && (
            <div className="space-y-5" key="agents">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-200"><Users className="h-5 w-5 text-cyan-500" /> Agent Default Settings</h3>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Default Wrap-up Time (sec)"><input type="number" value={agents.defaultWrapUp} onChange={e => setAgents({...agents, defaultWrapUp: parseInt(e.target.value)})} className={inputCls} /></Field>
                <Field label="Max Break Duration (min)"><input type="number" value={agents.breakMax} onChange={e => setAgents({...agents, breakMax: parseInt(e.target.value)})} className={inputCls} /></Field>
                <Field label="Idle Timeout (sec)" hint="Auto-pause agent after inactivity"><input type="number" value={agents.idleTimeout} onChange={e => setAgents({...agents, idleTimeout: parseInt(e.target.value)})} className={inputCls} /></Field>
              </div>
              <Toggle checked={agents.autoAnswer} onChange={v => setAgents({...agents, autoAnswer: v})} label="Auto-Answer Calls" desc="Automatically connect agents when a call is bridged (no manual accept)" />
              <Toggle checked={agents.forcedDisposition} onChange={v => setAgents({...agents, forcedDisposition: v})} label="Forced Disposition" desc="Agents must select a disposition code before receiving the next call" />
              <Toggle checked={agents.screenPop} onChange={v => setAgents({...agents, screenPop: v})} label="Screen Pop" desc="Automatically show contact details when a call connects" />
            </div>
          )}

          {/* ── SYSTEM ────────────────────────────────── */}
          {tab === 'system' && (
            <div className="space-y-5" key="system">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-200"><Server className="h-5 w-5 text-slate-500" /> System & Maintenance</h3>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Log Level"><select value={system.logLevel} onChange={e => setSystem({...system, logLevel: e.target.value})} className={inputCls}><option value="error">Error</option><option value="warn">Warning</option><option value="info">Info</option><option value="debug">Debug</option><option value="trace">Trace</option></select></Field>
                <Field label="Metrics Push Interval (sec)"><input type="number" value={system.metricsInterval} onChange={e => setSystem({...system, metricsInterval: parseInt(e.target.value)})} className={inputCls} /></Field>
                <Field label="System Timezone"><select value={system.timezone} onChange={e => setSystem({...system, timezone: e.target.value})} className={inputCls}><option value="UTC">UTC</option><option value="US/Eastern">US/Eastern</option><option value="US/Pacific">US/Pacific</option><option value="Europe/London">Europe/London</option><option value="Asia/Tokyo">Asia/Tokyo</option></select></Field>
                <Field label="Auto-Backup Frequency"><select value={system.backupFreq} onChange={e => setSystem({...system, backupFreq: e.target.value})} className={inputCls}><option value="hourly">Hourly</option><option value="daily">Daily</option><option value="weekly">Weekly</option></select></Field>
              </div>
              <Toggle checked={system.maintenanceMode} onChange={v => setSystem({...system, maintenanceMode: v})} label="Maintenance Mode" desc="Prevent new calls and show maintenance banner to agents" />
              <Toggle checked={system.backupEnabled} onChange={v => setSystem({...system, backupEnabled: v})} label="Automated Database Backups" desc="Automatically back up all data to configured storage" />
              {system.maintenanceMode && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span><strong>Warning:</strong> Maintenance mode is active. No new calls will be placed or received. Disable this setting to resume operations.</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
