// Sub-Agent Handlers — Spawn and manage child agents
import type { CoordinatorRequest, Env } from '../types';
import { spawnSubAgent, getSubAgents } from '../coordinator';

// POST /agents/:id/spawn — Spawn a sub-agent
export async function spawn(request: CoordinatorRequest, env: Env): Promise<Response> {
  const parentId = request.params?.id;
  if (!parentId) {
    return Response.json({ error: 'Missing parent agent id' }, { status: 400 });
  }

  const body = await request.json() as any;

  if (!body.name || !body.role) {
    return Response.json(
      { error: 'Missing required fields: name, role' },
      { status: 400 },
    );
  }

  try {
    const subAgent = await spawnSubAgent(env, parentId, {
      name: body.name,
      role: body.role,
      capabilities: body.capabilities ?? [],
    });

    return Response.json({
      message: 'Sub-agent spawned',
      subAgent,
      instructions: {
        websocket: `GET /ws/agent/${subAgent.id} — Real-time updates`,
        heartbeat: `POST /agents/${subAgent.id}/heartbeat`,
      },
    }, { status: 201 });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

// GET /agents/:id/subagents — List sub-agents
export async function listSubAgents(request: CoordinatorRequest, env: Env): Promise<Response> {
  const parentId = request.params?.id;
  if (!parentId) {
    return Response.json({ error: 'Missing parent agent id' }, { status: 400 });
  }

  const subAgents = await getSubAgents(env, parentId);

  return Response.json({
    parentId,
    subAgents,
    count: subAgents.length,
  });
}
