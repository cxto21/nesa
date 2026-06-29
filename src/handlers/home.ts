import type { NesaRequest, Env } from '../types';

// Home handler — returns JSON or HTML based on agent type
export function home(request: NesaRequest, env: Env): Response {
  const isAgent = request.agentType === 'ai';

  if (isAgent) {
    // Machine-readable response for AI agents
    return Response.json({
      name: 'nesa',
      version: '0.1.0',
      description: 'Ultra-light agent-native micro-framework for Cloudflare Workers',
      philosophy: 'Extreme minimalism. Explicit routes. No magic. Linear flow.',
      capabilities: ['routing', 'middleware', 'agent-detection', 'ai-endpoints'],
      endpoints: {
        health: '/health',
        robots: '/robots.txt',
        agent: '/agent/info',
        tools: '/agent/tools',
      },
      agentInstructions: 'This is an agent-optimized endpoint. Use /agent/info for capabilities, /agent/tools for tool definitions.',
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-Agent-Optimized': 'true',
      },
    });
  }

  // Human-readable response
  return new Response(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nesa</title>
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
    .links { margin-top: 2rem; display: flex; gap: 1rem; justify-content: center; }
    a { color: #fafafa; text-decoration: none; border: 1px solid #333; padding: 0.5rem 1rem; border-radius: 4px; }
    a:hover { border-color: #fafafa; }
  </style>
</head>
<body>
  <div class="container">
    <h1>NESA</h1>
    <p>Ultra-light agent-native micro-framework for Cloudflare Workers.</p>
    <p style="margin-top: 0.5rem; color: #666;">Extreme minimalism. Explicit routes. No magic. Linear flow.</p>
    <div class="links">
      <a href="/health">Health</a>
      <a href="/robots.txt">Robots</a>
      <a href="/agent/info">Agent Info</a>
    </div>
  </div>
</body>
</html>
  `, {
    headers: { 'Content-Type': 'text/html;charset=UTF-8' },
  });
}
