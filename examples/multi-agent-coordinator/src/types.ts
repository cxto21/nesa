// Multi-Agent Coordinator — Types
// Inspired by Parina: explicit, no magic, linear flow

export interface Env {
  STATE: KVNamespace;  // Local simulation via Miniflare
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
  url: URL;
  params?: Record<string, string>;
}
