import type { NesaRequest, Env } from '../types';

// Health check endpoint — minimal, fast, useful for uptime monitoring
export function health(request: NesaRequest, env: Env): Response {
  return Response.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: 'edge',
  });
}
