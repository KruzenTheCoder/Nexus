import React, { useState } from 'react';
import {
  Users, Plus, Search, Edit, Trash2, Shield, ChevronRight, ArrowLeft,
  Save, CheckCircle, X, Phone, Mail, Clock, MoreHorizontal, UserPlus,
  Crown, Star, Briefcase, Headphones, Eye, Settings, Lock, Unlock,
  Filter, Download, Upload, AlertTriangle, Activity, Building
} from 'lucide-react';

// ─── ROLE DEFINITIONS ───────────────────────────────────────
const SYSTEM_ROLES = [
  { id: 'agent', label: 'Agent', level: 1, color: 'bg-slate-100 text-slate-800', icon: Headphones, desc: 'Handles calls and interactions with customers' },
  { id: 'team_leader', label: 'Team Leader', level: 2, color: 'bg-blue-100 text-blue-800', icon: Users, desc: 'Manages a team of agents, monitors performance' },
  { id: 'ops_manager', label: 'Operations Manager', level: 3, color: 'bg-emerald-100 text-emerald-800', icon: Briefcase, desc: 'Oversees daily operations across multiple teams' },
  { id: 'sr_ops_manager', label: 'Senior Ops Manager', level: 4, color: 'bg-violet-100 text-violet-800', icon: Star, desc: 'Strategic oversight of all operational departments' },
  { id: 'director', label: 'Director', level: 5, color: 'bg-amber-100 text-amber-800', icon: Crown, desc: 'Executive leadership over business unit' },
  { id: 'dialler_admin', label: 'Dialler Administrator', level: 6, color: 'bg-rose-100 text-rose-800', icon: Settings, desc: 'Full control over dialler configuration and telephony' },
  { id: 'super_admin', label: 'Super Admin', level: 7, color: 'bg-red-100 text-red-900', icon: Shield, desc: 'Unrestricted access to all system features' },
];

const PERMISSION_GROUPS = [
  {
    group: 'Campaigns', permissions: [
      { id: 'campaigns.view', label: 'View Campaigns' },
      { id: 'campaigns.create', label: 'Create Campaigns' },
      { id: 'campaigns.edit', label: 'Edit Campaigns' },
      { id: 'campaigns.delete', label: 'Delete Campaigns' },
      { id: 'campaigns.start_stop', label: 'Start / Stop Campaigns' },
    ]
  },
  {
    group: 'Contacts', permissions: [
      { id: 'contacts.view', label: 'View Contacts' },
      { id: 'contacts.create', label: 'Create Contacts' },
      { id: 'contacts.edit', label: 'Edit Contacts' },
      { id: 'contacts.delete', label: 'Delete Contacts' },
      { id: 'contacts.import', label: 'Import Contacts' },
      { id: 'contacts.export', label: 'Export Contacts' },
    ]
  },
  {
    group: 'Monitoring & QA', permissions: [
      { id: 'monitoring.live', label: 'Live Monitoring' },
      { id: 'monitoring.listen', label: 'Silent Listen' },
      { id: 'monitoring.whisper', label: 'Whisper to Agent' },
      { id: 'monitoring.barge', label: 'Barge In' },
      { id: 'recordings.view', label: 'View Recordings' },
      { id: 'recordings.download', label: 'Download Recordings' },
    ]
  },
  {
    group: 'Reports & Analytics', permissions: [
      { id: 'reports.view', label: 'View Reports' },
      { id: 'reports.export', label: 'Export Reports' },
      { id: 'reports.scheduled', label: 'Schedule Reports' },
    ]
  },
  {
    group: 'Administration', permissions: [
      { id: 'admin.users', label: 'Manage Users' },
      { id: 'admin.roles', label: 'Manage Roles' },
      { id: 'admin.system_config', label: 'System Configuration' },
      { id: 'admin.integrations', label: 'API & Integrations' },
      { id: 'admin.billing', label: 'Billing & Subscription' },
      { id: 'admin.audit_log', label: 'View Audit Log' },
    ]
  },
  {
    group: 'Omni-Channel', permissions: [
      { id: 'omni.inbox', label: 'Access Inbox' },
      { id: 'omni.assign', label: 'Assign Conversations' },
      { id: 'omni.templates', label: 'Manage Templates' },
    ]
  },
  {
    group: 'Voice AI', permissions: [
      { id: 'voice_ai.view', label: 'View Voice AI Engine' },
      { id: 'voice_ai.configure', label: 'Configure AI Agents' },
      { id: 'voice_ai.deploy', label: 'Deploy AI Agents' },
    ]
  },
];

