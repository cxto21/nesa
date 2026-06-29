# Multi-Agent Coordinator

A Nesa example: coordinate multiple AI agents to complete complex tasks.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cxto21/Parina-Framework/tree/main/nesa/examples/multi-agent-coordinator)

## What It Does

1. **Agents register** with roles (researcher, writer, reviewer, etc.)
2. **User submits a task** broken into subtasks
3. **Coordinator assigns** subtasks to agents by role
4. **Agents pick up work**, execute, and submit results
5. **Coordinator assembles** the final result

## Quick Start

```bash
cd nesa/examples/multi-agent-coordinator
npm install
npm run dev
```

Visit `http://localhost:8787/dashboard` for the human dashboard.

## Agent Protocol

### 1. Register

```bash
curl -X POST http://localhost:8787/agents/register \
  -H "Content-Type: application/json" \
  -d '{"name": "researcher-1", "role": "researcher", "capabilities": ["search", "summarize"]}'
```

Response:
```json
{
  "message": "Agent registered",
  "agent": {
    "id": "abc-123",
    "name": "researcher-1",
    "role": "researcher",
    "capabilities": ["search", "summarize"],
    "status": "idle"
  },
  "instructions": {
    "pickTask": "GET /tasks/pick?role=researcher",
    "submitResult": "POST /tasks/result",
    "heartbeat": "POST /agents/abc-123/heartbeat"
  }
}
```

### 2. Create a Task

```bash
curl -X POST http://localhost:8787/tasks/create \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Write article about AI trends",
    "description": "Research and write a comprehensive article",
    "subtasks": [
      { "role": "researcher", "description": "Research latest AI trends 2026" },
      { "role": "writer", "description": "Write the article based on research" },
      { "role": "reviewer", "description": "Review and provide feedback" }
    ]
  }'
```

### 3. Pick a Task (as agent)

```bash
curl "http://localhost:8787/tasks/pick?role=researcher&agentId=abc-123"
```

### 4. Submit Result

```bash
curl -X POST http://localhost:8787/tasks/result \
  -H "Content-Type: application/json" \
  -d '{"subtaskId": "abc-123-st-0", "result": "Research findings: AI agents are..."}'
```

### 5. Check Status

```bash
curl http://localhost:8787/status
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Home — JSON for agents, HTML for humans |
| GET | `/dashboard` | Human dashboard with stats |
| GET | `/status` | JSON status for agents |
| POST | `/agents/register` | Register a new agent |
| GET | `/agents` | List all agents |
| POST | `/agents/:id/heartbeat` | Agent heartbeat |
| POST | `/tasks/create` | Create a task with subtasks |
| GET | `/tasks/pick?role=<role>` | Pick a task for your role |
| POST | `/tasks/result` | Submit subtask result |
| GET | `/tasks` | List all tasks |
| GET | `/tasks/:id` | Task detail with subtasks |

## Architecture

```
Agent A (researcher)  ─┐
Agent B (writer)      ─┼──> Coordinator ──> Assembled Result
Agent C (reviewer)    ─┘
```

## State

This example uses **in-memory state** (per-isolate). For production:

- Use **Durable Objects** for distributed state
- Use **KV** for agent registry persistence
- Use **D1** for task history and audit logs

## Files

```
src/
├── index.ts              # Entry point + router
├── types.ts              # TypeScript types
├── coordinator.ts        # Core: registry + task engine
└── handlers/
    ├── home.ts           # Home (JSON/HTML)
    ├── agents.ts         # Agent registration
    ├── tasks.ts          # Task management
    ├── dashboard.ts      # Human dashboard
    └── status.ts         # JSON status
```
