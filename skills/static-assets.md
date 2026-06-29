# Skill: static-assets

Serve static files from Workers. Cloudflare handles the heavy lifting.

```ts
// wrangler.toml: [assets] directory = "public" binding = "ASSETS"
// handler: return env.ASSETS.fetch(request);
```

For API + static: route `/static/*` to assets, rest to handlers. For full sites: use Cloudflare Pages instead. KV: use for dynamic assets that need caching.