// Role presets: which permissions each role gets by default
const ROLE_PERMISSION_PRESETS: Record<string, string[]> = {
  agent: ['campaigns.view', 'contacts.view', 'omni.inbox'],
  team_leader: ['campaigns.view', 'contacts.view', 'contacts.create', 'contacts.edit', 'monitoring.live', 'monitoring.listen', 'monitoring.whisper', 'recordings.view', 'reports.view', 'omni.inbox', 'omni.assign'],
  ops_manager: ['campaigns.view', 'campaigns.create', 'campaigns.edit', 'campaigns.start_stop', 'contacts.view', 'contacts.create', 'contacts.edit', 'contacts.import', 'contacts.export', 'monitoring.live', 'monitoring.listen', 'monitoring.whisper', 'monitoring.barge', 'recordings.view', 'recordings.download', 'reports.view', 'reports.export', 'omni.inbox', 'omni.assign', 'omni.templates'],
  sr_ops_manager: ['campaigns.view', 'campaigns.create', 'campaigns.edit', 'campaigns.delete', 'campaigns.start_stop', 'contacts.view', 'contacts.create', 'contacts.edit', 'contacts.delete', 'contacts.import', 'contacts.export', 'monitoring.live', 'monitoring.listen', 'monitoring.whisper', 'monitoring.barge', 'recordings.view', 'recordings.download', 'reports.view', 'reports.export', 'reports.scheduled', 'admin.users', 'omni.inbox', 'omni.assign', 'omni.templates', 'voice_ai.view'],
  director: ['campaigns.view', 'campaigns.create', 'campaigns.edit', 'campaigns.delete', 'campaigns.start_stop', 'contacts.view', 'contacts.create', 'contacts.edit', 'contacts.delete', 'contacts.import', 'contacts.export', 'monitoring.live', 'monitoring.listen', 'monitoring.whisper', 'monitoring.barge', 'recordings.view', 'recordings.download', 'reports.view', 'reports.export', 'reports.scheduled', 'admin.users', 'admin.roles', 'admin.audit_log', 'omni.inbox', 'omni.assign', 'omni.templates', 'voice_ai.view', 'voice_ai.configure'],
  dialler_admin: PERMISSION_GROUPS.flatMap(g => g.permissions.map(p => p.id)).filter(p => p !== 'admin.billing'),
  super_admin: PERMISSION_GROUPS.flatMap(g => g.permissions.map(p => p.id)),
};

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: 'active' | 'inactive' | 'suspended';
  campaigns: string[];
  team: string;
  extension: string;
  created_at: string;
  last_login: string;
  permissions: string[];
}

interface CustomRole {
  id: string;
  name: string;
  level: number;
  color: string;
  desc: string;
  permissions: string[];
}

// ─── MOCK DATA ──────────────────────────────────────────────
const MOCK_CAMPAIGNS = [
  { id: 'c1', name: 'Q3 B2B Outbound' },
  { id: 'c2', name: 'Insurance Renewals' },
  { id: 'c3', name: 'Debt Collections' },
  { id: 'c4', name: 'Customer Survey 2024' },
  { id: 'c5', name: 'Welcome Onboarding' },
  { id: 'c6', name: 'Win-Back Campaign' },
];

const MOCK_TEAMS = ['Team Alpha', 'Team Bravo', 'Team Charlie', 'Team Delta', 'Team Echo', 'Unassigned'];

