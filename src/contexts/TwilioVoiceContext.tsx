import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Device, Call } from '@twilio/voice-sdk';
import { useAuthStore } from '@/store/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:4444');

export type TwilioStatus = 'disconnected' | 'connecting' | 'ready' | 'calling' | 'ringing' | 'in-call' | 'error' | 'not-configured';

export interface CallerInfo {
  name: string;
  initials: string;
  company: string;
  phone: string;
}

interface TwilioVoiceContextValue {
  device: Device | null;
  activeCall: Call | null;
  status: TwilioStatus;
  isMuted: boolean;
  errorMessage: string;
  callerInfo: CallerInfo | null;
  callTimer: number;
  makeCall: (phoneNumber: string, info?: CallerInfo) => Promise<void>;
  endCall: () => void;
  toggleMute: () => void;
  acceptCall: () => void;
  rejectCall: () => void;
  setCallerInfo: (info: CallerInfo | null) => void;
}

const TwilioVoiceContext = createContext<TwilioVoiceContextValue | null>(null);

export function useTwilioVoiceContext() {
  const ctx = useContext(TwilioVoiceContext);
  if (!ctx) throw new Error('useTwilioVoiceContext must be used within TwilioVoiceProvider');
  return ctx;
}

export function TwilioVoiceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const [device, setDevice] = useState<Device | null>(null);
  const [activeCall, setActiveCall] = useState<Call | null>(null);
  const [status, setStatus] = useState<TwilioStatus>('disconnected');
  const [isMuted, setIsMuted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [callerInfo, setCallerInfo] = useState<CallerInfo | null>(null);
  const [callTimer, setCallTimer] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const deviceRef = useRef<Device | null>(null);

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
      if (status === 'ready' || status === 'disconnected') {
        setCallTimer(0);
      }
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [status]);

  // ─── Setup Twilio Device (once, at app level) ──────
  useEffect(() => {
    let newDevice: Device | null = null;

    async function setupDevice() {
      if (!user) return;

      setStatus('connecting');
      setErrorMessage('');

      try {
        const response = await fetch(`${API_URL}/api/twilio/token?identity=${user.id}`);

        let data: any;
        const text = await response.text();
        try {
          data = JSON.parse(text);
        } catch {
          console.error('[TwilioVoice] Non-JSON response:', text.substring(0, 200));
          setStatus('error');
          setErrorMessage('Server error — check Vercel function logs');
          return;
        }

        if (!response.ok) {
          const msg = data.error || 'Failed to get Twilio token';
          if (msg.includes('not fully configured')) {
            setStatus('not-configured');
            setErrorMessage('Twilio credentials not configured. Go to System Configuration → API & Integrations to add your Twilio Account SID, API Key, API Secret, and TwiML App SID.');
          } else {
            setStatus('error');
            setErrorMessage(msg);
          }
          return;
        }

        if (data.token) {
          newDevice = new Device(data.token, {
            logLevel: 1,
            edge: ['ashburn', 'roaming']
          });

          newDevice.on('registered', () => {
            setStatus('ready');
            setErrorMessage('');
          });

          newDevice.on('error', (error: any) => {
            console.error('Twilio Device Error:', error);
            setStatus('error');
            setErrorMessage(error.message || 'Twilio device encountered an error');
          });

          newDevice.on('incoming', (call) => {
            setActiveCall(call);
            setStatus('ringing');

            call.on('accept', () => setStatus('in-call'));
            call.on('disconnect', () => {
              setActiveCall(null);
              setStatus('ready');
              setCallerInfo(null);
            });
            call.on('reject', () => {
              setActiveCall(null);
              setStatus('ready');
              setCallerInfo(null);
            });
          });

          newDevice.register();
          setDevice(newDevice);
          deviceRef.current = newDevice;
        } else {
          setStatus('error');
          setErrorMessage('No token received from server');
        }
      } catch (err: any) {
        console.error('Error setting up Twilio Device:', err);
        if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
          setStatus('error');
          setErrorMessage('Cannot reach the backend server. Make sure the API server is running on port 4444.');
        } else {
          setStatus('error');
          setErrorMessage(err.message || 'Failed to connect to Twilio');
        }
      }
    }

    setupDevice();

    return () => {
      if (newDevice) {
        newDevice.destroy();
      }
    };
  }, [user]);

  const makeCall = useCallback(async (phoneNumber: string, info?: CallerInfo) => {
    const dev = deviceRef.current || device;
    if (dev && status === 'ready') {
      if (info) setCallerInfo(info);
      try {
        const call = await dev.connect({ params: { To: phoneNumber } });

        call.on('accept', () => setStatus('in-call'));
        call.on('disconnect', () => {
          setActiveCall(null);
          setStatus('ready');
          setCallerInfo(null);
        });
        call.on('error', (error) => {
          console.error('Call Error:', error);
          setActiveCall(null);
          setStatus('ready');
        });

        setActiveCall(call);
        setStatus('calling');
      } catch (err: any) {
        console.error('Failed to make call:', err);
        setErrorMessage(err.message || 'Failed to place call');
      }
    }
  }, [device, status]);

  const endCall = useCallback(() => {
    if (activeCall) {
      activeCall.disconnect();
    }
  }, [activeCall]);

  const toggleMute = useCallback(() => {
    if (activeCall) {
      const muted = !isMuted;
      activeCall.mute(muted);
      setIsMuted(muted);
    }
  }, [activeCall, isMuted]);

  const acceptCall = useCallback(() => activeCall?.accept(), [activeCall]);
  const rejectCall = useCallback(() => activeCall?.reject(), [activeCall]);

  return (
    <TwilioVoiceContext.Provider value={{
      device,
      activeCall,
      status,
      isMuted,
      errorMessage,
      callerInfo,
      callTimer,
      makeCall,
      endCall,
      toggleMute,
      acceptCall,
      rejectCall,
      setCallerInfo,
    }}>
      {children}
    </TwilioVoiceContext.Provider>
  );
}
