# Conventions

## Naming

- Files: `kebab-case.ts` (e.g., `agent-detect.ts`, `rate-limit.ts`)
- Types: `PascalCase` (e.g., `BugeishaRequest`, `Env`)
- Functions: `camelCase` (e.g., `home`, `health`, `detectAgent`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `API_KEY`, `CORS_ORIGIN`)
- Test files: `*.test.ts` in `__tests__/` directory

## Structure

- Handlers go in `src/handlers/`
- Middleware goes in `src/middleware/`
- Types go in `src/types.ts`
- Tests go in `src/__tests__/`

## Code Style

- TypeScript strict mode always
- No `any` types — use proper type definitions
- No decorators — explicit route registration only
- No global state — everything goes through `env`
- Explicit imports — no barrel exports that hide dependencies

## Error Handling

- Middleware returns `Response` to stop the pipeline (e.g., 401, 403, 429)
- Handlers return `Response` directly — no try/catch needed (itty-router handles errors)
- Use `error()` from itty-router for error responses

## Testing

- Mock `env` with `createMockEnv()` helper
- Mock `request` with `createMockRequest()` helper
- Test both agent (JSON) and human (HTML) responses when applicable
- Keep tests inline and readable — no test frameworks beyond vitest

## Documentation

- AGENTS.md — Entry point for all agents
- docs/architecture.md — How it works internally
- docs/conventions.md — This file
- tasks/ — Current work and backlog
