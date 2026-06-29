import type { NesaRequest, Env } from '../types';

// Agent info endpoint — tells AI agents what this service can do
export function agentInfo(request: NesaRequest, env: Env): Response {
  return Response.json({
    service: 'nesa-app',
    description: 'Agent-optimized Cloudflare Worker',
    capabilities: [
      {
        name: 'health',
        method: 'GET',
        path: '/health',
        description: 'Check service health status',
        responseFormat: 'application/json',
      },
      {
        name: 'agent-info',
        method: 'GET',
        path: '/agent/info',
        description: 'This endpoint — service capabilities',
        responseFormat: 'application/json',
      },
      {
        name: 'agent-tools',
        method: 'GET',
        path: '/agent/tools',
        description: 'Tool definitions for AI function calling',
        responseFormat: 'application/json',
      },
    ],
    authentication: 'Bearer token via Authorization header',
    rateLimit: '100 requests per minute',
    contact: 'Set your contact info in handlers/agent.ts',
  }, {
    headers: {
      'Content-Type': 'application/json',
      'X-Agent-Optimized': 'true',
    },
  });
}
