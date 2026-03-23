import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Volume2, Users, Bot, MessageSquare, Info, Play, Square, AlertTriangle, Settings } from 'lucide-react';
import { useTwilioVoice } from '@/hooks/useTwilioVoice';
import { useSocket } from '@/hooks/useSocket';
import { useNavigate } from 'react-router-dom';

export default function Calls() {
  const [phoneNumber, setPhoneNumber] = useState('+1 (555) 019-8234');
  const [simulatedTranscript, setSimulatedTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [speakerRole, setSpeakerRole] = useState<'agent' | 'customer'>('customer');
  
  // Real integrations
  const { status, makeCall, endCall, isMuted, toggleMute, errorMessage } = useTwilioVoice();
  // using a dummy call id for socket room demo
  const { isConnected, aiAnalysis, sendTranscription } = useSocket('demo-call-123');
  const navigate = useNavigate();

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Setup Speech Recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        if (transcript.trim()) {
          sendTranscription(transcript, speakerRole);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        // If it was supposed to be recording, restart it (continuous listening)
        if (isRecording) {
          try {
            recognition.start();
          } catch (e) {
             // Ignore already started errors
          }
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isRecording, speakerRole, sendTranscription]);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition is not supported in this browser. Please use Chrome.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSimulateTranscript = () => {
    if (simulatedTranscript.trim()) {
      sendTranscription(simulatedTranscript, speakerRole);
      setSimulatedTranscript('');
    }
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-8rem)]">
      {/* Left Column: Dial Pad & Call Controls */}
      <div className="w-1/3 flex flex-col space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center justify-center flex-1 relative">
          <div className="absolute top-4 right-4 flex items-center space-x-2">
            <span className={`h-2.5 w-2.5 rounded-full ${
              status === 'ready' ? 'bg-emerald-500' : 
              status === 'in-call' ? 'bg-blue-500' : 
              status === 'connecting' ? 'bg-amber-500 animate-pulse' :
              status === 'not-configured' ? 'bg-amber-500' :
              'bg-red-500'
            }`}></span>
            <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">{status}</span>
          </div>

          {/* Error / Not Configured Banner */}
          {(status === 'error' || status === 'not-configured') && errorMessage && (
            <div className={`absolute top-14 left-4 right-4 rounded-lg p-3 text-xs flex items-start gap-2 ${
              status === 'not-configured' 
                ? 'bg-amber-50 border border-amber-200 text-amber-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">{errorMessage}</p>
                {status === 'not-configured' && (
                  <button 
                    onClick={() => navigate('/system-config')}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    <Settings className="h-3 w-3" /> Go to System Configuration
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Phone className="h-10 w-10 text-blue-600" />
          </div>
          <h2 className="text-2xl font-semibold text-slate-900 mb-1">Alice Smith</h2>
          <input 
            type="text" 
            value={phoneNumber} 
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="text-center text-slate-500 mb-6 bg-transparent border-b border-slate-200 focus:border-blue-500 focus:outline-none focus:ring-0"
          />
          
          <div className="text-3xl font-mono font-light text-slate-700 mb-8">
            {status === 'in-call' ? 'Live' : '00:00'}
          </div>

          <div className="flex items-center space-x-4 mb-8">
            <button 
              onClick={toggleMute}
              disabled={status !== 'in-call'}
              className={`p-4 rounded-full ${isMuted ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'} disabled:opacity-50`}
            >
              {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </button>
            <button 
              onClick={() => {
                if (status === 'ready' || status === 'disconnected') {
                  makeCall(phoneNumber);
                } else {
                  endCall();
                }
              }}
              className={`p-4 rounded-full ${status === 'in-call' || status === 'calling' ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'}`}
            >
              {status === 'in-call' || status === 'calling' ? <PhoneOff className="h-6 w-6" /> : <Phone className="h-6 w-6" />}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 w-full max-w-[240px]">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, '*', 0, '#'].map((digit) => (
              <button key={digit} className="h-14 bg-slate-50 rounded-lg flex items-center justify-center text-xl font-medium text-slate-700 hover:bg-slate-100 border border-slate-200">
                {digit}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Middle Column: Contact Info */}
      <div className="w-1/3 flex flex-col space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col">
          <div className="border-b border-slate-200 px-6 py-4 flex items-center">
            <Info className="h-5 w-5 text-slate-400 mr-2" />
            <h3 className="text-lg font-medium text-slate-900">Contact Details</h3>
          </div>
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            <div>
              <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-3">Personal Information</h4>
              <dl className="space-y-3">
                <div className="grid grid-cols-3 gap-4">
                  <dt className="text-sm font-medium text-slate-500">Email</dt>
                  <dd className="text-sm text-slate-900 col-span-2">alice@techcorp.com</dd>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <dt className="text-sm font-medium text-slate-500">Company</dt>
                  <dd className="text-sm text-slate-900 col-span-2">Tech Corp</dd>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <dt className="text-sm font-medium text-slate-500">Title</dt>
                  <dd className="text-sm text-slate-900 col-span-2">VP of Operations</dd>
                </div>
              </dl>
            </div>
            
            <div className="border-t border-slate-200 pt-6">
              <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-3">CRM Context</h4>
              <dl className="space-y-3">
                <div className="grid grid-cols-3 gap-4">
                  <dt className="text-sm font-medium text-slate-500">Stage</dt>
                  <dd className="text-sm col-span-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      Lead
                    </span>
                  </dd>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <dt className="text-sm font-medium text-slate-500">Lead Score</dt>
                  <dd className="text-sm text-emerald-600 font-medium col-span-2">85 (Hot)</dd>
                </div>
              </dl>
            </div>

            <div className="border-t border-slate-200 pt-6">
              <h4 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-3">Notes</h4>
              <textarea 
                className="w-full h-32 rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 border"
                placeholder="Take notes during the call..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: AI Assistant */}
      <div className="w-1/3 flex flex-col space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col">
          <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between bg-indigo-50">
            <div className="flex items-center">
              <Bot className="h-5 w-5 text-indigo-600 mr-2" />
              <h3 className="text-lg font-medium text-indigo-900">AI Assistant (Live)</h3>
            </div>
            {isConnected && (
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
              </span>
            )}
          </div>
          
          <div className="p-6 overflow-y-auto flex-1 bg-slate-50 space-y-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
              <div className="flex items-center mb-2">
                <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Sentiment Analysis</span>
              </div>
              <p className="text-sm text-slate-700 capitalize font-medium">
                {aiAnalysis ? aiAnalysis.sentiment : 'Listening for conversation...'}
              </p>
            </div>

            <div className="bg-indigo-600 text-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center mb-2">
                <span className="text-xs font-semibold text-indigo-200 uppercase tracking-wider">Suggested Action</span>
              </div>
              <p className="text-sm font-medium">
                {aiAnalysis ? aiAnalysis.suggestedAction : 'Waiting for context to suggest actions...'}
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Voice / Text Input</span>
                <select 
                  value={speakerRole}
                  onChange={(e) => setSpeakerRole(e.target.value as 'agent' | 'customer')}
                  className="text-xs border-slate-200 rounded text-slate-600"
                >
                  <option value="customer">Simulate Customer</option>
                  <option value="agent">Simulate Agent</option>
                </select>
              </div>

              <div className="space-y-4">
                <button
                  onClick={toggleRecording}
                  className={`w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                    isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isRecording ? <Square className="h-4 w-4 mr-2" /> : <Mic className="h-4 w-4 mr-2" />}
                  {isRecording ? 'Stop Microphone' : 'Use Microphone'}
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-2 text-xs text-slate-500">OR TYPE</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={simulatedTranscript}
                    onChange={(e) => setSimulatedTranscript(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSimulateTranscript()}
                    className="flex-1 rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                    placeholder={`Type ${speakerRole} text...`}
                  />
                  <button 
                    onClick={handleSimulateTranscript}
                    className="bg-slate-100 text-slate-600 p-2 rounded-md hover:bg-slate-200 border border-slate-200"
                  >
                    <Play className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
