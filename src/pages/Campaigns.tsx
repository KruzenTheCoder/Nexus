import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Plus, Play, Pause, Settings, BarChart2, Trash2, Edit, PhoneCall, Users,
  Clock, AlertTriangle, Workflow, MessageSquare, X, ArrowLeft, ChevronRight,
  Phone, Shield, RefreshCw, Volume2, Bot, Layers, Radio, Hash, Mic, Save,
  CheckCircle, XCircle, TrendingUp, Mail, Inbox, MessageCircle
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

interface Campaign {
  id: string;
  name: string;
  type: string;
  dial_mode: string;
  status: string;
  created_at: string;
  configuration?: any;
}

type ViewMode = 'list' | 'edit' | 'stats';

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [workflows, setWorkflows] = useState<any[]>([]);

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [selectedCampaignForStats, setSelectedCampaignForStats] = useState<Campaign | null>(null);
  const [campaignStats, setCampaignStats] = useState<any>(null);
  const [configTab, setConfigTab] = useState('general');

  const { user } = useAuthStore();
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    type: 'outbound',
    dial_mode: 'predictive',
    status: 'draft',
    configuration: {
      dial_ratio: 3,
      max_drop_rate: 3,
      ring_timeout: 30,
      caller_id: '+1234567890',
      amd_enabled: true,
      amd_action: 'hangup',
      workflow_id: '',
      recording_enabled: true,
      max_call_duration: 3600,
      retry_rules: {
        max_attempts: 3,
        retry_delay_minutes: 60,
        retry_on_busy: true,
        retry_on_no_answer: true
      },
      ivr_settings: {
        enabled: false,
        greeting_message: '',
        timeout_seconds: 10,
        fallback_action: 'disconnect'
      },
      // NEW extended config
      cli_rotation: {
        enabled: false,
        numbers: [],
        strategy: 'round_robin'
      },
      whisper_message: '',
      wrap_up_time: 15,
      priority: 'normal',
      time_zone_mode: 'lead_timezone',
      concurrent_calls_limit: 50,
      disposal_codes: ['Connected', 'No Answer', 'Busy', 'Voicemail', 'Invalid Number', 'Callback Requested', 'DNC'],
      compliance: {
        dnc_check: true,
        tcpa_mode: false,
        consent_required: false,
        max_daily_attempts: 3
      },
      // Channel configuration
      channels: {
        voice: { enabled: true },
        sms: {
          enabled: false,
          template: '',
          followUpDelay: 30,
          sendWindow: { start: '09:00', end: '20:00' },
          optOutMessage: 'Reply STOP to unsubscribe'
        },
        email: {
          enabled: false,
          subject: '',
          templateId: '',
          fromName: '',
          followUpDelay: 60,
          sendWindow: { start: '08:00', end: '18:00' },
          trackOpens: true,
          trackClicks: true
        },
        whatsapp: {
          enabled: false,
          templateName: '',
          headerType: 'none',
          followUpDelay: 60,
          sessionFollowUp: true
        }
      },
      channel_strategy: 'voice_first',
      channel_escalation: true,
      channel_sequence_delay: 30
    } as any
  });

  useEffect(() => {
    fetchCampaigns();
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const { data } = await supabase.from('workflows').select('id, name').order('created_at', { ascending: false });
      if (data) setWorkflows(data);
    } catch (err) {
      console.error('Failed to load workflows', err);
    }
  };

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('campaigns').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCampaignId) {
        const { error } = await supabase.from('campaigns').update(newCampaign).eq('id', editingCampaignId);
        if (error) throw error;
        setCampaigns(campaigns.map(c => c.id === editingCampaignId ? { ...c, ...newCampaign } as Campaign : c));
      } else {
        const { data, error } = await supabase.from('campaigns').insert([{
          ...newCampaign,
          created_by: user?.id
        }]).select();
        if (error) throw error;
        if (data) setCampaigns([data[0], ...campaigns]);
      }
      setViewMode('list');
      setEditingCampaignId(null);
      resetForm();
    } catch (error) {
      console.error('Error saving campaign:', error);
      alert('Failed to save campaign');
    }
  };

  const resetForm = () => {
    setNewCampaign({
      name: '', type: 'outbound', dial_mode: 'predictive', status: 'draft',
      configuration: {
        dial_ratio: 3, max_drop_rate: 3, ring_timeout: 30, caller_id: '+1234567890',
        amd_enabled: true, amd_action: 'hangup', workflow_id: '', recording_enabled: true,
        max_call_duration: 3600,
        retry_rules: { max_attempts: 3, retry_delay_minutes: 60, retry_on_busy: true, retry_on_no_answer: true },
        ivr_settings: { enabled: false, greeting_message: '', timeout_seconds: 10, fallback_action: 'disconnect' },
        cli_rotation: { enabled: false, numbers: [], strategy: 'round_robin' },
        whisper_message: '', wrap_up_time: 15, priority: 'normal', time_zone_mode: 'lead_timezone',
        concurrent_calls_limit: 50,
        disposal_codes: ['Connected', 'No Answer', 'Busy', 'Voicemail', 'Invalid Number', 'Callback Requested', 'DNC'],
        compliance: { dnc_check: true, tcpa_mode: false, consent_required: false, max_daily_attempts: 3 },
        channels: {
          voice: { enabled: true },
          sms: { enabled: false, template: '', followUpDelay: 30, sendWindow: { start: '09:00', end: '20:00' }, optOutMessage: 'Reply STOP to unsubscribe' },
          email: { enabled: false, subject: '', templateId: '', fromName: '', followUpDelay: 60, sendWindow: { start: '08:00', end: '18:00' }, trackOpens: true, trackClicks: true },
          whatsapp: { enabled: false, templateName: '', headerType: 'none', followUpDelay: 60, sessionFollowUp: true }
        },
        channel_strategy: 'voice_first', channel_escalation: true, channel_sequence_delay: 30
      }
    });
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;
    try {
      const { error } = await supabase.from('campaigns').delete().eq('id', id);
      if (error) throw error;
      setCampaigns(campaigns.filter(c => c.id !== id));
    } catch (error) {
      console.error('Error deleting campaign:', error);
      alert('Failed to delete campaign');
    }
  };

  const openEditPanel = (campaign: Campaign) => {
    setNewCampaign({
      name: campaign.name,
      type: campaign.type,
      dial_mode: campaign.dial_mode,
      status: campaign.status,
      configuration: {
        ...resetForm, // defaults
        dial_ratio: 3, max_drop_rate: 3, ring_timeout: 30, caller_id: '', amd_enabled: true,
        amd_action: 'hangup', workflow_id: '', recording_enabled: true, max_call_duration: 3600,
        retry_rules: { max_attempts: 3, retry_delay_minutes: 60, retry_on_busy: true, retry_on_no_answer: true },
        ivr_settings: { enabled: false, greeting_message: '', timeout_seconds: 10, fallback_action: 'disconnect' },
        cli_rotation: { enabled: false, numbers: [], strategy: 'round_robin' },
        whisper_message: '', wrap_up_time: 15, priority: 'normal', time_zone_mode: 'lead_timezone',
        concurrent_calls_limit: 50,
        disposal_codes: ['Connected', 'No Answer', 'Busy', 'Voicemail', 'Invalid Number', 'Callback Requested', 'DNC'],
        compliance: { dnc_check: true, tcpa_mode: false, consent_required: false, max_daily_attempts: 3 },
        channels: {
          voice: { enabled: true },
          sms: { enabled: false, template: '', followUpDelay: 30, sendWindow: { start: '09:00', end: '20:00' }, optOutMessage: 'Reply STOP to unsubscribe' },
          email: { enabled: false, subject: '', templateId: '', fromName: '', followUpDelay: 60, sendWindow: { start: '08:00', end: '18:00' }, trackOpens: true, trackClicks: true },
          whatsapp: { enabled: false, templateName: '', headerType: 'none', followUpDelay: 60, sessionFollowUp: true }
        },
        channel_strategy: 'voice_first', channel_escalation: true, channel_sequence_delay: 30,
        ...(campaign.configuration || {})
      }
    });
    setEditingCampaignId(campaign.id);
    setConfigTab('general');
    setViewMode('edit');
  };

  const openCreatePanel = () => {
    setEditingCampaignId(null);
    resetForm();
    setConfigTab('general');
    setViewMode('edit');
  };

  const toggleCampaignStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    try {
      const { error } = await supabase.from('campaigns').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
      setCampaigns(campaigns.map(c => c.id === id ? { ...c, status: newStatus } : c));
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const viewStats = async (campaign: Campaign) => {
    setSelectedCampaignForStats(campaign);
    setViewMode('stats');
    setCampaignStats(null);
    try {
      const { data, error } = await supabase.from('calls').select('status, duration, disposition').eq('campaign_id', campaign.id);
      if (error) throw error;
      if (data) {
        let connected = 0, noAnswer = 0, failed = 0, totalDuration = 0;
        data.forEach(call => {
          totalDuration += call.duration || 0;
          if (call.status === 'completed') connected++;
          else if (call.status === 'failed') failed++;
          if (call.disposition?.toLowerCase().includes('no answer')) noAnswer++;
        });
        setCampaignStats({
          total: data.length, connected, failed, noAnswer,
          avgDuration: data.length > 0 ? Math.floor(totalDuration / data.length) : 0,
          connectRate: data.length > 0 ? ((connected / data.length) * 100).toFixed(1) : 0
        });
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
      setCampaignStats({ error: true });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-800';
      case 'paused': return 'bg-amber-100 text-amber-800';
      case 'draft': return 'bg-slate-100 text-slate-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  // helper for config
  const cfg = newCampaign.configuration || {};
  const updateCfg = (patch: any) => {
    setNewCampaign({ ...newCampaign, configuration: { ...cfg, ...patch } });
  };

  // ─── CONFIG TABS ────────────────────────────────────
  const CONFIG_TABS = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'dialer', label: 'Dialer Engine', icon: PhoneCall },
    { id: 'cli', label: 'CLI & Caller ID', icon: Hash },
    { id: 'amd', label: 'AMD & Detection', icon: Radio },
    { id: 'retry', label: 'Retry & Recycling', icon: RefreshCw },
    { id: 'workflow', label: 'AI & Workflows', icon: Bot },
    { id: 'ivr', label: 'IVR & Routing', icon: Volume2 },
    { id: 'compliance', label: 'Compliance', icon: Shield },
    { id: 'disposal', label: 'Dispositions', icon: Layers },
    { id: 'channels', label: 'Channels', icon: Inbox },
  ];

  // ═══════════════════════════════════════════════════════
  // RENDER: Stats Panel (inline)
  // ═══════════════════════════════════════════════════════
  if (viewMode === 'stats' && selectedCampaignForStats) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <button onClick={() => setViewMode('list')} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">{selectedCampaignForStats.name}</h1>
            <p className="text-sm text-slate-500 flex items-center gap-1">
              <Settings className="h-3.5 w-3.5" /> {selectedCampaignForStats.dial_mode.toUpperCase()} MODE • Campaign Statistics
            </p>
          </div>
        </div>

        {!campaignStats ? (
          <div className="glass-card p-12 flex items-center justify-center hover:translate-y-0">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-slate-500 font-medium">Loading live statistics...</p>
            </div>
          </div>
        ) : campaignStats.error ? (
          <div className="glass-card p-12 flex items-center justify-center text-red-500 hover:translate-y-0">
            <AlertTriangle className="h-8 w-8 mr-3" /> Failed to load campaign statistics.
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Calls Dialed', value: campaignStats.total, icon: PhoneCall, color: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200' },
              { label: 'Connect Rate', value: `${campaignStats.connectRate}%`, icon: Users, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
              { label: 'Avg Handle Time', value: `${Math.floor(campaignStats.avgDuration / 60)}m ${campaignStats.avgDuration % 60}s`, icon: Clock, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
              { label: 'Dropped / Failed', value: campaignStats.failed, icon: AlertTriangle, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
            ].map((item, i) => (
              <div key={i} className={`${item.bg} p-5 rounded-xl border ${item.border} animate-fade-in-up stagger-${i + 1}`} style={{ opacity: 0 }}>
                <div className={`flex items-center ${item.color} mb-2`}>
                  <item.icon className="h-4 w-4 mr-2" /> <span className="text-sm font-medium">{item.label}</span>
                </div>
                <div className={`text-3xl font-bold ${item.color}`}>{item.value}</div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-between items-center">
          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">Download Full Report</button>
          <button onClick={() => setViewMode('list')} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors">
            Back to Campaigns
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════
  // RENDER: Edit / Create Panel (inline full-screen config)
  // ═══════════════════════════════════════════════════════
  if (viewMode === 'edit') {
    return (
      <div className="animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => { setViewMode('list'); setEditingCampaignId(null); }} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
                {editingCampaignId ? 'Edit Campaign' : 'Create New Campaign'}
              </h1>
              <p className="text-sm text-slate-500">Configure every aspect of this campaign</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setViewMode('list'); setEditingCampaignId(null); }} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button onClick={handleSaveCampaign} className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-sm transition-all flex items-center gap-2">
              <Save className="h-4 w-4" />
              Save Campaign
            </button>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Sidebar Tabs */}
          <div className="w-56 flex-shrink-0 space-y-1">
            {CONFIG_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setConfigTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  configTab === tab.id
                    ? 'bg-blue-50 text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'
                }`}
              >
                <tab.icon className={`h-4 w-4 ${configTab === tab.id ? 'text-blue-600' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Config Content */}
          <div className="flex-1 glass-card p-6 hover:translate-y-0 min-h-[520px]">
            <form onSubmit={handleSaveCampaign}>
              {/* ─── GENERAL ─────────────────────────────── */}
              {configTab === 'general' && (
                <div className="space-y-5 animate-fade-in">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-200">
                    <Settings className="h-5 w-5 text-slate-500" /> General Information
                  </h3>
                  <div className="grid grid-cols-2 gap-5">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Campaign Name</label>
                      <input required type="text" value={newCampaign.name} onChange={e => setNewCampaign({ ...newCampaign, name: e.target.value })} className="block w-full rounded-lg border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2.5 border bg-white" placeholder="e.g. Q3 B2B Outbound" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Direction Type</label>
                      <select value={newCampaign.type} onChange={e => setNewCampaign({ ...newCampaign, type: e.target.value })} className="block w-full rounded-lg border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2.5 border bg-white">
                        <option value="outbound">Outbound</option>
                        <option value="inbound">Inbound</option>
                        <option value="mixed">Mixed (Blended)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Campaign Priority</label>
                      <select value={cfg.priority || 'normal'} onChange={e => updateCfg({ priority: e.target.value })} className="block w-full rounded-lg border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2.5 border bg-white">
                        <option value="low">Low</option>
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Timezone Mode</label>
                      <select value={cfg.time_zone_mode || 'lead_timezone'} onChange={e => updateCfg({ time_zone_mode: e.target.value })} className="block w-full rounded-lg border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2.5 border bg-white">
                        <option value="lead_timezone">Lead's Timezone</option>
                        <option value="agent_timezone">Agent's Timezone</option>
                        <option value="campaign_timezone">Campaign Timezone (Fixed)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Concurrent Calls Limit</label>
                      <input type="number" min="1" max="500" value={cfg.concurrent_calls_limit || 50} onChange={e => updateCfg({ concurrent_calls_limit: parseInt(e.target.value) })} className="block w-full rounded-lg border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2.5 border bg-white" />
                    </div>
                    <div className="col-span-2 flex items-center gap-6 pt-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={cfg.recording_enabled || false} onChange={e => updateCfg({ recording_enabled: e.target.checked })} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600" />
                        <span className="text-sm font-medium text-slate-700">Enable Call Recording</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── DIALER ENGINE ────────────────────────── */}
              {configTab === 'dialer' && (
                <div className="space-y-5 animate-fade-in">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-200">
                    <PhoneCall className="h-5 w-5 text-blue-500" /> Dialer Engine Configuration
                  </h3>
                  <div className="grid grid-cols-2 gap-5">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Dialing Engine Mode</label>
                      <select value={newCampaign.dial_mode} onChange={e => setNewCampaign({ ...newCampaign, dial_mode: e.target.value })} className="block w-full rounded-lg border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2.5 border bg-white">
                        <option value="predictive">Predictive — Multiple calls per agent based on algorithm</option>
                        <option value="power">Power — 1:1 ratio, drops voicemail automatically</option>
                        <option value="progressive">Progressive — Dials exactly when agent is ready</option>
                        <option value="preview">Preview — Agent clicks to dial after reviewing</option>
                      </select>
                      <p className="text-xs text-blue-600 mt-1">Predictive mode requires at least 5 active agents to function efficiently.</p>
                    </div>
                    {(newCampaign.dial_mode === 'predictive' || newCampaign.dial_mode === 'power') && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1.5">Dial Ratio (Lines per agent)</label>
                          <input type="number" min="1" max="10" value={cfg.dial_ratio || 3} onChange={e => updateCfg({ dial_ratio: parseInt(e.target.value) })} className="block w-full rounded-lg border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2.5 border bg-white" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1.5">Max Drop Rate (%)</label>
                          <input type="number" min="1" max="10" value={cfg.max_drop_rate || 3} onChange={e => updateCfg({ max_drop_rate: parseInt(e.target.value) })} className="block w-full rounded-lg border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2.5 border bg-white" />
                        </div>
                      </>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Ring Timeout (Seconds)</label>
                      <input type="number" min="10" max="60" value={cfg.ring_timeout || 30} onChange={e => updateCfg({ ring_timeout: parseInt(e.target.value) })} className="block w-full rounded-lg border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2.5 border bg-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Max Call Duration (Seconds)</label>
                      <input type="number" min="60" value={cfg.max_call_duration || 3600} onChange={e => updateCfg({ max_call_duration: parseInt(e.target.value) })} className="block w-full rounded-lg border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2.5 border bg-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Agent Wrap-up Time (Seconds)</label>
                      <input type="number" min="0" max="120" value={cfg.wrap_up_time || 15} onChange={e => updateCfg({ wrap_up_time: parseInt(e.target.value) })} className="block w-full rounded-lg border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2.5 border bg-white" />
                      <p className="text-xs text-slate-500 mt-1">Time given to agents after a call ends before the next one rings.</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Whisper Message</label>
                      <input type="text" value={cfg.whisper_message || ''} onChange={e => updateCfg({ whisper_message: e.target.value })} className="block w-full rounded-lg border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2.5 border bg-white" placeholder="e.g. 'Insurance lead from Facebook'" />
                      <p className="text-xs text-slate-500 mt-1">Played to the agent before connecting to the caller.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── CLI / CALLER ID ─────────────────────── */}
              {configTab === 'cli' && (
                <div className="space-y-5 animate-fade-in">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-200">
                    <Hash className="h-5 w-5 text-violet-500" /> Caller ID & CLI Rotation
                  </h3>
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Primary Caller ID (CLI)</label>
                      <input type="text" value={cfg.caller_id || ''} onChange={e => updateCfg({ caller_id: e.target.value })} className="block w-full rounded-lg border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2.5 border bg-white" placeholder="+1 (555) 000-0000" />
                    </div>

                    <div className="p-4 rounded-xl border border-violet-200 bg-violet-50">
                      <label className="flex items-center gap-2 cursor-pointer mb-3">
                        <input type="checkbox" checked={cfg.cli_rotation?.enabled || false} onChange={e => updateCfg({ cli_rotation: { ...cfg.cli_rotation, enabled: e.target.checked } })} className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-600" />
                        <span className="text-sm font-semibold text-violet-900">Enable CLI Rotation</span>
                      </label>
                      <p className="text-xs text-violet-700 mb-3">Cycle through multiple outbound numbers to improve answer rates and avoid SPAM labels.</p>

                      {cfg.cli_rotation?.enabled && (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-semibold text-violet-800 mb-1">Rotation Strategy</label>
                            <select value={cfg.cli_rotation?.strategy || 'round_robin'} onChange={e => updateCfg({ cli_rotation: { ...cfg.cli_rotation, strategy: e.target.value } })} className="block w-full rounded-lg border-violet-200 shadow-sm focus:border-violet-500 focus:ring-violet-500 text-sm p-2 border bg-white">
                              <option value="round_robin">Round Robin — Cycle sequentially</option>
                              <option value="random">Random — Pick randomly each call</option>
                              <option value="area_code_match">Area Code Match — Match lead's area code</option>
                              <option value="reputation_based">Reputation Based — Prioritize cleanest numbers</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-violet-800 mb-1">Rotation Numbers (one per line)</label>
                            <textarea
                              rows={4}
                              value={(cfg.cli_rotation?.numbers || []).join('\n')}
                              onChange={e => updateCfg({ cli_rotation: { ...cfg.cli_rotation, numbers: e.target.value.split('\n').filter(Boolean) } })}
                              className="block w-full rounded-lg border-violet-200 shadow-sm focus:border-violet-500 focus:ring-violet-500 text-sm p-2.5 border bg-white font-mono"
                              placeholder={"+1 (555) 100-0001\n+1 (555) 100-0002\n+1 (555) 100-0003"}
                            />
                            <p className="text-xs text-violet-600 mt-1">{(cfg.cli_rotation?.numbers || []).length} numbers configured</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ─── AMD ──────────────────────────────────── */}
              {configTab === 'amd' && (
                <div className="space-y-5 animate-fade-in">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-200">
                    <Radio className="h-5 w-5 text-rose-500" /> Answering Machine Detection
                  </h3>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={cfg.amd_enabled || false} onChange={e => updateCfg({ amd_enabled: e.target.checked })} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600" />
                    <span className="text-sm font-semibold text-slate-900">Enable Answering Machine Detection (AMD)</span>
                  </label>
                  {cfg.amd_enabled && (
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Action upon detecting Voicemail</label>
                        <select value={cfg.amd_action || 'hangup'} onChange={e => updateCfg({ amd_action: e.target.value })} className="block w-full rounded-lg border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2.5 border bg-white">
                          <option value="hangup">Drop / Hangup immediately</option>
                          <option value="leave_message">Leave pre-recorded message (AI Voice)</option>
                          <option value="route_to_agent">Bridge to Agent anyway</option>
                          <option value="play_audio">Play custom audio file</option>
                        </select>
                      </div>
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                        <span>AMD may occasionally misclassify live humans as machines. Consider using "Bridge to Agent" for high-value campaigns.</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ─── RETRY ────────────────────────────────── */}
              {configTab === 'retry' && (
                <div className="space-y-5 animate-fade-in">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-200">
                    <RefreshCw className="h-5 w-5 text-amber-500" /> Lead Recycling & Retries
                  </h3>
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Max Attempts Per Lead</label>
                      <input type="number" min="1" max="20" value={cfg.retry_rules?.max_attempts || 3} onChange={e => updateCfg({ retry_rules: { ...cfg.retry_rules, max_attempts: parseInt(e.target.value) } })} className="block w-full rounded-lg border-slate-200 shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm p-2.5 border bg-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Retry Delay (Minutes)</label>
                      <input type="number" min="5" value={cfg.retry_rules?.retry_delay_minutes || 60} onChange={e => updateCfg({ retry_rules: { ...cfg.retry_rules, retry_delay_minutes: parseInt(e.target.value) } })} className="block w-full rounded-lg border-slate-200 shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm p-2.5 border bg-white" />
                    </div>
                    <div className="col-span-2 flex gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={cfg.retry_rules?.retry_on_busy || false} onChange={e => updateCfg({ retry_rules: { ...cfg.retry_rules, retry_on_busy: e.target.checked } })} className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-600" />
                        <span className="text-sm font-medium text-slate-700">Retry on Busy</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={cfg.retry_rules?.retry_on_no_answer || false} onChange={e => updateCfg({ retry_rules: { ...cfg.retry_rules, retry_on_no_answer: e.target.checked } })} className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-600" />
                        <span className="text-sm font-medium text-slate-700">Retry on No Answer</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── AI & WORKFLOWS ───────────────────────── */}
              {configTab === 'workflow' && (
                <div className="space-y-5 animate-fade-in">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-200">
                    <Bot className="h-5 w-5 text-violet-500" /> AI Workflows & Scripting
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Assigned AI Call Script / Workflow</label>
                    <select value={cfg.workflow_id || ''} onChange={e => updateCfg({ workflow_id: e.target.value })} className="block w-full rounded-lg border-slate-200 shadow-sm focus:border-violet-500 focus:ring-violet-500 text-sm p-2.5 border bg-white">
                      <option value="">-- No AI Script Assigned --</option>
                      {workflows.map(w => (<option key={w.id} value={w.id}>{w.name}</option>))}
                    </select>
                    <p className="text-xs text-slate-500 mt-1">Scripts are created in the Workflow Builder and drive the AI Assistant panel during calls.</p>
                  </div>
                  <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 flex items-start gap-3">
                    <Workflow className="h-5 w-5 text-violet-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-violet-900">Workflow Builder Integration</p>
                      <p className="text-xs text-violet-700 mt-1">When a workflow is assigned, the AI assistant will follow the script during live calls, providing real-time prompts, objection handling, and automated actions.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── IVR ──────────────────────────────────── */}
              {configTab === 'ivr' && (
                <div className="space-y-5 animate-fade-in">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-200">
                    <Volume2 className="h-5 w-5 text-purple-500" /> Inbound IVR Routing
                  </h3>
                  {newCampaign.type === 'outbound' && (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-slate-600 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-slate-400" />
                      IVR settings are only available for Inbound or Mixed campaigns. Change the Direction Type in General settings.
                    </div>
                  )}
                  {newCampaign.type !== 'outbound' && (
                    <>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={cfg.ivr_settings?.enabled || false} onChange={e => updateCfg({ ivr_settings: { ...cfg.ivr_settings, enabled: e.target.checked } })} className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-600" />
                        <span className="text-sm font-semibold text-slate-900">Enable Interactive Voice Response (IVR)</span>
                      </label>
                      {cfg.ivr_settings?.enabled && (
                        <div className="grid grid-cols-2 gap-5 bg-purple-50 p-4 rounded-xl border border-purple-200">
                          <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Greeting / Prompt (Text-to-Speech)</label>
                            <textarea rows={2} value={cfg.ivr_settings?.greeting_message || ''} onChange={e => updateCfg({ ivr_settings: { ...cfg.ivr_settings, greeting_message: e.target.value } })} className="block w-full rounded-lg border-purple-200 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm p-2.5 border bg-white" placeholder="Thank you for calling NexusCRM. Press 1 for Sales, 2 for Support..." />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Input Timeout (Seconds)</label>
                            <input type="number" min="5" max="30" value={cfg.ivr_settings?.timeout_seconds || 10} onChange={e => updateCfg({ ivr_settings: { ...cfg.ivr_settings, timeout_seconds: parseInt(e.target.value) } })} className="block w-full rounded-lg border-purple-200 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm p-2.5 border bg-white" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Fallback Action</label>
                            <select value={cfg.ivr_settings?.fallback_action || 'disconnect'} onChange={e => updateCfg({ ivr_settings: { ...cfg.ivr_settings, fallback_action: e.target.value } })} className="block w-full rounded-lg border-purple-200 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm p-2.5 border bg-white">
                              <option value="disconnect">Disconnect</option>
                              <option value="route_agent">Route to first available agent</option>
                              <option value="voicemail">Send to Voicemail</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* ─── COMPLIANCE ───────────────────────────── */}
              {configTab === 'compliance' && (
                <div className="space-y-5 animate-fade-in">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-200">
                    <Shield className="h-5 w-5 text-emerald-500" /> Compliance & Regulations
                  </h3>
                  <div className="space-y-4">
                    <label className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-white hover:border-emerald-200 transition-colors cursor-pointer">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Do Not Call (DNC) List Check</p>
                        <p className="text-xs text-slate-500">Automatically scrub leads against DNC registry before dialling</p>
                      </div>
                      <input type="checkbox" checked={cfg.compliance?.dnc_check ?? true} onChange={e => updateCfg({ compliance: { ...cfg.compliance, dnc_check: e.target.checked } })} className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600" />
                    </label>
                    <label className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-white hover:border-emerald-200 transition-colors cursor-pointer">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">TCPA Safe Mode</p>
                        <p className="text-xs text-slate-500">Enforce TCPA-compliant calling restrictions (no auto-dial to mobiles without consent)</p>
                      </div>
                      <input type="checkbox" checked={cfg.compliance?.tcpa_mode || false} onChange={e => updateCfg({ compliance: { ...cfg.compliance, tcpa_mode: e.target.checked } })} className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600" />
                    </label>
                    <label className="flex items-center justify-between p-4 border border-slate-200 rounded-xl bg-white hover:border-emerald-200 transition-colors cursor-pointer">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Require Prior Consent</p>
                        <p className="text-xs text-slate-500">Only dial contacts that have opt-in consent recorded in CRM</p>
                      </div>
                      <input type="checkbox" checked={cfg.compliance?.consent_required || false} onChange={e => updateCfg({ compliance: { ...cfg.compliance, consent_required: e.target.checked } })} className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600" />
                    </label>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Max Daily Attempts Per Contact</label>
                      <input type="number" min="1" max="10" value={cfg.compliance?.max_daily_attempts || 3} onChange={e => updateCfg({ compliance: { ...cfg.compliance, max_daily_attempts: parseInt(e.target.value) } })} className="block w-full max-w-xs rounded-lg border-slate-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-sm p-2.5 border bg-white" />
                      <p className="text-xs text-slate-500 mt-1">Limits how many times a contact can be dialled in a single day.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── DISPOSITIONS ─────────────────────────── */}
              {configTab === 'disposal' && (
                <div className="space-y-5 animate-fade-in">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-200">
                    <Layers className="h-5 w-5 text-indigo-500" /> Disposition Codes
                  </h3>
                  <p className="text-sm text-slate-500">Agents select a disposition code after each call. Customize the available options.</p>
                  <div className="space-y-2">
                    {(cfg.disposal_codes || []).map((code: string, i: number) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={code}
                          onChange={e => {
                            const codes = [...(cfg.disposal_codes || [])];
                            codes[i] = e.target.value;
                            updateCfg({ disposal_codes: codes });
                          }}
                          className="flex-1 rounded-lg border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm p-2.5 border bg-white"
                        />
                        <button type="button" onClick={() => {
                          const codes = (cfg.disposal_codes || []).filter((_: any, idx: number) => idx !== i);
                          updateCfg({ disposal_codes: codes });
                        }} className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={() => updateCfg({ disposal_codes: [...(cfg.disposal_codes || []), ''] })} className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">
                    <Plus className="h-4 w-4" /> Add Disposition Code
                  </button>
                </div>
              )}

              {/* ─── CHANNELS (OMNI-CHANNEL) ────────────── */}
              {configTab === 'channels' && (
                <div className="space-y-5 animate-fade-in">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-200">
                    <Inbox className="h-5 w-5 text-blue-500" /> Omni-Channel Configuration
                  </h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800 flex items-start gap-2">
                    <Inbox className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>Enable multiple communication channels for this campaign. Contacts can be reached via voice, SMS, email, or WhatsApp based on your strategy.</span>
                  </div>

                  {/* Channel Strategy */}
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Channel Strategy</label>
                      <select value={cfg.channel_strategy || 'voice_first'} onChange={e => updateCfg({ channel_strategy: e.target.value })} className="block w-full rounded-lg border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2.5 border bg-white">
                        <option value="voice_first">Voice First — Call, then fall back to digital</option>
                        <option value="digital_first">Digital First — SMS/Email first, escalate to voice</option>
                        <option value="parallel">Parallel — Engage on all enabled channels simultaneously</option>
                        <option value="sequential">Sequential — Follow a defined channel order</option>
                        <option value="smart">Smart — AI picks best channel per contact</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Delay Between Channels (min)</label>
                      <input type="number" min="0" max="1440" value={cfg.channel_sequence_delay || 30} onChange={e => updateCfg({ channel_sequence_delay: parseInt(e.target.value) })} className="block w-full rounded-lg border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2.5 border bg-white" />
                      <p className="text-xs text-slate-500 mt-1">Wait time before trying the next channel if no response.</p>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={cfg.channel_escalation || false} onChange={e => updateCfg({ channel_escalation: e.target.checked })} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600" />
                    <span className="text-sm font-medium text-slate-700">Auto-Escalate — Automatically try the next channel if no response</span>
                  </label>

                  <hr className="border-slate-200" />

                  {/* Voice Channel */}
                  <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50">
                    <label className="flex items-center gap-2 cursor-pointer mb-2">
                      <input type="checkbox" checked={cfg.channels?.voice?.enabled !== false} onChange={e => updateCfg({ channels: { ...cfg.channels, voice: { ...cfg.channels?.voice, enabled: e.target.checked } } })} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600" />
                      <Phone className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-bold text-blue-900">Voice Calls</span>
                    </label>
                    <p className="text-xs text-blue-700 ml-6">Use the dialler engine settings configured in the Dialer Engine tab.</p>
                  </div>

                  {/* SMS Channel */}
                  <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50">
                    <label className="flex items-center gap-2 cursor-pointer mb-3">
                      <input type="checkbox" checked={cfg.channels?.sms?.enabled || false} onChange={e => updateCfg({ channels: { ...cfg.channels, sms: { ...cfg.channels?.sms, enabled: e.target.checked } } })} className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600" />
                      <MessageSquare className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm font-bold text-emerald-900">SMS</span>
                    </label>
                    {cfg.channels?.sms?.enabled && (
                      <div className="space-y-3 ml-6">
                        <div>
                          <label className="block text-xs font-semibold text-emerald-800 mb-1">Message Template</label>
                          <textarea rows={3} value={cfg.channels?.sms?.template || ''} onChange={e => updateCfg({ channels: { ...cfg.channels, sms: { ...cfg.channels?.sms, template: e.target.value } } })} className="block w-full rounded-lg border-emerald-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-sm p-2.5 border bg-white" placeholder="Hi {first_name}, we noticed you were interested in..." />
                          <p className="text-[10px] text-emerald-600 mt-1">Use {'{first_name}'}, {'{company}'}, {'{agent_name}'} as merge variables</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-emerald-800 mb-1">Follow-up Delay (min)</label>
                            <input type="number" min="1" value={cfg.channels?.sms?.followUpDelay || 30} onChange={e => updateCfg({ channels: { ...cfg.channels, sms: { ...cfg.channels?.sms, followUpDelay: parseInt(e.target.value) } } })} className="block w-full rounded-lg border-emerald-200 text-sm p-2 border bg-white" />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-emerald-800 mb-1">Opt-Out Footer</label>
                            <input value={cfg.channels?.sms?.optOutMessage || 'Reply STOP to unsubscribe'} onChange={e => updateCfg({ channels: { ...cfg.channels, sms: { ...cfg.channels?.sms, optOutMessage: e.target.value } } })} className="block w-full rounded-lg border-emerald-200 text-sm p-2 border bg-white" />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-emerald-800 mb-1">Send Window Start</label>
                            <input type="time" value={cfg.channels?.sms?.sendWindow?.start || '09:00'} onChange={e => updateCfg({ channels: { ...cfg.channels, sms: { ...cfg.channels?.sms, sendWindow: { ...cfg.channels?.sms?.sendWindow, start: e.target.value } } } })} className="block w-full rounded-lg border-emerald-200 text-sm p-2 border bg-white" />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-emerald-800 mb-1">Send Window End</label>
                            <input type="time" value={cfg.channels?.sms?.sendWindow?.end || '20:00'} onChange={e => updateCfg({ channels: { ...cfg.channels, sms: { ...cfg.channels?.sms, sendWindow: { ...cfg.channels?.sms?.sendWindow, end: e.target.value } } } })} className="block w-full rounded-lg border-emerald-200 text-sm p-2 border bg-white" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Email Channel */}
                  <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50">
                    <label className="flex items-center gap-2 cursor-pointer mb-3">
                      <input type="checkbox" checked={cfg.channels?.email?.enabled || false} onChange={e => updateCfg({ channels: { ...cfg.channels, email: { ...cfg.channels?.email, enabled: e.target.checked } } })} className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-600" />
                      <Mail className="h-4 w-4 text-rose-600" />
                      <span className="text-sm font-bold text-rose-900">Email</span>
                    </label>
                    {cfg.channels?.email?.enabled && (
                      <div className="space-y-3 ml-6">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2">
                            <label className="block text-xs font-semibold text-rose-800 mb-1">Email Subject Line</label>
                            <input value={cfg.channels?.email?.subject || ''} onChange={e => updateCfg({ channels: { ...cfg.channels, email: { ...cfg.channels?.email, subject: e.target.value } } })} className="block w-full rounded-lg border-rose-200 shadow-sm focus:border-rose-500 focus:ring-rose-500 text-sm p-2.5 border bg-white" placeholder="{first_name}, quick question about {company}" />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-rose-800 mb-1">From Name Override</label>
                            <input value={cfg.channels?.email?.fromName || ''} onChange={e => updateCfg({ channels: { ...cfg.channels, email: { ...cfg.channels?.email, fromName: e.target.value } } })} className="block w-full rounded-lg border-rose-200 text-sm p-2 border bg-white" placeholder="Leave blank for system default" />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-rose-800 mb-1">Email Template ID</label>
                            <input value={cfg.channels?.email?.templateId || ''} onChange={e => updateCfg({ channels: { ...cfg.channels, email: { ...cfg.channels?.email, templateId: e.target.value } } })} className="block w-full rounded-lg border-rose-200 text-sm p-2 border bg-white" placeholder="template_xxxx" />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-rose-800 mb-1">Follow-up Delay (min)</label>
                            <input type="number" min="1" value={cfg.channels?.email?.followUpDelay || 60} onChange={e => updateCfg({ channels: { ...cfg.channels, email: { ...cfg.channels?.email, followUpDelay: parseInt(e.target.value) } } })} className="block w-full rounded-lg border-rose-200 text-sm p-2 border bg-white" />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-rose-800 mb-1">Send Window Start</label>
                            <input type="time" value={cfg.channels?.email?.sendWindow?.start || '08:00'} onChange={e => updateCfg({ channels: { ...cfg.channels, email: { ...cfg.channels?.email, sendWindow: { ...cfg.channels?.email?.sendWindow, start: e.target.value } } } })} className="block w-full rounded-lg border-rose-200 text-sm p-2 border bg-white" />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-rose-800 mb-1">Send Window End</label>
                            <input type="time" value={cfg.channels?.email?.sendWindow?.end || '18:00'} onChange={e => updateCfg({ channels: { ...cfg.channels, email: { ...cfg.channels?.email, sendWindow: { ...cfg.channels?.email?.sendWindow, end: e.target.value } } } })} className="block w-full rounded-lg border-rose-200 text-sm p-2 border bg-white" />
                          </div>
                        </div>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={cfg.channels?.email?.trackOpens !== false} onChange={e => updateCfg({ channels: { ...cfg.channels, email: { ...cfg.channels?.email, trackOpens: e.target.checked } } })} className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-600" />
                            <span className="text-xs font-medium text-rose-800">Track Opens</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={cfg.channels?.email?.trackClicks !== false} onChange={e => updateCfg({ channels: { ...cfg.channels, email: { ...cfg.channels?.email, trackClicks: e.target.checked } } })} className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-600" />
                            <span className="text-xs font-medium text-rose-800">Track Clicks</span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* WhatsApp Channel */}
                  <div className="p-4 rounded-xl border border-green-200 bg-green-50/50">
                    <label className="flex items-center gap-2 cursor-pointer mb-3">
                      <input type="checkbox" checked={cfg.channels?.whatsapp?.enabled || false} onChange={e => updateCfg({ channels: { ...cfg.channels, whatsapp: { ...cfg.channels?.whatsapp, enabled: e.target.checked } } })} className="h-4 w-4 rounded border-slate-300 text-green-600 focus:ring-green-600" />
                      <MessageCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-bold text-green-900">WhatsApp</span>
                    </label>
                    {cfg.channels?.whatsapp?.enabled && (
                      <div className="space-y-3 ml-6">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2">
                            <label className="block text-xs font-semibold text-green-800 mb-1">Approved Template Name</label>
                            <input value={cfg.channels?.whatsapp?.templateName || ''} onChange={e => updateCfg({ channels: { ...cfg.channels, whatsapp: { ...cfg.channels?.whatsapp, templateName: e.target.value } } })} className="block w-full rounded-lg border-green-200 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm p-2.5 border bg-white" placeholder="campaign_outreach_v1" />
                            <p className="text-[10px] text-green-600 mt-1">Must match an approved template in your WhatsApp Business account</p>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-green-800 mb-1">Header Type</label>
                            <select value={cfg.channels?.whatsapp?.headerType || 'none'} onChange={e => updateCfg({ channels: { ...cfg.channels, whatsapp: { ...cfg.channels?.whatsapp, headerType: e.target.value } } })} className="block w-full rounded-lg border-green-200 text-sm p-2 border bg-white">
                              <option value="none">None</option><option value="text">Text</option><option value="image">Image</option><option value="document">Document</option><option value="video">Video</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-green-800 mb-1">Follow-up Delay (min)</label>
                            <input type="number" min="1" value={cfg.channels?.whatsapp?.followUpDelay || 60} onChange={e => updateCfg({ channels: { ...cfg.channels, whatsapp: { ...cfg.channels?.whatsapp, followUpDelay: parseInt(e.target.value) } } })} className="block w-full rounded-lg border-green-200 text-sm p-2 border bg-white" />
                          </div>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={cfg.channels?.whatsapp?.sessionFollowUp !== false} onChange={e => updateCfg({ channels: { ...cfg.channels, whatsapp: { ...cfg.channels?.whatsapp, sessionFollowUp: e.target.checked } } })} className="h-4 w-4 rounded border-slate-300 text-green-600 focus:ring-green-600" />
                          <span className="text-xs font-medium text-green-800">Auto-follow-up within 24h session window (free-form)</span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════
  // RENDER: Campaign List (default)
  // ═══════════════════════════════════════════════════════
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-slate-900">Campaigns & Dialer Settings</h1>
        <button onClick={openCreatePanel} className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:from-blue-700 hover:to-blue-800 transition-all">
          <Plus className="-ml-0.5 mr-2 h-4 w-4" />
          Create Campaign
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-500">Loading campaigns...</div>
        ) : campaigns.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500">No campaigns found. Create your first campaign to get started.</div>
        ) : (
          campaigns.map((campaign, i) => (
            <div key={campaign.id} className={`rounded-xl bg-white shadow-sm border border-slate-200 overflow-hidden flex flex-col group relative hover:shadow-md transition-all animate-fade-in-up stagger-${Math.min(i + 1, 5)}`} style={{ opacity: 0 }}>
              {/* Hover actions */}
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10 bg-white/90 backdrop-blur-sm p-1 rounded-lg shadow-sm border border-slate-100">
                <button onClick={() => openEditPanel(campaign)} className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md transition-colors" title="Edit">
                  <Edit className="h-4 w-4" />
                </button>
                <button onClick={() => handleDeleteCampaign(campaign.id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded-md transition-colors" title="Delete">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="p-5 flex-1 pt-6">
                <div className="flex items-start justify-between mb-3 pr-12">
                  <h3 className="text-base font-semibold text-slate-900 truncate">{campaign.name}</h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(campaign.status)}`}>
                    {campaign.status}
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Type</span>
                    <span className="font-medium text-slate-900 capitalize">{campaign.type}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Dial Mode</span>
                    <span className="font-medium text-slate-900 capitalize">{campaign.dial_mode}</span>
                  </div>
                  {campaign.configuration && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Channels</span>
                      <span className="font-medium text-slate-900">
                        {[campaign.configuration.channels?.voice?.enabled !== false && 'Voice', campaign.configuration.channels?.sms?.enabled && 'SMS', campaign.configuration.channels?.email?.enabled && 'Email', campaign.configuration.channels?.whatsapp?.enabled && 'WA'].filter(Boolean).join(', ') || 'Voice'}
                      </span>
                    </div>
                  )}
                  {campaign.configuration && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">AMD Filter</span>
                      <span className="font-medium text-slate-900">{campaign.configuration.amd_enabled ? 'Active' : 'Disabled'}</span>
                    </div>
                  )}
                  <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1">
                    <div className={`h-1.5 rounded-full ${campaign.status === 'active' ? 'bg-blue-600 w-full animate-pulse' : 'bg-slate-400 w-full'}`} />
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-between items-center">
                <div className="flex space-x-1">
                  {campaign.status === 'active' ? (
                    <button onClick={() => toggleCampaignStatus(campaign.id, campaign.status)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Pause">
                      <Pause className="h-4 w-4" />
                    </button>
                  ) : (
                    <button onClick={() => toggleCampaignStatus(campaign.id, campaign.status)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Start">
                      <Play className="h-4 w-4" />
                    </button>
                  )}
                  <button onClick={() => openEditPanel(campaign)} className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors" title="Settings">
                    <Settings className="h-4 w-4" />
                  </button>
                </div>
                <button onClick={() => viewStats(campaign)} className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
                  <BarChart2 className="h-4 w-4 mr-1" /> Stats
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
