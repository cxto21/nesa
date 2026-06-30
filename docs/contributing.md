# Contributing to Bugeisha

How to contribute to the Bugeisha framework.

## Development Setup

```bash
# Clone the repository
git clone https://github.com/cxto21/bugeisha.git
cd bugeisha

# Install dependencies
npm install

# Start development
npm run dev

# Run tests
npm test
```

## Project Structure

```
bugeisha/
├── src/
│   ├── index.ts          # Entry point
│   ├── router.ts         # Core router
│   ├── types.ts          # TypeScript types
│   ├── middleware/        # Middleware functions
│   └── handlers/         # Route handlers
├── skills/               # Documentation skills
├── examples/             # Example projects
└── docs/                 # Documentation
```

## Code Style

- **TypeScript strict mode**
- **Explicit routes** — No decorators, no magic
- **Pure functions** — Handlers should be pure when possible
- **Minimal dependencies** — Only Itty Router

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Run specific test
npm test -- middleware.test.ts
```

### Test Guidelines

- Test handlers as pure functions
- Mock `env` and `ctx` for unit tests
- Verify both agent (JSON) and human (HTML) responses
- Keep tests simple and focused

## Adding Middleware

1. Create `src/middleware/my-middleware.ts`
2. Export a function with signature:
   ```typescript
   export const myMiddleware = async (request: BugeishaRequest, env: Env) => {
     // Return Response to stop, void to continue
   }
   ```
3. Add tests in `src/__tests__/middleware.test.ts`
4. Update documentation in `docs/middleware/`

## Adding Handlers

1. Create `src/handlers/my-handler.ts`
2. Export a handler function:
   ```typescript
   export const myHandler = async (request: BugeishaRequest, env: Env) => {
     return Response.json({ data: 'value' })
   }
   ```
3. Add tests in `src/__tests__/handlers.test.ts`
4. Update documentation in `docs/handlers/`

## Creating Skills

1. Create `skills/my-skill/` directory
2. Add `SKILL.md` with YAML frontmatter:
   ```yaml
   ---
   name: my-skill
   description: What this skill does
   ---
   
   # My Skill
   
   Instructions here...
   ```
3. Keep it concise: 3 lines description, 5 lines code, 1 gotcha

## Commit Messages

Use conventional commits:

```
feat: add new feature
fix: bug fix
docs: documentation update
test: add tests
refactor: code refactoring
```

## Pull Requests

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Update documentation
6. Submit a pull request

## Code Review

All PRs require review. We check:

- Code quality
- Test coverage
- Documentation
- Performance
- Security

## Gotcha

**Keep it minimal.** Bugeisha is about extreme simplicity. Don't add features that don't align with the philosophy.