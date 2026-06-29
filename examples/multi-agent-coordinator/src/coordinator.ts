// Coordinator Core — Agent Registry + Task Engine
// In-memory state (per-isolate). For production: use Durable Objects or KV.

import type { Agent, Task, Subtask } from './types';

// ─── State (in-memory, resets on cold start) ────────────
const agents = new Map<string, Agent>();
const tasks = new Map<string, Task>();

// ─── Agent Registry ─────────────────────────────────────

export function registerAgent(data: {
  name: string;
  role: string;
  capabilities: string[];
}): Agent {
  const id = crypto.randomUUID();
  const now = Date.now();

  const agent: Agent = {
    id,
    name: data.name,
    role: data.role,
    capabilities: data.capabilities,
    status: 'idle',
    registeredAt: now,
    lastSeen: now,
  };

  agents.set(id, agent);
  return agent;
}

export function getAgent(id: string): Agent | undefined {
  return agents.get(id);
}

export function getAgentsByRole(role: string): Agent[] {
  return Array.from(agents.values()).filter(
    a => a.role === role && a.status === 'idle',
  );
}

export function getAllAgents(): Agent[] {
  return Array.from(agents.values());
}

export function updateAgentStatus(id: string, status: Agent['status']): void {
  const agent = agents.get(id);
  if (agent) {
    agent.status = status;
    agent.lastSeen = Date.now();
  }
}

// ─── Task Engine ────────────────────────────────────────

export function createTask(data: {
  title: string;
  description: string;
  subtasks: Array<{ role: string; description: string }>;
}): Task {
  const id = crypto.randomUUID();
  const now = Date.now();

  const subtasks: Subtask[] = data.subtasks.map((st, i) => ({
    id: `${id}-st-${i}`,
    taskId: id,
    assignedTo: null,
    role: st.role,
    description: st.description,
    status: 'pending' as const,
    result: null,
    createdAt: now,
    completedAt: null,
  }));

  const task: Task = {
    id,
    title: data.title,
    description: data.description,
    status: 'pending',
    subtasks,
    createdAt: now,
    completedAt: null,
    result: null,
  };

  tasks.set(id, task);
  return task;
}

export function getTask(id: string): Task | undefined {
  return tasks.get(id);
}

export function getAllTasks(): Task[] {
  return Array.from(tasks.values());
}

// Assign a subtask to an agent
export function assignSubtask(subtaskId: string, agentId: string): boolean {
  const agent = agents.get(agentId);
  if (!agent || agent.status !== 'idle') return false;

  for (const task of tasks.values()) {
    const subtask = task.subtasks.find(st => st.id === subtaskId);
    if (subtask && subtask.status === 'pending') {
      subtask.assignedTo = agentId;
      subtask.status = 'assigned';
      agent.status = 'working';
      task.status = 'assigned';
      return true;
    }
  }
  return false;
}

// Submit result for a subtask
export function submitResult(subtaskId: string, result: string): boolean {
  for (const task of tasks.values()) {
    const subtask = task.subtasks.find(st => st.id === subtaskId);
    if (subtask && (subtask.status === 'assigned' || subtask.status === 'in-progress')) {
      subtask.result = result;
      subtask.status = 'completed';
      subtask.completedAt = Date.now();

      // Free the agent
      if (subtask.assignedTo) {
        updateAgentStatus(subtask.assignedTo, 'idle');
      }

      // Check if all subtasks are done
      const allDone = task.subtasks.every(st => st.status === 'completed');
      if (allDone) {
        task.status = 'completed';
        task.completedAt = Date.now();
        task.result = task.subtasks
          .map(st => `[${st.role}]\n${st.result}`)
          .join('\n\n');
      }

      return true;
    }
  }
  return false;
}

// Auto-assign pending subtasks to available agents
export function autoAssign(): Array<{ subtask: Subtask; agent: Agent }> {
  const assignments: Array<{ subtask: Subtask; agent: Agent }> = [];

  for (const task of tasks.values()) {
    if (task.status === 'completed') continue;

    for (const subtask of task.subtasks) {
      if (subtask.status !== 'pending') continue;

      const available = getAgentsByRole(subtask.role);
      if (available.length > 0) {
        const agent = available[0];
        subtask.assignedTo = agent.id;
        subtask.status = 'assigned';
        agent.status = 'working';
        task.status = 'assigned';
        assignments.push({ subtask, agent });
      }
    }
  }

  return assignments;
}

// ─── Stats ──────────────────────────────────────────────

export function getStats() {
  const allAgents = getAllAgents();
  const allTasks = getAllTasks();

  return {
    agents: {
      total: allAgents.length,
      idle: allAgents.filter(a => a.status === 'idle').length,
      working: allAgents.filter(a => a.status === 'working').length,
      offline: allAgents.filter(a => a.status === 'offline').length,
    },
    tasks: {
      total: allTasks.length,
      pending: allTasks.filter(t => t.status === 'pending').length,
      assigned: allTasks.filter(t => t.status === 'assigned').length,
      completed: allTasks.filter(t => t.status === 'completed').length,
      failed: allTasks.filter(t => t.status === 'failed').length,
    },
  };
}
