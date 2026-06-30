// Dashboard Handler — Human-facing overview
import type { CoordinatorRequest, Env } from '../types';
import { getStats, getAllAgents, getAllTasks } from '../coordinator';

export async function dashboard(request: CoordinatorRequest, env: Env): Promise<Response> {
  const stats = await getStats(env);
  const agents = await getAllAgents(env);
  const tasks = await getAllTasks(env);

  // Agent cards
  const agentCards = agents.slice(0, 10).map(a => `
    <div class="agent-card">
      <div class="agent-name">${a.name}</div>
      <div class="agent-role">${a.role}</div>
      <span class="status status--${a.status}">${a.status}</span>
    </div>
  `).join('');

  // Recent tasks
  const taskRows = tasks.slice(-10).reverse().map(t => {
    const done = t.subtasks.filter(s => s.status === 'completed').length;
    return `
      <tr>
        <td><a href="/tasks/${t.id}">${t.title}</a></td>
        <td><span class="status status--${t.status}">${t.status}</span></td>
        <td>${done}/${t.subtasks.length}</td>
      </tr>
    `;
  }).join('');

  // Agent instructions
  const instructions = `
## 1. Register
POST /agents/register
{ "name": "my-agent", "role": "researcher", "capabilities": ["search"] }

## 2. Pick task
GET /tasks/pick?role=researcher&agentId=YOUR_ID

## 3. Submit result
POST /tasks/result
{ "subtaskId": "...", "result": "..." }

## 4. Heartbeat
POST /agents/YOUR_ID/heartbeat
`;

  return new Response(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Multi-Agent Coordinator</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; background: #0a0a0a; color: #fafafa; }
    .container { max-width: 1000px; margin: 0 auto; padding: 2rem; }
    h1 { font-size: 2.5rem; font-weight: 100; letter-spacing: 0.3em; margin-bottom: 0.5rem; }
    .subtitle { color: #888; margin-bottom: 2rem; font-size: 0.9rem; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 2rem; }
    .card { background: #111; border: 1px solid #222; border-radius: 8px; padding: 1.5rem; text-align: center; }
    .card .label { font-size: 0.75rem; color: #888; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 0.5rem; }
    .card .value { font-size: 2.5rem; font-weight: 100; }
    .section { margin-bottom: 2rem; }
    .section h2 { font-size: 1rem; font-weight: 400; color: #888; margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 0.1em; }
    .agents-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 0.75rem; }
    .agent-card { background: #111; border: 1px solid #222; border-radius: 8px; padding: 1rem; }
    .agent-name { font-weight: 500; margin-bottom: 0.25rem; }
    .agent-role { font-size: 0.8rem; color: #888; margin-bottom: 0.5rem; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid #222; }
    th { color: #888; font-weight: 400; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.1em; }
    td { font-size: 0.9rem; }
    .status { padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.8rem; }
    .status--idle { background: #1a3a1a; color: #4ade80; }
    .status--working { background: #3a3a1a; color: #facc15; }
    .status--pending { background: #1a1a3a; color: #60a5fa; }
    .status--assigned { background: #3a2a1a; color: #fb923c; }
    .status--completed { background: #1a3a1a; color: #4ade80; }
    a { color: #60a5fa; text-decoration: none; }
    a:hover { text-decoration: underline; }
    pre { background: #111; border: 1px solid #222; border-radius: 8px; padding: 1.5rem; overflow-x: auto; font-size: 0.85rem; line-height: 1.6; }
    code { font-family: 'SF Mono', 'Fira Code', monospace; }
    .links { display: flex; gap: 1rem; margin-bottom: 2rem; flex-wrap: wrap; }
    .links a { background: #111; border: 1px solid #222; padding: 0.5rem 1rem; border-radius: 4px; }
    .links a:hover { border-color: #60a5fa; background: #0a0a1a; }
  </style>
</head>
<body>
  <div class="container">
    <h1>COORDINATOR</h1>
    <p class="subtitle">Multi-Agent Task Coordination — Nesa Example</p>

    <div class="links">
      <a href="/agents">Agents</a>
      <a href="/tasks">Tasks</a>
      <a href="/status">Status (JSON)</a>
      <a href="/logs">Logs</a>
    </div>

    <div class="grid">
      <div class="card">
        <div class="label">Agents</div>
        <div class="value">${stats.agents.total}</div>
      </div>
      <div class="card">
        <div class="label">Working</div>
        <div class="value" style="color: #facc15;">${stats.agents.working}</div>
      </div>
      <div class="card">
        <div class="label">Tasks</div>
        <div class="value">${stats.tasks.total}</div>
      </div>
      <div class="card">
        <div class="label">Completed</div>
        <div class="value" style="color: #4ade80;">${stats.tasks.completed}</div>
      </div>
    </div>

    ${agents.length > 0 ? `
    <div class="section">
      <h2>Recent Agents</h2>
      <div class="agents-grid">${agentCards}</div>
    </div>
    ` : ''}

    ${tasks.length > 0 ? `
    <div class="section">
      <h2>Recent Tasks</h2>
      <table>
        <thead><tr><th>Title</th><th>Status</th><th>Subtasks</th></tr></thead>
        <tbody>${taskRows}</tbody>
      </table>
    </div>
    ` : ''}

    <div class="section">
      <h2>Agent Protocol</h2>
      <pre><code>${instructions.trim()}</code></pre>
    </div>
  </div>
</body>
</html>
  `, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
}
