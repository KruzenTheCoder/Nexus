import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";
import Layout from "@/components/layout/Layout";
import Login from "@/pages/Login";
import Home from "@/pages/Home";
import Contacts from "@/pages/Contacts";
import Campaigns from "@/pages/Campaigns";
import IDEBuilder from "@/pages/IDEBuilder";
import Calls from "@/pages/Calls";
import Recordings from "@/pages/Recordings";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import DataOptimization from "@/pages/DataOptimization";
import VoiceAutomation from "@/pages/VoiceAutomation";
import SystemConfig from "@/pages/SystemConfig";
import OmniChannel from "@/pages/OmniChannel";
import LiveMonitoring from "@/pages/LiveMonitoring";
import UserManagement from "@/pages/UserManagement";

export default function App() {
  const { setUser, setIsLoading, user } = useAuthStore();

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [setUser, setIsLoading]);

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={user ? <Navigate to="/" replace /> : <Login />} 
        />
        
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="contacts" element={<Contacts />} />
          <Route path="campaigns" element={<Campaigns />} />
          <Route path="ide" element={<IDEBuilder />} />
          <Route path="calls" element={<Calls />} />
          <Route path="recordings" element={<Recordings />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="data-optimization" element={<DataOptimization />} />
          <Route path="voice-automation" element={<VoiceAutomation />} />
          <Route path="system-config" element={<SystemConfig />} />
          <Route path="omni-channel" element={<OmniChannel />} />
          <Route path="live-monitoring" element={<LiveMonitoring />} />
          <Route path="user-management" element={<UserManagement />} />
        </Route>
      </Routes>
    </Router>
  );
}
