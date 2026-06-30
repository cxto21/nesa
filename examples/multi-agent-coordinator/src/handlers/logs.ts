// Logs Handler — View API interactions
import type { CoordinatorRequest, Env } from '../types';

export async function getLogs(env: Env, limit = 50): Promise<any[]> {
  const store = (env as any).LOGS ?? (env as any).STATE;
  const logs: any[] = await store.get('logs', 'json') ?? [];
  return logs.slice(-limit).reverse(); // newest first
}

export async function logs(request: CoordinatorRequest, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') ?? '50', 10);
  const logEntries = await getLogs(env, limit);

  if (request.agentType === 'ai') {
    return Response.json({
      logs: logEntries,
      count: logEntries.length,
      filters: {
        limit: `?limit=${limit}`,
        path: `?path=/agents/register`,
        agent: `?agentType=ai`,
      },
    }, {
      headers: { 'X-Agent-Optimized': 'true' },
    });
  }

  // Human: HTML
  const rows = logEntries.map(l => `
    <tr>
      <td>${new Date(l.timestamp).toLocaleTimeString()}</td>
      <td><span class="method method--${l.method.toLowerCase()}">${l.method}</span></td>
      <td><code>${l.path}</code></td>
      <td><span class="status status--${l.agentType}">${l.agentType}</span></td>
      <td><span class="http http--${l.status < 400 ? 'ok' : 'err'}">${l.status}</span></td>
      <td>${l.duration}ms</td>
      <td>${l.ip}</td>
    </tr>
  `).join('');

  return new Response(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Logs</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; background: #0a0a0a; color: #fafafa; }
    .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
    h1 { font-size: 2rem; font-weight: 100; letter-spacing: 0.2em; margin-bottom: 0.5rem; }
    .subtitle { color: #888; margin-bottom: 2rem; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 2rem; }
    th, td { padding: 0.5rem 0.75rem; text-align: left; border-bottom: 1px solid #222; font-size: 0.85rem; }
    th { color: #888; font-weight: 400; text-transform: uppercase; font-size: 0.7rem; letter-spacing: 0.1em; }
    .method { padding: 0.15rem 0.5rem; border-radius: 3px; font-size: 0.75rem; font-weight: 600; }
    .method--get { background: #1a3a1a; color: #4ade80; }
    .method--post { background: #1a1a3a; color: #60a5fa; }
    .status { padding: 0.15rem 0.5rem; border-radius: 3px; font-size: 0.75rem; }
    .status--ai { background: #3a1a3a; color: #c084fc; }
    .status--human { background: #1a3a3a; color: #67e8f9; }
    .status--unknown { background: #2a2a2a; color: #888; }
    .http { padding: 0.15rem 0.5rem; border-radius: 3px; font-size: 0.75rem; }
    .http--ok { background: #1a3a1a; color: #4ade80; }
    .http--err { background: #3a1a1a; color: #f87171; }
    a { color: #60a5fa; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .back { display: inline-block; margin-top: 1rem; color: #888; }
    code { font-family: 'SF Mono', 'Fira Code', monospace; }
    .empty { color: #666; padding: 2rem; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <h1>API LOGS</h1>
    <p class="subtitle">${logEntries.length} interaction(s) logged</p>
    ${logEntries.length > 0 ? `
    <table>
      <thead>
        <tr><th>Time</th><th>Method</th><th>Path</th><th>Agent</th><th>Status</th><th>Duration</th><th>IP</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    ` : '<p class="empty">No interactions logged yet.</p>'}
    <a href="/dashboard" class="back">← Dashboard</a>
  </div>
</body>
</html>
  `, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
}
