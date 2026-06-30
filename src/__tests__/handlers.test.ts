// Handler Tests — home, health, agent-info, agent-tools
import { describe, it, expect } from 'vitest';
import { home } from '../handlers/home';
import { health } from '../handlers/health';
import { agentInfo } from '../handlers/agent';
import { agentTools } from '../handlers/agent-tools';
import type { NesaRequest, Env } from '../types';

// Mock request helper
function mockRequest(opts: {
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  agentType?: 'ai' | 'bot' | 'human';
} = {}): NesaRequest {
  const url = opts.url ?? 'http://localhost/';
  const headers = new Headers(opts.headers ?? {});
  return {
    url,
    method: opts.method ?? 'GET',
    headers,
    agentType: opts.agentType ?? 'human',
  } as unknown as NesaRequest;
}

const mockEnv = {} as Env;

describe('home', () => {
  it('should return JSON for AI agents', () => {
    const req = mockRequest({ agentType: 'ai' });
    const response = home(req, mockEnv);

    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('application/json');
    expect(response.headers.get('X-Agent-Optimized')).toBe('true');
  });

  it('should return HTML for humans', () => {
    const req = mockRequest({ agentType: 'human' });
    const response = home(req, mockEnv);

    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('text/html');
  });

  it('should include agent instructions in JSON', async () => {
    const req = mockRequest({ agentType: 'ai' });
    const response = home(req, mockEnv);
    const body = await response.json();

    expect(body.agentInstructions).toBeDefined();
    expect(body.capabilities).toBeDefined();
    expect(body.endpoints).toBeDefined();
  });
});

describe('health', () => {
  it('should return healthy status', () => {
    const req = mockRequest();
    const response = health(req, mockEnv);

    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(200);
  });

  it('should return JSON', async () => {
    const req = mockRequest();
    const response = health(req, mockEnv);
    const body = await response.json();

    expect(body.status).toBe('ok');
    expect(body.timestamp).toBeDefined();
  });
});

describe('agentInfo', () => {
  it('should return agent info', () => {
    const req = mockRequest({ agentType: 'ai' });
    const response = agentInfo(req, mockEnv);

    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(200);
  });

  it('should return JSON with capabilities', async () => {
    const req = mockRequest({ agentType: 'ai' });
    const response = agentInfo(req, mockEnv);
    const body = await response.json();

    expect(body.service).toBe('nesa-app');
    expect(body.capabilities).toBeDefined();
    expect(body.capabilities.length).toBeGreaterThan(0);
  });
});

describe('agentTools', () => {
  it('should return tool definitions', () => {
    const req = mockRequest({ agentType: 'ai' });
    const response = agentTools(req, mockEnv);

    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(200);
  });

  it('should return OpenAI-compatible format', async () => {
    const req = mockRequest({ agentType: 'ai' });
    const response = agentTools(req, mockEnv);
    const body = await response.json();

    expect(body.tools).toBeDefined();
    expect(Array.isArray(body.tools)).toBe(true);
    expect(body.tools.length).toBeGreaterThan(0);
    expect(body.tools[0].type).toBe('function');
    expect(body.tools[0].function.name).toBeDefined();
  });
});
