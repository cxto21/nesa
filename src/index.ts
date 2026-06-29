// Nesa — Ultra-light agent-native micro-framework for Cloudflare Workers
//
// Philosophy: Extreme minimalism. Explicit routes. No magic. Linear flow.
//
// Usage:
//   import nesa from './router';
//   export default nesa;
//
// Or customize:
//   import { createNesa } from './router';
//   const router = createNesa({ base: '/api', middlewares: [...] });
//   export default router;

export { router as default, createNesa } from './router';
export type { Env, NesaRequest, NesaHandler, NesaMiddleware } from './types';
export { detectAgent, cors, auth, rateLimit } from './middleware';
