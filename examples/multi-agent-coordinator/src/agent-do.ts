// Agent Durable Object — Stateful agent with WebSocket + scheduling
// Nesa style: explicit, no magic, linear flow

import { DurableObject } from "cloudflare:workers";

// ─── Types ──────────────────────────────────────────────
export interface AgentState {
  id: string;
  name: string;
  role: string;
  capabilities: string[];
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

export interface WebSocketMessage {
  type: 'state-update' | 'task-assigned' | 'task-completed' | 'heartbeat' | 'sub-agent-spawned' | 'error';
  data: any;
  timestamp: number;
}

// ─── Agent Durable Object ───────────────────────────────
export class AgentDO extends DurableObject {
  private state: AgentState | null = null;
  private connections: Set<WebSocket> = new Set();
  private heartbeatInterval: number | null = null;

  constructor(ctx: DurableObjectState, env: any) {
    super(ctx, env);
    // Load state from SQLite on startup
    this.ctx.blockConcurrencyWhile(async () => {
      const row = this.ctx.sql`SELECT * FROM agent_state LIMIT 1`.toArray()[0];
      if (row) {
        this.state = JSON.parse(row.data as string);
      }
    });
  }

  // ─── Lifecycle ────────────────────────────────────────
  async onStart(): Promise<void> {
    // Create table if not exists
    this.ctx.sql`CREATE TABLE IF NOT EXISTS agent_state (id TEXT PRIMARY KEY, data TEXT)`;
    
    // Start heartbeat alarm (every 30 seconds)
    if (!this.state) return;
    
    await this.ctx.storage.setAlarm(Date.now() + 30000);
  }

  async alarm(): Promise<void> {
    if (!this.state) return;
    
    // Check if agent is still alive (heartbeat timeout: 60s)
    const timeSinceLastSeen = Date.now() - this.state.lastSeen;
    if (timeSinceLastSeen > 60000 && this.state.status !== 'offline') {
      this.state.status = 'offline';
      await this.persistState();
      this.broadcast({
        type: 'state-update',
        data: this.state,
        timestamp: Date.now(),
      });
    }

    // Schedule next alarm
    await this.ctx.storage.setAlarm(Date.now() + 30000);
  }

  // ─── HTTP Handler ─────────────────────────────────────
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // WebSocket upgrade
    if (url.pathname.endsWith('/ws')) {
      return this.handleWebSocket(request);
    }

    // Callable methods via POST
    if (request.method === 'POST') {
      const body = await request.json() as any;
      return this.handleCallable(body.method, body.args);
    }

    // GET = return current state
    return Response.json({ state: this.state });
  }

  // ─── WebSocket ────────────────────────────────────────
  private handleWebSocket(request: Request): Response {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    this.ctx.acceptWebSocket(server);
    this.connections.add(client);

    // Send current state on connect
    client.send(JSON.stringify({
      type: 'state-update',
      data: this.state,
      timestamp: Date.now(),
    }));

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    try {
      const data = JSON.parse(message as string);
      
      // Handle client messages
      if (data.type === 'heartbeat') {
        await this.heartbeat();
      } else if (data.type === 'update-state') {
        await this.setState(data.data);
      }
    } catch (e) {
      ws.send(JSON.stringify({
        type: 'error',
        data: 'Invalid message format',
        timestamp: Date.now(),
      }));
    }
  }

  async webSocketClose(ws: WebSocket): Promise<void> {
    this.connections.delete(ws);
  }

  // ─── Callable Methods ─────────────────────────────────
  private async handleCallable(method: string, args: any): Promise<Response> {
    try {
      let result: any;

      switch (method) {
        case 'register':
          result = await this.register(args);
          break;
        case 'heartbeat':
          result = await this.heartbeat();
          break;
        case 'updateStatus':
          result = await this.updateStatus(args.status);
          break;
        case 'assignTask':
          result = await this.assignTask(args.taskId, args.subtaskId);
          break;
        case 'completeTask':
          result = await this.completeTask(args.result);
          break;
        case 'spawnSubAgent':
          result = await this.spawnSubAgent(args);
          break;
        case 'getState':
          result = this.state;
          break;
        default:
          return Response.json({ error: `Unknown method: ${method}` }, { status: 400 });
      }

      return Response.json({ result });
    } catch (e: any) {
      return Response.json({ error: e.message }, { status: 500 });
    }
  }

