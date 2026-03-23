import React, { useEffect, useState } from 'react';
import { User, Bell, Shield, Key, CreditCard, Plug, Upload } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';

const TABS = [
  { id: 'profile', name: 'Profile', icon: User },
  { id: 'notifications', name: 'Notifications', icon: Bell },
  { id: 'security', name: 'Security', icon: Shield },
  { id: 'api_keys', name: 'API Keys', icon: Key },
  { id: 'billing', name: 'Billing', icon: CreditCard },
  { id: 'integrations', name: 'Integrations', icon: Plug },
];

export default function Settings() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  
  // Profile State
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    email: '',
    timezone: 'Pacific Standard Time (PST)'
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user && activeTab === 'profile') {
      setProfile(prev => ({
        ...prev,
        email: user.email || ''
      }));
      fetchProfile();
    }
  }, [user, activeTab]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('name')
        .eq('id', user?.id)
        .single();
      
      if (error) throw error;
      if (data && data.name) {
        const parts = data.name.split(' ');
        setProfile(prev => ({
          ...prev,
          first_name: parts[0] || '',
          last_name: parts.slice(1).join(' ') || ''
        }));
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fullName = `${profile.first_name} ${profile.last_name}`.trim();
      const { error } = await supabase
        .from('users')
        .update({ name: fullName })
        .eq('id', user?.id);
        
      if (error) throw error;
      alert('Profile updated successfully!');
    } catch (err) {
      console.error('Error updating profile:', err);
      alert('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-64 flex-shrink-0">
          <nav className="flex md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-md whitespace-nowrap transition-colors w-full ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <tab.icon
                  className={`flex-shrink-0 -ml-1 mr-3 h-5 w-5 ${
                    activeTab === tab.id ? 'text-blue-700' : 'text-slate-400'
                  }`}
                  aria-hidden="true"
                />
                <span className="truncate">{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {activeTab === 'profile' && (
            <div className="p-6 sm:p-8">
              <h2 className="text-xl font-medium text-slate-900 mb-6">Profile Information</h2>
              
              <form onSubmit={handleSaveProfile} className="space-y-6 max-w-2xl">
                <div className="flex items-center space-x-5">
                  <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-2xl font-medium shadow-inner">
                    {profile.first_name ? profile.first_name[0].toUpperCase() : 'U'}
                  </div>
                  <div>
                    <button type="button" className="inline-flex items-center justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 transition-colors">
                      <Upload className="h-4 w-4 mr-2 text-slate-400" />
                      Change avatar
                    </button>
                    <p className="mt-2 text-xs text-slate-500">JPG, GIF or PNG. 1MB max.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-6">
                  <div>
                    <label htmlFor="first-name" className="block text-sm font-medium leading-6 text-slate-900">
                      First name
                    </label>
                    <div className="mt-2">
                      <input
                        type="text"
                        name="first-name"
                        id="first-name"
                        value={profile.first_name}
                        onChange={(e) => setProfile({...profile, first_name: e.target.value})}
                        className="block w-full rounded-md border-slate-300 py-1.5 text-slate-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm sm:leading-6 border px-3"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="last-name" className="block text-sm font-medium leading-6 text-slate-900">
                      Last name
                    </label>
                    <div className="mt-2">
                      <input
                        type="text"
                        name="last-name"
                        id="last-name"
                        value={profile.last_name}
                        onChange={(e) => setProfile({...profile, last_name: e.target.value})}
                        className="block w-full rounded-md border-slate-300 py-1.5 text-slate-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm sm:leading-6 border px-3"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="email" className="block text-sm font-medium leading-6 text-slate-900">
                      Email address
                    </label>
                    <div className="mt-2">
                      <input
                        id="email"
                        name="email"
                        type="email"
                        disabled
                        value={profile.email}
                        className="block w-full rounded-md border-slate-200 py-1.5 text-slate-500 bg-slate-50 shadow-sm sm:text-sm sm:leading-6 border px-3 cursor-not-allowed"
                      />
                    </div>
                    <p className="mt-2 text-xs text-slate-500">Email address is used for login and cannot be changed.</p>
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="timezone" className="block text-sm font-medium leading-6 text-slate-900">
                      Timezone
                    </label>
                    <div className="mt-2">
                      <select
                        id="timezone"
                        name="timezone"
                        value={profile.timezone}
                        onChange={(e) => setProfile({...profile, timezone: e.target.value})}
                        className="block w-full rounded-md border-slate-300 py-1.5 text-slate-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm sm:leading-6 border px-3"
                      >
                        <option>Pacific Standard Time (PST)</option>
                        <option>Eastern Standard Time (EST)</option>
                        <option>Central Standard Time (CST)</option>
                        <option>Mountain Standard Time (MST)</option>
                        <option>Greenwich Mean Time (GMT)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-6 border-t border-slate-200">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 transition-colors"
                  >
                    {saving ? 'Saving...' : 'Save changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="p-6 sm:p-8">
              <h2 className="text-xl font-medium text-slate-900 mb-6">Notification Preferences</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900">Email Notifications</p>
                    <p className="text-sm text-slate-500">Receive daily summary reports</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900">SMS Alerts</p>
                    <p className="text-sm text-slate-500">Get notified for urgent QA flags</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="p-6 sm:p-8">
              <h2 className="text-xl font-medium text-slate-900 mb-6">Security Settings</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-slate-900 mb-2">Change Password</h3>
                  <form className="space-y-4 max-w-md">
                    <input type="password" placeholder="Current Password" className="block w-full rounded-md border-slate-300 py-1.5 text-slate-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3" />
                    <input type="password" placeholder="New Password" className="block w-full rounded-md border-slate-300 py-1.5 text-slate-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3" />
                    <input type="password" placeholder="Confirm New Password" className="block w-full rounded-md border-slate-300 py-1.5 text-slate-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3" />
                    <button type="button" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500">Update Password</button>
                  </form>
                </div>
                <div className="pt-6 border-t border-slate-200">
                  <h3 className="text-sm font-medium text-slate-900 mb-2">Two-Factor Authentication (2FA)</h3>
                  <p className="text-sm text-slate-500 mb-4">Add an extra layer of security to your account.</p>
                  <button type="button" className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-700 border border-slate-300 shadow-sm hover:bg-slate-50">Enable 2FA</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'api_keys' && (
            <div className="p-6 sm:p-8">
              <h2 className="text-xl font-medium text-slate-900 mb-6">API Keys</h2>
              <p className="text-sm text-slate-500 mb-6">Manage your API keys for integrating with external services.</p>
              
              <div className="space-y-4">
                <div className="p-4 border border-slate-200 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-slate-900">Production Key</span>
                    <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full font-medium">Active</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <code className="bg-slate-100 px-3 py-1.5 rounded text-sm text-slate-600 flex-1">sk_live_••••••••••••••••••••••••</code>
                    <button className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded shadow-sm hover:bg-slate-50">Copy</button>
                    <button className="px-3 py-1.5 text-sm font-medium text-red-600 bg-white border border-slate-300 rounded shadow-sm hover:bg-red-50">Revoke</button>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">Created on Mar 15, 2026</p>
                </div>
                <button className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-slate-900 hover:bg-slate-800">
                  Generate New Key
                </button>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="p-6 sm:p-8">
              <h2 className="text-xl font-medium text-slate-900 mb-6">Billing & Subscription</h2>
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-medium text-blue-900">Enterprise Plan</h3>
                <p className="text-sm text-blue-700 mt-1">You are currently on the Enterprise plan with unlimited calling minutes.</p>
                <div className="mt-4 flex items-center space-x-4">
                  <span className="text-2xl font-bold text-blue-900">$299<span className="text-sm font-normal text-blue-700">/mo</span></span>
                </div>
              </div>
              
              <h3 className="font-medium text-slate-900 mb-4">Payment Method</h3>
              <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-12 bg-slate-100 rounded border border-slate-200 flex items-center justify-center font-bold text-slate-400 text-xs">VISA</div>
                  <div>
                    <p className="font-medium text-slate-900">Visa ending in 4242</p>
                    <p className="text-sm text-slate-500">Expires 12/28</p>
                  </div>
                </div>
                <button className="text-sm font-medium text-blue-600 hover:text-blue-700">Update</button>
              </div>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="p-6 sm:p-8">
              <h2 className="text-xl font-medium text-slate-900 mb-6">Connected Services</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-slate-200 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 font-bold">SF</div>
                    <div>
                      <p className="font-medium text-slate-900">Salesforce</p>
                      <p className="text-xs text-emerald-600">Connected</p>
                    </div>
                  </div>
                  <button className="text-sm font-medium text-slate-500 hover:text-slate-700">Configure</button>
                </div>
                
                <div className="border border-slate-200 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold">Tw</div>
                    <div>
                      <p className="font-medium text-slate-900">Twilio Voice</p>
                      <p className="text-xs text-emerald-600">Connected</p>
                    </div>
                  </div>
                  <button className="text-sm font-medium text-slate-500 hover:text-slate-700">Configure</button>
                </div>

                <div className="border border-slate-200 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600 font-bold">OAI</div>
                    <div>
                      <p className="font-medium text-slate-900">OpenAI</p>
                      <p className="text-xs text-emerald-600">Connected</p>
                    </div>
                  </div>
                  <button className="text-sm font-medium text-slate-500 hover:text-slate-700">Configure</button>
                </div>

                <div className="border border-slate-200 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 font-bold">HS</div>
                    <div>
                      <p className="font-medium text-slate-900">HubSpot</p>
                      <p className="text-xs text-slate-500">Not connected</p>
                    </div>
                  </div>
                  <button className="text-sm font-medium text-blue-600 hover:text-blue-700">Connect</button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
