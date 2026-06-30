// Coordinator Core — Unit Tests
import { describe, it, expect, beforeEach } from 'vitest';
import {
  registerAgent,
  getAgent,
  getAllAgents,
  updateAgentStatus,
  createTask,
  getTask,
  getAllTasks,
  assignSubtask,
  submitResult,
  autoAssign,
  getStats,
} from '../coordinator';

// Mock KV namespace (matches Cloudflare KV behavior)
function createMockKV() {
  const store = new Map<string, string>();
  return {
    get: async (key: string, type?: string) => {
      const val = store.get(key);
      if (val === undefined) return null;
      if (type === 'json') return JSON.parse(val);
      return val;
    },
    put: async (key: string, value: string) => { store.set(key, value); },
    delete: async (key: string) => { store.delete(key); },
  } as unknown as KVNamespace;
}

// Mock Durable Object namespace
function createMockDO(kv: KVNamespace) {
  const agents = new Map<string, any>();

  return {
    idFromName: (name: string) => ({ toString: () => name, name }),
    get: (id: any) => ({
      register: async (data: any) => {
        const agent = {
          id: id.name || id.toString(),
          name: data.name,
          role: data.role,
          capabilities: data.capabilities || [],
          status: 'idle',
          registeredAt: Date.now(),
          lastSeen: Date.now(),
          parentId: data.parentId || null,
          subAgents: [],
          currentTask: null,
          result: null,
        };
        agents.set(agent.id, agent);

        // Maintain KV index
        const indexData = await kv.get('agent-index', 'json');
        const agentNames = (indexData as string[]) ?? [];
        if (!agentNames.includes(agent.name)) {
          agentNames.push(agent.name);
          await kv.put('agent-index', JSON.stringify(agentNames));
        }

        return agent;
      },
      getState: async () => agents.get(id.name || id.toString()),
      updateStatus: async (status: string) => {
        const agent = agents.get(id.name || id.toString());
        if (agent) {
          agent.status = status;
          agent.lastSeen = Date.now();
        }
      },
      assignTask: async (taskId: string, subtaskId: string) => {
        const agent = agents.get(id.name || id.toString());
        if (agent) {
          agent.currentTask = `${taskId}:${subtaskId}`;
          agent.status = 'working';
          agent.lastSeen = Date.now();
        }
      },
      completeTask: async (result: string) => {
        const agent = agents.get(id.name || id.toString());
        if (agent) {
          agent.currentTask = null;
          agent.result = result;
          agent.status = 'idle';
          agent.lastSeen = Date.now();
        }
      },
      spawnSubAgent: async (data: any) => {
        const subAgent = {
          id: `sub-${id.name || id.toString()}-${data.name}`,
          name: data.name,
          role: data.role,
          capabilities: data.capabilities || [],
          status: 'idle',
          registeredAt: Date.now(),
          lastSeen: Date.now(),
          parentId: id.name || id.toString(),
          subAgents: [],
          currentTask: null,
          result: null,
        };
        agents.set(subAgent.id, subAgent);

        // Add to parent's subAgents list
        const parent = agents.get(id.name || id.toString());
        if (parent) {
          parent.subAgents.push(subAgent.id);
        }

        // Maintain KV index for sub-agent
        const indexData = await kv.get('agent-index', 'json');
        const agentNames = (indexData as string[]) ?? [];
        if (!agentNames.includes(subAgent.name)) {
          agentNames.push(subAgent.name);
          await kv.put('agent-index', JSON.stringify(agentNames));
        }

        return subAgent;
      },
      getSubAgents: async () => {
        const parent = agents.get(id.name || id.toString());
        if (!parent) return [];
        return parent.subAgents.map((subId: string) => agents.get(subId)).filter(Boolean);
      },
    }),
  } as unknown as DurableObjectNamespace;
}

