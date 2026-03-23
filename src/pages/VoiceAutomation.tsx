import React, { useState, useRef, useEffect } from 'react';
import {
  Bot, Mic, Play, Square, Settings, Phone, Volume2, MessageSquare,
  Sparkles, Activity, TrendingUp, Clock, Star, Plus, Edit,
  ChevronRight, Pause, SkipForward, RefreshCw, X
} from 'lucide-react';

// ─── Voice Agent Personas ────────────────────────────
interface VoiceAgent {
  id: string;
  name: string;
  personality: string;
  voice: string;
  pitch: number;
  speed: number;
  warmth: number;
  greeting: string;
  objective: string;
  gradient: string;
  avatar: string;
  stats: { calls: number; successRate: number; avgDuration: string; sentiment: number };
}

const SAMPLE_AGENTS: VoiceAgent[] = [
  {
    id: '1', name: 'Nova', personality: 'Professional & Warm',
    voice: 'en-US-Female-Aria', pitch: 1.0, speed: 1.0, warmth: 0.8,
    greeting: "Hi! This is Nova calling from NexusCRM. I noticed you recently explored our enterprise solutions — I'd love to walk you through some features that could be perfect for your team.",
    objective: 'Schedule product demo appointments',
    gradient: 'from-violet-500 to-indigo-600',
    avatar: '🤖',
    stats: { calls: 1247, successRate: 34.2, avgDuration: '2m 45s', sentiment: 87 },
  },
  {
    id: '2', name: 'Atlas', personality: 'Confident & Direct',
    voice: 'en-US-Male-Davis', pitch: 0.9, speed: 1.1, warmth: 0.6,
    greeting: "Good morning! Atlas here with NexusCRM. I'm reaching out because we've helped companies like yours increase their contact rates by 40% — mind if I share how?",
    objective: 'Qualify leads for sales team handoff',
    gradient: 'from-blue-500 to-cyan-600',
    avatar: '🎯',
    stats: { calls: 892, successRate: 28.7, avgDuration: '3m 12s', sentiment: 82 },
  },
  {
    id: '3', name: 'Luna', personality: 'Friendly & Empathetic',
    voice: 'en-US-Female-Jenny', pitch: 1.1, speed: 0.95, warmth: 0.9,
    greeting: "Hey there! This is Luna from NexusCRM. I hope I'm not catching you at a bad time — I just wanted to follow up on the information you requested last week.",
    objective: 'Follow up on warm leads and nurture relationships',
    gradient: 'from-rose-500 to-pink-600',
    avatar: '💫',
    stats: { calls: 653, successRate: 41.5, avgDuration: '4m 08s', sentiment: 94 },
  },
];

// ─── Conversation Flow Steps ─────────────────────────
interface FlowStep {
  id: string;
  type: 'speak' | 'listen' | 'decide' | 'action';
  label: string;
  content: string;
}

const SAMPLE_FLOW: FlowStep[] = [
  { id: '1', type: 'speak', label: 'Greeting', content: 'Deliver personalized opening based on lead data' },
  { id: '2', type: 'listen', label: 'Listen', content: 'Analyze customer response & detect intent' },
  { id: '3', type: 'decide', label: 'Branch', content: 'If interested → pitch | If busy → reschedule | If not interested → soft close' },
  { id: '4', type: 'speak', label: 'Value Pitch', content: 'Present key benefits tailored to company profile' },
  { id: '5', type: 'listen', label: 'Objection', content: 'Detect objections & select appropriate rebuttal' },
  { id: '6', type: 'speak', label: 'Handle', content: 'Address objection with empathy & data-backed response' },
  { id: '7', type: 'action', label: 'CRM Update', content: 'Update contact record with call notes & next steps' },
];

