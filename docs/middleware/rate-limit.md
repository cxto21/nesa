# Rate Limit Middleware

**Rate limit middleware** prevents abuse by limiting requests per client. Uses in-memory storage for simplicity.

## Why Rate Limit?

APIs are targets for abuse:

- **DDoS protection** — Block excessive requests
- **Fair usage** — Prevent single clients from monopolizing resources
- **Cost control** — Workers have usage limits
- **Stability** — Protect your database and external APIs

## Configuration

```typescript
import { createRateLimiter } from '../middleware/rate-limit'

// Create limiter with custom options
const limiter = createRateLimiter({
  windowMs: 60 * 1000,  // 1 minute window
  max: 100,              // 100 requests per window
  keyGenerator: (req) => req.headers.get('cf-connecting-ip') || 'unknown'
})
```

## Usage

```typescript
import { createRateLimiter } from '../middleware/rate-limit'

const limiter = createRateLimiter({ windowMs: 60000, max: 100 })

router.get('/api/data', async (request: BugeishaRequest, env: Env) => {
  // Check rate limit
  const error = await limiter(request, env)
  if (error) return error

  // Proceed with handler
  return new Response('Data')
})
```

## Response Headers

The limiter adds standard headers:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 75
X-RateLimit-Reset: 1625097600
Retry-After: 30  # Only on 429 responses
```

## Error Response

When rate limit exceeded:

```json
{
  "error": "rate_limit_exceeded",
  "message": "Too many requests. Please try again later.",
  "retryAfter": 30
}
```

## Production Considerations

⚠️ **In-memory is per-isolate.** If you run multiple Worker instances, each has its own memory. For distributed rate limiting:

- Use **KV** for eventually consistent limits
- Use **D1** for strong consistency
- Use **Cloudflare Rate Limiting** (built-in feature)

## Gotcha

**Per-isolate memory.** In-memory rate limiting works for single-instance deployments. For production with multiple isolates, you need distributed storage (KV/D1) or Cloudflare's built-in Rate Limiting.