import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  PhoneCall, 
  Users, 
  CheckCircle, 
  Clock,
  TrendingUp,
  Activity,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Bot,
  GitBranch
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

// Animated number component
function AnimatedNumber({ value, suffix = '' }: { value: string; suffix?: string }) {
  return (
    <span className="animate-count-up inline-block" style={{ opacity: 0 }}>
      {value}{suffix}
    </span>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalCalls: 0,
    activeCalls: 0,
    connected: 0,
    voicemail: 0,
    noAnswer: 0,
    invalid: 0,
    totalDuration: 0
  });

  const [recentAgents, setRecentAgents] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: calls, error } = await supabase.from('calls').select('*, agent_id(name)');
      if (error) throw error;

      if (calls) {
        let connected = 0, voicemail = 0, noAnswer = 0, invalid = 0;
        let totalDuration = 0;
        let activeCalls = 0;
        
        calls.forEach((c: any) => {
          totalDuration += c.duration || 0;
          if (c.status === 'connected' || c.status === 'ringing') activeCalls++;
          
          if (c.disposition?.toLowerCase().includes('voicemail')) voicemail++;
          else if (c.disposition?.toLowerCase().includes('no answer') || c.status === 'failed') noAnswer++;
          else if (c.disposition?.toLowerCase().includes('invalid')) invalid++;
          else if (c.status === 'completed') connected++;
        });

        setStats({
          totalCalls: calls.length,
          activeCalls,
          connected,
          voicemail,
          noAnswer,
          invalid,
          totalDuration
        });

        // Group by agent
        const agentMap = new Map();
        calls.forEach((c: any) => {
          if (!c.agent_id) return;
          const agentData = c.agent_id as any;
          const aId = agentData.name || 'Unknown Agent';
          if (!agentMap.has(aId)) {
            agentMap.set(aId, { name: aId, calls: 0, duration: 0, status: c.status === 'completed' ? 'Available' : 'Wrap-up' });
          }
          const a = agentMap.get(aId);
          a.calls++;
          a.duration += (c.duration || 0);
        });
        setRecentAgents(Array.from(agentMap.values()).map((a, i) => ({ ...a, id: i })));
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
  };

  const connectRate = stats.totalCalls > 0 ? ((stats.connected / stats.totalCalls) * 100).toFixed(1) : '0';
  const avgHandleTime = stats.totalCalls > 0 ? Math.floor(stats.totalDuration / stats.totalCalls) : 0;

  const kpiData = [
    { name: 'Active Calls', value: stats.activeCalls.toString(), icon: Activity, change: '+2', up: true, color: 'text-blue-600', bg: 'bg-blue-100/50' },
    { name: 'Total Calls Today', value: stats.totalCalls.toString(), icon: PhoneCall, change: '+18', up: true, color: 'text-indigo-600', bg: 'bg-indigo-100/50' },
    { name: 'Connect Rate', value: `${connectRate}%`, icon: Users, change: '+2.8%', up: true, color: 'text-violet-600', bg: 'bg-violet-100/50' },
    { name: 'Conversion Rate', value: '12.5%', icon: CheckCircle, change: '+1.2%', up: true, color: 'text-emerald-600', bg: 'bg-emerald-100/50' },
    { name: 'Avg Handle Time', value: `${Math.floor(avgHandleTime/60)}m ${avgHandleTime%60}s`, icon: Clock, change: '-12s', up: false, color: 'text-amber-600', bg: 'bg-amber-100/50' },
  ];

  const outcomeData = [
    { name: 'Connected', value: stats.connected },
    { name: 'Voicemail', value: stats.voicemail },
    { name: 'No Answer', value: stats.noAnswer },
    { name: 'Invalid', value: stats.invalid },
  ].filter(d => d.value > 0);

  // If no data, show a placeholder for pie chart
  if (outcomeData.length === 0) outcomeData.push({ name: 'No Data', value: 1 });

  // Quick actions
  const quickActions = [
    { label: 'Workflow Builder', icon: GitBranch, path: '/ide', color: 'from-violet-500 to-indigo-600' },
    { label: 'Data Optimization', icon: Target, path: '/data-optimization', color: 'from-blue-500 to-cyan-600' },
    { label: 'Voice AI Engine', icon: Bot, path: '/voice-automation', color: 'from-rose-500 to-pink-600' },
    { label: 'Campaign Manager', icon: Zap, path: '/campaigns', color: 'from-amber-500 to-orange-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Dashboard</h1>
        <div className="flex items-center space-x-2 text-sm font-medium px-3 py-1.5 glass-card text-emerald-600 hover:translate-y-0">
          <TrendingUp className="h-4 w-4" />
          <span>Live Sync Active</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickActions.map((action, i) => (
          <button
            key={action.label}
            onClick={() => navigate(action.path)}
            className={`relative overflow-hidden rounded-xl p-4 text-left transition-all hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] animate-fade-in-up stagger-${i + 1} group`}
            style={{ opacity: 0 }}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${action.color} rounded-xl`} />
            <div className="relative z-10">
              <action.icon className="h-6 w-6 text-white/90 mb-2 group-hover:scale-110 transition-transform" />
              <p className="text-sm font-semibold text-white">{action.label}</p>
            </div>
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 rounded-full bg-white/10 group-hover:scale-150 transition-transform duration-500" />
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {kpiData.map((item, i) => (
          <div key={item.name} className={`glass-card p-5 animate-fade-in-up stagger-${i + 1}`} style={{ opacity: 0 }}>
            <div className="flex items-center">
              <div className={`rounded-xl p-3 ${item.bg}`}>
                <item.icon className={`h-6 w-6 ${item.color}`} aria-hidden="true" />
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-slate-500">{item.name}</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-bold text-slate-900 tracking-tight">
                      <AnimatedNumber value={item.value} />
                    </div>
                    <div className={`ml-2 flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${
                      item.up ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {item.up ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
                      {item.change}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Call Outcomes */}
        <div className="glass-card p-6 lg:col-span-1 flex flex-col hover:translate-y-0">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 tracking-tight">Call Outcomes</h2>
          <div className="flex-1 min-h-[250px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={outcomeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {outcomeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: '1px solid rgba(255,255,255,0.2)', 
                    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
                    backgroundColor: 'rgba(255,255,255,0.8)',
                    backdropFilter: 'blur(12px)'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-y-3 gap-x-4">
            {outcomeData.map((item, index) => (
              <div key={item.name} className="flex items-center">
                <div className="h-3 w-3 rounded-full mr-2 shadow-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="text-sm font-medium text-slate-600">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Agent Status */}
        <div className="glass-card lg:col-span-2 flex flex-col overflow-hidden hover:translate-y-0">
          <div className="border-b border-slate-200/50 px-6 py-4 flex justify-between items-center bg-white/40">
            <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Live Agent Board</h2>
            <span className="flex items-center text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600 mr-1.5 animate-pulse"></span>
              Auto-updates
            </span>
          </div>
          <div className="overflow-x-auto flex-1 p-2">
            <table className="min-w-full divide-y divide-slate-100">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Agent</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Duration</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Calls Handled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50/50">
                {recentAgents.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-sm font-medium text-slate-500">No agents active</td></tr>
                ) : (
                  recentAgents.map((agent) => (
                    <tr key={agent.id} className="hover:bg-white/40 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-slate-200 to-slate-100 flex items-center justify-center text-slate-600 mr-3 shadow-sm border border-white">
                            {agent.name.charAt(0)}
                          </div>
                          {agent.name}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold shadow-sm ${
                          agent.status === 'Available' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50' :
                          agent.status === 'On Call' ? 'bg-blue-50 text-blue-700 border border-blue-200/50' :
                          agent.status === 'Wrap-up' ? 'bg-amber-50 text-amber-700 border border-amber-200/50' :
                          'bg-slate-50 text-slate-700 border border-slate-200/50'
                        }`}>
                          {agent.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-600">{Math.floor(agent.duration/60)}m {agent.duration%60}s</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-600">{agent.calls}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
