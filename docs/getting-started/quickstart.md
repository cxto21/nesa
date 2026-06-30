# Quick Start

Get a Bugeisha app running in 2 minutes.

## Step 1: Create entry point

Create `src/index.ts`:

```ts
import { Router, error, json } from 'itty-router';

const router = Router({
  finally: [json],
});

// Home — JSON for agents, HTML for humans
router.get('/', (request) => {
  const isAgent = request.headers.get('User-Agent')?.toLowerCase().includes('openai');

  if (isAgent) {
    return Response.json({
      name: 'my-bugeisha-app',
      version: '0.1.0',
      endpoints: { health: '/health' },
    });
  }

  return new Response('<h1>My Bugeisha App</h1>', {
    headers: { 'Content-Type': 'text/html' },
  });
});

// Health check
router.get('/health', () => Response.json({ status: 'ok' }));

// 404
router.all('*', () => error(404, 'Not found'));

export default { fetch: router.fetch.bind(router) };
```

## Step 2: Start dev server

```bash
npm run dev
```

Open [http://localhost:8787](http://localhost:8787) in your browser.

## Step 3: Test with curl

=== "Browser (human)"

    ```bash
    curl http://localhost:8787
    # Returns HTML
    ```

=== "AI Agent"

    ```bash
    curl -H "User-Agent: OpenAI-GPT" http://localhost:8787
    # Returns JSON
    ```

=== "Health check"

    ```bash
    curl http://localhost:8787/health
    # Returns { "status": "ok" }
    ```

## Step 4: Deploy to Cloudflare

```bash
npm run deploy
```

Your app is now live on `https://my-bugeisha-app.your-subdomain.workers.dev`.

## What just happened?

1. **Request entered** via Cloudflare Workers fetch handler
2. **Router matched** the route (`/` or `/health`)
3. **Agent detection** identified if it's an AI or human
4. **Response transformed** to JSON or HTML
5. **Edge response** returned in microseconds

## Next steps

- :material-arrow-right: [Project Structure](project-structure.md)
- :material-arrow-right: [Agent-Native Concepts](../concepts/agent-native.md)
- :material-arrow-right: [Multi-Agent Coordinator](../examples/multi-agent-coordinator.md)
