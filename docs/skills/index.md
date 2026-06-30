# Skills

**Skills are guides, not code.** They help you integrate Bugeisha with Cloudflare services and patterns.

## What Are Skills?

Skills are documentation folders with:

- `SKILL.md` — Instructions and patterns
- Optional scripts or assets

They're **reference material** — you decide if you need them.

## Available Skills

### Core

| Skill | Description |
|-------|-------------|
| `core` | Core framework patterns and best practices |
| `security` | Security middleware and authentication |
| `agent-native` | Agent-native API design patterns |

### Storage

| Skill | Description |
|-------|-------------|
| `storage` | KV, D1, and R2 integration |
| `queues` | Message queue patterns |

### DevEx

| Skill | Description |
|-------|-------------|
| `devex` | Developer experience and tooling |
| `static-assets` | Static file serving |

### DevOps

| Skill | Description |
|-------|-------------|
| `devops` | Deployment and monitoring |
| `protocols` | HTTP, WebSocket, gRPC patterns |

### Agent-Specific

| Skill | Description |
|-------|-------------|
| `agent-discoverability` | Making APIs discoverable to agents |
| `agents-md` | AGENTS.md file patterns |

### Cloudflare Services

| Skill | Description |
|-------|-------------|
| `workers-ai` | Workers AI integration |
| `multi-model` | Multi-model orchestration |
| `agents-sandbox` | Secure code execution |

## Using Skills

1. **Browse** — Look at available skills in `skills/` directory
2. **Read** — Open `SKILL.md` for instructions
3. **Apply** — Follow the patterns in your code
4. **Decide** — Choose what works for your use case

## Skill Quality Standards

Each skill follows these rules:

- **3 lines description** — What it does
- **5 lines code** — Minimal working example
- **1 gotcha** — What to watch out for
- **Max 10 lines total** — Keep it concise

## Creating Skills

To create a new skill:

```bash
mkdir skills/my-skill
cat > skills/my-skill/SKILL.md << 'EOF'
---
name: my-skill
description: What this skill does
---

# My Skill

Instructions here...
EOF
```

## Gotcha

**Skills are guides.** They're not required — just reference material. Use what makes sense for your project.