describe('Coordinator', () => {
  let env: { STATE: KVNamespace; LOGS: KVNamespace; AgentDO: DurableObjectNamespace };

  beforeEach(() => {
    const logsKV = createMockKV();
    const stateKV = createMockKV();
    env = { STATE: stateKV, LOGS: logsKV, AgentDO: createMockDO(stateKV) };
  });

  describe('Agent Registry', () => {
    it('should register an agent', async () => {
      const agent = await registerAgent(env, {
        name: 'test-agent',
        role: 'researcher',
        capabilities: ['search'],
      });

      expect(agent.id).toBeDefined();
      expect(agent.name).toBe('test-agent');
      expect(agent.role).toBe('researcher');
      expect(agent.status).toBe('idle');
      expect(agent.capabilities).toEqual(['search']);
    });

    it('should get agent by id', async () => {
      const registered = await registerAgent(env, {
        name: 'agent-1',
        role: 'writer',
        capabilities: [],
      });

      const found = await getAgent(env, registered.id);
      expect(found).toBeDefined();
      expect(found!.name).toBe('agent-1');
    });

    it('should return undefined for non-existent agent', async () => {
      const found = await getAgent(env, 'non-existent-id');
      expect(found).toBeUndefined();
    });

    it('should list all agents', async () => {
      await registerAgent(env, { name: 'a1', role: 'r1', capabilities: [] });
      await registerAgent(env, { name: 'a2', role: 'r2', capabilities: [] });

      const all = await getAllAgents(env);
      expect(all).toHaveLength(2);
    });

    it('should update agent status', async () => {
      const agent = await registerAgent(env, {
        name: 'agent',
        role: 'role',
        capabilities: [],
      });

      await updateAgentStatus(env, agent.id, 'working');
      const updated = await getAgent(env, agent.id);
      expect(updated!.status).toBe('working');
    });

    it('should get agents by role (only idle)', async () => {
      const a1 = await registerAgent(env, { name: 'r1', role: 'researcher', capabilities: [] });
      await registerAgent(env, { name: 'r2', role: 'researcher', capabilities: [] });
      await registerAgent(env, { name: 'w1', role: 'writer', capabilities: [] });

      // Make a1 working
      await updateAgentStatus(env, a1.id, 'working');

      const researchers = await import('../coordinator').then(m => m.getAgentsByRole(env, 'researcher'));
      expect(researchers).toHaveLength(1); // only idle researcher
      expect(researchers[0].name).toBe('r2');
    });
  });

  describe('Task Engine', () => {
    it('should create a task with subtasks', async () => {
      const task = await createTask(env, {
        title: 'Test task',
        description: 'Test description',
        subtasks: [
          { role: 'researcher', description: 'Research' },
          { role: 'writer', description: 'Write' },
        ],
      });

      expect(task.id).toBeDefined();
      expect(task.title).toBe('Test task');
      expect(task.subtasks).toHaveLength(2);
      expect(task.subtasks[0].role).toBe('researcher');
      expect(task.subtasks[1].role).toBe('writer');
      expect(task.status).toBe('pending');
    });

    it('should get task by id', async () => {
      const created = await createTask(env, {
        title: 'Task',
        description: 'Desc',
        subtasks: [{ role: 'r', description: 'd' }],
      });

      const found = await getTask(env, created.id);
      expect(found).toBeDefined();
      expect(found!.title).toBe('Task');
    });

    it('should list all tasks', async () => {
      await createTask(env, { title: 'T1', description: 'D1', subtasks: [] });
      await createTask(env, { title: 'T2', description: 'D2', subtasks: [] });

      const all = await getAllTasks(env);
      expect(all).toHaveLength(2);
    });

    it('should assign subtask to agent', async () => {
      const agent = await registerAgent(env, { name: 'a', role: 'researcher', capabilities: [] });
      const task = await createTask(env, {
        title: 'T',
        description: 'D',
        subtasks: [{ role: 'researcher', description: 'Research' }],
      });

      const subtaskId = task.subtasks[0].id;
      const ok = await assignSubtask(env, subtaskId, agent.id);
      expect(ok).toBe(true);

      const updated = await getTask(env, task.id);
      const subtask = updated!.subtasks.find(s => s.id === subtaskId);
      expect(subtask!.status).toBe('assigned');
      expect(subtask!.assignedTo).toBe(agent.id);

      const agentStatus = await getAgent(env, agent.id);
      expect(agentStatus!.status).toBe('working');
    });

    it('should submit result for subtask', async () => {
      const agent = await registerAgent(env, { name: 'a', role: 'r', capabilities: [] });
      const task = await createTask(env, {
        title: 'T',
        description: 'D',
        subtasks: [{ role: 'r', description: 'Do' }],
      });

      await assignSubtask(env, task.subtasks[0].id, agent.id);
      const ok = await submitResult(env, task.subtasks[0].id, 'Result here');
      expect(ok).toBe(true);

      const updated = await getTask(env, task.id);
      expect(updated!.subtasks[0].status).toBe('completed');
      expect(updated!.subtasks[0].result).toBe('Result here');

      const agentStatus = await getAgent(env, agent.id);
      expect(agentStatus!.status).toBe('idle');
    });

    it('should complete task when all subtasks done', async () => {
      const a1 = await registerAgent(env, { name: 'a1', role: 'r1', capabilities: [] });
      const a2 = await registerAgent(env, { name: 'a2', role: 'r2', capabilities: [] });

      const task = await createTask(env, {
        title: 'T',
        description: 'D',
        subtasks: [
          { role: 'r1', description: 'Step 1' },
          { role: 'r2', description: 'Step 2' },
        ],
      });

      await assignSubtask(env, task.subtasks[0].id, a1.id);
      await assignSubtask(env, task.subtasks[1].id, a2.id);

      await submitResult(env, task.subtasks[0].id, 'Done 1');
      await submitResult(env, task.subtasks[1].id, 'Done 2');

      const completed = await getTask(env, task.id);
      expect(completed!.status).toBe('completed');
      expect(completed!.result).toContain('[r1]');
      expect(completed!.result).toContain('[r2]');
      expect(completed!.completedAt).toBeDefined();
    });

    it('should auto-assign pending subtasks', async () => {
      await registerAgent(env, { name: 'r1', role: 'researcher', capabilities: [] });
      await registerAgent(env, { name: 'w1', role: 'writer', capabilities: [] });

      await createTask(env, {
        title: 'T',
        description: 'D',
        subtasks: [
          { role: 'researcher', description: 'Research' },
          { role: 'writer', description: 'Write' },
        ],
      });

      const assignments = await autoAssign(env);
      expect(assignments).toHaveLength(2);

      const tasks = await getAllTasks(env);
      expect(tasks[0].subtasks[0].status).toBe('assigned');
      expect(tasks[0].subtasks[1].status).toBe('assigned');
    });
  });

  describe('Stats', () => {
    it('should return correct stats', async () => {
      await registerAgent(env, { name: 'a1', role: 'r', capabilities: [] });
      await registerAgent(env, { name: 'a2', role: 'r', capabilities: [] });

      await createTask(env, {
        title: 'T',
        description: 'D',
        subtasks: [{ role: 'r', description: 'Do' }],
      });

      const stats = await getStats(env);
      expect(stats.agents.total).toBe(2);
      expect(stats.agents.idle).toBe(2);
      expect(stats.tasks.total).toBe(1);
      expect(stats.tasks.pending).toBe(1);
    });
  });
});
