# Skill: agent-discoverability

Make your Nesa service findable by AI agents. robots.txt + llms.txt + sitemap + structured data.

```ts
// robots.txt: AI bot rules + sitemap directive
// llms.txt: service description for agents (markdown)
// sitemap.xml: endpoint discovery
// Structured data: JSON-LD Service schema
router.get('/robots.txt', robots);
router.get('/llms.txt', llms);
router.get('/sitemap.xml', sitemap);
```

Priority: robots.txt (easy win) → llms.txt (agent understanding) → sitemap (discovery) → structured data (entity recognition). See isitagentready.com for scoring. Google ignores llms.txt but other agents use it.
