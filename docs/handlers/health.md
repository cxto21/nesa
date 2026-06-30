# Health Handler

**Health handler** provides system status at `/health` for monitoring and load balancers.

## Why Health Check?

Production APIs need:

- **Uptime monitoring** — Know if your API is responding
- **Load balancer checks** — Route traffic away from unhealthy instances
- **Debugging** — See memory usage and response times
- **Alerting** — Trigger alerts when health fails

## Usage

```typescript
import { healthHandler } from '../handlers/health'

router.get('/health', healthHandler)
```

## Response

```json
{
  "status": "healthy",
  "timestamp": "2026-06-30T12:00:00.000Z",
  "uptime": 86400,
  "memory": {
    "used": 15.2,
    "limit": 128
  },
  "version": "1.0.0"
}
```

## Response Fields

| Field | Description |
|-------|-------------|
| `status` | `healthy` or `unhealthy` |
| `timestamp` | Current ISO timestamp |
| `uptime` | Seconds since Worker started |
| `memory.used` | MB of memory used |
| `memory.limit` | MB of memory available |
| `version` | API version from package.json |

## Custom Health Checks

Add your own health checks:

```typescript
router.get('/health', async (request: BugeishaRequest, env: Env) => {
  const checks = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      database: await checkDatabase(env),
      cache: await checkCache(env),
      externalApi: await checkExternalApi()
    }
  }

  const allHealthy = Object.values(checks.checks).every(c => c.status === 'ok')
  checks.status = allHealthy ? 'healthy' : 'unhealthy'

  return Response.json(checks, {
    status: allHealthy ? 200 : 503
  })
})
```

## Gotcha

**Always return 200 for healthy.** Load balancers expect 200 for healthy, non-200 for unhealthy. Don't return 500 for health failures — return 503 (Service Unavailable).