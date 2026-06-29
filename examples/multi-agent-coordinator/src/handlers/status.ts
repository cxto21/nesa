// Status Handler — JSON endpoint for agents
import type { CoordinatorRequest, Env } from '../types';
import { getStats, getAllAgents, getAllTasks } from '../coordinator';

export function status(request: CoordinatorRequest, env: Env): Response {
  return Response.json({
    service: 'multi-agent-coordinator',
    version: '0.1.0',
    stats: getStats(),
    agents: getAllAgents(),
    tasks: getAllTasks(),
    endpoints: {
      register: 'POST /agents/register',
      listAgents: 'GET /agents',
      heartbeat: 'POST /agents/:id/heartbeat',
      createTask: 'POST /tasks/create',
      pickTask: 'GET /tasks/pick?role=<role>&agentId=<id>',
      submitResult: 'POST /tasks/result',
      listTasks: 'GET /tasks',
      taskDetail: 'GET /tasks/:id',
      dashboard: 'GET /dashboard',
    },
  }, {
    headers: { 'X-Agent-Optimized': 'true' },
  });
}
