# Agent-Detect Middleware

**Agent-detect middleware** identifies whether requests come from AI agents, bots, or humans based on User-Agent headers.

## Why Detect Agents?

AI agents are different from human users:

- **Different responses** — Agents want JSON, humans want HTML
- **Different capabilities** — Agents can call tools, humans use browsers
- **Different expectations** — Agents expect machine-readable formats
- **Different rate limits** — Agents may need different throttling

## How It Works

The middleware examines the User-Agent header for known patterns:

```typescript
// AI agent patterns
const aiPatterns = ['openai', 'gpt', 'claude', 'anthropic', 'bot', 'crawler']

// Check if request is from an AI agent
const isAgent = aiPatterns.some(pattern => 
  userAgent.toLowerCase().includes(pattern)
)
```

## Configuration

```typescript
import { agentDetect } from '../middleware/agent-detect'

// Add to middleware pipeline
router.all('*', agentDetect)
```

## Usage in Handlers

Once detected, use the `isAgent` flag:

```typescript
export const homeHandler = async (request: BugeishaRequest, env: Env) => {
  if (request.isAgent) {
    // JSON response for agents
    return Response.json({
      name: 'My API',
      version: '1.0.0',
      endpoints: ['/api/data', '/api/users']
    })
  }

  // HTML response for humans
  return new Response('<html><body>My API</body></html>', {
    headers: { 'Content-Type': 'text/html' }
  })
}
```

## Detection Patterns

| Pattern | Example User-Agents |
|---------|---------------------|
| `openai` | OpenAI crawlers, GPTBot |
| `gpt` | GPT-based agents |
| `claude` | Anthropic Claude |
| `anthropic` | Anthropic crawlers |
| `bot` | Generic bots |
| `crawler` | Web crawlers |

## Limitations

⚠️ **Best-effort detection.** Agents can:

- Spoof User-Agent headers
- Use custom User-Agent strings
- Rotate User-Agents to avoid detection

Don't rely solely on agent detection for security. Use it for **response optimization**, not authentication.

## Gotcha

**Spoofable.** Agent detection is for response formatting, not security. Any client can set any User-Agent. Use auth middleware for security.