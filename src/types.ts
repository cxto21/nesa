// Nesa — Cloudflare Workers environment bindings
export interface Env {
  // Bindings (uncomment as needed)
  // CACHE: KVNamespace;
  // DB: D1Database;
  // AI: Ai;

  // Vars
  // ENVIRONMENT?: string;
}

// Nesa request extends Request with agent detection
export interface NesaRequest extends Request {
  // Detected user-agent type
  agentType?: 'ai' | 'bot' | 'human';
  // Parsed URL
  url: URL;
  // Route params (from Itty Router)
  params?: Record<string, string>;
  // Query params
  query?: Record<string, string>;
}

// Handler signature — receives request + env, returns Response
export type NesaHandler = (
  request: NesaRequest,
  env: Env,
  ctx: ExecutionContext,
) => Response | Promise<Response>;

// Middleware signature — return Response to stop, return void/undefined to continue
export type NesaMiddleware = (
  request: NesaRequest,
  env: Env,
  ctx: ExecutionContext,
) => Response | void | Promise<Response | void>;
