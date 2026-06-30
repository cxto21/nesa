# Architecture

## Overview

Bugeisha is a middleware-based router for Cloudflare Workers. The entire framework is ~200 LOC.

## Request Flow

```
Request
  → Itty Router
    → agent-detect (identifies AI/bot/human)
    → custom middleware (auth, cors, rate-limit)
    → handler
      → isAgent? JSON : HTML
    → Response
```

## Core Components

### Router (`src/router.ts`)

- `createBugeisha(options?)` — Creates router with middleware pipeline
- `router.fetch.bind(router)` — Must bind `fetch` to router (Cloudflare Workers requirement)

### Types (`src/types.ts`)

- `Env` — Cloudflare Workers environment bindings (KV, DO, env vars)
- `BugeishaRequest` — Request with `isAgent: boolean` flag
- `BugeishaHandler` — `(request: BugeishaRequest, env: Env) => Response`
- `BugeishaMiddleware` — `(request: BugeishaRequest, env: Env) => Response | void`

### Middleware (`src/middleware/`)

Each middleware follows the same pattern:
1. Receive request
2. Check condition
3. Return `Response` to STOP (error, redirect, etc.)
4. Return `void` to CONTINUE to next middleware/handler

### Handlers (`src/handlers/`)

Handlers are pure functions. They receive a request and env, return a Response.

**Dual response pattern:**
```typescript
export const home = (request: BugeishaRequest, env: Env) => {
  if (request.isAgent) {
    return Response.json({ name: 'bugeisha' })
  }
  return new Response('<html>...</html>')
}
```

## Cloudflare Bindings

- `STATE` — KV namespace for agent/task state
- `LOGS` — KV namespace for activity logs
- `AgentDO` — Durable Object for stateful agents (optional)

## Files Never to Modify

- `src/router.ts` — Core logic
- `src/types.ts` — Shared types
- `wrangler.toml` — Cloudflare config
- `package.json` — Dependencies
