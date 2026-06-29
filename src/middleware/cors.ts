import type { NesaRequest, Env } from '../types';

// CORS headers for API endpoints
export function cors(
  request: NesaRequest,
  env: Env,
): Response | void {
  // Only handle preflight OPTIONS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Agent',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // For other methods, add CORS headers to response via finally hook
  // (handled in router.ts)
}
