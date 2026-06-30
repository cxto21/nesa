# Current

## Task: Restructure Documentation

**Status:** In Progress
**Started:** 2026-06-30

### Goal
Restructure documentation following minimal agent-friendly pattern:
- AGENTS.md as single entry point
- docs/ with architecture.md, conventions.md, roadmap.md, decisions/
- tasks/ with TODO.md, current.md, backlog.md

### Why
The previous MkDocs structure (20 pages) was overkill for a ~200 LOC framework. Agents work better with minimal, focused context.

### Files Changed
- `AGENTS.md` — Rewritten to be concise entry point
- `docs/` — Replaced 20 MkDocs pages with 4 focused files
- `tasks/` — Added task tracking files

### Done
- [x] Rewrite AGENTS.md
- [x] Create docs/architecture.md
- [x] Create docs/conventions.md
- [x] Create docs/roadmap.md
- [x] Create docs/decisions/
- [x] Create tasks/ structure
- [x] Remove old mkdocs docs

### Next
- [ ] Commit and push changes
