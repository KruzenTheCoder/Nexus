import { useState, useCallback, useRef, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4444';

export interface VoiceAIState {
  isListening: boolean;
  isSpeaking: boolean;
  isInterrupted: boolean;
  transcript: string;
  aiResponse: string;
  error: string | null;
}

export interface VoiceAIOptions {
  callId: string;
  enableBargeIn?: boolean;
  interruptionSensitivity?: number;
  bargeInBuffer?: number;
  responseDelay?: number;
  enableNaturalSpeech?: boolean;
  onTranscript?: (text: string) => void;
  onAIResponse?: (response: string) => void;
  onInterruption?: () => void;
}

// Enhanced AI response types
interface AIResponseResult {
  response: string;
  shouldUseRecovery: boolean;
}

export function useVoiceAI(options: VoiceAIOptions) {
  const {
    callId,
    enableBargeIn = true,
    bargeInBuffer = 250,
    responseDelay = 400,
    enableNaturalSpeech = true,
    onTranscript,
    onAIResponse,
    onInterruption,
  } = options;

  const [state, setState] = useState<VoiceAIState>({
    isListening: false,
    isSpeaking: false,
    isInterrupted: false,
    transcript: '',
    aiResponse: '',
    error: null,
  });

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const vadRef = useRef<{ startTime: number; isActive: boolean } | null>(null);
  const silenceTimerRef = useRef<number | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognitionAPI();
      
      if (recognitionRef.current) {
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: any) => {
          const results: any[] = Array.from(event.results);
          const transcript = results
            .map((result: any) => result[0].transcript)
            .join('');

          // Check if user is speaking (for barge-in detection)
          if (enableBargeIn && state.isSpeaking) {
            const lastResult: any = results[results.length - 1];
            const isFinal = lastResult.isFinal;
            
            // If we have speech for longer than bargeInBuffer duration
            if (!vadRef.current) {
              vadRef.current = { startTime: Date.now(), isActive: true };
            } else {
              const duration = Date.now() - vadRef.current.startTime;
              
              if (duration > bargeInBuffer && !isFinal) {
                // Trigger barge-in
                handleBargeIn(transcript);
              }
            }
          }

          setState(prev => ({ ...prev, transcript }));
          onTranscript?.(transcript);

          // Reset silence timer
          if (silenceTimerRef.current) {
            window.clearTimeout(silenceTimerRef.current);
          }
          
          silenceTimerRef.current = window.setTimeout(() => {
            // User stopped speaking
            if (vadRef.current) {
              vadRef.current = null;
            }
          }, responseDelay);
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setState(prev => ({ ...prev, error: event.error }));
        };
      }
    }

    // Initialize speech synthesis
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }

    return () => {
      if (silenceTimerRef.current) {
        window.clearTimeout(silenceTimerRef.current);
      }
    };
  }, [callId, enableBargeIn, bargeInBuffer, responseDelay, onTranscript, state.isSpeaking]);

  // Handle barge-in (interruption)
  const handleBargeIn = useCallback((userSpeech: string) => {
    if (!enableBargeIn || !state.isSpeaking) return;

    // Stop current speech
    if (synthRef.current) {
      synthRef.current.cancel();
    }

    // Mark interruption via API
    fetch(`${API_URL}/api/voice/interrupt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callId, userSpeech }),
    }).catch(err => console.error('Failed to mark interruption:', err));

    setState(prev => ({
      ...prev,
      isSpeaking: false,
      isInterrupted: true,
      isListening: true,
    }));

    onInterruption?.();
  }, [callId, enableBargeIn, state.isSpeaking, onInterruption]);

  // Start listening
  const startListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setState(prev => ({ ...prev, isListening: true, error: null }));
      } catch (err) {
        console.error('Failed to start listening:', err);
      }
    }
  }, []);

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        setState(prev => ({ ...prev, isListening: false }));
      } catch (err) {
        console.error('Failed to stop listening:', err);
      }
    }
  }, []);

  // Speak AI response
  const speak = useCallback(async (text: string) => {
    if (!synthRef.current || !text) return;

    // Cancel any ongoing speech
    synthRef.current.cancel();

    // Clear interruption flag via API
    fetch(`${API_URL}/api/voice/clear-interrupt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ callId }),
    }).catch(err => console.error('Failed to clear interruption:', err));

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configure for natural speech if enabled
    if (enableNaturalSpeech) {
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
    }

    utterance.onstart = () => {
      setState(prev => ({ ...prev, isSpeaking: true, isInterrupted: false }));
    };

    utterance.onend = () => {
      setState(prev => ({ ...prev, isSpeaking: false }));
      // Resume listening after speaking
      if (enableBargeIn) {
        startListening();
      }
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setState(prev => ({ ...prev, isSpeaking: false, error: event.error }));
    };

    synthRef.current.speak(utterance);
  }, [callId, enableNaturalSpeech, enableBargeIn, startListening]);

  // Generate AI response and speak it
  const generateAndSpeak = useCallback(async (userInput: string) => {
    try {
      setState(prev => ({ ...prev, isListening: false, aiResponse: '' }));

      // Get AI response from API
      const response = await fetch(`${API_URL}/api/voice/generate-response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: userInput,
          callId,
          enableNaturalSpeech 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate AI response');
      }

      const result: AIResponseResult = await response.json();

      setState(prev => ({ ...prev, aiResponse: result.response }));
      onAIResponse?.(result.response);

      // Speak the response
      await speak(result.response);

      return result.response;
    } catch (error) {
      console.error('Error generating AI response:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to generate AI response',
      }));
      return null;
    }
  }, [callId, onAIResponse, speak, enableNaturalSpeech]);

  // Send message (for typed input)
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    // Stop listening while processing
    stopListening();

    // Generate and speak response
    await generateAndSpeak(text);
  }, [stopListening, generateAndSpeak]);

  return {
    ...state,
    startListening,
    stopListening,
    speak,
    sendMessage,
    generateAndSpeak,
    handleBargeIn,
  };
}

// Type declarations for Web Speech API - using existing DOM types
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// Helper type for SpeechRecognition event handling
type SpeechRecognitionCallback = (event: any) => void;
