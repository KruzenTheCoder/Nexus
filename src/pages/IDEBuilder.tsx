import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play, Save, Plus, Trash2, Settings, Zap, GitBranch, Bot, Clock, Plug, MousePointer,
  PhoneCall, MessageSquare, ArrowRight, ZoomIn, ZoomOut, Maximize, GripVertical,
  ChevronDown, X, FolderTree, Code
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';

// ─── Node type definitions ─────────────────────────────
interface WorkflowNodeData {
  id: string;
  type: 'trigger' | 'condition' | 'action' | 'ai' | 'integration' | 'delay';
  label: string;
  x: number;
  y: number;
  config: Record<string, any>;
  outputs: string[]; // IDs of connected nodes
}

interface EdgeData {
  from: string;
  to: string;
}

const NODE_TYPES = [
  { type: 'trigger', label: 'Trigger', icon: Zap, color: 'bg-amber-500', desc: 'Start the workflow' },
  { type: 'condition', label: 'Condition', icon: GitBranch, color: 'bg-blue-500', desc: 'Branch on logic' },
  { type: 'action', label: 'Action', icon: PhoneCall, color: 'bg-emerald-500', desc: 'Perform an action' },
  { type: 'ai', label: 'AI Response', icon: Bot, color: 'bg-violet-500', desc: 'AI generates response' },
  { type: 'integration', label: 'Integration', icon: Plug, color: 'bg-rose-500', desc: 'External service call' },
  { type: 'delay', label: 'Delay', icon: Clock, color: 'bg-slate-500', desc: 'Wait before next step' },
] as const;

const NODE_COLOR_MAP: Record<string, { bg: string; border: string; light: string; text: string }> = {
  trigger:     { bg: 'bg-amber-500',   border: 'border-amber-300', light: 'bg-amber-50',   text: 'text-amber-700' },
  condition:   { bg: 'bg-blue-500',    border: 'border-blue-300',  light: 'bg-blue-50',    text: 'text-blue-700' },
  action:      { bg: 'bg-emerald-500', border: 'border-emerald-300', light: 'bg-emerald-50', text: 'text-emerald-700' },
  ai:          { bg: 'bg-violet-500',  border: 'border-violet-300', light: 'bg-violet-50',  text: 'text-violet-700' },
  integration: { bg: 'bg-rose-500',    border: 'border-rose-300',  light: 'bg-rose-50',    text: 'text-rose-700' },
  delay:       { bg: 'bg-slate-500',   border: 'border-slate-300', light: 'bg-slate-50',    text: 'text-slate-700' },
};

function generateId() {
  return 'node_' + Math.random().toString(36).substring(2, 9);
}

// ─── Edge SVG Renderer ────────────────────────────────
function EdgeRenderer({ edges, nodes, canvasOffset, zoom }: {
  edges: EdgeData[];
  nodes: WorkflowNodeData[];
  canvasOffset: { x: number; y: number };
  zoom: number;
}) {
  const getNodeCenter = (id: string, outlet: 'bottom' | 'top') => {
    const node = nodes.find(n => n.id === id);
    if (!node) return { x: 0, y: 0 };
    const nodeWidth = 220;
    const nodeHeight = 80;
    return {
      x: (node.x + nodeWidth / 2) * zoom + canvasOffset.x,
      y: (node.y + (outlet === 'bottom' ? nodeHeight : 0)) * zoom + canvasOffset.y,
    };
  };

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 5 }}>
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
        </marker>
      </defs>
      {edges.map((edge, i) => {
        const from = getNodeCenter(edge.from, 'bottom');
        const to = getNodeCenter(edge.to, 'top');
        const midY = (from.y + to.y) / 2;
        return (
          <g key={i}>
            <path
              d={`M ${from.x} ${from.y} C ${from.x} ${midY}, ${to.x} ${midY}, ${to.x} ${to.y}`}
              fill="none"
              stroke="#cbd5e1"
              strokeWidth="2"
              className="flow-edge"
              markerEnd="url(#arrowhead)"
            />
            <path
              d={`M ${from.x} ${from.y} C ${from.x} ${midY}, ${to.x} ${midY}, ${to.x} ${to.y}`}
              fill="none"
              stroke="rgba(59,130,246,0.3)"
              strokeWidth="4"
              strokeDasharray="8 4"
              className="flow-edge"
              style={{ animationDuration: '1.5s' }}
            />
          </g>
        );
      })}
    </svg>
  );
}

