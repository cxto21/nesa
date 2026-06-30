// Multi-Agent Coordinator — Entry Point
// Nesa example: coordinate multiple AI agents to complete complex tasks
import { Router, error, json } from 'itty-router';
import type { CoordinatorRequest, Env } from './types';

// Middleware — agent detection
function detectAgent(request: CoordinatorRequest): void {
  const ua = request.headers.get('User-Agent')?.toLowerCase() ?? '';
  const aiPatterns = ['openai', 'gpt', 'claude', 'anthropic', 'cohere', 'llama', 'agent'];
  request.agentType = aiPatterns.some(p => ua.includes(p)) ? 'ai' : 'human';
}

// Handlers
import { home } from './handlers/home';
import { register, list as listAgents, heartbeat } from './handlers/agents';
import { create, pick, result, list as listTasks, detail } from './handlers/tasks';
import { dashboard } from './handlers/dashboard';
import { status } from './handlers/status';
import { logs } from './handlers/logs';

// Router
const router = Router({
  before: [detectAgent],
  catch: (err) => {
    console.error('Coordinator error:', err);
    return error(err);
  },
  finally: [json],
});

// ─── Public ─────────────────────────────────────────────
router.get('/', home);
router.get('/dashboard', dashboard);
router.get('/status', status);
router.get('/logs', logs);

// ─── Agents ─────────────────────────────────────────────
router.post('/agents/register', register);
router.get('/agents', listAgents);
router.post('/agents/:id/heartbeat', heartbeat);

// ─── Tasks ──────────────────────────────────────────────
router.post('/tasks/create', create);
router.get('/tasks/pick', pick);
router.post('/tasks/result', result);
router.get('/tasks', listTasks);
router.get('/tasks/:id', detail);

// ─── Catch-all ──────────────────────────────────────────
router.all('*', () => error(404, 'Not found'));

// ─── Logging wrapper ────────────────────────────────────
async function loggedFetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const start = Date.now();
  const response = await router.fetch(request, env, ctx);
  const url = new URL(request.url);

  const entry = {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    method: request.method,
    path: url.pathname + url.search,
    agentType: (request as CoordinatorRequest).agentType ?? 'unknown',
    status: response.status,
    duration: Date.now() - start,
    ip: request.headers.get('cf-connecting-ip') ?? 'unknown',
    userAgent: request.headers.get('user-agent') ?? '',
  };

  // Fire-and-forget: store in KV
  ctx.waitUntil(
    (env.LOGS ?? env.STATE).get('logs', 'json')
      .then((existing) => {
        const logs = ((existing as any[]) ?? []).concat(entry).slice(-500);
        return (env.LOGS ?? env.STATE).put('logs', JSON.stringify(logs));
      })
      .catch(() => {})
  );

  return response;
}

export default {
  fetch: loggedFetch,
};
