# Workers AI Integration

How to use Cloudflare Workers AI with Bugeisha for model inference.

## Overview

Workers AI provides:

- **100+ models** — LLMs, image generation, embeddings
- **Edge inference** — Run models close to users
- **Pay-per-use** — No idle costs
- **TypeScript SDK** — Easy integration with Workers

## Setup

```bash
# Enable Workers AI in Cloudflare Dashboard
# Add to wrangler.toml

[ai]
binding = "AI"
```

## Basic Usage

```typescript
// src/handlers/chat.ts
export const chatHandler = async (request: BugeishaRequest, env: Env) => {
  const { message } = await request.json()
  
  // Call Workers AI
  const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
    messages: [{ role: 'user', content: message }]
  })
  
  return Response.json({
    response: response.response
  })
}
```

## Model Routing

Route requests to different models based on task:

```typescript
const models = {
  chat: '@cf/meta/llama-3.1-8b-instruct',
  embeddings: '@cf/baai/bge-base-en-v1.5',
  image: '@cf/stabilityai/stable-diffusion-xl-base-1.0'
}

export const aiHandler = async (request: BugeishaRequest, env: Env) => {
  const { task, input } = await request.json()
  
  const model = models[task] || models.chat
  
  const response = await env.AI.run(model, {
    messages: [{ role: 'user', content: input }]
  })
  
  return Response.json({ model, response })
}
```

## Fallback Patterns

Handle model failures gracefully:

```typescript
const fallbackChain = [
  '@cf/meta/llama-3.1-8b-instruct',
  '@cf/mistralai/mistral-7b-instruct',
  '@cf/google/gemma-2b'
]

export const chatWithFallback = async (message: string, env: Env) => {
  for (const model of fallbackChain) {
    try {
      const response = await env.AI.run(model, {
        messages: [{ role: 'user', content: message }]
      })
      return { model, response }
    } catch (error) {
      console.log(`Model ${model} failed, trying next...`)
    }
  }
  
  throw new Error('All models failed')
}
```

## Streaming Responses

Stream responses for better UX:

```typescript
export const streamHandler = async (request: BugeishaRequest, env: Env) => {
  const { message } = await request.json()
  
  const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
    messages: [{ role: 'user', content: message }],
    stream: true
  })
  
  // Return streaming response
  return new Response(response, {
    headers: { 'Content-Type': 'text/event-stream' }
  })
}
```

## Workers AI Skill

For more details, see the `workers-ai` skill:

```
skills/workers-ai/SKILL.md
```

## Gotcha

**Model availability varies.** Not all models are available in all regions. Check Cloudflare's documentation for current model availability.