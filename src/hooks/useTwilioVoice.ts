import { useState, useEffect, useRef } from 'react';
import { Device, Call } from '@twilio/voice-sdk';
import { useAuthStore } from '@/store/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:4444');

export type TwilioStatus = 'disconnected' | 'connecting' | 'ready' | 'calling' | 'ringing' | 'in-call' | 'error' | 'not-configured';

export function useTwilioVoice() {
  const { user } = useAuthStore();
  const [device, setDevice] = useState<Device | null>(null);
  const [activeCall, setActiveCall] = useState<Call | null>(null);
  const [status, setStatus] = useState<TwilioStatus>('disconnected');
  const [isMuted, setIsMuted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    let newDevice: Device | null = null;

    async function setupDevice() {
      if (!user) return;
      
      setStatus('connecting');
      setErrorMessage('');
      
      try {
        const response = await fetch(`${API_URL}/api/twilio/token?identity=${user.id}`);
        const data = await response.json();

        if (!response.ok) {
          // Server returned an error
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
            });
            call.on('reject', () => {
              setActiveCall(null);
              setStatus('ready');
            });
          });

          newDevice.register();
          setDevice(newDevice);
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

  const makeCall = async (phoneNumber: string) => {
    if (device && status === 'ready') {
      try {
        const call = await device.connect({ params: { To: phoneNumber } });
        
        call.on('accept', () => setStatus('in-call'));
        call.on('disconnect', () => {
          setActiveCall(null);
          setStatus('ready');
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
  };

  const endCall = () => {
    if (activeCall) {
      activeCall.disconnect();
    }
  };

  const toggleMute = () => {
    if (activeCall) {
      const muted = !isMuted;
      activeCall.mute(muted);
      setIsMuted(muted);
    }
  };

  return {
    device,
    activeCall,
    status,
    isMuted,
    errorMessage,
    makeCall,
    endCall,
    toggleMute,
    acceptCall: () => activeCall?.accept(),
    rejectCall: () => activeCall?.reject()
  };
}
