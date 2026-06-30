# Auth Middleware

**Auth middleware** provides opt-in Bearer token authentication for your Bugeisha routes. It supports custom validation functions and secure error responses.

## Why Use Auth Middleware?

Most Bugeisha endpoints should be **public** by default. Auth middleware is opt-in because:

- Public APIs (home, health, discoverability) should always be accessible
- Agents and bots need to reach your discovery endpoints
- Authentication can be added per-handler when needed
- Avoids global authentication complexity

## Key Features

- **Bearer token only** — No sessions, no cookies, no magic
- **Environment-based configuration** — `API_KEY` environment variable
- **Custom validation** — Use your own validation functions
- **Agent-friendly errors** — JSON responses for agents, friendly messages for humans  
- **Public route exclusion** — Skip auth for `/health`, `/robots.txt`, etc.

## Configuration

```ts
import { auth } from './middleware/auth';

// Configure auth middleware
const router = Router({
  finally: [auth({
    publicPaths: ['/health', '/robots.txt', '/llms.txt'],
    headerName: 'Authorization'
  })]
});
```

## How It Works

1. **Check if API_KEY exists** in environment
2. **Skip auth** if not configured (permissive by default)
3. **Validate Authorization header** (Bearer token)
4. **Compare tokens** with configured API_KEY
5. **Continue** or return **401/403 error**

## Implementation

### Basic Usage

```ts
import { Router } from 'itty-router';
import { auth } from './middleware/auth';

const router = Router({
  finally: [auth()]
});

// Public route - no auth needed
router.get('/health', () => Response.json({ status: 'ok' }));

// Protected route - requires API_KEY
router.get('/api/data', (request, env) => {
  return Response.json({ data: 'secret' });
});
```

### With Custom Validation

```ts
import jwt from 'jsonwebtoken';

const router = Router({
  finally: [auth({
    publicPaths: ['/health', '/docs']
  })]
});

router.get('/api/protected', async (request, env) => {
  // Your business logic here
  return Response.json({ user: 'authenticated' });
});
```

## Error Responses

### For Agents (JSON)

```json
{
  "error": "Missing Authorization header"
}
```

### For Humans (HTML)

```html
<!DOCTYPE html>
<html>
<head><title>Authentication Required</title></head>
<body>
  <h1>Authentication Required</h1>
  <p>Please provide a valid API key in the Authorization header.</p>
</body>
</html>
```

## Integration with Other Middleware

### Combined Pipeline

```ts
import { auth } from './middleware/auth';
import { cors } from './middleware/cors';
import { rateLimit } from './middleware/rate-limit';

const router = Router({
  finally: [
    auth({
      publicPaths: ['/health', '/robots.txt', '/llms.txt']
    }),
    cors,
    rateLimit({
      windowMs: 60000,
      max: 100,
      keyBy: 'ip'
    })
  ]
});
```

### Per-Handler Auth

```ts
import { auth } from './middleware/auth';

// Global auth middleware
const router = Router({
  finally: [auth()]
});

// Make a specific route public
router.get('/public-endpoint', auth({ publicPaths: [''] }), (request, env) => {
  return Response.json({ public: true });
});
```

## Security Considerations

### Token Storage

```env
# Environment variable
API_KEY=your-secret-api-key-here
```

### Token Rotation

```ts
export function auth(options: AuthOptions = {}) {
  const {
    headerName = 'Authorization',
    publicPaths = ['/health', '/robots.txt', '/llms.txt', '/sitemap.xml']
  } = options;

  return async (request: BugeishaRequest, env: Env): Response | void => {
    // Check for API_KEY in environment
    const apiKey = (env as any).API_KEY;
    if (!apiKey) return; // No auth configured

    // Your token validation logic
    // Implement token rotation logic here
    // Allow old tokens for grace period if needed
  };
}
```

### Rate Limiting Auth

```ts
import { auth } from './middleware/auth';
import { rateLimit } from './middleware/rate-limit';

const router = Router({
  finally: [
    auth(),
    rateLimit({
      windowMs: 60000,
      max: 100,
      keyBy: 'token', // Rate limit by auth token
      skipIf: (request) => !request.headers.has('Authorization')
    })
  ]
});
```

## Testing

### Test Unauthenticated Requests

```ts
import { auth } from './middleware/auth';

d describe('auth middleware', () => {
  test('allows requests without API_KEY', async () => {
    const request = new BugeishaRequest(new Request('http://localhost/health'));
    const env = {};
    
    const middleware = auth();
    const result = await middleware(request, env);
    
    expect(result).toBeUndefined(); // Continues to handler
  });
});
```

### Test Protected Routes

```ts
import { auth } from './middleware/auth';

d describe('auth on protected routes', () => {
  test('rejects invalid token', async () => {
    const request = new BugeishaRequest(new Request('http://localhost/api', {
      headers: { 'Authorization': 'Bearer invalid-token' }
    }));
    
    const env = { API_KEY: 'correct-token' };
    const middleware = auth();
    
    const response = await middleware(request, env);
    expect(response.status).toBe(401);
  });
});
```

## Migration Guide

### From Parina (PHP) Auth

Parina had centralized authentication in controllers. Bugeisha moves auth to middleware:

```php
// Parina - in controller
if (!isset($_SESSION['user'])) {
    return new ErrorResponse("Access denied", 401);
}
```

```ts
// Bugeisha - in middleware pipeline
if (!apiKey || token !== apiKey) {
    return new Response(JSON.stringify({ error: 'Access denied' }), { status: 401 });
}
```

### From Express/Jest Authentication

```javascript
// Express - per-route auth
app.get('/api', authenticateToken, (req, res) => {
  // Handler logic
});
```

```ts
// Bugeisha - per-handler auth pattern
router.get('/api', auth(), (request, env) => {
  // Handler logic
});
```

## FAQ

### **Q: What happens without API_KEY?**

A: Middleware skips auth completely (permissive by default). Configure `API_KEY` for protection.

### **Q: Can I use JWT instead of plain tokens?**

A: Yes, use custom validation by passing your own validation logic to the auth middleware.

### **Q: Should I put auth in the pipeline or per-handler?**

A: Prefer per-handler for maximum flexibility. Use global auth for APIs with uniform protection needs.

### **Q: Does auth work with agent detection?**

A: Yes, auth runs after agent-detect middleware by default, so agents get JSON errors and humans get HTML responses appropriately.

## Further Reading

- [Discoverability](#) - Learn about public API design
- [Rate Limit Middleware](#) - Combine auth with rate limiting
- [CORS Middleware](#) - Add CORS support
- [Agent-Detect Middleware](#) - Learn about agent detection

Auth middleware in Bugeisha follows the principle: **Explicit, optional, secure by configuration not by default**.
