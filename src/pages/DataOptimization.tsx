import React, { useState, useMemo } from 'react';
import {
  BarChart3, Clock, Users, TrendingUp, Zap, Target, Sliders, Globe,
  ArrowUpRight, ArrowDownRight, RefreshCw, ChevronDown, Info, Star, Phone
} from 'lucide-react';

// ─── Heatmap Data Generator ────────────────────────────
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function generateHeatmapData(): number[][] {
  return DAYS.map((_, di) =>
    HOURS.map((_, hi) => {
      // Simulate realistic contact rates: higher during business hours
      const isWeekday = di < 5;
      const isBusinessHour = hi >= 9 && hi <= 17;
      const isPeakHour = hi >= 10 && hi <= 14;
      let base = Math.random() * 20;
      if (isWeekday) base += 15;
      if (isBusinessHour) base += 25;
      if (isPeakHour) base += 20;
      if (!isWeekday && (hi < 8 || hi > 20)) base = Math.random() * 5;
      return Math.min(100, Math.round(base));
    })
  );
}

function getHeatColor(value: number): string {
  if (value >= 80) return 'bg-emerald-500';
  if (value >= 60) return 'bg-emerald-400';
  if (value >= 40) return 'bg-blue-400';
  if (value >= 20) return 'bg-blue-300';
  if (value >= 10) return 'bg-slate-300';
  return 'bg-slate-200';
}

// ─── Lead Data Generator ────────────────────────────────
interface Lead {
  id: number;
  name: string;
  company: string;
  score: number;
  bestTime: string;
  timezone: string;
  attempts: number;
  lastContact: string;
  readiness: 'high' | 'medium' | 'low';
}

const SAMPLE_LEADS: Lead[] = [
  { id: 1, name: 'Sarah Chen', company: 'TechVault Inc.', score: 94, bestTime: '10:30 AM', timezone: 'PST', attempts: 1, lastContact: '2d ago', readiness: 'high' },
  { id: 2, name: 'Marcus Rodriguez', company: 'DataFlow Systems', score: 87, bestTime: '2:00 PM', timezone: 'EST', attempts: 2, lastContact: '1d ago', readiness: 'high' },
  { id: 3, name: 'Aisha Patel', company: 'CloudNine Solutions', score: 82, bestTime: '11:00 AM', timezone: 'CST', attempts: 0, lastContact: 'New', readiness: 'high' },
  { id: 4, name: 'James O\'Brien', company: 'FinEdge Corp', score: 76, bestTime: '3:30 PM', timezone: 'PST', attempts: 3, lastContact: '5d ago', readiness: 'medium' },
  { id: 5, name: 'Elena Vasquez', company: 'GreenLeaf Media', score: 71, bestTime: '9:00 AM', timezone: 'MST', attempts: 1, lastContact: '3d ago', readiness: 'medium' },
  { id: 6, name: 'David Kim', company: 'NeuralPath AI', score: 68, bestTime: '1:00 PM', timezone: 'EST', attempts: 2, lastContact: '4d ago', readiness: 'medium' },
  { id: 7, name: 'Lisa Thompson', company: 'UrbanGrow Labs', score: 55, bestTime: '4:00 PM', timezone: 'PST', attempts: 4, lastContact: '7d ago', readiness: 'low' },
  { id: 8, name: 'Robert Walsh', company: 'AeroTech Dynamics', score: 42, bestTime: '10:00 AM', timezone: 'CST', attempts: 5, lastContact: '10d ago', readiness: 'low' },
];

