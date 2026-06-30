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

  // For other methods, add CORS headers via addCorsHeaders() in your handler
}

// Helper: Add CORS headers to a response (explicit, no magic)
// Usage: return addCorsHeaders(Response.json({ data }));
export function addCorsHeaders(response: Response): Response {
  const newResponse = new Response(response.body, response);
  newResponse.headers.set('Access-Control-Allow-Origin', '*');
  newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Agent');
  return newResponse;
}
