import React, { useEffect, useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuthStore } from '@/store/useAuthStore';
import { supabase } from '@/lib/supabase';

export default function Layout() {
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [setUser]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f5f5f7' }}>
        <div className="glass-panel p-8 flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-500 font-medium tracking-wide">Loading NexusCRM...</p>
        </div>
      </div>
    );
  }

  if (!user && location.pathname !== '/login') {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden relative selection:bg-blue-100 selection:text-blue-900" style={{ backgroundColor: '#f5f5f7' }}>
      {/* Decorative blurred background orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-400/20 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-blob pointer-events-none"></div>
      <div className="absolute top-[20%] right-[-5%] w-72 h-72 bg-purple-400/20 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-blob animation-delay-2000 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[20%] w-80 h-80 bg-emerald-400/20 rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-blob animation-delay-4000 pointer-events-none"></div>

      <div className="z-10 flex w-full h-full p-4 gap-4">
        {/* Sidebar floated */}
        <div className="h-full glass-panel flex-shrink-0 w-64 overflow-hidden flex flex-col">
          <Sidebar />
        </div>
        
        <div className="flex-1 flex flex-col min-w-0 h-full relative z-10 space-y-4">
          <div className="glass-panel px-6 py-3 flex-shrink-0 z-20">
            <Header />
          </div>
          
          <main className="flex-1 overflow-x-hidden overflow-y-auto glass-panel p-6 sm:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
