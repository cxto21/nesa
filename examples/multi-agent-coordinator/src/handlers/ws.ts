// WebSocket Handler — Real-time agent communication
// Nesa style: explicit, no magic, linear flow

import type { CoordinatorRequest, Env } from '../types';

// GET /ws/agent/:id — WebSocket connection to agent
export async function agentWebSocket(request: CoordinatorRequest, env: Env): Promise<Response> {
  const id = request.params?.id;
  if (!id) {
    return Response.json({ error: 'Missing agent id' }, { status: 400 });
  }

  // Get the Durable Object stub
  const agentId = env.AgentDO.idFromName(id);
  const stub = env.AgentDO.get(agentId);

  // Forward the request to the DO
  return stub.fetch(request);
}

// GET /ws/agents — Broadcast to all agents (future use)
export async function broadcastWebSocket(request: CoordinatorRequest, env: Env): Promise<Response> {
  // For now, return info about WebSocket endpoints
  return Response.json({
    message: 'WebSocket endpoints',
    endpoints: {
      agent: '/ws/agent/:id — Connect to specific agent',
      broadcast: '/ws/broadcast — Broadcast to all (coming soon)',
    },
    usage: 'Connect via WebSocket for real-time updates',
  });
}

// POST /agents/:id/call — Call a method on the agent DO
export async function callAgent(request: CoordinatorRequest, env: Env): Promise<Response> {
  const id = request.params?.id;
  if (!id) {
    return Response.json({ error: 'Missing agent id' }, { status: 400 });
  }

  const body = await request.json() as { method: string; args?: any };

  // Get the Durable Object stub
  const agentId = env.AgentDO.idFromName(id);
  const stub = env.AgentDO.get(agentId) as any;

  // Call the method
  const result = await stub[body.method](body.args ?? {});

  return Response.json({ result });
}
