# Decisions

Architecture Decision Records (ADRs) for Bugeisha.

## Format

Each decision file follows the format:

```
# ADR-XXX: Title

## Status
Accepted | Proposed | Deprecated

## Context
What is the issue that motivates this decision?

## Decision
What is the change being proposed or decided?

## Consequences
What are the trade-offs of this decision?
```

## Index

| ADR | Decision | Status |
|-----|----------|--------|
| ADR-001 | Agent detection via User-Agent | Accepted |
| ADR-002 | Middleware returns Response or void | Accepted |
| ADR-003 | Dual response pattern (JSON/HTML) | Accepted |
| ADR-004 | Itty Router over Express-like routers | Accepted |
| ADR-005 | TypeScript strict mode | Accepted |
| ADR-006 | No global middleware — explicit per-handler | Accepted |
| ADR-007 | Auth is opt-in, not in default pipeline | Accepted |
| ADR-008 | Skills as documentation, not code | Accepted |
