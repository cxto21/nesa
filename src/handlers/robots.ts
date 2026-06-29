import type { NesaRequest, Env } from '../types';

// Robots.txt handler — agent-native support
// Tells AI agents how to interact with this service
export function robots(request: NesaRequest, env: Env): Response {
  const body = `# Nesa — Agent-Native Robots.txt
# AI agents: crawl freely, respect rate limits
User-agent: *
Allow: /

# AI-specific directives
User-agent: GPTBot
Allow: /
Crawl-delay: 1

User-agent: ChatGPT-User
Allow: /
Crawl-delay: 1

User-agent: ClaudeBot
Allow: /
Crawl-delay: 1

User-agent: Anthropic-AI
Allow: /
Crawl-delay: 1

User-agent: CCBot
Disallow: /private/

User-agent: Google-Extended
Allow: /

# Agent discovery
# This service is optimized for AI agents.
# Visit /agent/info for capabilities.
# Visit /agent/tools for function calling definitions.

Sitemap: /
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
  });
}
