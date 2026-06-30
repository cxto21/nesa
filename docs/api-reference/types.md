# TypeScript Types Reference

All exported types from `types.ts` with descriptions and usage examples.

## Core Types

### `Env`

Cloudflare Workers environment with Bugeisha-specific bindings.

```typescript
interface Env {
  // KV bindings
  STATE: KVNamespace      // Agent/task state
  LOGS: KVNamespace       // Activity logs
  
  // Durable Objects
  AgentDO: DurableObjectNamespace
  
  // Environment variables
  API_KEY?: string
  CORS_ORIGIN?: string
}
```

### `BugeishaRequest`

Extended Request with agent detection.

```typescript
interface BugeishaRequest extends Request {
  isAgent: boolean  // true if request is from AI agent
}
```

### `BugeishaHandler`

Handler function signature.

```typescript
type BugeishaHandler = (
  request: BugeishaRequest,
  env: Env
) => Promise<Response> | Response
```

### `BugeishaMiddleware`

Middleware function signature.

```typescript
type BugeishaMiddleware = (
  request: BugeishaRequest,
  env: Env
) => Promise<Response | void> | Response | void
```

## Agent Types

### `Agent`

Agent definition.

```typescript
interface Agent {
  id: string
  name: string
  status: 'active' | 'idle' | 'offline'
  lastHeartbeat: number
  capabilities: string[]
}
```

### `Task`

Task definition.

```typescript
interface Task {
  id: string
  title: string
  description: string
  status: 'pending' | 'assigned' | 'completed'
  assignedTo?: string
  result?: any
  createdAt: number
  completedAt?: number
}
```

### `SubAgent`

Sub-agent definition.

```typescript
interface SubAgent {
  id: string
  parentId: string
  type: 'worker' | 'specialist'
  status: 'active' | 'completed' | 'failed'
  result?: any
}
```

## WebSocket Types

### `WebSocketMessage`

Message format for WebSocket communication.

```typescript
interface WebSocketMessage {
  type: 'task' | 'result' | 'heartbeat' | 'error'
  payload: any
  timestamp: number
}
```

## Durable Object Types

### `AgentDOState`

State stored in AgentDO.

```typescript
interface AgentDOState {
  agent: Agent
  tasks: Task[]
  subagents: SubAgent[]
  connections: number
}
```

## Handler Response Types

### `HealthResponse`

Health check response.

```typescript
interface HealthResponse {
  status: 'healthy' | 'unhealthy'
  timestamp: string
  uptime: number
  memory: {
    used: number
    limit: number
  }
  version: string
}
```

### `ErrorResponse`

Error response format.

```typescript
interface ErrorResponse {
  error: string
  message: string
  retryAfter?: number
}
```

## Usage Example

```typescript
import { Env, BugeishaRequest, BugeishaHandler, Agent, Task } from '../types'

const handler: BugeishaHandler = async (request: BugeishaRequest, env: Env) => {
  const agent: Agent = {
    id: '123',
    name: 'Worker',
    status: 'active',
    lastHeartbeat: Date.now(),
    capabilities: ['process', 'analyze']
  }
  
  return Response.json(agent)
}
```

## Gotcha

**Import from `types.ts`.** Don't re-declare types — import them to ensure consistency across your codebase.