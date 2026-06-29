import type { NesaRequest, Env } from '../types';

// Tool definitions for AI function calling (OpenAI/Anthropic format)
export function agentTools(request: NesaRequest, env: Env): Response {
  // Define your tools here — these are examples
  const tools = [
    {
      type: 'function',
      function: {
        name: 'get_health',
        description: 'Check the health status of this service',
        parameters: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'get_info',
        description: 'Get information about this service and its capabilities',
        parameters: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
    },
    // Add your custom tools here:
    // {
    //   type: 'function',
    //   function: {
    //     name: 'search',
    //     description: 'Search for items',
    //     parameters: {
    //       type: 'object',
    //       properties: {
    //         query: { type: 'string', description: 'Search query' },
    //       },
    //       required: ['query'],
    //     },
    //   },
    // },
  ];

  return Response.json({
    tools,
    note: 'These tool definitions follow the OpenAI function calling format. Adapt as needed for your AI provider.',
  }, {
    headers: {
      'Content-Type': 'application/json',
      'X-Agent-Optimized': 'true',
    },
  });
}
