import type { NesaRequest, Env } from '../types';

// Detect if user-agent is an AI agent, bot, or human
export function detectAgent(request: NesaRequest): NesaRequest {
  const ua = request.headers.get('User-Agent')?.toLowerCase() ?? '';

  // AI agents
  const aiPatterns = [
    'openai', 'gpt', 'claude', 'anthropic', 'cohere', 'llama',
    'chatgpt', 'bard', 'gemini', 'perplexity', 'you.com',
    'ai-agent', 'langchain', 'autogpt', 'agent',
  ];

  // Common bots
  const botPatterns = [
    'googlebot', 'bingbot', 'slurp', 'duckduckbot', 'baiduspider',
    'yandexbot', 'sogou', 'exabot', 'facebot', 'facebookexternalhit',
    'ia_archiver', 'semrushbot', 'ahrefsbot', 'dotbot', 'mj12bot',
  ];

  if (aiPatterns.some(p => ua.includes(p))) {
    request.agentType = 'ai';
  } else if (botPatterns.some(p => ua.includes(p))) {
    request.agentType = 'bot';
  } else {
    request.agentType = 'human';
  }

  return request;
}
