import type { NesaRequest, Env } from '../types';

// In-memory rate limiter (per-isolate, resets on cold start)
// For production, use KV or D1 for distributed rate limiting
const requests = new Map<string, number[]>();

interface RateLimitOptions {
  windowMs?: number;   // Time window in milliseconds (default: 60000 = 1min)
  max?: number;        // Max requests per window (default: 100)
  keyBy?: 'ip' | 'ua' | 'token'; // Rate limit key (default: 'ip')
}

export function rateLimit(options: RateLimitOptions = {}) {
  const { windowMs = 60_000, max = 100, keyBy = 'ip' } = options;

  return (request: NesaRequest, env: Env): Response | void => {
    // Get rate limit key
    let key: string;
    switch (keyBy) {
      case 'ip':
        key = request.headers.get('CF-Connecting-IP') ?? 'unknown';
        break;
      case 'ua':
        key = request.headers.get('User-Agent') ?? 'unknown';
        break;
      case 'token':
        key = request.headers.get('Authorization') ?? 'anonymous';
        break;
      default:
        key = request.headers.get('CF-Connecting-IP') ?? 'unknown';
    }

    const now = Date.now();
    const windowStart = now - windowMs;

    // Get existing requests for this key
    const existing = requests.get(key) ?? [];
    const recent = existing.filter(t => t > windowStart);

    if (recent.length >= max) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded', retryAfter: Math.ceil(windowMs / 1000) }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(Math.ceil(windowMs / 1000)),
          },
        },
      );
    }

    // Record this request
    recent.push(now);
    requests.set(key, recent);

    // Continue to handler
  };
}
