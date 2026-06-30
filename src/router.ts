import { Router, error, json } from 'itty-router';
import type { NesaRequest, Env } from './types';
import { detectAgent } from './middleware/agent-detect';
import { cors } from './middleware/cors';
import { rateLimit } from './middleware/rate-limit';

// Handlers
import { home } from './handlers/home';
import { health } from './handlers/health';
import { agentInfo } from './handlers/agent';
import { agentTools } from './handlers/agent-tools';
import { robots } from './handlers/robots';
import { llms } from './handlers/llms';
import { sitemap } from './handlers/sitemap';

// Create router with Parina's philosophy:
// Explicit routes, no magic, linear flow
const router = Router({
  // Base path (optional, uncomment if needed)
  // base: '/api',

  // Before: middleware pipeline
  before: [detectAgent, cors, rateLimit({ windowMs: 60_000, max: 100 })],

  // Error handler
  catch: (err) => {
    console.error('Nesa error:', err);
    return error(err);
  },

  // Finally: ensure JSON responses
  finally: [json],
});

// ─── Public Routes ─────────────────────────────────────────
router.get('/', home);
router.get('/health', health);
router.get('/robots.txt', robots);
router.get('/llms.txt', llms);
router.get('/sitemap.xml', sitemap);

// ─── Agent Routes ──────────────────────────────────────────
router.get('/agent/info', agentInfo);
router.get('/agent/tools', agentTools);

// ─── Catch-all ─────────────────────────────────────────────
router.all('*', () => error(404, 'Not found'));

// ─── Factory ─────────────────────────────────────────────
// Create your own Nesa instance with custom config
export function createNesa(options?: {
  base?: string;
  middlewares?: any[];
}) {
  const r = Router({
    base: options?.base,
    before: options?.middlewares ?? [detectAgent, cors],
    catch: (err) => error(err),
    finally: [json],
  });

  return r;
}

// Export the fetch handler for Cloudflare Workers
export { router };
export default {
  fetch: router.fetch.bind(router),
};
