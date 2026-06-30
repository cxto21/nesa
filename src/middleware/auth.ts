import type { NesaRequest, Env } from '../types';

// Auth options
interface AuthOptions {
  publicPaths?: string[];
  headerName?: string;
}

// Simple token-based auth middleware (OPT-IN — not in default pipeline)
export function auth(options: AuthOptions = {}) {
  const {
    publicPaths = ['/health', '/robots.txt', '/llms.txt', '/sitemap.xml', '/.well-known/'],
    headerName = 'Authorization',
  } = options;

  return (request: NesaRequest, env: Env): Response | void => {
    // Skip auth for public routes
    const url = new URL(request.url);
    if (publicPaths.some(p => url.pathname.startsWith(p))) {
      return; // Continue to handler
    }

    // Check if API_KEY is configured
    const apiKey = (env as any).API_KEY;
    if (!apiKey) {
      // No API_KEY configured — skip auth (permissive by default)
      return;
    }

    // Check Authorization header
    const authHeader = request.headers.get(headerName);
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // Validate Bearer token
    const token = authHeader.replace(/^Bearer\s+/i, '');
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Invalid token format' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // Compare tokens
    if (token !== apiKey) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // Token valid — continue to handler
  };
}
