# Nesa

**Ultra-light agent-native micro-framework for Cloudflare Workers.**

*Inspired by Parina PHP. Built fresh for the edge.*

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cxto21/nesa)

---

## Philosophy

**Extreme minimalism. Explicit routes. No magic. Linear flow.**

Nesa takes Parina's core principles — clarity over abstraction, control over convenience — and rebuilds them for Cloudflare Workers with Itty Router.

---

## Architecture in 10 Lines

1. Request enters via Cloudflare Workers fetch handler.
2. Itty Router matches the route.
3. Middleware pipeline runs (`before` hooks).
4. Agent detection identifies AI/bot/human.
5. CORS handles preflight.
6. Rate limiting protects endpoints.
7. Handler executes core logic.
8. Response transforms run (`finally` hooks).
9. JSON serialization for API responses.
10. Edge response in microseconds.

---

## Quick Start

```bash
cd nesa
npm install
npm run dev
```

---

## Usage

### Minimal (default router)

```ts
// src/index.ts
export { default } from './router';
```

### Custom router

```ts
import { createNesa } from './router';
import { auth } from './middleware';

const router = createNesa({
  base: '/api',
  middlewares: [auth],
});

router.get('/protected', ProtectedHandler);
export default { fetch: router.fetch.bind(router) };
```

---

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Home — JSON for agents, HTML for humans |
| GET | `/health` | Health check |
| GET | `/robots.txt` | Agent-aware robots.txt |
| GET | `/agent/info` | Service capabilities |
| GET | `/agent/tools` | Tool definitions for AI function calling |

---

## Agent-Native Features

- **Agent Detection**: Identifies AI agents, bots, and humans via User-Agent
- **Dual Responses**: JSON for agents, HTML for humans on the same route
- **Tool Definitions**: OpenAI-compatible function calling format at `/agent/tools`
- **Robots.txt**: AI-specific directives for GPTBot, ClaudeBot, Anthropic-AI

---

## Middleware

| Middleware | Description |
|------------|-------------|
| `detectAgent` | Identifies AI/bot/human from User-Agent |
| `cors` | Handles CORS preflight (OPTIONS) |
| `rateLimit` | In-memory rate limiting (per-isolate) |
| `auth` | Bearer token authentication |

---

## Skills

8 minimal skills in `/skills/` — guides, not code:

| Skill | Description |
|-------|-------------|
| `core` | Router + middleware pipeline |
| `security` | CORS, rate limiting, JWT auth |
| `agent-native` | Agent detection, dual responses, robots.txt, AGENTS.md |
| `storage` | KV + D1 persistence |
| `devex` | Logger, errors, env config |
| `protocols` | MCP + x402 integrations |
| `devops` | Testing + deployment |
| `static-assets` | Serve static files |

---

## Examples

Ready-to-deploy example apps:

| Example | Description | Deploy |
|---------|-------------|--------|
| [Multi-Agent Coordinator](examples/multi-agent-coordinator/) | Coordinate multiple AI agents to complete complex tasks | [![Deploy](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cxto21/nesa/tree/main/examples/multi-agent-coordinator) |

---

## License

MIT
