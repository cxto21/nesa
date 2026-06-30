import type { NesaRequest, Env } from '../types';

// llms.txt — agent-friendly service description
// Standard: https://llmstxt.org/
// Tells AI agents what this service does in plain language
export function llms(request: NesaRequest, env: Env): Response {
  const body = `# Nesa App

> Ultra-light agent-native micro-framework for Cloudflare Workers.

## What this service does
This is a Nesa-powered API service optimized for AI agents.
It provides structured JSON responses for machine consumers
and clean HTML for human visitors.

## Key endpoints
- GET / — Service overview (JSON for agents, HTML for humans)
- GET /health — Health check
- GET /agent/info — Capabilities, authentication, rate limits
- GET /agent/tools — Tool definitions for function calling
- GET /robots.txt — Crawl directives for AI bots
- GET /llms.txt — This file

## Authentication
Bearer token via Authorization header.
Public endpoints: /, /health, /robots.txt, /llms.txt

## Rate limits
100 requests per minute per IP.

## Response format
All agent endpoints return application/json.
Set Accept: application/json for guaranteed JSON response.
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
  });
}
