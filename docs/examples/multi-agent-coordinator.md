# Multi-Agent Coordinator

A complete example of a multi-agent system with Durable Objects, WebSocket, sub-agents, and human dashboard.

## Overview

This example demonstrates:

- **Agent registry** with Durable Objects for persistent state
- **Task engine** for distributed work
- **WebSocket** for real-time updates
- **Sub-agent spawning** for parallel execution
- **Human dashboard** for monitoring and control

## Setup

```bash
cd examples/multi-agent-coordinator
npm install
npm run dev
```

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Cloudflare Worker                   │
├─────────────────────────────────────────────────────┤
│  Router (Itty)                                       │
│  ├── /                → Home (dual response)        │
│  ├── /health          → System status               │
│  ├── /status          → JSON status                 │
│  ├── /logs            → Recent activity logs        │
│  ├── /dashboard       → Human dashboard (HTML)      │
│  ├── /agents          → Register, list, heartbeat   │
│  ├── /tasks           → Create, pick, result        │
│  ├── /chat            → Chat UI + @mention routing  │
│  ├── /ws/agent/:id    → WebSocket + DO callable     │
│  ├── /agents/:id/spawn → Sub-agent spawn            │
│  ├── /robots.txt      → Crawl directives            │
│  ├── /llms.txt        → Service description         │
│  └── /sitemap.xml     → Endpoint discovery          │
├─────────────────────────────────────────────────────┤
│  Durable Object: AgentDO                             │
│  ├── State (JSON)                                    │
│  ├── SQLite database                                 │
│  ├── WebSocket connections                           │
│  └── @callable() methods                             │
├─────────────────────────────────────────────────────┤
│  KV: STATE (agents) + LOGS (activity)                │
└─────────────────────────────────────────────────────┘
```

## Durable Object: AgentDO

Each agent gets its own Durable Object with:

```typescript
// src/agent-do.ts
export class AgentDO extends Agent<Env, State> {
  // State management
  state = this.setState(initialState)
  
  // SQLite database
  db = this.sql`CREATE TABLE tasks (id TEXT PRIMARY KEY, ...)`
  
  // Callable from client
  @callable()
  async assignTask(task: Task) { ... }
  
  // WebSocket connections
  onConnect(connection) { ... }
  onMessage(connection, message) { ... }
}
```

## Task Engine

Distributed task system with KV persistence:

```typescript
// src/coordinator.ts
export class TaskEngine {
  // Create task
  async create(task: Task) {
    await this.env.LOGS.put(`task:${task.id}`, JSON.stringify(task))
  }
  
  // Pick task (claim)
  async pick(agentId: string) {
    // Find unclaimed task, claim it
  }
  
  // Complete task
  async result(taskId: string, result: any) {
    // Store result, notify via WebSocket
  }
}
```

## WebSocket Integration

Real-time communication with agents:

```typescript
// Client-side
const ws = new WebSocket(`wss://yourdomain.com/ws/agent/${agentId}`)

ws.onmessage = (event) => {
  const data = JSON.parse(event.data)
  console.log('Agent update:', data)
}

// Server-side (in AgentDO)
onMessage(connection, message) {
  // Broadcast to all connected clients
  this.broadcast(JSON.stringify(message))
}
```

## Sub-Agent Spawning

Parallel task execution:

```typescript
// Spawn sub-agent
const response = await fetch(`/agents/${agentId}/spawn`, {
  method: 'POST',
  body: JSON.stringify({
    task: 'Process data',
    type: 'worker'
  })
})

// List sub-agents
const subagents = await fetch(`/agents/${agentId}/subagents`)
```

## Human Dashboard

Monitor and control agents:

```typescript
// GET /dashboard
// Returns HTML dashboard with:
// - Agent status
// - Task progress
// - Activity logs
// - Manual controls
```

## Configuration

```bash
# wrangler.toml
[vars]
API_KEY = "your-api-key"

# KV namespaces
[[kv_namespaces]]
binding = "STATE"
id = "your-state-kv"

[[kv_namespaces]]
binding = "LOGS"
id = "your-logs-kv"

# Durable Objects
[durable_objects]
bindings = [
  { name = "AgentDO", class_name = "AgentDO" }
]

[[migrations]]
tag = "v1"
new_sqlite_classes = ["AgentDO"]
```

## Gotcha

**Durable Objects are stateful.** Each agent instance persists across requests. Use `setState()` for persistent state, and SQLite for complex queries. State is broadcast to all WebSocket clients automatically.