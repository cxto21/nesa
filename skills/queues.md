# Skill: queues

Race condition prevention via Cloudflare Queues. Offload writes, process sequentially.

```ts
// wrangler.toml: [queues] binding = "QUEUE" queue = "nesa-queue"
// Send to queue: await env.QUEUE.send({ action: 'update', id: '123', data: {...} })
// Consumer: async queue(batch, env) { for (const msg of batch.messages) { /* process */ } }
```

Use for: concurrent writes to D1/KV, batch processing, rate-limited API calls, ordered operations. Don't use for: simple reads, low-latency responses, single-request logic. Queue consumer runs in a separate Worker — no concurrency conflicts.
