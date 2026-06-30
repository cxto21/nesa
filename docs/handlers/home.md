# Home Handler

**Home handler** provides the root endpoint `/` with dual responses: JSON for AI agents, HTML for humans.

## Why Dual Response?

Different clients have different needs:

- **AI agents** want structured data they can parse
- **Humans** want visual interfaces they can read
- **Same endpoint** serves both without separate routes

## Usage

```typescript
import { homeHandler } from '../handlers/home'

router.get('/', homeHandler)
```

## Agent Response

When `isAgent` is true:

```json
{
  "name": "My API",
  "version": "1.0.0",
  "type": "agent-native",
  "description": "API for AI agents and humans",
  "endpoints": {
    "home": "/",
    "health": "/health",
    "agent": "/agent",
    "tools": "/agent/tools"
  },
  "discoverability": {
    "robots": "/robots.txt",
    "llms": "/llms.txt",
    "sitemap": "/sitemap.xml"
  },
  "docs": "https://yourdomain.com/docs"
}
```

## Human Response

When `isAgent` is false:

```html
<!DOCTYPE html>
<html>
<head>
  <title>My API</title>
  <style>/* Minimal styles */</style>
</head>
<body>
  <h1>My API</h1>
  <p>Agent-native API for AI and humans</p>
  <ul>
    <li><a href="/health">Health Check</a></li>
    <li><a href="/agent">Agent Info</a></li>
    <li><a href="/agent/tools">Available Tools</a></li>
  </ul>
</body>
</html>
```

## Integration with Agent-Detect

The home handler works with agent-detect middleware:

```typescript
import { agentDetect } from '../middleware/agent-detect'
import { homeHandler } from '../handlers/home'

// Detect agents first
router.all('*', agentDetect)

// Home handler uses isAgent flag
router.get('/', homeHandler)
```

## Gotcha

**Always check `request.isAgent`.** The home handler doesn't detect agents itself — it relies on the agent-detect middleware running first.