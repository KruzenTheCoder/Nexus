import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare, Mail, Phone, Send, Search, Filter, Star, Archive,
  ChevronRight, Paperclip, Smile, MoreVertical, Check, CheckCheck,
  Clock, User, Hash, AtSign, X, Plus, ArrowLeft
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────
interface Conversation {
  id: string;
  contactName: string;
  channel: 'sms' | 'email' | 'whatsapp' | 'livechat';
  lastMessage: string;
  timestamp: string;
  unread: number;
  status: 'active' | 'waiting' | 'resolved';
  avatar: string;
  phone?: string;
  email?: string;
}

interface Message {
  id: string;
  sender: 'agent' | 'customer' | 'system';
  content: string;
  timestamp: string;
  channel: string;
  read: boolean;
}

const CHANNEL_ICONS: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  sms: { icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-100', label: 'SMS' },
  email: { icon: Mail, color: 'text-violet-600', bg: 'bg-violet-100', label: 'Email' },
  whatsapp: { icon: MessageSquare, color: 'text-emerald-600', bg: 'bg-emerald-100', label: 'WhatsApp' },
  livechat: { icon: MessageSquare, color: 'text-amber-600', bg: 'bg-amber-100', label: 'Live Chat' },
};

const CONVERSATIONS: Conversation[] = [
  { id: '1', contactName: 'Sarah Chen', channel: 'whatsapp', lastMessage: "That sounds great, can you send me the pricing details?", timestamp: '2 min ago', unread: 2, status: 'active', avatar: 'SC', phone: '+1 555-0101', email: 'sarah@techvault.com' },
  { id: '2', contactName: 'Marcus Rodriguez', channel: 'email', lastMessage: "Re: NexusCRM Enterprise Demo — Looking forward to the session next Tuesday.", timestamp: '15 min ago', unread: 0, status: 'active', avatar: 'MR', phone: '+1 555-0202', email: 'marcus@dataflow.io' },
  { id: '3', contactName: 'Aisha Patel', channel: 'sms', lastMessage: "Yes I'm available at 3 PM tomorrow", timestamp: '1 hr ago', unread: 1, status: 'waiting', avatar: 'AP', phone: '+1 555-0303' },
  { id: '4', contactName: 'James O\'Brien', channel: 'livechat', lastMessage: "I need help setting up the integration with Salesforce", timestamp: '2 hr ago', unread: 0, status: 'active', avatar: 'JO', email: 'james@finedge.com' },
  { id: '5', contactName: 'Elena Vasquez', channel: 'whatsapp', lastMessage: "Thanks for the follow up! Let me discuss with my team.", timestamp: '3 hr ago', unread: 0, status: 'waiting', avatar: 'EV', phone: '+1 555-0505' },
  { id: '6', contactName: 'David Kim', channel: 'email', lastMessage: "Re: Contract renewal — We'd like to upgrade to the enterprise plan.", timestamp: '5 hr ago', unread: 3, status: 'active', avatar: 'DK', email: 'david@neuralpath.ai' },
  { id: '7', contactName: 'Lisa Thompson', channel: 'sms', lastMessage: "Please remove me from your contact list", timestamp: '1 day ago', unread: 0, status: 'resolved', avatar: 'LT', phone: '+1 555-0707' },
];

const MESSAGES: Record<string, Message[]> = {
  '1': [
    { id: 'm1', sender: 'system', content: 'Conversation started via WhatsApp', timestamp: '10:22 AM', channel: 'whatsapp', read: true },
    { id: 'm2', sender: 'agent', content: "Hi Sarah! Thanks for reaching out. I saw you were interested in our enterprise solution — would you like me to walk you through our key features?", timestamp: '10:23 AM', channel: 'whatsapp', read: true },
    { id: 'm3', sender: 'customer', content: "Yes please! We're particularly interested in the predictive dialer and AI voice features.", timestamp: '10:25 AM', channel: 'whatsapp', read: true },
    { id: 'm4', sender: 'agent', content: "Great picks! Our predictive dialer uses real-time ML algorithms to optimize contact rates — customers typically see a 35% improvement. The AI voice engine lets you create natural-sounding agents for automated outreach. Want me to schedule a live demo?", timestamp: '10:27 AM', channel: 'whatsapp', read: true },
    { id: 'm5', sender: 'customer', content: "That sounds great, can you send me the pricing details?", timestamp: '10:30 AM', channel: 'whatsapp', read: false },
    { id: 'm6', sender: 'customer', content: "Also, do you support integration with HubSpot?", timestamp: '10:31 AM', channel: 'whatsapp', read: false },
  ],
};

