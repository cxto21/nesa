# Bugeisha 🪆

**Ultra-light agent-native micro-framework for Cloudflare Workers.**

*Inspired by Parina PHP. Built fresh for the edge.*

<p align="center" style="margin: 1.5rem 0;">
  <img src="assets/images/mamuzhka.svg" alt="Bugeisha Mamuzhka" width="120" height="120" />
</p>

---

## Why Bugeisha?

In 2026, APIs serve two audiences: **humans** and **AI agents**. Most frameworks ignore this reality. Bugeisha embraces it.

**Same routes, different responses.** JSON for agents, HTML for humans. No separate endpoints, no duplication, no magic.

---

## Features

- :material-route: **Explicit Routes** — Itty Router v5, no decorators, no magic
- :material-robot: **Agent Detection** — Identifies AI, bots, and humans via User-Agent
- :material-swap-horizontal: **Dual Response** — JSON for agents, HTML for humans on the same route
- :material-magnify: **Discoverability** — Built-in robots.txt, llms.txt, sitemap.xml
- :material-shield-lock: **Auth** — Bearer token validation (opt-in)
- :material-web: **CORS** — Explicit helper for cross-origin requests
- :material-test-tube: **Tested** — 26 tests for core framework

---

## Quick Example

```ts
import { Router } from 'itty-router';

const router = Router();

router.get('/', (request) => {
  // Agent? JSON. Human? HTML.
  if (request.agentType === 'ai') {
    return Response.json({ name: 'bugeisha', version: '0.1.0' });
  }
  return new Response('<h1>Bugeisha</h1>', {
    headers: { 'Content-Type': 'text/html' },
  });
});

export default { fetch: router.fetch.bind(router) };
```

---

## Get Started

<div class="grid cards" markdown>

- :material-rocket-launch-outline:{ .lg .middle } __Quick Start__

    ---

    Get running in 2 minutes

    [:octicons-arrow-right-24: Getting started](getting-started/installation.md)

- :material-lightbulb-on:{ .lg .middle } __Concepts__

    ---

    Learn agent-native patterns

    [:octicons-arrow-right-24: Agent-Native](concepts/agent-native.md)

- :material-puzzle:{ .lg .middle } __Examples__

    ---

    Real-world applications

    [:octicons-arrow-right-24: Multi-Agent Coordinator](examples/multi-agent-coordinator.md)

- :material-book:{ .lg .middle } __Skills__

    ---

    Reusable patterns and guides

    [:octicons-arrow-right-24: Browse skills](skills/index.md)

</div>

---

## Philosophy

!!! quote "Extreme minimalism. Explicit routes. No magic. Linear flow."

    Bugeisha takes Parina's core principles — clarity over abstraction, control over convenience — and rebuilds them for Cloudflare Workers with Itty Router.

---

## Comparison

| Feature | Bugeisha | Hono | Express | Agents SDK |
|---------|------|------|---------|------------|
| Agent-native | :material-check: | :material-close: | :material-close: | :material-check: |
| Dual response | :material-check: | :material-close: | :material-close: | :material-close: |
| Discoverability | :material-check: | :material-close: | :material-close: | :material-close: |
| Size | ~200 LOC | ~1000 LOC | ~5000 LOC | ~10k LOC |
| Learning curve | Low | Low | Medium | High |
| Production-ready | :material-close: | :material-check: | :material-check: | :material-check: |

---

## License

MIT
