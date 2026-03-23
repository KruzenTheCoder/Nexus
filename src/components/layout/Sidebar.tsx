import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Megaphone, 
  PhoneCall, 
  FileAudio, 
  BarChart3, 
  Settings,
  GitBranch,
  Target,
  Bot,
  Server,
  Inbox,
  Activity,
  UserCog
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Contacts', href: '/contacts', icon: Users },
  { name: 'Campaigns', href: '/campaigns', icon: Megaphone },
  { name: 'Omni-Channel', href: '/omni-channel', icon: Inbox },
  { name: 'Workflow Builder', href: '/ide', icon: GitBranch },
  { name: 'Active Calls', href: '/calls', icon: PhoneCall },
  { name: 'Live Monitoring', href: '/live-monitoring', icon: Activity },
  { name: 'Data Optimization', href: '/data-optimization', icon: Target },
  { name: 'Voice AI Engine', href: '/voice-automation', icon: Bot },
  { name: 'Recordings & QA', href: '/recordings', icon: FileAudio },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'User Management', href: '/user-management', icon: UserCog },
  { name: 'System Config', href: '/system-config', icon: Server },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <div className="flex h-full flex-col bg-transparent relative z-20">
      <div className="flex h-16 shrink-0 items-center px-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <PhoneCall className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 tracking-tight">NexusCRM</span>
        </div>
      </div>
      <nav className="flex flex-1 flex-col px-4 py-4 overflow-y-auto custom-scrollbar">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600/10 text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:bg-white/60 hover:text-slate-900 hover:shadow-sm'
                }`}
              >
                <div className="relative">
                  <item.icon
                    className={`h-5 w-5 shrink-0 transition-colors duration-200 ${
                      isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                    aria-hidden="true"
                  />
                  {isActive && (
                    <div className="absolute -left-1 -top-1 -right-1 -bottom-1 rounded-lg bg-blue-500/10 animate-pulse-glow" />
                  )}
                </div>
                {item.name}
                {(item.name === 'Voice AI Engine') && (
                  <span className="ml-auto text-[9px] font-bold bg-gradient-to-r from-violet-500 to-indigo-500 text-white px-1.5 py-0.5 rounded-full">
                    NEW
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>
        <div className="mt-auto pt-4">
          <NavLink
            to="/settings"
            className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
              location.pathname === '/settings'
                ? 'bg-blue-600/10 text-blue-700 shadow-sm'
                : 'text-slate-600 hover:bg-white/60 hover:text-slate-900 hover:shadow-sm'
            }`}
          >
            <Settings
              className={`h-5 w-5 shrink-0 transition-colors duration-200 ${
                location.pathname === '/settings' ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
              }`}
              aria-hidden="true"
            />
            Settings
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
