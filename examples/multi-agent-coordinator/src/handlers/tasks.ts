// Task Handlers — Create, pick, list, status
import type { CoordinatorRequest, Env } from './types';
import {
  createTask,
  getTask,
  getAllTasks,
  assignSubtask,
  submitResult,
  autoAssign,
  getStats,
} from '../coordinator';

// POST /tasks/create — Create a new task with subtasks
export function create(request: CoordinatorRequest, env: Env): Response | Promise<Response> {
  return request.json().then((body: any) => {
    if (!body.title || !body.description || !body.subtasks?.length) {
      return Response.json(
        { error: 'Missing required fields: title, description, subtasks[]' },
        { status: 400 },
      );
    }

    const task = createTask({
      title: body.title,
      description: body.description,
      subtasks: body.subtasks,
    });

    // Try to auto-assign
    const assignments = autoAssign();

    return Response.json({
      message: 'Task created',
      task,
      autoAssigned: assignments.length,
    }, { status: 201 });
  });
}

// GET /tasks/pick?role=researcher — Agent picks a task for its role
export function pick(request: CoordinatorRequest, env: Env): Response {
  const role = request.url.searchParams.get('role');
  if (!role) {
    return Response.json({ error: 'Missing role query param' }, { status: 400 });
  }

  const allTasks = getAllTasks();

  // Find first pending subtask matching this role
  for (const task of allTasks) {
    for (const subtask of task.subtasks) {
      if (subtask.role === role && subtask.status === 'pending') {
        // Auto-assign to the requesting agent (we need agent id)
        const agentId = request.url.searchParams.get('agentId');
        if (agentId) {
          assignSubtask(subtask.id, agentId);
        }

        return Response.json({
          subtask,
          task: {
            id: task.id,
            title: task.title,
            description: task.description,
          },
          instructions: {
            submitResult: `POST /tasks/result`,
            body: { subtaskId: subtask.id, result: '...' },
          },
        });
      }
    }
  }

  return Response.json({ message: 'No pending tasks for this role', role });
}

// POST /tasks/result — Submit result for a subtask
export function result(request: CoordinatorRequest, env: Env): Response | Promise<Response> {
  return request.json().then((body: any) => {
    if (!body.subtaskId || !body.result) {
      return Response.json(
        { error: 'Missing required fields: subtaskId, result' },
        { status: 400 },
      );
    }

    const ok = submitResult(body.subtaskId, body.result);

    if (!ok) {
      return Response.json({ error: 'Subtask not found or not assignable' }, { status: 404 });
    }

    return Response.json({ message: 'Result submitted', subtaskId: body.subtaskId });
  });
}

