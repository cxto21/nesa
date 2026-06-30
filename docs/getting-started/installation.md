# Installation

## Prerequisites

- [Node.js](https://nodejs.org/) 18+ (for development)
- [Cloudflare account](https://dash.cloudflare.com/sign-up) (for deployment)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) (for deployment)

## Create a new project

=== "npm"

    ```bash
    mkdir my-bugeisha-app && cd my-bugeisha-app
    npm init -y
    npm install itty-router
    npm install -D @cloudflare/workers-types typescript vitest wrangler
    ```

=== "yarn"

    ```bash
    mkdir my-bugeisha-app && cd my-bugeisha-app
    yarn init -y
    yarn add itty-router
    yarn add -D @cloudflare/workers-types typescript vitest wrangler
    ```

=== "pnpm"

    ```bash
    mkdir my-bugeisha-app && cd my-bugeisha-app
    pnpm init
    pnpm add itty-router
    pnpm add -D @cloudflare/workers-types typescript vitest wrangler
    ```

## Configure TypeScript

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "node",
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["@cloudflare/workers-types"]
  },
  "include": ["src/**/*.ts"]
}
```

## Configure Wrangler

Create `wrangler.toml`:

```toml
name = "my-bugeisha-app"
main = "src/index.ts"
compatibility_date = "2024-09-25"
```

## Project structure

```
my-bugeisha-app/
├── src/
│   ├── index.ts          # Entry point
│   ├── router.ts         # Router setup
│   ├── types.ts          # TypeScript types
│   └── handlers/         # Route handlers
├── package.json
├── tsconfig.json
└── wrangler.toml
```

## Next steps

- :material-arrow-right: [Quick Start](quickstart.md)
- :material-arrow-right: [Project Structure](project-structure.md)
