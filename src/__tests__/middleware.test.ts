// Middleware Tests — agent-detect, cors, auth, rate-limit
import { describe, it, expect } from 'vitest';
import { detectAgent } from '../middleware/agent-detect';
import { cors, addCorsHeaders } from '../middleware/cors';
import { auth } from '../middleware/auth';
import { rateLimit } from '../middleware/rate-limit';
import type { NesaRequest, Env } from '../types';

// Mock request helper
function mockRequest(opts: {
  url?: string;
  method?: string;
  headers?: Record<string, string>;
} = {}): NesaRequest {
  const url = opts.url ?? 'http://localhost/';
  const headers = new Headers(opts.headers ?? {});
  return {
    url,
    method: opts.method ?? 'GET',
    headers,
    agentType: undefined,
  } as unknown as NesaRequest;
}

const mockEnv = {} as Env;

describe('detectAgent', () => {
  it('should detect AI agents', () => {
    const req = mockRequest({ headers: { 'User-Agent': 'OpenAI-GPT' } });
    detectAgent(req);
    expect(req.agentType).toBe('ai');
  });

  it('should detect Claude', () => {
    const req = mockRequest({ headers: { 'User-Agent': 'ClaudeBot/1.0' } });
    detectAgent(req);
    expect(req.agentType).toBe('ai');
  });

  it('should detect bots', () => {
    const req = mockRequest({ headers: { 'User-Agent': 'Googlebot/2.1' } });
    detectAgent(req);
    expect(req.agentType).toBe('bot');
  });

  it('should detect humans', () => {
    const req = mockRequest({ headers: { 'User-Agent': 'Mozilla/5.0' } });
    detectAgent(req);
    expect(req.agentType).toBe('human');
  });

  it('should default to human when no User-Agent', () => {
    const req = mockRequest({});
    detectAgent(req);
    expect(req.agentType).toBe('human');
  });
});

describe('cors', () => {
  it('should handle OPTIONS preflight', () => {
    const req = mockRequest({ method: 'OPTIONS' });
    const response = cors(req, mockEnv);

    expect(response).toBeInstanceOf(Response);
    expect(response!.status).toBe(204);
    expect(response!.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('should return void for non-OPTIONS methods', () => {
    const req = mockRequest({ method: 'GET' });
    const result = cors(req, mockEnv);
    expect(result).toBeUndefined();
  });
});

describe('addCorsHeaders', () => {
  it('should add CORS headers to response', () => {
    const original = Response.json({ data: 'test' });
    const withCors = addCorsHeaders(original);

    expect(withCors.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(withCors.headers.get('Access-Control-Allow-Methods')).toContain('GET');
  });

  it('should not destroy existing headers', () => {
    const original = new Response('test', {
      headers: { 'X-Custom': 'value' },
    });
    const withCors = addCorsHeaders(original);

    expect(withCors.headers.get('X-Custom')).toBe('value');
    expect(withCors.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });
});

describe('auth', () => {
  it('should skip auth for public paths', () => {
    const req = mockRequest({ url: 'http://localhost/' });
    const middleware = auth();
    const result = middleware(req, mockEnv);
    expect(result).toBeUndefined();
  });

  it('should skip auth when no API_KEY configured', () => {
    const req = mockRequest({ url: 'http://localhost/protected' });
    const envWithKey = { API_KEY: undefined } as Env;
    const middleware = auth();
    const result = middleware(req, envWithKey);
    expect(result).toBeUndefined();
  });

  it('should return 401 when API_KEY configured but no header', () => {
    const req = mockRequest({ url: 'http://localhost/protected' });
    const envWithKey = { API_KEY: 'secret' } as Env;
    const middleware = auth();
    const result = middleware(req, envWithKey);

    expect(result).toBeInstanceOf(Response);
    expect(result!.status).toBe(401);
  });

  it('should return 401 for invalid token', () => {
    const req = mockRequest({
      url: 'http://localhost/protected',
      headers: { 'Authorization': 'Bearer wrong' },
    });
    const envWithKey = { API_KEY: 'secret' } as Env;
    const middleware = auth();
    const result = middleware(req, envWithKey);

    expect(result).toBeInstanceOf(Response);
    expect(result!.status).toBe(401);
  });

  it('should pass with valid token', () => {
    const req = mockRequest({
      url: 'http://localhost/protected',
      headers: { 'Authorization': 'Bearer secret' },
    });
    const envWithKey = { API_KEY: 'secret' } as Env;
    const middleware = auth();
    const result = middleware(req, envWithKey);

    expect(result).toBeUndefined();
  });

  it('should allow custom public paths', () => {
    const req = mockRequest({ url: 'http://localhost/custom-public' });
    const middleware = auth({ publicPaths: ['/custom-public'] });
    const result = middleware(req, mockEnv);
    expect(result).toBeUndefined();
  });
});

describe('rateLimit', () => {
  it('should allow requests under limit', () => {
    const req = mockRequest({
      headers: { 'CF-Connecting-IP': '1.2.3.4' },
    });
    const middleware = rateLimit({ windowMs: 60000, max: 5 });
    const result = middleware(req, mockEnv);
    expect(result).toBeUndefined();
  });

  it('should block requests over limit', () => {
    const middleware = rateLimit({ windowMs: 60000, max: 2 });

    // First two requests pass
    const req1 = mockRequest({ headers: { 'CF-Connecting-IP': '1.2.3.4' } });
    middleware(req1, mockEnv);
    const req2 = mockRequest({ headers: { 'CF-Connecting-IP': '1.2.3.4' } });
    middleware(req2, mockEnv);

    // Third request blocked
    const req3 = mockRequest({ headers: { 'CF-Connecting-IP': '1.2.3.4' } });
    const result = middleware(req3, mockEnv);
    expect(result).toBeInstanceOf(Response);
    expect(result!.status).toBe(429);
  });
});
