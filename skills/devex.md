# Skill: devex

Logger, error handler, env config — developer experience essentials.

```ts
// Logger: console-based, no deps
export function log(request: Request, status: number, start: number): void {
  console.log(`${request.method} ${new URL(request.url).pathname} ${status} ${Date.now()-start}ms`);
}

// Errors: consistent JSON format
export function err(status: number, message: string): Response {
  return Response.json({ error: { status, message } }, { status });
}

// Env: typed bindings via Env interface
export interface Env { API_KEY: string; CACHE: KVNamespace; }
```

Logger: use structured JSON for log pipelines. Errors: log server-side for 5xx, return generic message. Env: never log secrets, use `.dev.vars` for local.
