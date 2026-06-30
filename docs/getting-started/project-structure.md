# Project Structure

Bugeisha follows a clear, explicit structure. No magic folders, no hidden behavior.

## Directory layout

```
bugeisha/
├── src/
│   ├── index.ts              # Entry point + exports
│   ├── router.ts             # Core router with middleware pipeline
│   ├── types.ts              # TypeScript types
│   ├── middleware/
│   │   ├── agent-detect.ts   # AI/bot/human detection
│   │   ├── auth.ts           # Bearer token authentication
│   │   ├── cors.ts           # CORS preflight + helper
│   │   └── rate-limit.ts     # In-memory rate limiting
│   ├── handlers/
│   │   ├── home.ts           # Home (dual response)
│   │   ├── health.ts         # Health check
│   │   ├── agent.ts          # Agent info
│   │   ├── agent-tools.ts    # Tool definitions
│   │   ├── robots.ts         # Agent-aware robots.txt
│   │   ├── llms.ts           # Service description
│   │   └── sitemap.ts        # XML sitemap
│   └── __tests__/
│       ├── middleware.test.ts # Middleware tests
│       └── handlers.test.ts  # Handler tests
├── skills/                   # Reusable patterns
│   ├── core/
│   ├── security/
│   ├── agent-native/
│   └── ...
├── examples/
│   └── multi-agent-coordinator/  # Full example
├── docs/                     # MkDocs documentation
├── mkdocs.yml                # Documentation config
├── vitest.config.ts          # Test config
├── package.json
├── tsconfig.json
└── wrangler.toml             # Cloudflare config
```

## Key files

### `src/router.ts`

The heart of your Bugeisha app. Sets up the router with middleware pipeline:

```ts
import { Router, error, json } from 'itty-router';

const router = Router({
  before: [detectAgent, cors, rateLimit],  // Request middleware
  catch: (err) => error(err),              // Error handler
  finally: [json],                         // Response transforms
});

// Routes — explicit, no magic
router.get('/', home);
router.get('/health', health);
router.all('*', () => error(404, 'Not found'));

export default { fetch: router.fetch.bind(router) };
```

### `src/types.ts`

TypeScript types for your app:

```ts
export interface Env {
  // Bindings
  // CACHE: KVNamespace;
  // DB: D1Database;
  // AI: Ai;
}

export interface BugeishaRequest extends Request {
  agentType?: 'ai' | 'bot' | 'human';
  params?: Record<string, string>;
}

export type BugeishaHandler = (
  request: BugeishaRequest,
  env: Env,
  ctx: ExecutionContext,
) => Response | Promise<Response>;
```

### `src/middleware/`

Middleware functions that run before handlers:

- **agent-detect.ts** — Identifies AI, bots, and humans
- **auth.ts** — Bearer token validation (opt-in)
- **cors.ts** — CORS preflight handling
- **rate-limit.ts** — In-memory rate limiting

### `src/handlers/`

Route handlers that process requests:

- **home.ts** — Dual response (JSON/HTML)
- **health.ts** — Health check endpoint
- **agent.ts** — Agent info for AI consumers
- **agent-tools.ts** — Tool definitions for function calling

## Conventions

!!! info "Bugeisha conventions"

    - **Explicit routes** — No decorators, no magic, no hidden behavior
    - **Middleware returns Response to stop, void to continue**
    - **Always bind fetch** — `export default { fetch: router.fetch.bind(router) }`
    - **Dual response** — Same route, different output for agents vs humans
    - **Tests as pure functions** — Mock env and ctx, test handlers directly
