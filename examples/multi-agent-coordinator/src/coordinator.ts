// Coordinator Core — Agent Registry + Task Engine
// KV for tasks (shared state), Durable Objects for agents (per-agent state)

import type { Agent, Task, Subtask, Env } from './types';

// ─── KV Keys ──────────────────────────────────────────────
const TASKS_KEY = 'tasks';

// ─── KV Helpers ──────────────────────────────────────────
async function loadMap<T>(env: Env, key: string): Promise<Map<string, T>> {
  const data = await env.STATE.get(key, 'json');
  if (!data) return new Map();
  return new Map(Object.entries(data as Record<string, T>));
}

async function saveMap<T>(env: Env, key: string, map: Map<string, T>): Promise<void> {
  const obj = Object.fromEntries(map);
  await env.STATE.put(key, JSON.stringify(obj));
}

// ─── Agent Registry (via Durable Objects) ─────────────────

export async function registerAgent(env: Env, data: {
  name: string;
  role: string;
  capabilities: string[];
}): Promise<Agent> {
  // Create a Durable Object for this agent
  const agentId = env.AgentDO.idFromName(data.name);
  const stub = env.AgentDO.get(agentId) as any;

  // Register via callable method
  const result = await stub.register({
    name: data.name,
    role: data.role,
    capabilities: data.capabilities,
  });

  return result;
}

export async function getAgent(env: Env, id: string): Promise<Agent | undefined> {
  // Try to find agent by name (since DO id is name-based)
  const agentId = env.AgentDO.idFromName(id);
  const stub = env.AgentDO.get(agentId) as any;

  try {
    const result = await stub.getState();
    return result || undefined;
  } catch {
    return undefined;
  }
}

export async function getAgentByName(env: Env, name: string): Promise<Agent | undefined> {
  const agentId = env.AgentDO.idFromName(name);
  const stub = env.AgentDO.get(agentId) as any;

  try {
    const result = await stub.getState();
    return result || undefined;
  } catch {
    return undefined;
  }
}

export async function getAgentsByRole(env: Env, role: string): Promise<Agent[]> {
  // For now, we need to scan agents — in production, use KV index
  // This is a limitation of DO-based state
  const allAgents = await getAllAgents(env);
  return allAgents.filter(a => a.role === role && a.status === 'idle');
}

export async function getAllAgents(env: Env): Promise<Agent[]> {
  // Get all agent names from KV index
  const indexData = await env.STATE.get('agent-index', 'json');
  if (!indexData) return [];

  const agentNames = indexData as string[];
  const agents: Agent[] = [];

  for (const name of agentNames) {
    const agentId = env.AgentDO.idFromName(name);
    const stub = env.AgentDO.get(agentId) as any;

    try {
      const state = await stub.getState();
      if (state) agents.push(state);
    } catch {
      // Skip invalid agents
    }
  }

  return agents;
}

export async function updateAgentStatus(env: Env, id: string, status: Agent['status']): Promise<void> {
  const agentId = env.AgentDO.idFromName(id);
  const stub = env.AgentDO.get(agentId) as any;

  await stub.updateStatus(status);

  // Update KV index
  const indexData = await env.STATE.get('agent-index', 'json');
  const agentNames = (indexData as string[]) ?? [];
  if (!agentNames.includes(id)) {
    agentNames.push(id);
    await env.STATE.put('agent-index', JSON.stringify(agentNames));
  }
}

// ─── Task Engine (KV-based, shared state) ─────────────────

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
  const tasks = await loadMap<Task>(env, TASKS_KEY);

  // Get agent via DO
  const agent = await getAgent(env, agentId);
  if (!agent || agent.status !== 'idle') return false;

  for (const task of tasks.values()) {
    const subtask = task.subtasks.find(st => st.id === subtaskId);
    if (subtask && subtask.status === 'pending') {
      subtask.assignedTo = agentId;
      subtask.status = 'assigned';
      task.status = 'assigned';

      // Update agent state via DO
      const agentDOId = env.AgentDO.idFromName(agentId);
      const stub = env.AgentDO.get(agentDOId) as any;
      await stub.assignTask(task.id, subtaskId);

      await saveMap(env, TASKS_KEY, tasks);
      return true;
    }
  }
  return false;
}

// Submit result for a subtask
export async function submitResult(env: Env, subtaskId: string, result: string): Promise<boolean> {
  const tasks = await loadMap<Task>(env, TASKS_KEY);

  for (const task of tasks.values()) {
    const subtask = task.subtasks.find(st => st.id === subtaskId);
    if (subtask && (subtask.status === 'assigned' || subtask.status === 'in-progress')) {
      subtask.result = result;
      subtask.status = 'completed';
      subtask.completedAt = Date.now();

      // Free the agent via DO
      if (subtask.assignedTo) {
        const agentDOId = env.AgentDO.idFromName(subtask.assignedTo);
        const stub = env.AgentDO.get(agentDOId) as any;
        await stub.completeTask(result);
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
      return true;
    }
  }
  return false;
}

// Auto-assign pending subtasks to available agents
export async function autoAssign(env: Env): Promise<Array<{ subtask: Subtask; agent: Agent }>> {
  const tasks = await loadMap<Task>(env, TASKS_KEY);
  const assignments: Array<{ subtask: Subtask; agent: Agent }> = [];

  for (const task of tasks.values()) {
    if (task.status === 'completed') continue;

    for (const subtask of task.subtasks) {
      if (subtask.status !== 'pending') continue;

      const available = await getAgentsByRole(env, subtask.role);
      if (available.length > 0) {
        const agent = available[0];
        subtask.assignedTo = agent.id;
        subtask.status = 'assigned';
        task.status = 'assigned';

        // Update agent via DO
        const agentDOId = env.AgentDO.idFromName(agent.id);
        const stub = env.AgentDO.get(agentDOId) as any;
        await stub.assignTask(task.id, subtask.id);

        assignments.push({ subtask, agent });
      }
    }
  }

  if (assignments.length > 0) {
    await saveMap(env, TASKS_KEY, tasks);
  }

  return assignments;
}

// ─── Sub-Agent Support ──────────────────────────────────

export async function spawnSubAgent(env: Env, parentId: string, data: {
  name: string;
  role: string;
  capabilities: string[];
}): Promise<Agent> {
  const parentDOId = env.AgentDO.idFromName(parentId);
  const stub = env.AgentDO.get(parentDOId) as any;

  const subAgent = await stub.spawnSubAgent(data);

  // Add to agent index
  const indexData = await env.STATE.get('agent-index', 'json');
  const agentNames = (indexData as string[]) ?? [];
  if (!agentNames.includes(subAgent.name)) {
    agentNames.push(subAgent.name);
    await env.STATE.put('agent-index', JSON.stringify(agentNames));
  }

  return subAgent;
}

export async function getSubAgents(env: Env, parentId: string): Promise<Agent[]> {
  const agentDOId = env.AgentDO.idFromName(parentId);
  const stub = env.AgentDO.get(agentDOId) as any;

  return await stub.getSubAgents();
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
