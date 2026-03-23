import React, { useState, useEffect } from 'react';
import {
  Activity, PhoneCall, Users, Clock, Eye, Volume2, Mic, MicOff,
  AlertTriangle, TrendingUp, Pause, Play, ArrowUpRight, ArrowDownRight,
  Radio, Monitor, Headphones, BarChart2, Zap, Shield
} from 'lucide-react';

// ─── Simulated live data ─────────────────────────────
interface LiveAgent {
  id: string;
  name: string;
  status: 'on_call' | 'idle' | 'wrap_up' | 'break' | 'offline';
  currentCall?: { contact: string; duration: number; campaign: string; sentiment: 'positive' | 'neutral' | 'negative' };
  callsToday: number;
  talkTime: number;
  avgHandle: number;
}

const LIVE_AGENTS: LiveAgent[] = [
  { id: '1', name: 'Alex Rivera', status: 'on_call', currentCall: { contact: 'Sarah Chen', duration: 142, campaign: 'Q3 Outbound', sentiment: 'positive' }, callsToday: 47, talkTime: 3420, avgHandle: 185 },
  { id: '2', name: 'Jordan Wright', status: 'on_call', currentCall: { contact: 'Marcus Rodriguez', duration: 67, campaign: 'Enterprise Demo', sentiment: 'neutral' }, callsToday: 38, talkTime: 2845, avgHandle: 212 },
  { id: '3', name: 'Maya Patel', status: 'wrap_up', callsToday: 52, talkTime: 4100, avgHandle: 168 },
  { id: '4', name: 'Chris Lee', status: 'idle', callsToday: 41, talkTime: 3200, avgHandle: 195 },
  { id: '5', name: 'Sophia Martinez', status: 'on_call', currentCall: { contact: 'James O\'Brien', duration: 310, campaign: 'Renewal Campaign', sentiment: 'negative' }, callsToday: 35, talkTime: 2650, avgHandle: 225 },
  { id: '6', name: 'Ryan Kim', status: 'break', callsToday: 29, talkTime: 1980, avgHandle: 202 },
  { id: '7', name: 'Emma Davis', status: 'on_call', currentCall: { contact: 'Elena Vasquez', duration: 45, campaign: 'Q3 Outbound', sentiment: 'positive' }, callsToday: 44, talkTime: 3650, avgHandle: 178 },
  { id: '8', name: 'Liam Foster', status: 'offline', callsToday: 0, talkTime: 0, avgHandle: 0 },
];

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  on_call: { label: 'On Call', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', dot: 'bg-blue-500' },
  idle: { label: 'Available', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500' },
  wrap_up: { label: 'Wrap-up', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', dot: 'bg-amber-500' },
  break: { label: 'On Break', color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200', dot: 'bg-slate-400' },
  offline: { label: 'Offline', color: 'text-slate-400', bg: 'bg-slate-50 border-slate-100', dot: 'bg-slate-300' },
};

const SENTIMENT_MAP: Record<string, { color: string; icon: string }> = {
  positive: { color: 'text-emerald-600', icon: '😊' },
  neutral: { color: 'text-blue-600', icon: '😐' },
  negative: { color: 'text-red-600', icon: '😟' },
};

// ═══════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════
export default function LiveMonitoring() {
  const [agents] = useState(LIVE_AGENTS);
  const [tick, setTick] = useState(0);

  // Simulate live duration counter
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const onCall = agents.filter(a => a.status === 'on_call').length;
  const idle = agents.filter(a => a.status === 'idle').length;
  const totalCalls = agents.reduce((sum, a) => sum + a.callsToday, 0);
  const avgHandle = agents.filter(a => a.avgHandle > 0).reduce((sum, a) => sum + a.avgHandle, 0) / agents.filter(a => a.avgHandle > 0).length;

  const metrics = [
    { label: 'Active Calls', value: onCall.toString(), icon: PhoneCall, color: 'text-blue-600', bg: 'bg-blue-50', change: '+2', up: true },
    { label: 'Agents Available', value: idle.toString(), icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50', change: `${idle}/${agents.length}`, up: true },
    { label: 'Total Calls Today', value: totalCalls.toString(), icon: BarChart2, color: 'text-violet-600', bg: 'bg-violet-50', change: '+18%', up: true },
    { label: 'Avg Handle Time', value: formatDuration(Math.round(avgHandle)), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', change: '-8s', up: false },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight flex items-center gap-2">
            Live Monitoring
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Real-time
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Monitor all agent activity, live calls, and performance in real-time</p>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <div key={m.label} className={`glass-card p-5 animate-fade-in-up stagger-${i + 1} hover:translate-y-0`} style={{ opacity: 0 }}>
            <div className="flex items-center justify-between">
              <div className={`rounded-xl p-2.5 ${m.bg}`}><m.icon className={`h-5 w-5 ${m.color}`} /></div>
              <div className={`flex items-center gap-1 text-xs font-medium ${m.up ? 'text-emerald-600' : 'text-amber-600'}`}>
                {m.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}{m.change}
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-3 tracking-tight">{m.value}</p>
            <p className="text-sm text-slate-500 mt-0.5">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Agent Board */}
      <div className="glass-card overflow-hidden hover:translate-y-0">
        <div className="px-6 py-4 border-b border-slate-200/50 bg-white/40 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 tracking-tight flex items-center gap-2">
            <Monitor className="h-5 w-5 text-blue-500" /> Agent Activity Board
          </h2>
          <div className="flex items-center gap-4 text-xs">
            {Object.entries(STATUS_MAP).slice(0, 4).map(([key, s]) => (
              <span key={key} className="flex items-center gap-1.5 text-slate-500">
                <span className={`h-2 w-2 rounded-full ${s.dot}`} />{s.label} ({agents.filter(a => a.status === key).length})
              </span>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Agent</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Current Call</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Duration</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Sentiment</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Calls Today</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Talk Time</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {agents.map((agent) => {
                const st = STATUS_MAP[agent.status];
                const callDuration = agent.currentCall ? agent.currentCall.duration + tick : 0;
                return (
                  <tr key={agent.id} className={`transition-colors ${agent.status === 'on_call' ? 'bg-blue-50/30' : 'hover:bg-white/40'}`}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 shadow-sm border border-white">
                            {agent.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ${st.dot} border-2 border-white`} />
                        </div>
                        <span className="text-sm font-medium text-slate-900">{agent.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${st.bg} ${st.color}`}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">
                      {agent.currentCall ? (
                        <div><p className="font-medium">{agent.currentCall.contact}</p><p className="text-[10px] text-slate-400">{agent.currentCall.campaign}</p></div>
                      ) : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-mono">
                      {agent.currentCall ? (
                        <span className={`font-medium ${callDuration > 300 ? 'text-amber-600' : 'text-slate-700'}`}>{formatDuration(callDuration)}</span>
                      ) : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {agent.currentCall ? (
                        <span className="text-lg" title={agent.currentCall.sentiment}>{SENTIMENT_MAP[agent.currentCall.sentiment].icon}</span>
                      ) : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-700">{agent.callsToday}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{formatDuration(agent.talkTime)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {agent.status === 'on_call' && (
                        <div className="flex gap-1">
                          <button className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Listen (Silent Monitor)"><Headphones className="h-4 w-4" /></button>
                          <button className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors" title="Whisper to Agent"><Volume2 className="h-4 w-4" /></button>
                          <button className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors" title="Barge In"><Zap className="h-4 w-4" /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