// ─── Waveform Visualizer Component ───────────────────
function WaveformVisualizer({ isPlaying }: { isPlaying: boolean }) {
  return (
    <div className="flex items-center justify-center h-12 gap-0.5">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="waveform-bar"
          style={{
            height: isPlaying ? undefined : '4px',
            animationPlayState: isPlaying ? 'running' : 'paused',
            animationDelay: `${i * 0.05}s`,
            opacity: isPlaying ? 1 : 0.3,
          }}
        />
      ))}
    </div>
  );
}

// ─── Call Simulation Console ─────────────────────────
function SimulationConsole({ agent }: { agent: VoiceAgent }) {
  const [messages, setMessages] = useState([
    { role: 'system', content: `AI Agent "${agent.name}" initialized. Personality: ${agent.personality}` },
    { role: 'agent', content: agent.greeting },
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'customer', content: userMsg }]);
    setIsProcessing(true);

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        "That's a great question! Based on what you've shared about your team's challenges, I think our predictive dialling feature would be particularly valuable — it's helped similar companies increase their connect rates by up to 35%.",
        "I completely understand your concern about timing. What if I sent over a brief 2-minute overview you could review at your convenience? Then we could schedule a quick call when it works best for you.",
        "Absolutely — we integrate seamlessly with your existing CRM. Most of our customers are up and running within 48 hours. Would you like me to set up a technical walkthrough with your team?",
        "I appreciate your honesty! Before I let you go, would it be okay if I sent you a case study from a company in your industry? No pressure at all — just thought it might be useful.",
      ];
      const response = responses[Math.floor(Math.random() * responses.length)];
      setMessages(prev => [...prev, { role: 'agent', content: response }]);
      setIsProcessing(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'customer' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
              msg.role === 'system'
                ? 'bg-slate-100 text-slate-500 text-xs italic w-full text-center rounded-lg'
                : msg.role === 'agent'
                ? 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-sm'
                : 'bg-slate-200 text-slate-800'
            }`}>
              {msg.role !== 'system' && (
                <p className="text-[10px] font-bold uppercase tracking-wider mb-1 opacity-70">
                  {msg.role === 'agent' ? `🤖 ${agent.name}` : '👤 Customer'}
                </p>
              )}
              {msg.content}
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-violet-100 text-violet-600 rounded-2xl px-4 py-3 text-sm flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0s' }} />
                <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0.15s' }} />
                <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0.3s' }} />
              </div>
              {agent.name} is thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-slate-200 p-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          placeholder="Type as the customer..."
        />
        <button
          onClick={handleSendMessage}
          disabled={isProcessing}
          className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════
export default function VoiceAutomation() {
  const [selectedAgent, setSelectedAgent] = useState<VoiceAgent>(SAMPLE_AGENTS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSimulation, setShowSimulation] = useState(false);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Voice preview using Web Speech API
  const handleVoicePreview = () => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(selectedAgent.greeting);
    utterance.pitch = selectedAgent.pitch;
    utterance.rate = selectedAgent.speed;
    utterance.volume = selectedAgent.warmth;

    // Try to find a natural voice
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v =>
      v.name.toLowerCase().includes('natural') ||
      v.name.toLowerCase().includes('neural') ||
      v.lang === 'en-US'
    );
    if (preferred) utterance.voice = preferred;

    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    synthRef.current = utterance;
    setIsPlaying(true);
    window.speechSynthesis.speak(utterance);
  };

  // Ensure voices are loaded
  useEffect(() => {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices();
    };
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight flex items-center gap-2">
            AI Voice Engine
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-violet-500 to-indigo-500 text-white">BETA</span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Create, configure, and deploy autonomous AI voice agents</p>
        </div>
        <button className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 shadow-sm transition-all gap-2">
          <Plus className="h-4 w-4" />
          Create Agent
        </button>
      </div>

      {/* Agent Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {SAMPLE_AGENTS.map((agent, i) => (
          <div
            key={agent.id}
            onClick={() => setSelectedAgent(agent)}
            className={`voice-agent-card p-5 cursor-pointer transition-all animate-fade-in-up stagger-${i + 1} ${
              selectedAgent.id === agent.id ? 'ring-2 ring-white/50 scale-[1.02]' : 'opacity-80 hover:opacity-100'
            }`}
            style={{ background: `linear-gradient(135deg, var(--tw-gradient-from), var(--tw-gradient-to))`, opacity: 0 }}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${agent.gradient} rounded-2xl`} />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{agent.avatar}</span>
                  <div>
                    <h3 className="text-lg font-bold text-white">{agent.name}</h3>
                    <p className="text-xs text-white/70">{agent.personality}</p>
                  </div>
                </div>
                {selectedAgent.id === agent.id && (
                  <div className="h-3 w-3 rounded-full bg-white animate-pulse-glow" />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-white/15 rounded-lg p-2.5 backdrop-blur-sm">
                  <p className="text-[10px] text-white/60 font-medium uppercase">Calls Made</p>
                  <p className="text-lg font-bold text-white">{agent.stats.calls.toLocaleString()}</p>
                </div>
                <div className="bg-white/15 rounded-lg p-2.5 backdrop-blur-sm">
                  <p className="text-[10px] text-white/60 font-medium uppercase">Success Rate</p>
                  <p className="text-lg font-bold text-white">{agent.stats.successRate}%</p>
                </div>
                <div className="bg-white/15 rounded-lg p-2.5 backdrop-blur-sm">
                  <p className="text-[10px] text-white/60 font-medium uppercase">Avg Duration</p>
                  <p className="text-lg font-bold text-white">{agent.stats.avgDuration}</p>
                </div>
                <div className="bg-white/15 rounded-lg p-2.5 backdrop-blur-sm">
                  <p className="text-[10px] text-white/60 font-medium uppercase">Sentiment</p>
                  <p className="text-lg font-bold text-white">{agent.stats.sentiment}%</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ═══ Voice Configuration ═══ */}
        <div className="glass-card p-6 hover:translate-y-0">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 tracking-tight flex items-center gap-2">
            <Volume2 className="h-5 w-5 text-violet-500" />
            Voice Settings
          </h2>

          <div className="space-y-5">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Agent Name</label>
              <input
                type="text"
                value={selectedAgent.name}
                onChange={(e) => setSelectedAgent({ ...selectedAgent, name: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-slate-700">Pitch</label>
                <span className="text-sm font-bold text-violet-600">{selectedAgent.pitch.toFixed(1)}</span>
              </div>
              <input
                type="range" min="0.5" max="1.5" step="0.1"
                value={selectedAgent.pitch}
                onChange={(e) => setSelectedAgent({ ...selectedAgent, pitch: parseFloat(e.target.value) })}
                className="w-full accent-violet-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Deep</span><span>High</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-slate-700">Speed</label>
                <span className="text-sm font-bold text-violet-600">{selectedAgent.speed.toFixed(1)}x</span>
              </div>
              <input
                type="range" min="0.5" max="2.0" step="0.05"
                value={selectedAgent.speed}
                onChange={(e) => setSelectedAgent({ ...selectedAgent, speed: parseFloat(e.target.value) })}
                className="w-full accent-violet-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Slow</span><span>Fast</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-slate-700">Warmth / Volume</label>
                <span className="text-sm font-bold text-violet-600">{Math.round(selectedAgent.warmth * 100)}%</span>
              </div>
              <input
                type="range" min="0" max="1" step="0.05"
                value={selectedAgent.warmth}
                onChange={(e) => setSelectedAgent({ ...selectedAgent, warmth: parseFloat(e.target.value) })}
                className="w-full accent-violet-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Subtle</span><span>Expressive</span>
              </div>
            </div>

            {/* Voice Preview */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-4 rounded-xl">
              <WaveformVisualizer isPlaying={isPlaying} />
              <button
                onClick={handleVoicePreview}
                className={`w-full mt-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  isPlaying
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-white text-slate-900 hover:bg-slate-100'
                }`}
              >
                {isPlaying ? <><Square className="h-4 w-4" /> Stop Preview</> : <><Play className="h-4 w-4" /> Preview Voice</>}
              </button>
            </div>
          </div>
        </div>

        {/* ═══ Conversation Flow ═══ */}
        <div className="glass-card p-6 hover:translate-y-0">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 tracking-tight flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-500" />
            Conversation Flow
          </h2>

          <div className="space-y-2">
            {SAMPLE_FLOW.map((step, i) => (
              <div key={step.id} className="relative">
                {/* Connection line */}
                {i < SAMPLE_FLOW.length - 1 && (
                  <div className="absolute left-5 top-10 w-0.5 h-4 bg-slate-200" />
                )}

                <div className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm transition-all cursor-pointer group">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    step.type === 'speak' ? 'bg-violet-100 text-violet-600' :
                    step.type === 'listen' ? 'bg-blue-100 text-blue-600' :
                    step.type === 'decide' ? 'bg-amber-100 text-amber-600' :
                    'bg-emerald-100 text-emerald-600'
                  }`}>
                    {step.type === 'speak' ? <Volume2 className="h-5 w-5" /> :
                     step.type === 'listen' ? <Mic className="h-5 w-5" /> :
                     step.type === 'decide' ? <Sparkles className="h-5 w-5" /> :
                     <Activity className="h-5 w-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{step.type}</span>
                      <ChevronRight className="h-3 w-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-sm font-medium text-slate-800">{step.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{step.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ Call Simulation Console ═══ */}
        <div className="glass-card overflow-hidden flex flex-col hover:translate-y-0" style={{ minHeight: '500px' }}>
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-semibold text-white">Call Simulation</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Preview
              </span>
            </div>
          </div>

          <div className="flex-1 bg-slate-50">
            <SimulationConsole agent={selectedAgent} />
          </div>
        </div>
      </div>

      {/* ═══ Greeting Script Editor ═══ */}
      <div className="glass-card p-6 hover:translate-y-0">
        <h2 className="text-lg font-semibold text-slate-900 mb-4 tracking-tight flex items-center gap-2">
          <Edit className="h-5 w-5 text-emerald-500" />
          Opening Script for <span className="text-violet-600">{selectedAgent.name}</span>
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">Greeting Message</label>
            <textarea
              rows={4}
              value={selectedAgent.greeting}
              onChange={(e) => setSelectedAgent({ ...selectedAgent, greeting: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none resize-none"
            />
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-slate-400">{selectedAgent.greeting.length} characters</span>
              <span className="text-xs text-slate-300">•</span>
              <span className="text-xs text-slate-400">~{Math.ceil(selectedAgent.greeting.split(' ').length / 2.5)}s speaking time</span>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">Call Objective</label>
            <textarea
              rows={2}
              value={selectedAgent.objective}
              onChange={(e) => setSelectedAgent({ ...selectedAgent, objective: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none resize-none"
            />

            <div className="mt-3 p-3 bg-violet-50 border border-violet-100 rounded-lg">
              <p className="text-xs font-semibold text-violet-700 flex items-center gap-1 mb-1">
                <Sparkles className="h-3 w-3" /> AI Personality Profile
              </p>
              <p className="text-xs text-violet-600">
                {selectedAgent.name} uses a <strong>{selectedAgent.personality.toLowerCase()}</strong> communication style,
                optimized for {selectedAgent.objective.toLowerCase()}.
                Voice calibrated at {selectedAgent.pitch}x pitch and {selectedAgent.speed}x speed.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-200">
          <button className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors">
            Reset to Default
          </button>
          <button className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 shadow-sm transition-all">
            Save Agent Configuration
          </button>
        </div>
      </div>
    </div>
  );
}