// ═══════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════
export default function OmniChannel() {
  const [selectedConvo, setSelectedConvo] = useState<Conversation | null>(CONVERSATIONS[0]);
  const [messages, setMessages] = useState<Message[]>(MESSAGES['1'] || []);
  const [newMessage, setNewMessage] = useState('');
  const [filterChannel, setFilterChannel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages]);

  const selectConversation = (convo: Conversation) => {
    setSelectedConvo(convo);
    setMessages(MESSAGES[convo.id] || [
      { id: 'sys', sender: 'system', content: `Conversation via ${convo.channel}`, timestamp: convo.timestamp, channel: convo.channel, read: true },
      { id: 'last', sender: 'customer', content: convo.lastMessage, timestamp: convo.timestamp, channel: convo.channel, read: true },
    ]);
  };

  const handleSend = () => {
    if (!newMessage.trim() || !selectedConvo) return;
    setMessages(prev => [...prev, { id: `m${Date.now()}`, sender: 'agent', content: newMessage.trim(), timestamp: 'Just now', channel: selectedConvo.channel, read: true }]);
    setNewMessage('');
  };

  const filtered = CONVERSATIONS.filter(c => {
    if (filterChannel !== 'all' && c.channel !== filterChannel) return false;
    if (searchQuery && !c.contactName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const totalUnread = CONVERSATIONS.reduce((sum, c) => sum + c.unread, 0);

  return (
    <div className="h-[calc(100vh-8rem)] flex rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm">
      {/* ═══ Conversation List ═══ */}
      <div className="w-80 border-r border-slate-200 flex flex-col flex-shrink-0 bg-slate-50">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-white">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Inbox</h2>
            <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{totalUnread} unread</span>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search conversations..." className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
          </div>

          {/* Channel filter chips */}
          <div className="flex gap-1.5 overflow-x-auto">
            <button onClick={() => setFilterChannel('all')} className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${filterChannel === 'all' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
              All ({CONVERSATIONS.length})
            </button>
            {Object.entries(CHANNEL_ICONS).map(([ch, cfg]) => {
              const count = CONVERSATIONS.filter(c => c.channel === ch).length;
              return (
                <button key={ch} onClick={() => setFilterChannel(ch)} className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${filterChannel === ch ? `${cfg.bg} ${cfg.color}` : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
                  {cfg.label} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {filtered.map((convo) => {
            const ch = CHANNEL_ICONS[convo.channel];
            return (
              <div
                key={convo.id}
                onClick={() => selectConversation(convo)}
                className={`px-4 py-3 border-b border-slate-100 cursor-pointer transition-colors ${selectedConvo?.id === convo.id ? 'bg-blue-50 border-l-2 border-l-blue-500' : 'hover:bg-white'}`}
              >
                <div className="flex items-start gap-3">
                  <div className="relative flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 border border-white shadow-sm">
                      {convo.avatar}
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full ${ch.bg} flex items-center justify-center`}>
                      <ch.icon className={`h-2.5 w-2.5 ${ch.color}`} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-900 truncate">{convo.contactName}</p>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">{convo.timestamp}</span>
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{convo.lastMessage}</p>
                  </div>
                  {convo.unread > 0 && (
                    <span className="flex-shrink-0 h-5 w-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">{convo.unread}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══ Message Thread ═══ */}
      {selectedConvo ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Thread header */}
          <div className="h-16 border-b border-slate-200 px-5 flex items-center justify-between bg-white flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-slate-200 to-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 border border-white shadow-sm">
                {selectedConvo.avatar}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{selectedConvo.contactName}</p>
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  {selectedConvo.phone && <span className="flex items-center gap-0.5"><Phone className="h-2.5 w-2.5" />{selectedConvo.phone}</span>}
                  {selectedConvo.email && <span className="flex items-center gap-0.5"><AtSign className="h-2.5 w-2.5" />{selectedConvo.email}</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${CHANNEL_ICONS[selectedConvo.channel].bg} ${CHANNEL_ICONS[selectedConvo.channel].color}`}>
                {CHANNEL_ICONS[selectedConvo.channel].label}
              </span>
              <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
                <Phone className="h-4 w-4" />
              </button>
              <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
                <Star className="h-4 w-4" />
              </button>
              <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-slate-50/50">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'agent' ? 'justify-end' : msg.sender === 'system' ? 'justify-center' : 'justify-start'}`}>
                <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${
                  msg.sender === 'system' ? 'bg-slate-100 text-slate-500 text-xs italic rounded-lg' :
                  msg.sender === 'agent' ? 'bg-blue-600 text-white shadow-sm' :
                  'bg-white text-slate-800 shadow-sm border border-slate-100'
                }`}>
                  {msg.content}
                  <div className={`flex items-center justify-end gap-1 mt-1 ${msg.sender === 'agent' ? 'text-blue-200' : 'text-slate-400'}`}>
                    <span className="text-[10px]">{msg.timestamp}</span>
                    {msg.sender === 'agent' && (msg.read ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />)}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Message input */}
          <div className="border-t border-slate-200 p-4 bg-white flex-shrink-0">
            <div className="flex items-end gap-2">
              <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0">
                <Paperclip className="h-5 w-5" />
              </button>
              <div className="flex-1 relative">
                <textarea
                  rows={1}
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                  placeholder={`Reply via ${CHANNEL_ICONS[selectedConvo.channel].label}...`}
                />
              </div>
              <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0">
                <Smile className="h-5 w-5" />
              </button>
              <button onClick={handleSend} className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-1.5 flex-shrink-0">
                <Send className="h-4 w-4" />
                Send
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-slate-50">
          <div className="text-center">
            <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Select a conversation</p>
          </div>
        </div>
      )}

      {/* ═══ Contact Details Sidebar ═══ */}
      {selectedConvo && (
        <div className="w-64 border-l border-slate-200 bg-white flex-shrink-0 overflow-y-auto">
          <div className="p-4 border-b border-slate-200 text-center">
            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-100 to-violet-100 flex items-center justify-center text-lg font-bold text-blue-700 mx-auto shadow-sm border border-white">
              {selectedConvo.avatar}
            </div>
            <p className="text-sm font-semibold text-slate-900 mt-2">{selectedConvo.contactName}</p>
            <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${selectedConvo.status === 'active' ? 'bg-emerald-100 text-emerald-700' : selectedConvo.status === 'waiting' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
              {selectedConvo.status}
            </span>
          </div>
          <div className="p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contact Info</h4>
            {selectedConvo.phone && (
              <div className="flex items-center gap-2 text-sm text-slate-700"><Phone className="h-3.5 w-3.5 text-slate-400" />{selectedConvo.phone}</div>
            )}
            {selectedConvo.email && (
              <div className="flex items-center gap-2 text-sm text-slate-700"><Mail className="h-3.5 w-3.5 text-slate-400" />{selectedConvo.email}</div>
            )}
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider pt-2">Channel History</h4>
            <div className="space-y-1.5">
              {Object.entries(CHANNEL_ICONS).map(([ch, cfg]) => (
                <div key={ch} className="flex items-center gap-2 text-sm">
                  <div className={`h-6 w-6 rounded-md ${cfg.bg} flex items-center justify-center`}><cfg.icon className={`h-3 w-3 ${cfg.color}`} /></div>
                  <span className="text-slate-600">{cfg.label}</span>
                  <span className="ml-auto text-[10px] text-slate-400">{Math.floor(Math.random() * 5) + 1} msgs</span>
                </div>
              ))}
            </div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider pt-2">Quick Actions</h4>
            <button className="w-full text-left px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">📞 Call Contact</button>
            <button className="w-full text-left px-3 py-2 text-sm font-medium text-violet-600 bg-violet-50 rounded-lg hover:bg-violet-100 transition-colors">📅 Schedule Callback</button>
            <button className="w-full text-left px-3 py-2 text-sm font-medium text-slate-600 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">📋 View Full Profile</button>
          </div>
        </div>
      )}
    </div>
  );
}
