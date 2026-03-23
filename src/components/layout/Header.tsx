import React from 'react';
import { Bell, Search, Menu } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { supabase } from '@/lib/supabase';

export default function Header() {
  const { user } = useAuthStore();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="flex h-14 items-center justify-between w-full bg-transparent">
      <div className="flex items-center flex-1">
        <button className="md:hidden p-2 -ml-2 mr-2 text-slate-500 hover:bg-slate-100 rounded-md">
          <Menu className="h-5 w-5" />
        </button>
        <div className="max-w-md w-full lg:max-w-xs relative hidden sm:block">
          <label htmlFor="search" className="sr-only">Search</label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-slate-400" aria-hidden="true" />
            </div>
            <input
              id="search"
              name="search"
              className="glass-input block w-full py-1.5 pl-10 pr-3 text-sm placeholder:text-slate-400 focus:outline-none"
              placeholder="Search contacts, campaigns..."
              type="search"
            />
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <button className="p-2 text-slate-400 hover:text-slate-500 relative transition-colors rounded-full hover:bg-white/50">
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
          <Bell className="h-5 w-5" aria-hidden="true" />
        </button>
        
        <div className="flex items-center space-x-3 border-l border-slate-200/60 pl-4">
          <div className="flex flex-col text-right hidden sm:flex">
            <span className="text-sm font-medium text-slate-700">{user?.email?.split('@')[0]}</span>
            <span className="text-xs text-slate-500 capitalize">{user?.role || 'Admin'}</span>
          </div>
          <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-medium shadow-sm ring-2 ring-white cursor-pointer hover:opacity-90 transition-opacity">
            {user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <button 
            onClick={handleLogout}
            className="text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors ml-2"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
