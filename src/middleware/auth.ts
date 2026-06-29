import type { NesaRequest, Env } from '../types';

// Simple token-based auth middleware
export function auth(
  request: NesaRequest,
  env: Env,
): Response | void {
  // Skip auth for public routes
  const url = new URL(request.url);
  const publicPaths = ['/', '/health', '/robots.txt', '/.well-known/'];
  if (publicPaths.some(p => url.pathname.startsWith(p))) {
    return; // Continue to handler
  }

  // Check Authorization header
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'Missing Authorization header' }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  // TODO: Implement your auth logic here
  // For now, just check that a token exists
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) {
    return new Response(
      JSON.stringify({ error: 'Invalid token' }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  // Continue to handler
}
