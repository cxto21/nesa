# Agent-Tools Handler

**Agent-tools handler** provides machine-readable tool definitions at `/agent/tools` for AI agent function calling.

## Why Tool Definitions?

AI agents need to know:

- **What tools are available** — Names and descriptions
- **How to call them** — Parameters and types
- **What they return** — Response format

This enables autonomous agent workflows.

## Usage

```typescript
import { agentToolsHandler } from '../handlers/agent-tools'

router.get('/agent/tools', agentToolsHandler)
```

## Response Format

Returns OpenAI-compatible function calling format:

```json
{
  "tools": [
    {
      "name": "get_weather",
      "description": "Get current weather for a location",
      "parameters": {
        "type": "object",
        "properties": {
          "location": {
            "type": "string",
            "description": "City and country"
          }
        },
        "required": ["location"]
      }
    }
  ]
}
```

## Defining Your Tools

```typescript
import { agentToolsHandler } from '../handlers/agent-tools'

// Define your tools
const tools = [
  {
    name: 'search_users',
    description: 'Search users by name or email',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' }
      },
      required: ['query']
    }
  }
]

// Pass tools to handler
router.get('/agent/tools', agentToolsHandler(tools))
```

## Integration with Agent Handler

Tools work with the agent handler for function calling:

```typescript
router.get('/agent/tools', agentToolsHandler(myTools))
router.post('/agent', agentHandler(myTools))
```

## Gotcha

**Tools are static definitions.** They describe what your API can do, not how to do it. For dynamic tool discovery, use the sitemap and llms.txt endpoints.