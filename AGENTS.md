# AGENTS.md — Bugeisha 🪆

Ultra-light agent-native micro-framework for Cloudflare Workers. ~200 LOC. TypeScript + Itty Router v5.

## Qué hace

APIs que sirven a dos públicos: **humanos** (HTML) y **agentes IA** (JSON). Misma ruta, distinta respuesta. Sin magia, sin decoradores.

## Cómo levantarlo

```bash
npm install
npm run dev        # localhost:8787
npm test           # 26 tests (vitest)
```

## Dónde está cada cosa

```
src/
├── index.ts          # Entry point + exports
├── router.ts         # createBugeisha() + middleware pipeline
├── types.ts          # Env, BugeishaRequest, BugeishaHandler
├── middleware/        # agent-detect, auth, cors, rate-limit
└── handlers/         # home, health, agent, agent-tools, robots, llms, sitemap

examples/
└── multi-agent-coordinator/   # Ejemplo completo con DO + WebSocket

skills/               # Guías, no código (14 skills)
```

## Reglas de estilo

- TypeScript strict mode
- Rutas explícitas (no decoradores, no magia)
- Middleware retorna `Response` para parar, `void` para continuar
- Siempre bind: `export default { fetch: router.fetch.bind(router) }`
- Handlers puros: `(request, env) => Response`
- Nada que no sea Itty Router como dependencia core

## Archivos que nunca modificar

- `src/router.ts` — Lógica central del framework
- `src/types.ts` — Tipos compartidos
- `wrangler.toml` — Config de Cloudflare Workers
- `package.json` — Dependencias

## Cómo ejecutar tests

```bash
npm test                    # Todos
npm run test:watch          # Watch mode
npm test -- middleware       # Solo middleware
npm test -- handlers        # Solo handlers
```

Tests usan mocks inline ligeros. No instalar dependencias extras para testear.

## Qué documentación leer primero

1. **este archivo** — visión general
2. `docs/architecture.md` — cómo funciona internamente
3. `docs/conventions.md` — naming, estructura, patrones
4. `src/types.ts` — tipos disponibles

## Gotchas

- `request.url` es string, no URL — usar `new URL(request.url)` para searchParams
- Rate limit es por-isolate — usar KV/D1 para producción
- Agent detection es best-effort — agentes pueden spoofear User-Agent
- KV es eventualmente consistente (~60s) — D1 para consistencia fuerte
