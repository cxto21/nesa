# Skill: protocols

MCP + x402 — external protocol integrations for agent-native services.

```ts
// MCP: tool discovery + execution via @cloudflare/agents-sdk
// x402: payment-gated endpoints via x402 npm package
// Both are heavy — add only when needed, not by default
```

MCP: use `McpAgent` or `createMcpHandler` for Streamable HTTP transport. x402: use facilitator for payment verification, JWT cookies for session persistence. Both require their own SDK — Nesa stays minimal.
