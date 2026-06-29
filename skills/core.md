# Skill: core

Itty Router + middleware pipeline. The foundation of every Nesa app.

```ts
import { Router, error, json } from 'itty-router';
const router = Router({ before: [middleware], catch: error, finally: [json] });
router.get('/path', handler);
export default { fetch: router.fetch.bind(router) };
```

Middleware: return `Response` to stop, return `void` to continue. Always bind `fetch` to router. Use `before` for request middleware, `finally` for response transforms.