// GET /tasks — List all tasks
export function list(request: CoordinatorRequest, env: Env): Response {
  const allTasks = getAllTasks();
  const stats = getStats();

  if (request.agentType === 'ai') {
    return Response.json({ tasks: allTasks, stats });
  }

  // Human: HTML
  const rows = allTasks.map(t => {
    const subtasksDone = t.subtasks.filter(s => s.status === 'completed').length;
    const progress = t.subtasks.length > 0
      ? Math.round((subtasksDone / t.subtasks.length) * 100)
      : 0;

    return `
      <tr>
        <td><code>${t.id.slice(0, 8)}</code></td>
        <td>${t.title}</td>
        <td><span class="status status--${t.status}">${t.status}</span></td>
        <td>${subtasksDone}/${t.subtasks.length}</td>
        <td>${progress}%</td>
        <td><a href="/tasks/${t.id}">View</a></td>
      </tr>
    `;
  }).join('');

  return new Response(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tasks</title>
  <style>${sharedStyles()}</style>
</head>
<body>
  <div class="container">
    <h1>Tasks</h1>
    <p class="subtitle">${allTasks.length} task(s) total</p>
    <table>
      <thead>
        <tr><th>ID</th><th>Title</th><th>Status</th><th>Progress</th><th>%</th><th></th></tr>
      </thead>
      <tbody>${rows || '<tr><td colspan="6">No tasks created</td></tr>'}</tbody>
    </table>
    <a href="/dashboard" class="back">← Dashboard</a>
  </div>
</body>
</html>
  `, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
}

// GET /tasks/:id — Task detail
export function detail(request: CoordinatorRequest, env: Env): Response {
  const id = request.params?.id;
  if (!id) {
    return Response.json({ error: 'Missing task id' }, { status: 400 });
  }

  const task = getTask(id);
  if (!task) {
    return Response.json({ error: 'Task not found' }, { status: 404 });
  }

  if (request.agentType === 'ai') {
    return Response.json({ task });
  }

  // Human: HTML
  const subtaskRows = task.subtasks.map(st => `
    <tr>
      <td><code>${st.id.slice(0, 12)}</code></td>
      <td>${st.role}</td>
      <td>${st.description}</td>
      <td><span class="status status--${st.status}">${st.status}</span></td>
      <td>${st.assignedTo ? `<code>${st.assignedTo.slice(0, 8)}</code>` : '-'}</td>
      <td>${st.result ? `<pre>${st.result.slice(0, 100)}${st.result.length > 100 ? '...' : ''}</pre>` : '-'}</td>
    </tr>
  `).join('');

  return new Response(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Task: ${task.title}</title>
  <style>${sharedStyles()}</style>
</head>
<body>
  <div class="container">
    <h1>${task.title}</h1>
    <p class="subtitle">${task.description}</p>
    <p>Status: <span class="status status--${task.status}">${task.status}</span></p>
    ${task.result ? `<div class="card"><h2>Final Result</h2><pre>${task.result}</pre></div>` : ''}
    <h2 style="margin: 1.5rem 0 1rem; font-weight: 400; color: #888;">Subtasks</h2>
    <table>
      <thead>
        <tr><th>ID</th><th>Role</th><th>Description</th><th>Status</th><th>Assigned</th><th>Result</th></tr>
      </thead>
      <tbody>${subtaskRows}</tbody>
    </table>
    <a href="/tasks" class="back">← Tasks</a>
  </div>
</body>
</html>
  `, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
}

// ─── Shared Styles ──────────────────────────────────────
function sharedStyles(): string {
  return `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; background: #0a0a0a; color: #fafafa; }
    .container { max-width: 1000px; margin: 0 auto; padding: 2rem; }
    h1 { font-size: 2rem; font-weight: 100; letter-spacing: 0.2em; margin-bottom: 0.5rem; }
    .subtitle { color: #888; margin-bottom: 2rem; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 2rem; }
    th, td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid #222; }
    th { color: #888; font-weight: 400; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.1em; }
    td { font-size: 0.9rem; }
    .status { padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.8rem; }
    .status--idle { background: #1a3a1a; color: #4ade80; }
    .status--working { background: #3a3a1a; color: #facc15; }
    .status--pending { background: #1a1a3a; color: #60a5fa; }
    .status--assigned { background: #3a2a1a; color: #fb923c; }
    .status--in-progress { background: #3a3a1a; color: #facc15; }
    .status--completed { background: #1a3a1a; color: #4ade80; }
    .status--failed { background: #3a1a1a; color: #f87171; }
    a { color: #60a5fa; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .back { display: inline-block; margin-top: 1rem; color: #888; }
    .card { background: #111; border: 1px solid #222; border-radius: 8px; padding: 1.5rem; margin-bottom: 1rem; }
    .card h2 { font-size: 1rem; font-weight: 400; color: #888; margin-bottom: 0.5rem; }
    pre { background: #111; border: 1px solid #222; border-radius: 4px; padding: 0.5rem; overflow-x: auto; font-size: 0.8rem; }
    code { font-family: 'SF Mono', 'Fira Code', monospace; }
  `;
}
