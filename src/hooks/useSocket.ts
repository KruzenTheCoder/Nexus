import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:4444';

export function useSocket(callId?: string) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<{ sentiment: string; suggestedAction: string; timestamp: string } | null>(null);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(SOCKET_URL);

    socketRef.current.on('connect', () => {
      setIsConnected(true);
      if (callId) {
        socketRef.current?.emit('join-call', callId);
      }
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
    });

    socketRef.current.on('ai-analysis', (data) => {
      setAiAnalysis(data);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [callId]);

  const sendTranscription = (text: string, speaker: 'agent' | 'customer') => {
    if (socketRef.current && isConnected && callId) {
      socketRef.current.emit('transcription', { callId, text, speaker });
    }
  };

  return { isConnected, aiAnalysis, sendTranscription };
}
