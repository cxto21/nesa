// Multi-Agent Coordinator — Types
// Inspired by Parina: explicit, no magic, linear flow

export interface Env {
  STATE: KVNamespace;  // Local simulation via Miniflare
  LOGS: KVNamespace;   // Interaction logs (falls back to STATE)
  AgentDO: DurableObjectNamespace;  // Agent Durable Object
}

// ─── Agent ──────────────────────────────────────────────
export interface Agent {
  id: string;
  name: string;
  role: string;           // e.g. "researcher", "writer", "reviewer"
  capabilities: string[]; // e.g. ["search", "summarize", "analyze"]
  status: 'idle' | 'working' | 'offline';
  registeredAt: number;
  lastSeen: number;
  // Sub-agent support
  parentId: string | null;
  subAgents: string[];
  // Task context
  currentTask: string | null;
  result: string | null;
}

// ─── Durable Object Types ──────────────────────────────
export interface AgentDOState {
  id: string;
  name: string;
  role: string;
  capabilities: string[];
  status: 'idle' | 'working' | 'offline';
  registeredAt: number;
  lastSeen: number;
  parentId: string | null;
  subAgents: string[];
  currentTask: string | null;
  result: string | null;
}

export interface WebSocketMessage {
  type: 'state-update' | 'task-assigned' | 'task-completed' | 'heartbeat' | 'sub-agent-spawned' | 'error';
  data: any;
  timestamp: number;
}

export interface CallableRequest {
  method: string;
  args: any;
}

// ─── Task ───────────────────────────────────────────────
export type TaskStatus = 'pending' | 'assigned' | 'in-progress' | 'completed' | 'failed';

export interface Subtask {
  id: string;
  taskId: string;
  assignedTo: string | null;  // agent id
  role: string;               // required role
  description: string;
  status: TaskStatus;
  result: string | null;
  createdAt: number;
  completedAt: number | null;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  subtasks: Subtask[];
  createdAt: number;
  completedAt: number | null;
  result: string | null;      // assembled final result
}

// ─── Request ────────────────────────────────────────────
export interface CoordinatorRequest extends Request {
  agentType?: 'ai' | 'bot' | 'human';
  params?: Record<string, string>;
}

// ─── Chat ──────────────────────────────────────────────
export interface ChatMessage {
  id: string;
  from: string;          // 'user' or agent name
  to: string | null;     // agent name or null (broadcast)
  content: string;
  timestamp: number;
  type: 'user' | 'agent' | 'system';
}

// ─── Sub-Agent ─────────────────────────────────────────
export interface SubAgentRequest {
  name: string;
  role: string;
  capabilities: string[];
  parentId: string;
}

export interface SubAgent {
  id: string;
  name: string;
  role: string;
  parentId: string;
  status: 'idle' | 'working' | 'offline';
  createdAt: number;
}
