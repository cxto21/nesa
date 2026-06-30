// Agent Handlers — Registration, listing, heartbeat
import type { CoordinatorRequest, Env } from '../types';
import {
  registerAgent,
  getAgent,
  getAllAgents,
  updateAgentStatus,
} from '../coordinator';

// POST /agents/register — Register a new agent
export async function register(request: CoordinatorRequest, env: Env): Promise<Response> {
  const body = await request.json() as any;

  if (!body.name || !body.role) {
    return Response.json(
      { error: 'Missing required fields: name, role' },
      { status: 400 },
    );
  }

  const agent = await registerAgent(env, {
    name: body.name,
    role: body.role,
    capabilities: body.capabilities ?? [],
  });

  return Response.json({
    message: 'Agent registered',
    agent,
    instructions: {
      pickTask: `GET /tasks/pick?role=${agent.role}`,
      submitResult: `POST /tasks/result`,
      heartbeat: `POST /agents/${agent.id}/heartbeat`,
    },
  }, { status: 201 });
}

// GET /agents — List all agents
export async function list(request: CoordinatorRequest, env: Env): Promise<Response> {
  const allAgents = await getAllAgents(env);

  if (request.agentType === 'ai') {
    return Response.json({
      agents: allAgents,
      count: allAgents.length,
    });
  }

  // Human: HTML
  const rows = allAgents.map(a => `
    <tr>
      <td><code>${a.id.slice(0, 8)}</code></td>
      <td>${a.name}</td>
      <td>${a.role}</td>
      <td>${a.capabilities.join(', ')}</td>
      <td><span class="status status--${a.status}">${a.status}</span></td>
      <td>${new Date(a.registeredAt).toLocaleString()}</td>
    </tr>
  `).join('');

  return new Response(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Registered Agents</title>
  <style>${dashboardStyles()}</style>
</head>
<body>
  <div class="container">
    <h1>Registered Agents</h1>
    <p class="subtitle">${allAgents.length} agent(s) registered</p>
    <table>
      <thead>
        <tr><th>ID</th><th>Name</th><th>Role</th><th>Capabilities</th><th>Status</th><th>Registered</th></tr>
      </thead>
      <tbody>${rows || '<tr><td colspan="6">No agents registered</td></tr>'}</tbody>
    </table>
    <a href="/dashboard" class="back">← Dashboard</a>
  </div>
</body>
</html>
  `, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
}

// POST /agents/:id/heartbeat — Agent heartbeat
export async function heartbeat(request: CoordinatorRequest, env: Env): Promise<Response> {
  const id = request.params?.id;
  if (!id) {
    return Response.json({ error: 'Missing agent id' }, { status: 400 });
  }

  const agent = await getAgent(env, id);
  if (!agent) {
    return Response.json({ error: 'Agent not found' }, { status: 404 });
  }

  await updateAgentStatus(env, id, agent.status);
  return Response.json({ ok: true, status: agent.status });
}

// ─── Shared Styles ──────────────────────────────────────
function dashboardStyles(): string {
  return `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; background: #0a0a0a; color: #fafafa; }
    .container { max-width: 1000px; margin: 0 auto; padding: 2rem; }
    h1 { font-size: 2rem; font-weight: 100; letter-spacing: 0.2em; margin-bottom: 0.5rem; }
    .subtitle { color: #888; margin-bottom: 2rem; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 2rem; }
    th, td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid #222; }
    th { color: #888; font-weight: 400; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.1em; }
    td { font-size: 0.9rem; }
    .status { padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.8rem; }
    .status--idle { background: #1a3a1a; color: #4ade80; }
    .status--working { background: #3a3a1a; color: #facc15; }
    .status--offline { background: #3a1a1a; color: #f87171; }
    .status--pending { background: #1a1a3a; color: #60a5fa; }
    .status--assigned { background: #3a2a1a; color: #fb923c; }
    .status--completed { background: #1a3a1a; color: #4ade80; }
    .status--failed { background: #3a1a1a; color: #f87171; }
    a { color: #60a5fa; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .back { display: inline-block; margin-top: 1rem; color: #888; }
    .card { background: #111; border: 1px solid #222; border-radius: 8px; padding: 1.5rem; margin-bottom: 1rem; }
    .card h2 { font-size: 1rem; font-weight: 400; color: #888; margin-bottom: 0.5rem; }
    .card .value { font-size: 2rem; font-weight: 100; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
    pre { background: #111; border: 1px solid #222; border-radius: 4px; padding: 1rem; overflow-x: auto; font-size: 0.85rem; }
    code { font-family: 'SF Mono', 'Fira Code', monospace; }
  `;
}