  // ─── State Management ─────────────────────────────────
  async register(data: {
    name: string;
    role: string;
    capabilities: string[];
    parentId?: string;
  }): Promise<AgentState> {
    this.state = {
      id: this.ctx.id.toString(),
      name: data.name,
      role: data.role,
      capabilities: data.capabilities,
      status: 'idle',
      registeredAt: Date.now(),
      lastSeen: Date.now(),
      parentId: data.parentId ?? null,
      subAgents: [],
      currentTask: null,
      result: null,
    };

    await this.persistState();
    await this.ctx.storage.setAlarm(Date.now() + 30000);

    this.broadcast({
      type: 'state-update',
      data: this.state,
      timestamp: Date.now(),
    });

    return this.state;
  }

  async heartbeat(): Promise<{ status: string; lastSeen: number }> {
    if (!this.state) {
      return { status: 'not-registered', lastSeen: 0 };
    }

    this.state.lastSeen = Date.now();
    if (this.state.status === 'offline') {
      this.state.status = 'idle';
    }

    await this.persistState();
    return { status: this.state.status, lastSeen: this.state.lastSeen };
  }

  async updateStatus(status: AgentState['status']): Promise<void> {
    if (!this.state) return;

    this.state.status = status;
    this.state.lastSeen = Date.now();
    await this.persistState();

    this.broadcast({
      type: 'state-update',
      data: this.state,
      timestamp: Date.now(),
    });
  }

  async assignTask(taskId: string, subtaskId: string): Promise<void> {
    if (!this.state) return;

    this.state.currentTask = `${taskId}:${subtaskId}`;
    this.state.status = 'working';
    this.state.lastSeen = Date.now();
    await this.persistState();

    this.broadcast({
      type: 'task-assigned',
      data: { taskId, subtaskId },
      timestamp: Date.now(),
    });
  }

  async completeTask(result: string): Promise<void> {
    if (!this.state) return;

    const taskId = this.state.currentTask;
    this.state.currentTask = null;
    this.state.result = result;
    this.state.status = 'idle';
    this.state.lastSeen = Date.now();
    await this.persistState();

    this.broadcast({
      type: 'task-completed',
      data: { taskId, result },
      timestamp: Date.now(),
    });
  }

  // ─── Sub-Agent Support ────────────────────────────────
  async spawnSubAgent(data: {
    name: string;
    role: string;
    capabilities: string[];
  }): Promise<AgentState> {
    if (!this.state) throw new Error('Agent not registered');

    // Get the sub-agent DO stub
    const subAgentId = this.env.AgentDO.idFromName(`sub-${this.state.id}-${data.name}`);
    const stub = this.env.AgentDO.get(subAgentId) as any;

    // Register the sub-agent with this as parent
    const subAgent = await stub.register({
      ...data,
      parentId: this.state.id,
    });

    // Track sub-agent in parent
    this.state.subAgents.push(subAgent.id);
    this.state.lastSeen = Date.now();
    await this.persistState();

    this.broadcast({
      type: 'sub-agent-spawned',
      data: { subAgentId: subAgent.id, subAgentName: data.name },
      timestamp: Date.now(),
    });

    return subAgent;
  }

  async getSubAgents(): Promise<AgentState[]> {
    if (!this.state) return [];

    const subAgents: AgentState[] = [];
    for (const subId of this.state.subAgents) {
      const subAgentId = this.env.AgentDO.idFromName(subId);
      const stub = this.env.AgentDO.get(subAgentId) as any;
      const state = await stub.getState();
      if (state) subAgents.push(state);
    }

    return subAgents;
  }

  // ─── Internal ─────────────────────────────────────────
  private async setState(newState: Partial<AgentState>): Promise<void> {
    if (!this.state) return;

    Object.assign(this.state, newState);
    this.state.lastSeen = Date.now();
    await this.persistState();

    this.broadcast({
      type: 'state-update',
      data: this.state,
      timestamp: Date.now(),
    });
  }

  private broadcast(message: WebSocketMessage): void {
    const payload = JSON.stringify(message);
    for (const ws of this.connections) {
      try {
        ws.send(payload);
      } catch {
        this.connections.delete(ws);
      }
    }
  }

  private async persistState(): Promise<void> {
    if (!this.state) return;

    this.ctx.sql`INSERT OR REPLACE INTO agent_state (id, data) VALUES (${this.state.id}, ${JSON.stringify(this.state)})`;
  }
}
