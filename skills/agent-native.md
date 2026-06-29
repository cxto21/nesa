# Skill: agent-native

Agent detection, dual responses, robots.txt, AGENTS.md — agent optimization.

```ts
// Detect AI/bot/human from User-Agent
const ua = request.headers.get('User-Agent')?.toLowerCase() ?? '';
const isAI = ['openai','gpt','claude','anthropic'].some(p => ua.includes(p));

// Dual response: JSON for agents, HTML for humans
if (isAI) return Response.json({ service, capabilities });
return new Response(html, { headers: { 'Content-Type': 'text/html' } });
```

Set `X-Agent-Optimized: true` header for AI responses. Robots.txt: include GPTBot, ClaudeBot directives. AGENTS.md: document endpoints, auth, capabilities.
