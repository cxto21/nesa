# Skill: devops

Testing + deployment — quality and shipping workflows.

```ts
// Testing: Vitest for Workers, no Wrangler needed
// import { describe, it, expect } from 'vitest';
// const res = await worker.fetch(new Request('http://localhost/health'));
// expect(res.status).toBe(200);
```

```bash
# Deploy: Wrangler commands
wrangler deploy          # Push to edge
wrangler tail            # Live logs
wrangler secret put      # Add secrets
wrangler deploy --env staging  # Environment
```

Test handlers as pure functions, mock `env` and `ctx`. Pre-deploy: `wrangler types` → `wrangler dev` → `wrangler deploy`. For rollback: `wrangler rollback`.
