// Coordinator Core — Agent Registry + Task Engine
// Uses KV for persistent state (survives cold starts locally and in production)

import type { Agent, Task, Subtask, Env } from './types';

// ─── KV Keys ──────────────────────────────────────────────
const AGENTS_KEY = 'agents';
const TASKS_KEY = 'tasks';

// ─── Helpers ──────────────────────────────────────────────
async function loadMap<T>(env: Env, key: string): Promise<Map<string, T>> {
  const data = await env.STATE.get(key, 'json');
  if (!data) return new Map();
  return new Map(Object.entries(data as Record<string, T>));
}

async function saveMap<T>(env: Env, key: string, map: Map<string, T>): Promise<void> {
  const obj = Object.fromEntries(map);
  await env.STATE.put(key, JSON.stringify(obj));
}

// ─── Agent Registry ───────────────────────────────────────

export async function registerAgent(env: Env, data: {
  name: string;
  role: string;
  capabilities: string[];
}): Promise<Agent> {
  const agents = await loadMap<Agent>(env, AGENTS_KEY);
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
  await saveMap(env, AGENTS_KEY, agents);
  return agent;
}

export async function getAgent(env: Env, id: string): Promise<Agent | undefined> {
  const agents = await loadMap<Agent>(env, AGENTS_KEY);
  return agents.get(id);
}

export async function getAgentsByRole(env: Env, role: string): Promise<Agent[]> {
  const agents = await loadMap<Agent>(env, AGENTS_KEY);
  return Array.from(agents.values()).filter(
    a => a.role === role && a.status === 'idle',
  );
}

export async function getAllAgents(env: Env): Promise<Agent[]> {
  const agents = await loadMap<Agent>(env, AGENTS_KEY);
  return Array.from(agents.values());
}

export async function updateAgentStatus(env: Env, id: string, status: Agent['status']): Promise<void> {
  const agents = await loadMap<Agent>(env, AGENTS_KEY);
  const agent = agents.get(id);
  if (agent) {
    agent.status = status;
    agent.lastSeen = Date.now();
    await saveMap(env, AGENTS_KEY, agents);
  }
}

// ─── Task Engine ──────────────────────────────────────────

export async function createTask(env: Env, data: {
  title: string;
  description: string;
  subtasks: Array<{ role: string; description: string }>;
}): Promise<Task> {
  const tasks = await loadMap<Task>(env, TASKS_KEY);
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
  await saveMap(env, TASKS_KEY, tasks);
  return task;
}

export async function getTask(env: Env, id: string): Promise<Task | undefined> {
  const tasks = await loadMap<Task>(env, TASKS_KEY);
  return tasks.get(id);
}

export async function getAllTasks(env: Env): Promise<Task[]> {
  const tasks = await loadMap<Task>(env, TASKS_KEY);
  return Array.from(tasks.values());
}

// Assign a subtask to an agent
export async function assignSubtask(env: Env, subtaskId: string, agentId: string): Promise<boolean> {
  const agents = await loadMap<Agent>(env, AGENTS_KEY);
  const tasks = await loadMap<Task>(env, TASKS_KEY);

  const agent = agents.get(agentId);
  if (!agent || agent.status !== 'idle') return false;

  for (const task of tasks.values()) {
    const subtask = task.subtasks.find(st => st.id === subtaskId);
    if (subtask && subtask.status === 'pending') {
      subtask.assignedTo = agentId;
      subtask.status = 'assigned';
      agent.status = 'working';
      task.status = 'assigned';

      await saveMap(env, AGENTS_KEY, agents);
      await saveMap(env, TASKS_KEY, tasks);
      return true;
    }
  }
  return false;
}

// Submit result for a subtask
export async function submitResult(env: Env, subtaskId: string, result: string): Promise<boolean> {
  const tasks = await loadMap<Task>(env, TASKS_KEY);
  const agents = await loadMap<Agent>(env, AGENTS_KEY);

  for (const task of tasks.values()) {
    const subtask = task.subtasks.find(st => st.id === subtaskId);
    if (subtask && (subtask.status === 'assigned' || subtask.status === 'in-progress')) {
      subtask.result = result;
      subtask.status = 'completed';
      subtask.completedAt = Date.now();

      // Free the agent
      if (subtask.assignedTo) {
        const agent = agents.get(subtask.assignedTo);
        if (agent) {
          agent.status = 'idle';
          agent.lastSeen = Date.now();
        }
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

      await saveMap(env, TASKS_KEY, tasks);
      await saveMap(env, AGENTS_KEY, agents);
      return true;
    }
  }
  return false;
}

// Auto-assign pending subtasks to available agents
export async function autoAssign(env: Env): Promise<Array<{ subtask: Subtask; agent: Agent }>> {
  const agents = await loadMap<Agent>(env, AGENTS_KEY);
  const tasks = await loadMap<Task>(env, TASKS_KEY);
  const assignments: Array<{ subtask: Subtask; agent: Agent }> = [];

  for (const task of tasks.values()) {
    if (task.status === 'completed') continue;

    for (const subtask of task.subtasks) {
      if (subtask.status !== 'pending') continue;

      const available = Array.from(agents.values()).filter(
        a => a.role === subtask.role && a.status === 'idle',
      );

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

  if (assignments.length > 0) {
    await saveMap(env, AGENTS_KEY, agents);
    await saveMap(env, TASKS_KEY, tasks);
  }

  return assignments;
}

// ─── Stats ────────────────────────────────────────────────

export async function getStats(env: Env) {
  const allAgents = await getAllAgents(env);
  const allTasks = await getAllTasks(env);

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
