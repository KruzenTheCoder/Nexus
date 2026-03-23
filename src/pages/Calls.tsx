import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Phone, PhoneOff, Mic, MicOff, Bot, AlertTriangle, Settings,
  Search, UserCircle, Clock, Play, Pause, SkipForward, List,
  Hash, Delete, ChevronRight, PhoneCall, Users, Zap, FileText
} from 'lucide-react';
import { useTwilioVoice } from '@/hooks/useTwilioVoice';
import { useSocket } from '@/hooks/useSocket';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────
interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  company: string;
  lifecycle_stage: string;
  lead_score: number;
  email: string;
}

type DialerMode = 'manual' | 'queue';

const DIALPAD_KEYS = [
  { digit: '1', letters: '' },
  { digit: '2', letters: 'ABC' },
  { digit: '3', letters: 'DEF' },
  { digit: '4', letters: 'GHI' },
  { digit: '5', letters: 'JKL' },
  { digit: '6', letters: 'MNO' },
  { digit: '7', letters: 'PQRS' },
  { digit: '8', letters: 'TUV' },
  { digit: '9', letters: 'WXYZ' },
  { digit: '*', letters: '' },
  { digit: '0', letters: '+' },
  { digit: '#', letters: '' },
];

const STAGE_COLORS: Record<string, string> = {
  lead: 'bg-blue-100 text-blue-700',
  prospect: 'bg-violet-100 text-violet-700',
  qualified: 'bg-emerald-100 text-emerald-700',
  customer: 'bg-amber-100 text-amber-700',
};

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// ═══════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════
export default function Calls() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dialerMode, setDialerMode] = useState<DialerMode>('manual');
  const [callNotes, setCallNotes] = useState('');
  const [callTimer, setCallTimer] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Lead queue state
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadSearch, setLeadSearch] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [queueIndex, setQueueIndex] = useState(0);
  const [isAutoDialing, setIsAutoDialing] = useState(false);
  const [loadingLeads, setLoadingLeads] = useState(true);

  // Twilio & socket
  const { status, makeCall, endCall, isMuted, toggleMute, errorMessage } = useTwilioVoice();
  const { isConnected, aiAnalysis, sendTranscription } = useSocket('demo-call-123');
  const navigate = useNavigate();

  // ─── Load leads from Supabase ───────────────────────
  useEffect(() => {
    async function fetchLeads() {
      setLoadingLeads(true);
      try {
        const { data, error } = await supabase
          .from('contacts')
          .select('id, first_name, last_name, phone, company, lifecycle_stage, lead_score, email')
          .not('phone', 'is', null)
          .order('lead_score', { ascending: false });

        if (error) throw error;
        setLeads((data || []).filter((c: any) => c.phone && c.phone.trim()));
      } catch (err) {
        console.error('Error fetching leads:', err);
      } finally {
        setLoadingLeads(false);
      }
    }
    fetchLeads();
  }, []);

  // ─── Call timer ─────────────────────────────────────
  useEffect(() => {
    if (status === 'in-call') {
      setCallTimer(0);
      timerRef.current = setInterval(() => setCallTimer(t => t + 1), 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [status]);

  // ─── Auto-dialer: move to next lead when call ends ──
  useEffect(() => {
    if (isAutoDialing && status === 'ready') {
      const timeout = setTimeout(() => {
        if (queueIndex < filteredLeads.length - 1) {
          const nextIdx = queueIndex + 1;
          setQueueIndex(nextIdx);
          const next = filteredLeads[nextIdx];
          if (next) {
            setSelectedLead(next);
            setPhoneNumber(next.phone);
            setCallNotes('');
            makeCall(next.phone);
          }
        } else {
          setIsAutoDialing(false);
        }
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [status, isAutoDialing, queueIndex]);

  // ─── Filtered leads ─────────────────────────────────
  const filteredLeads = leads.filter(l => {
    if (!leadSearch) return true;
    const q = leadSearch.toLowerCase();
    return (
      l.first_name?.toLowerCase().includes(q) ||
      l.last_name?.toLowerCase().includes(q) ||
      l.company?.toLowerCase().includes(q) ||
      l.phone?.includes(q)
    );
  });

  // ─── Dial pad handlers ──────────────────────────────
  const handleDialPadPress = useCallback((digit: string) => {
    setPhoneNumber(prev => prev + digit);
  }, []);

  const handleBackspace = useCallback(() => {
    setPhoneNumber(prev => prev.slice(0, -1));
  }, []);

  const handleDial = useCallback(() => {
    if (status === 'in-call' || status === 'calling') {
      endCall();
    } else if (phoneNumber.trim()) {
      setCallNotes('');
      makeCall(phoneNumber.replace(/[^\d+*#]/g, ''));
    }
  }, [status, phoneNumber, makeCall, endCall]);

  const handleLeadDial = useCallback((lead: Lead) => {
    setSelectedLead(lead);
    setPhoneNumber(lead.phone);
    setCallNotes('');
    setDialerMode('manual');
    if (status === 'ready') {
      makeCall(lead.phone.replace(/[^\d+*#]/g, ''));
    }
  }, [status, makeCall]);

  const toggleAutoDial = useCallback(() => {
    if (isAutoDialing) {
      setIsAutoDialing(false);
    } else {
      setIsAutoDialing(true);
      if (filteredLeads.length > 0) {
        const lead = filteredLeads[queueIndex] || filteredLeads[0];
        setSelectedLead(lead);
        setPhoneNumber(lead.phone);
        setCallNotes('');
        if (status === 'ready') {
          makeCall(lead.phone.replace(/[^\d+*#]/g, ''));
        }
      }
    }
  }, [isAutoDialing, filteredLeads, queueIndex, status, makeCall]);

  const isOnCall = status === 'in-call' || status === 'calling' || status === 'ringing';

  return (
    <div className="space-y-4 h-[calc(100vh-7rem)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight flex items-center gap-2">
            Dialer
            {isOnCall && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" /> On Call
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Place outbound calls manually or auto-dial from your lead queue</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDialerMode('manual')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              dialerMode === 'manual' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Hash className="h-3.5 w-3.5 inline mr-1" />Manual Dial
          </button>
          <button
            onClick={() => setDialerMode('queue')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              dialerMode === 'queue' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <List className="h-3.5 w-3.5 inline mr-1" />Lead Queue
          </button>
        </div>
      </div>

      {/* Error / Not Configured Banner */}
      {(status === 'error' || status === 'not-configured') && errorMessage && (
        <div className={`rounded-xl p-4 text-sm flex items-start gap-3 ${
          status === 'not-configured'
            ? 'bg-amber-50 border border-amber-200 text-amber-800'
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">{errorMessage}</p>
            {status === 'not-configured' && (
              <button
                onClick={() => navigate('/system-config')}
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                <Settings className="h-3 w-3" /> Go to System Configuration
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main 3-Column Layout */}
      <div className="flex gap-4 h-[calc(100%-6rem)]">

        {/* ════════ LEFT: Lead Queue / Dial Pad ════════ */}
        <div className="w-[340px] flex-shrink-0 flex flex-col gap-4">
          {/* Softphone Card */}
          <div className="glass-card p-5 flex flex-col items-center hover:translate-y-0">
            {/* Status indicator */}
            <div className="w-full flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Softphone</span>
              <div className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${
                  status === 'ready' ? 'bg-emerald-500' :
                  isOnCall ? 'bg-blue-500 animate-pulse' :
                  status === 'connecting' ? 'bg-amber-500 animate-pulse' :
                  'bg-slate-300'
                }`} />
                <span className="text-[10px] text-slate-500 uppercase font-medium">{status}</span>
              </div>
            </div>

            {/* Caller info / Number display */}
            {selectedLead && isOnCall ? (
              <div className="text-center mb-3">
                <div className="h-12 w-12 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-sm font-bold mb-2 shadow-lg shadow-blue-500/20">
                  {selectedLead.first_name[0]}{selectedLead.last_name[0]}
                </div>
                <p className="text-sm font-semibold text-slate-900">{selectedLead.first_name} {selectedLead.last_name}</p>
                <p className="text-xs text-slate-500">{selectedLead.company}</p>
              </div>
            ) : (
              <div className="h-12 w-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center mb-3">
                <Phone className="h-6 w-6 text-slate-400" />
              </div>
            )}

            {/* Number input */}
            <div className="w-full relative mb-3">
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full text-center text-lg font-mono tracking-wider bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 placeholder:text-slate-300"
              />
              {phoneNumber && (
                <button onClick={handleBackspace} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <Delete className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Timer */}
            {isOnCall && (
              <div className="text-2xl font-mono font-light text-blue-600 mb-3 tracking-widest">
                {formatTimer(callTimer)}
              </div>
            )}

            {/* Call controls */}
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={toggleMute}
                disabled={!isOnCall}
                className={`p-3 rounded-full transition-all ${
                  isMuted ? 'bg-amber-100 text-amber-600 shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                } disabled:opacity-30 disabled:cursor-not-allowed`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>

              <button
                onClick={handleDial}
                disabled={!phoneNumber.trim() && !isOnCall}
                className={`p-4 rounded-full transition-all shadow-lg ${
                  isOnCall
                    ? 'bg-red-500 text-white hover:bg-red-600 shadow-red-500/30'
                    : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/30'
                } disabled:opacity-30 disabled:cursor-not-allowed`}
              >
                {isOnCall ? <PhoneOff className="h-6 w-6" /> : <Phone className="h-6 w-6" />}
              </button>

              <button
                disabled
                className="p-3 rounded-full bg-slate-100 text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Hold (coming soon)"
              >
                <Pause className="h-5 w-5" />
              </button>
            </div>

            {/* Dial pad */}
            <div className="grid grid-cols-3 gap-1.5 w-full max-w-[252px]">
              {DIALPAD_KEYS.map(({ digit, letters }) => (
                <button
                  key={digit}
                  onClick={() => handleDialPadPress(digit)}
                  className="h-12 bg-white rounded-lg flex flex-col items-center justify-center hover:bg-slate-50 border border-slate-200 active:bg-slate-100 transition-all active:scale-95"
                >
                  <span className="text-lg font-semibold text-slate-800 leading-none">{digit}</span>
                  {letters && <span className="text-[8px] text-slate-400 tracking-widest leading-none mt-0.5">{letters}</span>}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ════════ CENTER: Lead Queue ════════ */}
        <div className="flex-1 flex flex-col glass-card overflow-hidden hover:translate-y-0">
          <div className="px-5 py-3.5 border-b border-slate-200/50 bg-white/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4.5 w-4.5 text-blue-500" />
              <h2 className="text-sm font-semibold text-slate-900">Lead Queue</h2>
              <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{filteredLeads.length}</span>
            </div>
            <div className="flex items-center gap-2">
              {dialerMode === 'queue' && (
                <button
                  onClick={toggleAutoDial}
                  disabled={status !== 'ready' && !isAutoDialing}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    isAutoDialing
                      ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                      : 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100'
                  } disabled:opacity-40`}
                >
                  {isAutoDialing ? <><Pause className="h-3 w-3" /> Stop Auto-Dial</> : <><Zap className="h-3 w-3" /> Auto-Dial</>}
                </button>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="px-4 py-2 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={leadSearch}
                onChange={(e) => setLeadSearch(e.target.value)}
                placeholder="Search leads by name, company, or phone..."
                className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </div>
          </div>

          {/* Lead list */}
          <div className="flex-1 overflow-y-auto">
            {loadingLeads ? (
              <div className="flex items-center justify-center h-32 text-sm text-slate-400">Loading leads...</div>
            ) : filteredLeads.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-sm text-slate-400">
                <Users className="h-8 w-8 mb-2 text-slate-300" />
                <p>No leads with phone numbers found</p>
                <p className="text-xs mt-1">Import contacts with phone numbers to use the dialer</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {filteredLeads.map((lead, idx) => {
                  const isActive = selectedLead?.id === lead.id && isOnCall;
                  const isQueued = isAutoDialing && idx === queueIndex;
                  const stageCls = STAGE_COLORS[lead.lifecycle_stage?.toLowerCase()] || 'bg-slate-100 text-slate-600';

                  return (
                    <div
                      key={lead.id}
                      className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all ${
                        isActive ? 'bg-blue-50/70 border-l-2 border-blue-500' :
                        isQueued ? 'bg-amber-50/50 border-l-2 border-amber-400' :
                        'hover:bg-white/60 border-l-2 border-transparent'
                      }`}
                      onClick={() => {
                        setSelectedLead(lead);
                        setPhoneNumber(lead.phone);
                      }}
                    >
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-slate-200 to-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0 border border-white shadow-sm">
                        {lead.first_name?.[0]}{lead.last_name?.[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-slate-900 truncate">{lead.first_name} {lead.last_name}</p>
                          {lead.lead_score >= 80 && (
                            <span className="text-[9px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded">HOT</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-slate-500 truncate">{lead.company || 'No company'}</span>
                          <span className="text-slate-300">|</span>
                          <span className="text-xs text-slate-400 font-mono">{lead.phone}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${stageCls}`}>
                          {lead.lifecycle_stage || 'Lead'}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleLeadDial(lead); }}
                          disabled={isOnCall || status !== 'ready'}
                          className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title={`Call ${lead.first_name}`}
                        >
                          <Phone className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ════════ RIGHT: Contact Details + AI ════════ */}
        <div className="w-[320px] flex-shrink-0 flex flex-col gap-4">
          {/* Contact Details */}
          <div className="glass-card flex-1 overflow-hidden flex flex-col hover:translate-y-0">
            <div className="px-5 py-3.5 border-b border-slate-200/50 bg-white/40 flex items-center gap-2">
              <UserCircle className="h-4.5 w-4.5 text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-900">Contact Details</h3>
            </div>
            <div className="p-4 overflow-y-auto flex-1 space-y-4">
              {selectedLead ? (
                <>
                  <div className="text-center py-2">
                    <div className="h-14 w-14 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-lg font-bold mb-2 shadow-lg shadow-blue-500/20">
                      {selectedLead.first_name[0]}{selectedLead.last_name[0]}
                    </div>
                    <p className="font-semibold text-slate-900">{selectedLead.first_name} {selectedLead.last_name}</p>
                    <p className="text-xs text-slate-500">{selectedLead.company}</p>
                  </div>
                  <div className="space-y-2.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Phone</span>
                      <span className="font-mono text-slate-700">{selectedLead.phone}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Email</span>
                      <span className="text-slate-700 truncate ml-4">{selectedLead.email || '—'}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Stage</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STAGE_COLORS[selectedLead.lifecycle_stage?.toLowerCase()] || 'bg-slate-100 text-slate-600'}`}>
                        {selectedLead.lifecycle_stage || 'Lead'}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Lead Score</span>
                      <span className={`font-semibold ${selectedLead.lead_score >= 80 ? 'text-red-600' : selectedLead.lead_score >= 50 ? 'text-amber-600' : 'text-slate-600'}`}>
                        {selectedLead.lead_score ?? '—'}
                      </span>
                    </div>
                  </div>
                  <div className="border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <FileText className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-xs font-semibold text-slate-500 uppercase">Call Notes</span>
                    </div>
                    <textarea
                      value={callNotes}
                      onChange={(e) => setCallNotes(e.target.value)}
                      className="w-full h-24 rounded-lg border border-slate-200 text-xs p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none"
                      placeholder="Take notes during the call..."
                    />
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <UserCircle className="h-10 w-10 mb-2 text-slate-300" />
                  <p className="text-xs">Select a lead or dial a number</p>
                </div>
              )}
            </div>
          </div>

          {/* AI Assistant */}
          <div className="glass-card overflow-hidden flex flex-col hover:translate-y-0" style={{ maxHeight: '220px' }}>
            <div className="px-5 py-3 border-b border-slate-200/50 bg-indigo-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-indigo-500" />
                <h3 className="text-xs font-semibold text-indigo-900 uppercase tracking-wider">AI Assistant</h3>
              </div>
              {isConnected && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
                </span>
              )}
            </div>
            <div className="p-3 overflow-y-auto flex-1 space-y-2">
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">Sentiment</span>
                <p className="text-xs text-slate-700 mt-1 font-medium">
                  {aiAnalysis ? aiAnalysis.sentiment : 'Waiting for call...'}
                </p>
              </div>
              <div className="bg-indigo-600 text-white p-3 rounded-lg">
                <span className="text-[10px] font-semibold text-indigo-200 uppercase tracking-wider">Suggested Action</span>
                <p className="text-xs mt-1 font-medium">
                  {aiAnalysis ? aiAnalysis.suggestedAction : 'Start a call to get AI suggestions'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
