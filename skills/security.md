# Skill: security

CORS, rate limiting, JWT auth — security primitives for edge APIs.

```ts
// CORS: handle OPTIONS preflight, add Access-Control-Allow-Origin
// Rate limit: track requests per IP in Map, return 429 on exceeded
// JWT: sign/verify with Web Crypto API, no dependencies (~2KB)
export function cors(request: Request): Response | void { /* OPTIONS → 204 */ }
export function rateLimit(max = 100, windowMs = 60_000) { /* per-IP counter */ }
export async function signJWT(payload: object, secret: string): Promise<string> { /* HMAC-SHA256 */ }
```

CORS: replace `*` with specific origins in production. Rate limit: in-memory per-isolate (use KV for distributed). JWT: store secret via `wrangler secret put`.
