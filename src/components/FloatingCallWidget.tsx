import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Maximize2, GripHorizontal } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTwilioVoiceContext } from '@/contexts/TwilioVoiceContext';

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function FloatingCallWidget() {
  const { status, callerInfo, callTimer, isMuted, endCall, toggleMute } = useTwilioVoiceContext();
  const location = useLocation();
  const navigate = useNavigate();

  // Dragging state
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const widgetRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!widgetRef.current) return;
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  }, [position]);

  // Attach global mouse listeners for drag — must be above any conditional return
  useEffect(() => {
    if (!isDragging) return;

    const onMouseMove = (e: MouseEvent) => {
      setPosition({
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y,
      });
    };
    const onMouseUp = () => setIsDragging(false);

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging]);

  const isOnCall = status === 'in-call' || status === 'calling' || status === 'ringing';
  const isOnDialerPage = location.pathname === '/calls';

  // Don't render if not on a call or if user is on the dialer page
  if (!isOnCall || isOnDialerPage) return null;

  return (
    <div
      ref={widgetRef}
      className="fixed z-[9999] select-none"
      style={{ bottom: position.y, right: position.x }}
    >
      <div className="bg-slate-900 text-white rounded-2xl shadow-2xl shadow-black/30 border border-slate-700/50 overflow-hidden backdrop-blur-xl"
        style={{ minWidth: '280px' }}
      >
        {/* Drag handle */}
        <div
          className="flex items-center justify-center py-1.5 cursor-grab active:cursor-grabbing bg-slate-800/50 hover:bg-slate-700/50 transition-colors"
          onMouseDown={handleMouseDown}
        >
          <GripHorizontal className="h-4 w-4 text-slate-500" />
        </div>

        <div className="px-4 pb-4 pt-2">
          {/* Caller info */}
          <div className="flex items-center gap-3 mb-3">
            <div className="relative">
              {callerInfo ? (
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-blue-500/30">
                  {callerInfo.initials}
                </div>
              ) : (
                <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Phone className="h-5 w-5 text-white" />
                </div>
              )}
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-emerald-400 rounded-full border-2 border-slate-900 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {callerInfo ? callerInfo.name : 'Active Call'}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {callerInfo ? callerInfo.company || callerInfo.phone : status === 'calling' ? 'Dialing...' : 'Connected'}
              </p>
            </div>
            <div className="text-right">
              <div className="text-lg font-mono font-light text-emerald-400 tracking-wider">
                {formatTimer(callTimer)}
              </div>
              <div className="flex items-center gap-1 justify-end">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] text-emerald-400 uppercase font-medium">
                  {status === 'calling' ? 'Dialing' : status === 'ringing' ? 'Ringing' : 'Live'}
                </span>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={toggleMute}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                isMuted
                  ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {isMuted ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
              {isMuted ? 'Unmute' : 'Mute'}
            </button>

            <button
              onClick={endCall}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
            >
              <PhoneOff className="h-3.5 w-3.5" />
              End
            </button>

            <button
              onClick={() => navigate('/calls')}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              Open
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