// ═══════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════
export default function DataOptimization() {
  const [heatmapData] = useState(() => generateHeatmapData());
  const [hoveredCell, setHoveredCell] = useState<{ day: number; hour: number } | null>(null);

  // Lead Scoring Weights
  const [weights, setWeights] = useState({
    engagement: 35,
    recency: 25,
    companySize: 20,
    industry: 10,
    webActivity: 10,
  });

  // Timezone calling windows
  const [timezoneWindows, setTimezoneWindows] = useState({
    PST: { start: 9, end: 17, enabled: true },
    MST: { start: 9, end: 17, enabled: true },
    CST: { start: 8, end: 18, enabled: true },
    EST: { start: 8, end: 18, enabled: true },
  });

  // KPI metrics
  const kpis = [
    { label: 'Contact Rate', value: '34.2%', change: '+2.8%', up: true, icon: Phone, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Optimal Call Time', value: '10–2 PM', change: 'PST/EST', up: true, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Active Leads', value: '1,284', change: '+12%', up: true, icon: Users, color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'Avg Attempts to Connect', value: '2.3', change: '-0.4', up: false, icon: RefreshCw, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Data Optimization</h1>
          <p className="text-sm text-slate-500 mt-0.5">Configure lead scoring, calling windows, and contact rate optimization</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 shadow-sm transition-colors">
            <RefreshCw className="h-4 w-4 mr-2 text-slate-400" />
            Refresh Data
          </button>
          <button className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-sm transition-all">
            <Zap className="h-4 w-4 mr-2" />
            Auto-Optimize
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <div key={kpi.label} className={`glass-card p-5 animate-fade-in-up stagger-${i + 1}`} style={{ opacity: 0 }}>
            <div className="flex items-center justify-between">
              <div className={`rounded-xl p-2.5 ${kpi.bg}`}>
                <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
              </div>
              <div className={`flex items-center gap-1 text-xs font-medium ${kpi.up ? 'text-emerald-600' : 'text-amber-600'}`}>
                {kpi.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {kpi.change}
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-3 tracking-tight">{kpi.value}</p>
            <p className="text-sm text-slate-500 mt-0.5">{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ═══ Best Time to Call Heatmap ═══ */}
        <div className="lg:col-span-2 glass-card p-6 hover:translate-y-0">
          <h2 className="text-lg font-semibold text-slate-900 mb-1 tracking-tight flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-500" />
            Best Time to Call Heatmap
          </h2>
          <p className="text-xs text-slate-500 mb-4">Contact success rate by day and hour — darker = higher connect rate</p>

          <div className="overflow-x-auto">
            <div className="min-w-[680px]">
              {/* Hour labels */}
              <div className="flex items-center mb-1">
                <div className="w-10" />
                {HOURS.filter((_, i) => i % 2 === 0).map(h => (
                  <div key={h} className="text-[10px] text-slate-400 font-medium" style={{ width: '52px', textAlign: 'center' }}>
                    {h === 0 ? '12a' : h < 12 ? `${h}a` : h === 12 ? '12p' : `${h - 12}p`}
                  </div>
                ))}
              </div>

              {DAYS.map((day, di) => (
                <div key={day} className="flex items-center mb-1">
                  <div className="w-10 text-xs font-medium text-slate-500">{day}</div>
                  <div className="flex gap-0.5">
                    {heatmapData[di].map((value, hi) => (
                      <div
                        key={hi}
                        className={`heatmap-cell ${getHeatColor(value)} cursor-pointer`}
                        style={{ width: '24px', height: '20px' }}
                        onMouseEnter={() => setHoveredCell({ day: di, hour: hi })}
                        onMouseLeave={() => setHoveredCell(null)}
                        title={`${day} ${hi}:00 — ${value}% connect rate`}
                      />
                    ))}
                  </div>
                </div>
              ))}

              {/* Legend */}
              <div className="flex items-center gap-4 mt-3 ml-10">
                <span className="text-[10px] text-slate-400 font-medium">Low</span>
                {['bg-slate-200', 'bg-slate-300', 'bg-blue-300', 'bg-blue-400', 'bg-emerald-400', 'bg-emerald-500'].map((c, i) => (
                  <div key={i} className={`w-6 h-3 rounded-sm ${c}`} />
                ))}
                <span className="text-[10px] text-slate-400 font-medium">High</span>
              </div>
            </div>
          </div>

          {hoveredCell && (
            <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-100 animate-fade-in text-sm">
              <span className="font-semibold text-slate-700">{DAYS[hoveredCell.day]} at {hoveredCell.hour}:00</span>
              <span className="text-slate-500"> — </span>
              <span className="font-bold text-emerald-600">{heatmapData[hoveredCell.day][hoveredCell.hour]}%</span>
              <span className="text-slate-500"> connect rate</span>
            </div>
          )}
        </div>

        {/* ═══ Lead Scoring Configuration ═══ */}
        <div className="glass-card p-6 hover:translate-y-0">
          <h2 className="text-lg font-semibold text-slate-900 mb-1 tracking-tight flex items-center gap-2">
            <Target className="h-5 w-5 text-violet-500" />
            Lead Scoring Weights
          </h2>
          <p className="text-xs text-slate-500 mb-4">Adjust factor weights to optimize lead prioritization</p>

          {totalWeight !== 100 && (
            <div className="mb-4 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 font-medium flex items-center gap-1">
              <Info className="h-3.5 w-3.5" />
              Weights total {totalWeight}% — should equal 100%
            </div>
          )}

          <div className="space-y-5">
            {Object.entries(weights).map(([key, value]) => {
              const labels: Record<string, string> = {
                engagement: 'Engagement Score',
                recency: 'Recency / Last Activity',
                companySize: 'Company Size / Revenue',
                industry: 'Industry Match',
                webActivity: 'Website Activity',
              };
              const colors: Record<string, string> = {
                engagement: 'accent-emerald-500',
                recency: 'accent-blue-500',
                companySize: 'accent-violet-500',
                industry: 'accent-amber-500',
                webActivity: 'accent-rose-500',
              };
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-medium text-slate-700">{labels[key]}</label>
                    <span className="text-sm font-bold text-slate-900">{value}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={value}
                    onChange={(e) => setWeights({ ...weights, [key]: parseInt(e.target.value) })}
                    className={`w-full ${colors[key]}`}
                  />
                </div>
              );
            })}
          </div>

          <button className="w-full mt-5 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 shadow-sm transition-all flex items-center justify-center gap-2">
            <Sliders className="h-4 w-4" />
            Apply Scoring Model
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ═══ Lead Priority Queue ═══ */}
        <div className="lg:col-span-2 glass-card overflow-hidden hover:translate-y-0">
          <div className="px-6 py-4 border-b border-slate-200/50 bg-white/40 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 tracking-tight flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500" />
              AI-Prioritized Lead Queue
            </h2>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
              {SAMPLE_LEADS.filter(l => l.readiness === 'high').length} high-priority
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Rank</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Lead</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Score</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Best Time</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Attempts</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Readiness</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {SAMPLE_LEADS.map((lead, i) => (
                  <tr key={lead.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold ${
                        i < 3 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {i + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{lead.name}</p>
                        <p className="text-xs text-slate-500">{lead.company}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-200 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${lead.score >= 80 ? 'bg-emerald-500' : lead.score >= 60 ? 'bg-blue-500' : 'bg-amber-500'}`}
                            style={{ width: `${lead.score}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-slate-700">{lead.score}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                      <span className="font-medium">{lead.bestTime}</span>
                      <span className="text-slate-400 text-xs ml-1">{lead.timezone}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                      {lead.attempts}/5
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                        lead.readiness === 'high' ? 'bg-emerald-100 text-emerald-700' :
                        lead.readiness === 'medium' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {lead.readiness === 'high' ? '🔥 ' : lead.readiness === 'medium' ? '⚡ ' : ''}
                        {lead.readiness.charAt(0).toUpperCase() + lead.readiness.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ═══ Timezone Calling Windows ═══ */}
        <div className="glass-card p-6 hover:translate-y-0">
          <h2 className="text-lg font-semibold text-slate-900 mb-1 tracking-tight flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-500" />
            Timezone Call Windows
          </h2>
          <p className="text-xs text-slate-500 mb-4">Set allowed calling hours per timezone</p>

          <div className="space-y-4">
            {Object.entries(timezoneWindows).map(([tz, config]) => (
              <div key={tz} className={`p-3 rounded-lg border transition-colors ${config.enabled ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-800">{tz}</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={config.enabled}
                      onChange={(e) => setTimezoneWindows({
                        ...timezoneWindows,
                        [tz]: { ...config, enabled: e.target.checked }
                      })}
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                  </label>
                </div>

                {config.enabled && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      {/* Visual timeline bar */}
                      <div className="relative h-5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="absolute h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full"
                          style={{
                            left: `${(config.start / 24) * 100}%`,
                            width: `${((config.end - config.start) / 24) * 100}%`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-[10px] text-slate-400">{config.start}:00</span>
                        <span className="text-[10px] text-slate-400">{config.end}:00</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <button className="w-full mt-5 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-sm transition-all flex items-center justify-center gap-2">
            <Globe className="h-4 w-4" />
            Save Timezone Rules
          </button>
        </div>
      </div>
    </div>
  );
}
