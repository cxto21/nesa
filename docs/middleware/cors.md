# CORS Middleware

**CORS middleware** handles Cross-Origin Resource Sharing for your Bugeisha API. It's explicit and per-handler, not global.

## Why Explicit CORS?

Most frameworks add CORS globally. Bugeisha makes it explicit because:

- **Security** — Only add CORS where you actually need it
- **Clarity** — See exactly which endpoints allow cross-origin requests
- **Flexibility** — Different origins for different handlers
- **No surprises** — No hidden middleware affecting all routes

## Configuration

CORS is configured via environment variables:

```bash
# wrangler.toml
[vars]
CORS_ORIGIN = "https://yourdomain.com"
```

## Usage

```typescript
import { addCorsHeaders } from '../middleware/cors'

export const homeHandler = async (request: BugeishaRequest, env: Env) => {
  const response = new Response('Hello')
  return addCorsHeaders(request, response, env)
}
```

## Options Pre-flight

For `POST`, `PUT`, `DELETE` requests, browsers send an OPTIONS request first. Handle it like this:

```typescript
import { handleOptions } from '../middleware/cors'

// Add OPTIONS route before other routes
router.options('*', handleOptions)

// Your other routes
router.get('/', homeHandler)
```

## Integration with Auth

When using both CORS and Auth:

```typescript
import { addCorsHeaders } from '../middleware/cors'
import { auth } from '../middleware/auth'

router.get('/protected', async (request: BugeishaRequest, env: Env) => {
  // Auth first
  const authError = await auth()(request, env)
  if (authError) return authError

  // Then CORS
  const response = new Response('Protected data')
  return addCorsHeaders(request, response, env)
})
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CORS_ORIGIN` | Allowed origin(s) | `*` |
| `CORS_METHODS` | Allowed methods | `GET, POST, PUT, DELETE, OPTIONS` |
| `CORS_HEADERS` | Allowed headers | `Content-Type, Authorization` |

## Gotcha

**Per-handler, not global.** Each handler that needs CORS must call `addCorsHeaders()` explicitly. This is intentional — it keeps CORS visible and controllable.