# Agent-Native

**Agent-native** means your API is designed from the ground up to serve both humans and AI agents.

## The problem

In 2026, APIs serve two distinct audiences:

1. **Humans** — Need HTML, visual feedback, human-readable errors
2. **AI Agents** — Need JSON, structured data, machine-readable responses

Most frameworks ignore this reality. They either:

- Serve only JSON (bad UX for humans)
- Serve only HTML (agents can't consume it)
- Duplicate endpoints (`/api/v1/...` vs `/web/...`)

## The Bugeisha solution

**Same routes, different responses.** One endpoint serves both audiences.

```ts
router.get('/data', (request) => {
  if (request.agentType === 'ai') {
    // Agent gets structured JSON
    return Response.json({
      items: [...],
      count: 42,
      metadata: { source: 'api', version: '1.0' },
    });
  }

  // Human gets beautiful HTML
  return new Response(`
    <html>
      <body>
        <h1>Data</h1>
        <ul>${items.map(i => `<li>${i.name}</li>`).join('')}</ul>
      </body>
    </html>
  `);
});
```

## How it works

### 1. Agent detection

Bugeisha identifies the request source via User-Agent header:

```ts
import { detectAgent } from './middleware/agent-detect';

// Detects: OpenAI, GPT, Claude, Anthropic, Cohere, Llama, etc.
// Also detects: Googlebot, Bingbot, and other crawlers
// Default: human
```

### 2. Dual response

The same handler returns different content based on `request.agentType`:

| `agentType` | Response | Use case |
|-------------|----------|----------|
| `'ai'` | JSON | API consumption by LLMs |
| `'bot'` | JSON | Search engine crawlers |
| `'human'` | HTML | Browser viewing |

### 3. Agent-optimized headers

Responses include headers that help agents understand the content:

```ts
return Response.json(data, {
  headers: {
    'Content-Type': 'application/json',
    'X-Agent-Optimized': 'true',  // Tells agents this is machine-readable
  },
});
```

## Benefits

| Benefit | Description |
|---------|-------------|
| **No duplication** | One route, one handler, two outputs |
| **Better UX** | Humans get visual interfaces, agents get structured data |
| **Discoverability** | Agents can find and consume your API |
| **Future-proof** | Ready for the agent-native future |

## When to use

!!! tip "Use agent-native when"

    - Your API serves both humans and AI agents
    - You want to avoid endpoint duplication
    - You need search engines to discover your content
    - You're building for the agent ecosystem

!!! warning "Skip when"

    - Your API is internal-only (no external consumers)
    - You only serve agents (no human interface needed)
    - You only serve humans (no agent consumption)
