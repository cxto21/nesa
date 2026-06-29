# Skill: storage

KV for fast reads, D1 for relational data — Cloudflare edge persistence.

```ts
// KV: eventual consistency, great for cache/sessions
await env.CACHE.get('key'); // string | null
await env.CACHE.put('key', 'value', { expirationTtl: 3600 });

// D1: strong consistency, SQL queries
const { results } = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(id).all();
```

KV: use for rate limits, sessions, cached responses, feature flags. D1: use for user data, task history, relational queries. KV is eventually consistent (~60s propagation).
