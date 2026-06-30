# Agent-Discoverability

**Discoverability** is the capability of your API to be found, understood, and consumed by AI agents automatically. In 2026, autonomous workflows depend on APIs that can be discovered without manual integration.

## Why Discovery Matters

AI agents need to know:

1. **What your API can do** – available endpoints and capabilities
2. **How to use it** – request/response formats, required parameters
3. **Where to find it** – domain, path, machine-readable documentation

Without good discoverability, your API is invisible to the agent ecosystem.

## Bugeisha's Discovery Stack

Bugeisha provides four essential discoverability files:

1. **robots.txt** – Generic discovery for all bots
2. **llms.txt** – AI-optimized service description  
3. **sitemap.xml** – Structured endpoint inventory
4. **dual-response pattern** – Runtime discovery via agent vs human responses

## Built-in Discovery Files

### 1. robots.txt

```text
User-agent: *
Disallow: /admin/
Disallow: /private/

Sitemap: https://your-app.com/sitemap.xml

# Bugeisha agent endpoints are open
Allow: /agent/
Allow: /health
```

### 2. llms.txt (Service Description)

```text
# Bugeisha - Agent-Native Framework

## Overview
Ultra-light agent-native micro-framework for Cloudflare Workers. Same routes, different responses: JSON for agents, HTML for humans.

## Capabilities
- Agent detection via User-Agent
- Dual response format (JSON/HTML)
- Built-in authentication (opt-in Bearer token)
- CORS preflight support
- Rate limiting (per-isolate, KV-ready)
- Discoverability via robots.txt, llms.txt, sitemap.xml

## Endpoints
- GET / → Agent info (JSON) or Home page (HTML)
- GET /health → Health status (JSON)
- GET /agent/info → Detailed agent capabilities (JSON)
- GET /agent/tools → Available tools/functions (JSON)
- GET /robots.txt → Robots.txt
- GET /llms.txt → This service description
- GET /sitemap.xml → XML sitemap

## Usage
Agents can discover this service by checking `/llms.txt` and querying `/agent/tools` for function definitions.

## Version
0.1.0
```

### 3. sitemap.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://your-app.com/</loc>
    <priority>1.0</priority>
    <changefreq>daily</changefreq>
  </url>
  <url>
    <loc>https://your-app.com/health</loc>
    <priority>0.8</priority>
    <changefreq>hourly</changefreq>
  </url>
  <url>
    <loc>https://your-app.com/agent/info</loc>
    <priority>0.9</priority>
    <changefreq>daily</changefreq>
  </url>
  <url>
    <loc>https://your-app.com/agent/tools</loc>
    <priority>0.9</priority>
    <changefreq>daily</changefreq>
  </url>
</urlset>
```

## Dual-Response Pattern

The ultimate discovery mechanism: runtime detection of request type.

```ts
router.get('/api/data', (request) => {
  if (request.agentType === 'ai') {
    // Agent discovery: JSON with structured data
    return Response.json({
      items: [...],
      metadata: { version: '1.0', source: 'api' }
    });
  }
  
  // Human discovery: HTML interface
  return new Response(renderHTML());
});
```

## Integration with Other Features

### Agent Detection
Discoverability starts with detecting the request type:

- **AI agents** → JSON responses
- **Bots/crawlers** → JSON responses  
- **Humans** → HTML responses

### Middleware Integration

```ts
import { detectAgent, auth, cors, rateLimit } from './middleware';
import { robots, llms, sitemap } from './handlers';

const router = Router({
  finally: [detectAgent, auth, cors, rateLimit]
});

// Discovery endpoints (no auth, no rate limit)
router.get('/robots.txt', robots);
router.get('/llms.txt', llms);
router.get('/sitemap.xml', sitemap);

// Agent-native endpoints
router.get('/', home);
router.get('/health', health);
router.get('/agent/info', agent);
router.get('/agent/tools', agentTools);
```

## Benefits

| Benefit | Description |
|---------|-------------|
| **Automatic discovery** | Agents find your API without manual integration |
| **Backward compatibility** | Humans still get HTML interfaces |
| **No duplication** | Same route serves both audiences |
| **Future-proof** | Ready for autonomous workflow ecosystems |

## When to Use

!!! tip "Use discoverability when"

    - Building public APIs for both humans and AI
    - Want agents to automatically consume your services
    - Need search engines to index your endpoints
    - Building for the agent-native future

!!! warning "Skip when"

    - Your API is internal-only
    - No external consumers exist
    - You only serve one audience type

## Example Implementation

```ts
// src/handlers/discoverability.ts
export function robots(request: BugeishaRequest): Response {
  const body = `User-agent: *
Disallow: /admin/
Sitemap: ${request.url.replace(/robots\.txt$/, 'sitemap.xml')}`;
  
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain' }
  });
}

export function llms(request: BugeishaRequest): Response {
  const description = {
    name: 'My Bugeisha API',
    version: '1.0.0',
    description: 'API for managing resources',
    endpoints: [
      { path: '/', method: 'GET', description: 'Home page' },
      { path: '/health', method: 'GET', description: 'Health check' },
    ]
  };
  
  return Response.json(description);
}
```

Discoverability is the foundation of autonomous agent workflows in 2026+.