const MOCK_USERS: User[] = [
  { id: '1', name: 'Sarah Johnson', email: 'sarah.j@nexuscrm.com', phone: '+1 555-0101', role: 'super_admin', status: 'active', campaigns: ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'], team: 'Team Alpha', extension: '1001', created_at: '2024-01-15', last_login: '2024-03-22 14:32', permissions: ROLE_PERMISSION_PRESETS.super_admin },
  { id: '2', name: 'James Rodriguez', email: 'james.r@nexuscrm.com', phone: '+1 555-0102', role: 'director', status: 'active', campaigns: ['c1', 'c2', 'c3'], team: 'Team Alpha', extension: '1002', created_at: '2024-02-01', last_login: '2024-03-22 09:15', permissions: ROLE_PERMISSION_PRESETS.director },
  { id: '3', name: 'Emily Chen', email: 'emily.c@nexuscrm.com', phone: '+1 555-0103', role: 'sr_ops_manager', status: 'active', campaigns: ['c1', 'c2'], team: 'Team Bravo', extension: '1003', created_at: '2024-02-10', last_login: '2024-03-22 11:45', permissions: ROLE_PERMISSION_PRESETS.sr_ops_manager },
  { id: '4', name: 'Michael Thompson', email: 'michael.t@nexuscrm.com', phone: '+1 555-0104', role: 'ops_manager', status: 'active', campaigns: ['c1', 'c3'], team: 'Team Charlie', extension: '1004', created_at: '2024-02-15', last_login: '2024-03-21 16:20', permissions: ROLE_PERMISSION_PRESETS.ops_manager },
  { id: '5', name: 'Lisa Park', email: 'lisa.p@nexuscrm.com', phone: '+1 555-0105', role: 'team_leader', status: 'active', campaigns: ['c1'], team: 'Team Alpha', extension: '1005', created_at: '2024-03-01', last_login: '2024-03-22 08:00', permissions: ROLE_PERMISSION_PRESETS.team_leader },
  { id: '6', name: 'David Kim', email: 'david.k@nexuscrm.com', phone: '+1 555-0106', role: 'team_leader', status: 'active', campaigns: ['c2', 'c3'], team: 'Team Bravo', extension: '1006', created_at: '2024-03-01', last_login: '2024-03-22 10:30', permissions: ROLE_PERMISSION_PRESETS.team_leader },
  { id: '7', name: 'Anna Kowalski', email: 'anna.k@nexuscrm.com', phone: '+1 555-0107', role: 'agent', status: 'active', campaigns: ['c1'], team: 'Team Alpha', extension: '2001', created_at: '2024-03-05', last_login: '2024-03-22 07:55', permissions: ROLE_PERMISSION_PRESETS.agent },
  { id: '8', name: 'Chris Martinez', email: 'chris.m@nexuscrm.com', phone: '+1 555-0108', role: 'agent', status: 'active', campaigns: ['c1'], team: 'Team Alpha', extension: '2002', created_at: '2024-03-05', last_login: '2024-03-22 08:02', permissions: ROLE_PERMISSION_PRESETS.agent },
  { id: '9', name: 'Priya Patel', email: 'priya.p@nexuscrm.com', phone: '+1 555-0109', role: 'agent', status: 'inactive', campaigns: ['c2'], team: 'Team Bravo', extension: '2003', created_at: '2024-03-08', last_login: '2024-03-15 12:00', permissions: ROLE_PERMISSION_PRESETS.agent },
  { id: '10', name: 'Tom Wilson', email: 'tom.w@nexuscrm.com', phone: '+1 555-0110', role: 'dialler_admin', status: 'active', campaigns: ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'], team: 'Team Alpha', extension: '1010', created_at: '2024-01-20', last_login: '2024-03-22 13:00', permissions: ROLE_PERMISSION_PRESETS.dialler_admin },
  { id: '11', name: 'Rachel Green', email: 'rachel.g@nexuscrm.com', phone: '+1 555-0111', role: 'agent', status: 'suspended', campaigns: ['c3'], team: 'Team Charlie', extension: '2004', created_at: '2024-03-10', last_login: '2024-03-18 09:30', permissions: ROLE_PERMISSION_PRESETS.agent },
  { id: '12', name: 'Alex Turner', email: 'alex.t@nexuscrm.com', phone: '+1 555-0112', role: 'agent', status: 'active', campaigns: ['c2'], team: 'Team Bravo', extension: '2005', created_at: '2024-03-12', last_login: '2024-03-22 08:10', permissions: ROLE_PERMISSION_PRESETS.agent },
];

type ViewMode = 'list' | 'edit' | 'roles';

const inputCls = "block w-full rounded-lg border-slate-200 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2.5 border bg-white";

export default function UserManagement() {
  const [view, setView] = useState<ViewMode>('list');
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [teamFilter, setTeamFilter] = useState('all');

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [configTab, setConfigTab] = useState<'details' | 'permissions' | 'campaigns'>('details');

  // Custom roles
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [editingRole, setEditingRole] = useState<CustomRole | null>(null);
  const [creatingRole, setCreatingRole] = useState(false);
  const [saved, setSaved] = useState(false);

  const allRoles = [
    ...SYSTEM_ROLES,
    ...customRoles.map(cr => ({
      id: cr.id,
      label: cr.name,
      level: cr.level,
      color: cr.color,
      icon: Shield,
      desc: cr.desc,
    })),
  ];

  const getRoleInfo = (roleId: string) => allRoles.find(r => r.id === roleId) || SYSTEM_ROLES[0];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-800';
      case 'inactive': return 'bg-slate-100 text-slate-600';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  // New blank user
  const blankUser = (): User => ({
    id: `u_${Date.now()}`,
    name: '', email: '', phone: '', role: 'agent', status: 'active',
    campaigns: [], team: 'Unassigned', extension: '',
    created_at: new Date().toISOString().split('T')[0], last_login: 'Never',
    permissions: [...ROLE_PERMISSION_PRESETS.agent],
  });

  const openCreate = () => { setEditingUser(blankUser()); setIsCreating(true); setConfigTab('details'); setView('edit'); };
  const openEdit = (u: User) => { setEditingUser({ ...u, permissions: [...(u.permissions || [])] }); setIsCreating(false); setConfigTab('details'); setView('edit'); };

  const handleSaveUser = () => {
    if (!editingUser) return;
    if (isCreating) {
      setUsers([editingUser, ...users]);
    } else {
      setUsers(users.map(u => u.id === editingUser.id ? editingUser : u));
    }
    setView('list'); setEditingUser(null); setIsCreating(false);
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const handleDeleteUser = (id: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    setUsers(users.filter(u => u.id !== id));
  };

  const togglePermission = (permId: string) => {
    if (!editingUser) return;
    const perms = editingUser.permissions.includes(permId)
      ? editingUser.permissions.filter(p => p !== permId)
      : [...editingUser.permissions, permId];
    setEditingUser({ ...editingUser, permissions: perms });
  };

  const toggleCampaign = (campId: string) => {
    if (!editingUser) return;
    const camps = editingUser.campaigns.includes(campId)
      ? editingUser.campaigns.filter(c => c !== campId)
      : [...editingUser.campaigns, campId];
    setEditingUser({ ...editingUser, campaigns: camps });
  };

  const applyRolePreset = (roleId: string) => {
    if (!editingUser) return;
    const presets = ROLE_PERMISSION_PRESETS[roleId] || customRoles.find(c => c.id === roleId)?.permissions || [];
    setEditingUser({ ...editingUser, role: roleId, permissions: [...presets] });
  };

  // Filtering
  const filtered = users.filter(u => {
    if (searchQuery && !u.name.toLowerCase().includes(searchQuery.toLowerCase()) && !u.email.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (statusFilter !== 'all' && u.status !== statusFilter) return false;
    if (teamFilter !== 'all' && u.team !== teamFilter) return false;
    return true;
  });

  // Role stats
  const roleCounts = allRoles.map(r => ({ ...r, count: users.filter(u => u.role === r.id).length }));

  // ═══════════════════════════════════════════════════════════
  //  ROLE MANAGEMENT VIEW
  // ═══════════════════════════════════════════════════════════
  if (view === 'roles') {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setView('list')} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"><ArrowLeft className="h-5 w-5" /></button>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Role Management</h1>
              <p className="text-sm text-slate-500">System roles, custom roles, and permission presets</p>
            </div>
          </div>
          <button onClick={() => { setCreatingRole(true); setEditingRole({ id: `role_${Date.now()}`, name: '', level: 2, color: 'bg-teal-100 text-teal-800', desc: '', permissions: [] }); }} className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-sm transition-all gap-2">
            <Plus className="h-4 w-4" /> Create Custom Role
          </button>
        </div>

        {/* System Roles Hierarchy */}
        <div className="glass-card p-6 hover:translate-y-0">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2"><Shield className="h-5 w-5 text-blue-500" /> System Role Hierarchy</h3>
          <div className="relative">
            {SYSTEM_ROLES.map((role, i) => (
              <div key={role.id} className="flex items-center gap-4 mb-3 last:mb-0">
                <div className="w-8 text-center">
                  <span className="text-xs font-bold text-slate-400">L{role.level}</span>
                </div>
                <div className="relative flex-shrink-0">
                  {i < SYSTEM_ROLES.length - 1 && <div className="absolute left-1/2 top-full w-0.5 h-3 bg-slate-200 -translate-x-1/2" />}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${role.color}`}>
                    <role.icon className="h-4 w-4" />
                  </div>
                </div>
                <div className="flex-1 flex items-center justify-between bg-white rounded-xl border border-slate-200 px-4 py-3 hover:border-blue-200 transition-colors">
                  <div>
                    <span className="text-sm font-semibold text-slate-900">{role.label}</span>
                    <p className="text-xs text-slate-500">{role.desc}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">{users.filter(u => u.role === role.id).length} users</span>
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{(ROLE_PERMISSION_PRESETS[role.id] || []).length} perms</span>
                    <Lock className="h-3.5 w-3.5 text-slate-300" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Roles */}
        <div className="glass-card p-6 hover:translate-y-0">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2"><Star className="h-5 w-5 text-amber-500" /> Custom Roles</h3>
          {customRoles.length === 0 && !creatingRole ? (
            <div className="text-center py-8 text-slate-400">
              <Shield className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No custom roles created yet. Click "Create Custom Role" to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {customRoles.map(cr => (
                <div key={cr.id} className="flex items-center justify-between bg-white rounded-xl border border-slate-200 px-4 py-3 hover:border-blue-200 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cr.color}`}><Shield className="h-4 w-4" /></div>
                    <div>
                      <span className="text-sm font-semibold text-slate-900">{cr.name}</span>
                      <p className="text-xs text-slate-500">{cr.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">Level {cr.level}</span>
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{cr.permissions.length} perms</span>
                    <button onClick={() => { setEditingRole({ ...cr }); setCreatingRole(false); }} className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md transition-colors"><Edit className="h-4 w-4" /></button>
                    <button onClick={() => setCustomRoles(customRoles.filter(r => r.id !== cr.id))} className="p-1.5 text-slate-400 hover:text-red-600 rounded-md transition-colors"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Create / Edit Custom Role inline */}
          {editingRole && (
            <div className="mt-4 border-t border-slate-200 pt-4 space-y-4 animate-fade-in">
              <h4 className="text-sm font-bold text-slate-700">{creatingRole ? 'Create New Custom Role' : 'Edit Custom Role'}</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Role Name</label>
                  <input value={editingRole.name} onChange={e => setEditingRole({ ...editingRole, name: e.target.value })} className={inputCls} placeholder="e.g. Quality Analyst" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Role Level (1-7)</label>
                  <input type="number" min={1} max={7} value={editingRole.level} onChange={e => setEditingRole({ ...editingRole, level: parseInt(e.target.value) })} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Badge Color</label>
                  <select value={editingRole.color} onChange={e => setEditingRole({ ...editingRole, color: e.target.value })} className={inputCls}>
                    <option value="bg-teal-100 text-teal-800">Teal</option>
                    <option value="bg-pink-100 text-pink-800">Pink</option>
                    <option value="bg-cyan-100 text-cyan-800">Cyan</option>
                    <option value="bg-orange-100 text-orange-800">Orange</option>
                    <option value="bg-lime-100 text-lime-800">Lime</option>
                    <option value="bg-fuchsia-100 text-fuchsia-800">Fuchsia</option>
                    <option value="bg-sky-100 text-sky-800">Sky</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
                  <input value={editingRole.desc} onChange={e => setEditingRole({ ...editingRole, desc: e.target.value })} className={inputCls} placeholder="What this role does" />
                </div>
              </div>
              {/* Permissions for custom role */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Permissions</label>
                <div className="grid grid-cols-2 gap-4 max-h-60 overflow-y-auto pr-2">
                  {PERMISSION_GROUPS.map(pg => (
                    <div key={pg.group}>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">{pg.group}</p>
                      {pg.permissions.map(p => (
                        <label key={p.id} className="flex items-center gap-2 cursor-pointer py-0.5">
                          <input type="checkbox" checked={editingRole.permissions.includes(p.id)} onChange={() => {
                            const perms = editingRole.permissions.includes(p.id) ? editingRole.permissions.filter(x => x !== p.id) : [...editingRole.permissions, p.id];
                            setEditingRole({ ...editingRole, permissions: perms });
                          }} className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-600" />
                          <span className="text-xs text-slate-700">{p.label}</span>
                        </label>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => {
                  if (creatingRole) setCustomRoles([...customRoles, editingRole]);
                  else setCustomRoles(customRoles.map(c => c.id === editingRole.id ? editingRole : c));
                  ROLE_PERMISSION_PRESETS[editingRole.id] = editingRole.permissions;
                  setEditingRole(null); setCreatingRole(false);
                }} className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-sm transition-all flex items-center gap-2">
                  <Save className="h-4 w-4" /> {creatingRole ? 'Create Role' : 'Save Changes'}
                </button>
                <button onClick={() => { setEditingRole(null); setCreatingRole(false); }} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  //  USER EDIT / CREATE VIEW
  // ═══════════════════════════════════════════════════════════
  if (view === 'edit' && editingUser) {
    return (
      <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => { setView('list'); setEditingUser(null); }} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"><ArrowLeft className="h-5 w-5" /></button>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">{isCreating ? 'Create New User' : `Edit: ${editingUser.name}`}</h1>
              <p className="text-sm text-slate-500">Configure user details, role, permissions, and campaign access</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setView('list'); setEditingUser(null); }} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">Cancel</button>
            <button onClick={handleSaveUser} className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-sm transition-all flex items-center gap-2">
              <Save className="h-4 w-4" /> {isCreating ? 'Create User' : 'Save Changes'}
            </button>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Tab sidebar */}
          <div className="w-52 flex-shrink-0 space-y-1">
            {[
              { id: 'details', label: 'User Details', icon: Users },
              { id: 'permissions', label: 'Permissions', icon: Shield },
              { id: 'campaigns', label: 'Campaign Access', icon: Building },
            ].map(tab => (
              <button key={tab.id} onClick={() => setConfigTab(tab.id as any)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${configTab === tab.id ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-600 hover:bg-white/60'}`}>
                <tab.icon className={`h-4 w-4 ${configTab === tab.id ? 'text-blue-600' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Config Content */}
          <div className="flex-1 glass-card p-6 hover:translate-y-0 min-h-[520px] animate-fade-in">

            {/* ─── USER DETAILS ─────────────────────── */}
            {configTab === 'details' && (
              <div className="space-y-5">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-200"><Users className="h-5 w-5 text-blue-500" /> User Information</h3>
                <div className="grid grid-cols-2 gap-5">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                    <input value={editingUser.name} onChange={e => setEditingUser({ ...editingUser, name: e.target.value })} className={inputCls} placeholder="John Smith" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
                    <input type="email" value={editingUser.email} onChange={e => setEditingUser({ ...editingUser, email: e.target.value })} className={inputCls} placeholder="john@nexuscrm.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone Number</label>
                    <input type="tel" value={editingUser.phone} onChange={e => setEditingUser({ ...editingUser, phone: e.target.value })} className={inputCls} placeholder="+1 555-000-0000" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone Extension</label>
                    <input value={editingUser.extension} onChange={e => setEditingUser({ ...editingUser, extension: e.target.value })} className={inputCls} placeholder="1001" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Team</label>
                    <select value={editingUser.team} onChange={e => setEditingUser({ ...editingUser, team: e.target.value })} className={inputCls}>
                      {MOCK_TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Role</label>
                    <select value={editingUser.role} onChange={e => applyRolePreset(e.target.value)} className={inputCls}>
                      {allRoles.map(r => <option key={r.id} value={r.id}>{r.label} (Level {r.level})</option>)}
                    </select>
                    <p className="text-xs text-slate-500 mt-1">Changing role applies default permissions. Customize in Permissions tab.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
                    <select value={editingUser.status} onChange={e => setEditingUser({ ...editingUser, status: e.target.value as any })} className={inputCls}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>
                {!isCreating && (
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex gap-8">
                    <div><span className="text-xs text-slate-400 uppercase font-bold">Created</span><p className="text-sm text-slate-700 font-medium">{editingUser.created_at}</p></div>
                    <div><span className="text-xs text-slate-400 uppercase font-bold">Last Login</span><p className="text-sm text-slate-700 font-medium">{editingUser.last_login}</p></div>
                    <div><span className="text-xs text-slate-400 uppercase font-bold">User ID</span><p className="text-sm text-slate-700 font-mono">{editingUser.id}</p></div>
                  </div>
                )}
              </div>
            )}

            {/* ─── PERMISSIONS ─────────────────────── */}
            {configTab === 'permissions' && (
              <div className="space-y-5">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-200">
                  <Shield className="h-5 w-5 text-violet-500" /> Permissions
                  <span className="ml-auto text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">{editingUser.permissions.length} granted</span>
                </h3>
                <div className="bg-violet-50 border border-violet-200 rounded-xl p-3 text-xs text-violet-800 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Permissions are pre-filled based on the selected role. You can customize below. Changes here override the role defaults for this user only.</span>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  {PERMISSION_GROUPS.map(pg => (
                    <div key={pg.group} className="bg-white border border-slate-200 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">{pg.group}</h4>
                        <button onClick={() => {
                          const allIds = pg.permissions.map(p => p.id);
                          const allSelected = allIds.every(id => editingUser.permissions.includes(id));
                          const perms = allSelected
                            ? editingUser.permissions.filter(p => !allIds.includes(p))
                            : [...new Set([...editingUser.permissions, ...allIds])];
                          setEditingUser({ ...editingUser, permissions: perms });
                        }} className="text-[10px] text-blue-600 hover:text-blue-800 font-medium">
                          Toggle All
                        </button>
                      </div>
                      <div className="space-y-1.5">
                        {pg.permissions.map(p => (
                          <label key={p.id} className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={editingUser.permissions.includes(p.id)} onChange={() => togglePermission(p.id)} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600" />
                            <span className="text-sm text-slate-700">{p.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ─── CAMPAIGN ACCESS ────────────────── */}
            {configTab === 'campaigns' && (
              <div className="space-y-5">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-200">
                  <Building className="h-5 w-5 text-emerald-500" /> Campaign Assignment
                  <span className="ml-auto text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{editingUser.campaigns.length} assigned</span>
                </h3>
                <p className="text-sm text-slate-500">Select which campaigns this user can access and work on. Higher-level roles (Director+) typically get all campaigns.</p>
                <div className="grid grid-cols-2 gap-3">
                  {MOCK_CAMPAIGNS.map(camp => (
                    <label key={camp.id} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${editingUser.campaigns.includes(camp.id) ? 'border-emerald-300 bg-emerald-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                      <input type="checkbox" checked={editingUser.campaigns.includes(camp.id)} onChange={() => toggleCampaign(camp.id)} className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600" />
                      <div>
                        <span className="text-sm font-medium text-slate-900">{camp.name}</span>
                        <p className="text-xs text-slate-500">{camp.id}</p>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setEditingUser({ ...editingUser, campaigns: MOCK_CAMPAIGNS.map(c => c.id) })} className="text-xs text-blue-600 hover:text-blue-800 font-medium bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">Select All</button>
                  <button onClick={() => setEditingUser({ ...editingUser, campaigns: [] })} className="text-xs text-slate-600 hover:text-slate-800 font-medium bg-slate-100 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-colors">Deselect All</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  //  USER LIST VIEW (default)
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">User Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">Create and manage users, roles, teams, and permissions</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setView('roles')} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2">
            <Shield className="h-4 w-4" /> Roles & Permissions
          </button>
          <button onClick={openCreate} className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-sm transition-all gap-2">
            <UserPlus className="h-4 w-4" /> Add User
          </button>
        </div>
      </div>

      {saved && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm text-emerald-800 flex items-center gap-2 animate-fade-in">
          <CheckCircle className="h-4 w-4" /> User saved successfully.
        </div>
      )}

      {/* Role summary strip */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {roleCounts.map(r => (
          <button key={r.id} onClick={() => setRoleFilter(roleFilter === r.id ? 'all' : r.id)} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all flex-shrink-0 ${roleFilter === r.id ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}>
            <r.icon className="h-3 w-3" />
            {r.label}
            <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full text-[10px] font-bold">{r.count}</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full rounded-lg border border-slate-200 pl-9 pr-4 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 bg-white" placeholder="Search by name or email..." />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:border-blue-500 focus:ring-blue-500">
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
        <select value={teamFilter} onChange={e => setTeamFilter(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:border-blue-500 focus:ring-blue-500">
          <option value="all">All Teams</option>
          {MOCK_TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* User Table */}
      <div className="glass-card overflow-hidden hover:translate-y-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/80">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">User</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Role</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Team</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Campaigns</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Ext.</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Last Login</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((user, i) => {
                const role = getRoleInfo(user.role);
                return (
                  <tr key={user.id} className={`hover:bg-blue-50/30 transition-colors animate-fade-in-up stagger-${Math.min(i + 1, 5)}`} style={{ opacity: 0 }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">{user.name.split(' ').map(n => n[0]).join('')}</div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${role.color}`}>
                        <role.icon className="h-3 w-3" /> {role.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{user.team}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-600">{user.campaigns.length} campaign{user.campaigns.length !== 1 ? 's' : ''}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusBadge(user.status)}`}>{user.status}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 font-mono">{user.extension}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{user.last_login}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(user)} className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md transition-colors" title="Edit"><Edit className="h-4 w-4" /></button>
                        <button onClick={() => handleDeleteUser(user.id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded-md transition-colors" title="Delete"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400 text-sm">No users match your filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500">Showing {filtered.length} of {users.length} users</span>
          <div className="flex gap-2">
            <button className="text-xs text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1"><Download className="h-3 w-3" /> Export CSV</button>
            <button className="text-xs text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1"><Upload className="h-3 w-3" /> Import Users</button>
          </div>
        </div>
      </div>
    </div>
  );
}
