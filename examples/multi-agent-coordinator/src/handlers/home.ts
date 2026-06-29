// Home Handler — JSON for agents, HTML for humans
import type { CoordinatorRequest, Env } from '../types';

export function home(request: CoordinatorRequest, env: Env): Response {
  if (request.agentType === 'ai') {
    return Response.json({
      service: 'multi-agent-coordinator',
      description: 'Coordinate multiple AI agents to complete complex tasks',
      capabilities: [
        'Agent registration with roles and capabilities',
        'Task decomposition into subtasks',
        'Automatic subtask assignment by role',
        'Result collection and assembly',
        'Real-time status tracking',
      ],
      endpoints: {
        dashboard: 'GET /dashboard (HTML for humans)',
        status: 'GET /status (JSON for agents)',
        register: 'POST /agents/register',
        createTask: 'POST /tasks/create',
        pickTask: 'GET /tasks/pick?role=<role>',
        submitResult: 'POST /tasks/result',
      },
      protocol: {
        step1: 'POST /agents/register { name, role, capabilities }',
        step2: 'GET /tasks/pick?role=<your-role>&agentId=<your-id>',
        step3: 'POST /tasks/result { subtaskId, result }',
        step4: 'POST /agents/:id/heartbeat (keep alive)',
      },
    }, {
      headers: { 'X-Agent-Optimized': 'true' },
    });
  }

  return new Response(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Multi-Agent Coordinator</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      display: flex; justify-content: center; align-items: center;
      min-height: 100vh;
      background: #0a0a0a; color: #fafafa;
    }
    .container { text-align: center; max-width: 600px; padding: 2rem; }
    h1 { font-size: 3rem; font-weight: 100; letter-spacing: 0.5em; margin-bottom: 1rem; }
    p { color: #888; line-height: 1.6; }
    .links { margin-top: 2rem; display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
    a { color: #fafafa; text-decoration: none; border: 1px solid #333; padding: 0.5rem 1rem; border-radius: 4px; }
    a:hover { border-color: #fafafa; }
  </style>
</head>
<body>
  <div class="container">
    <h1>COORDINATOR</h1>
    <p>Multi-Agent Task Coordination.</p>
    <p style="margin-top: 0.5rem; color: #666;">Decompose complex tasks. Assign to specialized agents. Assemble results.</p>
    <div class="links">
      <a href="/dashboard">Dashboard</a>
      <a href="/agents">Agents</a>
      <a href="/tasks">Tasks</a>
      <a href="/status">Status</a>
    </div>
  </div>
</body>
</html>
  `, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
}
