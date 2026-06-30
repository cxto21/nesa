# Skill: agent-discoverability

Make your Nesa service findable by AI agents. Built-in handlers: `robots`, `llms`, `sitemap`.

```ts
// Routes are registered by default in the core router:
router.get('/robots.txt', robots);    // Bot rules + sitemap directive
router.get('/llms.txt', llms);        // Service description for agents
router.get('/sitemap.xml', sitemap);  // Endpoint discovery
```

Priority: robots.txt (easy win) → llms.txt (agent understanding) → sitemap (discovery). See isitagentready.com for scoring. Google ignores llms.txt but other agents (Perplexity, Claude, ChatGPT) use it.