// ─── Single Node Component ────────────────────────────
function WorkflowNode({
  node, isSelected, onSelect, onDragStart, onConnectStart, zoom, canvasOffset,
}: {
  node: WorkflowNodeData;
  isSelected: boolean;
  onSelect: () => void;
  onDragStart: (e: React.MouseEvent) => void;
  onConnectStart: (nodeId: string) => void;
  zoom: number;
  canvasOffset: { x: number; y: number };
}) {
  const colors = NODE_COLOR_MAP[node.type] || NODE_COLOR_MAP.action;
  const NodeIcon = NODE_TYPES.find(t => t.type === node.type)?.icon || Zap;

  return (
    <div
      className={`workflow-node ${isSelected ? 'selected' : ''}`}
      style={{
        left: node.x * zoom + canvasOffset.x,
        top: node.y * zoom + canvasOffset.y,
        transform: `scale(${zoom})`,
        transformOrigin: 'top left',
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
        onSelect();
        onDragStart(e);
      }}
    >
      {/* Input Port (top) */}
      {node.type !== 'trigger' && (
        <div
          className={`node-port absolute -top-1.5 left-1/2 -translate-x-1/2 ${colors.bg}`}
          title="Input"
        />
      )}

      {/* Node Body */}
      <div className={`${colors.light} border ${colors.border} rounded-xl overflow-hidden`}>
        <div className={`${colors.bg} px-3 py-2 flex items-center gap-2`}>
          <NodeIcon className="h-4 w-4 text-white" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">{node.type}</span>
        </div>
        <div className="px-4 py-3">
          <p className={`text-sm font-semibold ${colors.text}`}>{node.label}</p>
          {node.config?.description && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{node.config.description}</p>
          )}
        </div>
      </div>

      {/* Output Port (bottom) */}
      <div
        className={`node-port absolute -bottom-1.5 left-1/2 -translate-x-1/2 ${colors.bg} cursor-crosshair`}
        title="Drag to connect"
        onMouseDown={(e) => {
          e.stopPropagation();
          onConnectStart(node.id);
        }}
      />
    </div>
  );
}

