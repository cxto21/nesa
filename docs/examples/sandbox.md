# Sandbox Integration

Secure code execution in Bugeisha using Cloudflare Sandbox.

## Overview

Sandbox provides:

- **Secure execution** — Run untrusted code safely
- **Isolated environment** — Each sandbox is a Durable Object
- **File system** — Persistent files across requests
- **Code interpreter** — Execute JavaScript, Python, etc.
- **Preview URLs** — Live preview of running code

## Prerequisites

⚠️ **Requires Workers Paid plan** ($5/month)

## Setup

```bash
# Install Sandbox SDK
npm install @cloudflare/sandbox

# Add to wrangler.toml
[sandbox]
binding = "SANDBOX"
```

## Basic Usage

```typescript
// src/handlers/execute.ts
export const executeHandler = async (request: BugeishaRequest, env: Env) => {
  const { code, language } = await request.json()
  
  // Create or get sandbox
  const sandbox = await env.SANDBOX.get('default')
  
  // Execute code
  const result = await sandbox.exec(code, { language })
  
  return Response.json({
    output: result.stdout,
    errors: result.stderr,
    exitCode: result.exitCode
  })
}
```

## File Operations

Work with files in the sandbox:

```typescript
export const fileHandler = async (request: BugeishaRequest, env: Env) => {
  const sandbox = await env.SANDBOX.get('default')
  
  // Write file
  await sandbox.writeFile('data.json', JSON.stringify({ key: 'value' }))
  
  // Read file
  const content = await sandbox.readFile('data.json')
  
  // List files
  const files = await sandbox.listFiles('/')
  
  return Response.json({ files, content })
}
```

## Persistent Sandboxes

Same sandbox ID = same container (state persists):

```typescript
// User-specific sandbox
const userId = request.headers.get('x-user-id')
const sandbox = await env.SANDBOX.get(`user-${userId}`)

// Code and files persist across requests
```

## Code Interpreter

Execute code in multiple languages:

```typescript
export const interpreterHandler = async (request: BugeishaRequest, env: Env) => {
  const { language, code } = await request.json()
  
  const sandbox = await env.SANDBOX.get('default')
  
  let result
  switch (language) {
    case 'javascript':
      result = await sandbox.exec(code, { language: 'js' })
      break
    case 'python':
      result = await sandbox.exec(code, { language: 'python' })
      break
    default:
      return Response.json({ error: 'Unsupported language' }, { status: 400 })
  }
  
  return Response.json(result)
}
```

## Preview URLs

Get live preview of running code:

```typescript
export const previewHandler = async (request: BugeishaRequest, env: Env) => {
  const sandbox = await env.SANDBOX.get('default')
  
  // Start a web server in sandbox
  await sandbox.exec('python -m http.server 8080')
  
  // Get preview URL
  const previewUrl = sandbox.getPreviewUrl(8080)
  
  return Response.json({ previewUrl })
}
```

## Lifecycle

⚠️ **Containers sleep after 10 minutes** of inactivity. Wake-up takes a few seconds.

```typescript
// Check if sandbox is awake
const status = await sandbox.getStatus()

if (status === 'sleeping') {
  // Send a ping to wake it up
  await sandbox.ping()
}
```

## Sandbox Skill

For more details, see the `agents-sandbox` skill:

```
skills/agents-sandbox/SKILL.md
```

## Gotcha

**Billing applies.** Each sandbox is a Durable Object — you're billed for compute time. Use `sandbox.delete()` when done to stop billing.