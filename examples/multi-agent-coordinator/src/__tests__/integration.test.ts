// Integration Tests — Full HTTP flow
import { describe, it, expect, beforeEach } from 'vitest';
import worker from '../index';

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

// Mock ExecutionContext
function createMockContext() {
  const waitUntilPromises: Promise<any>[] = [];
  return {
    waitUntil: (promise: Promise<any>) => { waitUntilPromises.push(promise); },
    passThroughOnException: () => {},
    abort: () => {},
    promises: waitUntilPromises,
  } as unknown as ExecutionContext;
}

describe('Multi-Agent Coordinator API', () => {
  let env: { STATE: KVNamespace; LOGS: KVNamespace };

  beforeEach(() => {
    env = {
      STATE: createMockKV(),
      LOGS: createMockKV(),
    };
  });

  describe('GET /', () => {
    it('should return JSON for AI agents', async () => {
      const request = new Request('http://localhost/', {
        headers: { 'User-Agent': 'OpenAI-GPT' },
      });
      const ctx = createMockContext();
      const response = await worker.fetch(request, env, ctx);

      expect(response.status).toBe(200);
      const body = await response.json<any>();
      expect(body.service).toBe('multi-agent-coordinator');
      expect(body.capabilities).toBeDefined();
      expect(body.protocol).toBeDefined();
    });

    it('should return HTML for humans', async () => {
      const request = new Request('http://localhost/', {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
      const ctx = createMockContext();
      const response = await worker.fetch(request, env, ctx);

      expect(response.status).toBe(200);
      const html = await response.text();
      expect(html).toContain('COORDINATOR');
    });
  });

  describe('GET /status', () => {
    it('should return JSON status', async () => {
      const request = new Request('http://localhost/status');
      const ctx = createMockContext();
      const response = await worker.fetch(request, env, ctx);

      expect(response.status).toBe(200);
      const body = await response.json<any>();
      expect(body.service).toBe('multi-agent-coordinator');
      expect(body.stats.agents).toBeDefined();
      expect(body.stats.tasks).toBeDefined();
    });
  });

  describe('Agent Flow', () => {
    it('should register, list, and heartbeat an agent', async () => {
      // Register
      const regRequest = new Request('http://localhost/agents/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'OpenAI-GPT',
        },
        body: JSON.stringify({
          name: 'test-agent',
          role: 'researcher',
          capabilities: ['search'],
        }),
      });
      const regCtx = createMockContext();
      const regResponse = await worker.fetch(regRequest, env, regCtx);

      expect(regResponse.status).toBe(201);
      const regBody = await regResponse.json<any>();
      expect(regBody.agent.id).toBeDefined();
      const agentId = regBody.agent.id;

      // List
      const listRequest = new Request('http://localhost/agents', {
        headers: { 'User-Agent': 'OpenAI-GPT' },
      });
      const listCtx = createMockContext();
      const listResponse = await worker.fetch(listRequest, env, listCtx);

      expect(listResponse.status).toBe(200);
      const listBody = await listResponse.json<any>();
      expect(listBody.agents.length).toBeGreaterThanOrEqual(1);

      // Heartbeat
      const hbRequest = new Request(`http://localhost/agents/${agentId}/heartbeat`, {
        method: 'POST',
      });
      const hbCtx = createMockContext();
      const hbResponse = await worker.fetch(hbRequest, env, hbCtx);

      expect(hbResponse.status).toBe(200);
      const hbBody = await hbResponse.json<any>();
      expect(hbBody.ok).toBe(true);
    });

    it('should reject registration without name', async () => {
      const request = new Request('http://localhost/agents/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'writer' }),
      });
      const ctx = createMockContext();
      const response = await worker.fetch(request, env, ctx);

      expect(response.status).toBe(400);
    });
  });

  describe('Task Flow', () => {
    it('should complete full task lifecycle', async () => {
      // Register agent
      const regRequest = new Request('http://localhost/agents/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'OpenAI-GPT',
        },
        body: JSON.stringify({
          name: 'researcher',
          role: 'researcher',
          capabilities: ['search'],
        }),
      });
      const regCtx = createMockContext();
      const regResponse = await worker.fetch(regRequest, env, regCtx);
      const { agent } = await regResponse.json<any>();

      // Create task
      const createRequest = new Request('http://localhost/tasks/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'OpenAI-GPT',
        },
        body: JSON.stringify({
          title: 'Test task',
          description: 'Integration test',
          subtasks: [
            { role: 'researcher', description: 'Research something' },
          ],
        }),
      });
      const createCtx = createMockContext();
      const createResponse = await worker.fetch(createRequest, env, createCtx);

      expect(createResponse.status).toBe(201);
      const { task } = await createResponse.json<any>();
      expect(task.id).toBeDefined();
      expect(task.subtasks).toHaveLength(1);

      // Pick task — subtask may have been auto-assigned during creation
      const pickRequest = new Request(
        `http://localhost/tasks/pick?role=researcher&agentId=${agent.id}`,
        { headers: { 'User-Agent': 'OpenAI-GPT' } },
      );
      const pickCtx = createMockContext();
      const pickResponse = await worker.fetch(pickRequest, env, pickCtx);

      expect(pickResponse.status).toBe(200);
      const pickBody = await pickResponse.json<any>();

      // If auto-assigned, find the subtask ID from the task directly
      let subtaskId: string;
      if (pickBody.subtask) {
        subtaskId = pickBody.subtask.id;
      } else {
        // Subtask was auto-assigned — get ID from task detail
        subtaskId = task.subtasks[0].id;
      }

      // Submit result
      const submitRequest = new Request('http://localhost/tasks/result', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'OpenAI-GPT',
        },
        body: JSON.stringify({
          subtaskId,
          result: 'Research completed successfully',
        }),
      });
      const submitCtx = createMockContext();
      const submitResponse = await worker.fetch(submitRequest, env, submitCtx);

      expect(submitResponse.status).toBe(200);

      // Verify task completed
      const detailRequest = new Request(`http://localhost/tasks/${task.id}`, {
        headers: { 'User-Agent': 'OpenAI-GPT' },
      });
      const detailCtx = createMockContext();
      const detailResponse = await worker.fetch(detailRequest, env, detailCtx);

      expect(detailResponse.status).toBe(200);
      const detailBody = await detailResponse.json<any>();
      expect(detailBody.task.status).toBe('completed');
      expect(detailBody.task.result).toContain('Research completed');
    });

    it('should reject task creation without subtasks', async () => {
      const request = new Request('http://localhost/tasks/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'T', description: 'D' }),
      });
      const ctx = createMockContext();
      const response = await worker.fetch(request, env, ctx);

      expect(response.status).toBe(400);
    });

    it('should return 404 for non-existent task', async () => {
      const request = new Request('http://localhost/tasks/non-existent-id');
      const ctx = createMockContext();
      const response = await worker.fetch(request, env, ctx);

      expect(response.status).toBe(404);
    });
  });

  describe('Chat Flow', () => {
    it('should render chat UI', async () => {
      const request = new Request('http://localhost/chat');
      const ctx = createMockContext();
      const response = await worker.fetch(request, env, ctx);

      expect(response.status).toBe(200);
      const html = await response.text();
      expect(html).toContain('CHAT');
      expect(html).toContain('/chat/send');
    });

    it('should send and retrieve messages', async () => {
      // Send a message
      const sendReq = new Request('http://localhost/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'Hello everyone' }),
      });
      const sendCtx = createMockContext();
      const sendRes = await worker.fetch(sendReq, env, sendCtx);

      expect(sendRes.status).toBe(200);
      const sendBody = await sendRes.json<any>();
      expect(sendBody.ok).toBe(true);

      // Get messages
      const msgReq = new Request('http://localhost/chat/messages');
      const msgCtx = createMockContext();
      const msgRes = await worker.fetch(msgReq, env, msgCtx);

      expect(msgRes.status).toBe(200);
      const msgBody = await msgRes.json<any>();
      expect(msgBody.messages.length).toBe(1);
      expect(msgBody.messages[0].content).toBe('Hello everyone');
      expect(msgBody.messages[0].type).toBe('user');
    });

    it('should route @mentions to agents', async () => {
      // Register an agent first
      const regReq = new Request('http://localhost/agents/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'researcher-1', role: 'researcher', capabilities: ['search'] }),
      });
      const regCtx = createMockContext();
      await worker.fetch(regReq, env, regCtx);

      // Send @mention
      const sendReq = new Request('http://localhost/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: '@researcher-1 research edge computing' }),
      });
      const sendCtx = createMockContext();
      const sendRes = await worker.fetch(sendReq, env, sendCtx);
      expect(sendRes.status).toBe(200);

      // Should have user message + agent response
      const msgReq = new Request('http://localhost/chat/messages');
      const msgCtx = createMockContext();
      const msgRes = await worker.fetch(msgReq, env, msgCtx);
      const msgBody = await msgRes.json<any>();

      expect(msgBody.messages.length).toBe(2);
      expect(msgBody.messages[0].type).toBe('user');
      expect(msgBody.messages[0].to).toBe('researcher-1');
      expect(msgBody.messages[1].type).toBe('agent');
      expect(msgBody.messages[1].from).toBe('researcher-1');
    });

    it('should notify when agent not found', async () => {
      const sendReq = new Request('http://localhost/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: '@ghost do something' }),
      });
      const sendCtx = createMockContext();
      await worker.fetch(sendReq, env, sendCtx);

      const msgReq = new Request('http://localhost/chat/messages');
      const msgCtx = createMockContext();
      const msgRes = await worker.fetch(msgReq, env, msgCtx);
      const msgBody = await msgRes.json<any>();

      expect(msgBody.messages.length).toBe(2);
      expect(msgBody.messages[1].type).toBe('system');
      expect(msgBody.messages[1].content).toContain('not found');
    });
  });

  describe('404 Catch-all', () => {
    it('should return 404 for unknown routes', async () => {
      const request = new Request('http://localhost/unknown-route');
      const ctx = createMockContext();
      const response = await worker.fetch(request, env, ctx);

      expect(response.status).toBe(404);
    });
  });
});