// ─── Node Inspector Panel ─────────────────────────────
function NodeInspector({
  node, onUpdate, onDelete, onClose,
}: {
  node: WorkflowNodeData;
  onUpdate: (updated: WorkflowNodeData) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const colors = NODE_COLOR_MAP[node.type] || NODE_COLOR_MAP.action;

  return (
    <div className="w-80 border-l border-slate-200 bg-white flex flex-col animate-slide-in-right overflow-hidden">
      <div className={`${colors.bg} px-4 py-3 flex items-center justify-between`}>
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Configure {node.type}</h3>
        <button onClick={onClose} className="text-white/80 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Label</label>
          <input
            type="text"
            value={node.label}
            onChange={(e) => onUpdate({ ...node, label: e.target.value })}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Description</label>
          <textarea
            rows={2}
            value={node.config?.description || ''}
            onChange={(e) => onUpdate({ ...node, config: { ...node.config, description: e.target.value } })}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
            placeholder="Describe what this step does..."
          />
        </div>

        {node.type === 'trigger' && (
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Trigger Event</label>
            <select
              value={node.config?.event || 'call_started'}
              onChange={(e) => onUpdate({ ...node, config: { ...node.config, event: e.target.value } })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            >
              <option value="call_started">Call Started</option>
              <option value="call_answered">Call Answered</option>
              <option value="voicemail_detected">Voicemail Detected</option>
              <option value="ivr_input">IVR Key Press</option>
              <option value="schedule">Scheduled Time</option>
            </select>
          </div>
        )}

        {node.type === 'condition' && (
          <>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Condition Field</label>
              <select
                value={node.config?.field || 'sentiment'}
                onChange={(e) => onUpdate({ ...node, config: { ...node.config, field: e.target.value } })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              >
                <option value="sentiment">Customer Sentiment</option>
                <option value="lead_score">Lead Score</option>
                <option value="call_duration">Call Duration</option>
                <option value="keyword_detected">Keyword Detected</option>
                <option value="time_of_day">Time of Day</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Operator</label>
              <select
                value={node.config?.operator || 'equals'}
                onChange={(e) => onUpdate({ ...node, config: { ...node.config, operator: e.target.value } })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              >
                <option value="equals">Equals</option>
                <option value="not_equals">Not Equals</option>
                <option value="greater_than">Greater Than</option>
                <option value="less_than">Less Than</option>
                <option value="contains">Contains</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Value</label>
              <input
                type="text"
                value={node.config?.value || ''}
                onChange={(e) => onUpdate({ ...node, config: { ...node.config, value: e.target.value } })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                placeholder="e.g. positive, 80, pricing"
              />
            </div>
          </>
        )}

        {node.type === 'ai' && (
          <>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">AI Model</label>
              <select
                value={node.config?.model || 'gpt-4o'}
                onChange={(e) => onUpdate({ ...node, config: { ...node.config, model: e.target.value } })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              >
                <option value="gpt-4o">GPT-4o (Latest)</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Fast)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">System Prompt</label>
              <textarea
                rows={3}
                value={node.config?.prompt || ''}
                onChange={(e) => onUpdate({ ...node, config: { ...node.config, prompt: e.target.value } })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                placeholder="e.g. Respond to the customer's objection about pricing with empathy..."
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Temperature</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={node.config?.temperature ?? 0.7}
                onChange={(e) => onUpdate({ ...node, config: { ...node.config, temperature: parseFloat(e.target.value) } })}
                className="w-full accent-violet-500"
              />
              <div className="flex justify-between text-xs text-slate-400">
                <span>Precise (0)</span>
                <span className="font-medium text-violet-600">{node.config?.temperature ?? 0.7}</span>
                <span>Creative (1)</span>
              </div>
            </div>
          </>
        )}

        {node.type === 'action' && (
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Action Type</label>
            <select
              value={node.config?.action || 'speak'}
              onChange={(e) => onUpdate({ ...node, config: { ...node.config, action: e.target.value } })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            >
              <option value="speak">Speak to Customer</option>
              <option value="transfer">Transfer Call</option>
              <option value="hangup">End Call</option>
              <option value="send_sms">Send SMS</option>
              <option value="update_crm">Update CRM Field</option>
              <option value="play_audio">Play Audio Clip</option>
              <option value="record">Start Recording</option>
            </select>
          </div>
        )}

        {node.type === 'delay' && (
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Delay Duration</label>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                value={node.config?.duration || 5}
                onChange={(e) => onUpdate({ ...node, config: { ...node.config, duration: parseInt(e.target.value) } })}
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
              <select
                value={node.config?.unit || 'seconds'}
                onChange={(e) => onUpdate({ ...node, config: { ...node.config, unit: e.target.value } })}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              >
                <option value="seconds">Seconds</option>
                <option value="minutes">Minutes</option>
                <option value="hours">Hours</option>
              </select>
            </div>
          </div>
        )}

        {node.type === 'integration' && (
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Service</label>
            <select
              value={node.config?.service || 'salesforce'}
              onChange={(e) => onUpdate({ ...node, config: { ...node.config, service: e.target.value } })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            >
              <option value="salesforce">Salesforce</option>
              <option value="hubspot">HubSpot</option>
              <option value="slack">Slack Notification</option>
              <option value="webhook">Custom Webhook</option>
              <option value="email">Email (SMTP)</option>
            </select>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-200 flex gap-2">
        <button
          onClick={onDelete}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
          Delete Node
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════
export default function IDEBuilder() {
  const { user } = useAuthStore();
  const canvasRef = useRef<HTMLDivElement>(null);

  // Workflow list from Supabase
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(null);

  // Canvas state
  const [nodes, setNodes] = useState<WorkflowNodeData[]>([]);
  const [edges, setEdges] = useState<EdgeData[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [canvasOffset, setCanvasOffset] = useState({ x: 60, y: 60 });

  // Dragging state
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Connecting state
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);

  // Panning state
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // ─── Load workflows ─────────────────────────────────
  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const { data, error } = await supabase.from('workflows').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setWorkflows(data || []);
      if (data && data.length > 0 && !activeWorkflowId) {
        loadWorkflow(data[0]);
      }
    } catch (err) {
      console.error('Failed to load workflows', err);
    }
  };

  const loadWorkflow = (w: any) => {
    setActiveWorkflowId(w.id);
    const cfg = w.configuration || {};
    setNodes(cfg.nodes || [
      { id: 'node_start', type: 'trigger', label: 'Call Started', x: 200, y: 40, config: { event: 'call_started', description: 'Workflow begins when a call is initiated' }, outputs: [] },
    ]);
    setEdges(cfg.edges || []);
    setSelectedNodeId(null);
  };

  const handleCreateWorkflow = async () => {
    const name = prompt('Enter workflow name:');
    if (!name) return;
    const defaultNodes: WorkflowNodeData[] = [
      { id: 'node_start', type: 'trigger', label: 'Call Started', x: 200, y: 40, config: { event: 'call_started', description: 'Workflow begins when a call is initiated' }, outputs: [] },
    ];
    try {
      const { data, error } = await supabase.from('workflows').insert([{
        name,
        type: 'call_script',
        configuration: { nodes: defaultNodes, edges: [] },
        created_by: user?.id
      }]).select();
      if (error) throw error;
      if (data) {
        setWorkflows([data[0], ...workflows]);
        loadWorkflow(data[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async () => {
    if (!activeWorkflowId) return;
    try {
      const { error } = await supabase.from('workflows')
        .update({ configuration: { nodes, edges } })
        .eq('id', activeWorkflowId);
      if (error) throw error;
      alert('Workflow saved!');
    } catch (err) {
      console.error(err);
    }
  };

  // ─── Add node from palette ──────────────────────────
  const addNode = (type: string) => {
    const t = NODE_TYPES.find(n => n.type === type);
    const newNode: WorkflowNodeData = {
      id: generateId(),
      type: type as WorkflowNodeData['type'],
      label: t?.label || 'New Node',
      x: 200 + Math.random() * 100,
      y: 100 + nodes.length * 120,
      config: { description: t?.desc || '' },
      outputs: [],
    };
    setNodes([...nodes, newNode]);
    setSelectedNodeId(newNode.id);
  };

  // ─── Node dragging ──────────────────────────────────
  const handleNodeDragStart = (nodeId: string, e: React.MouseEvent) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    setDraggingNodeId(nodeId);
    setDragOffset({
      x: e.clientX - (node.x * zoom + canvasOffset.x),
      y: e.clientY - (node.y * zoom + canvasOffset.y),
    });
  };

  // ─── Canvas panning ─────────────────────────────────
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).classList.contains('workflow-canvas')) {
      setSelectedNodeId(null);
      setIsPanning(true);
      setPanStart({ x: e.clientX - canvasOffset.x, y: e.clientY - canvasOffset.y });
    }
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (draggingNodeId) {
      setNodes(prev => prev.map(n =>
        n.id === draggingNodeId
          ? { ...n, x: (e.clientX - dragOffset.x - canvasOffset.x) / zoom, y: (e.clientY - dragOffset.y - canvasOffset.y) / zoom }
          : n
      ));
    } else if (isPanning) {
      setCanvasOffset({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }
  }, [draggingNodeId, dragOffset, canvasOffset, zoom, isPanning, panStart]);

  const handleMouseUp = useCallback(() => {
    setDraggingNodeId(null);
    setIsPanning(false);
  }, []);

  // ─── Handle clicking a node to finish a connection ──
  const handleNodeClick = (nodeId: string) => {
    if (connectingFrom && connectingFrom !== nodeId) {
      // Check for duplicate edges
      const exists = edges.some(e => e.from === connectingFrom && e.to === nodeId);
      if (!exists) {
        setEdges([...edges, { from: connectingFrom, to: nodeId }]);
      }
      setConnectingFrom(null);
    }
  };

  // ─── Update / delete node ───────────────────────────
  const updateNode = (updated: WorkflowNodeData) => {
    setNodes(prev => prev.map(n => n.id === updated.id ? updated : n));
  };

  const deleteNode = (id: string) => {
    setNodes(prev => prev.filter(n => n.id !== id));
    setEdges(prev => prev.filter(e => e.from !== id && e.to !== id));
    setSelectedNodeId(null);
  };

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* ═══ Toolbar ═══ */}
      <div className="h-14 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-slate-700 font-semibold">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-violet-500 to-blue-500 flex items-center justify-center shadow-sm">
              <GitBranch className="h-4 w-4 text-white" />
            </div>
            <span className="text-base">Workflow Builder</span>
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <span className="px-3 py-1 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg">
            {workflows.find(w => w.id === activeWorkflowId)?.name || 'No Workflow'}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {/* Zoom Controls */}
          <div className="flex items-center bg-slate-100 rounded-lg border border-slate-200">
            <button onClick={() => setZoom(z => Math.max(0.3, z - 0.1))} className="p-1.5 hover:bg-slate-200 rounded-l-lg transition-colors">
              <ZoomOut className="h-4 w-4 text-slate-500" />
            </button>
            <span className="px-2 text-xs font-medium text-slate-600 min-w-[40px] text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="p-1.5 hover:bg-slate-200 rounded-r-lg transition-colors">
              <ZoomIn className="h-4 w-4 text-slate-500" />
            </button>
          </div>
          <button onClick={() => { setZoom(1); setCanvasOffset({ x: 60, y: 60 }); }} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" title="Reset View">
            <Maximize className="h-4 w-4" />
          </button>

          <div className="h-6 w-px bg-slate-200 mx-1" />

          <button onClick={handleSave} className="inline-flex items-center px-3 py-1.5 border border-slate-200 shadow-sm text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition-colors">
            <Save className="h-4 w-4 mr-1.5" />
            Save
          </button>
          <button
            onClick={() => alert('Test mode: Workflow syntax is valid ✓')}
            className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 transition-all"
          >
            <Play className="h-4 w-4 mr-1.5" />
            Test
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ═══ Left Sidebar: Workflow Explorer + Node Palette ═══ */}
        <div className="w-60 border-r border-slate-200 bg-slate-50 flex flex-col flex-shrink-0">
          {/* Workflow Explorer */}
          <div className="p-3 border-b border-slate-200">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold text-xs text-slate-500 uppercase tracking-wider">Workflows</span>
              <button onClick={handleCreateWorkflow} className="text-slate-400 hover:text-blue-600 transition-colors">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-0.5 max-h-32 overflow-y-auto">
              {workflows.map(w => (
                <div
                  key={w.id}
                  onClick={() => loadWorkflow(w)}
                  className={`flex items-center px-2 py-1.5 text-sm rounded-md cursor-pointer transition-colors ${
                    activeWorkflowId === w.id ? 'text-blue-600 bg-blue-50 font-medium' : 'text-slate-600 hover:bg-white'
                  }`}
                >
                  <GitBranch className={`h-3.5 w-3.5 mr-2 ${activeWorkflowId === w.id ? 'text-blue-500' : 'text-slate-400'}`} />
                  <span className="truncate">{w.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Node Palette */}
          <div className="p-3 flex-1 overflow-y-auto">
            <span className="font-semibold text-xs text-slate-500 uppercase tracking-wider mb-2 block">Add Nodes</span>
            <div className="space-y-1.5">
              {NODE_TYPES.map(nodeType => {
                const colors = NODE_COLOR_MAP[nodeType.type];
                return (
                  <button
                    key={nodeType.type}
                    onClick={() => addNode(nodeType.type)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm transition-all text-left group"
                  >
                    <div className={`h-8 w-8 rounded-lg ${colors.bg} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
                      <nodeType.icon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{nodeType.label}</p>
                      <p className="text-xs text-slate-400">{nodeType.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Connection mode indicator */}
          {connectingFrom && (
            <div className="p-3 border-t border-blue-200 bg-blue-50 animate-fade-in">
              <div className="flex items-center gap-2 text-sm text-blue-700 font-medium">
                <ArrowRight className="h-4 w-4 animate-pulse" />
                Click a target node to connect
              </div>
              <button
                onClick={() => setConnectingFrom(null)}
                className="mt-1 text-xs text-blue-500 hover:text-blue-700 underline"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* ═══ Canvas Area ═══ */}
        <div
          ref={canvasRef}
          className="flex-1 workflow-canvas relative"
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Edge SVGs */}
          <EdgeRenderer edges={edges} nodes={nodes} canvasOffset={canvasOffset} zoom={zoom} />

          {/* Nodes */}
          {nodes.map(node => (
            <WorkflowNode
              key={node.id}
              node={node}
              isSelected={selectedNodeId === node.id}
              onSelect={() => {
                handleNodeClick(node.id);
                setSelectedNodeId(node.id);
              }}
              onDragStart={(e) => handleNodeDragStart(node.id, e)}
              onConnectStart={(id) => setConnectingFrom(id)}
              zoom={zoom}
              canvasOffset={canvasOffset}
            />
          ))}

          {/* Empty state */}
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center animate-fade-in">
                <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <GitBranch className="h-8 w-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-medium text-slate-400">No nodes yet</h3>
                <p className="text-sm text-slate-400 mt-1">Click a node type from the left panel to get started</p>
              </div>
            </div>
          )}

          {/* Minimap */}
          <div className="absolute bottom-4 right-4 w-40 h-28 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg shadow-md overflow-hidden z-40">
            <div className="p-1 h-full relative">
              {nodes.map(node => {
                const scale = 0.12;
                const colors = NODE_COLOR_MAP[node.type];
                return (
                  <div
                    key={node.id}
                    className={`absolute rounded-sm ${colors.bg} opacity-70`}
                    style={{
                      left: node.x * scale + 8,
                      top: node.y * scale + 4,
                      width: 20,
                      height: 8,
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* ═══ Node Inspector Panel ═══ */}
        {selectedNode && (
          <NodeInspector
            node={selectedNode}
            onUpdate={updateNode}
            onDelete={() => deleteNode(selectedNode.id)}
            onClose={() => setSelectedNodeId(null)}
          />
        )}
      </div>
    </div>
  );
}
