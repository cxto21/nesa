// Chat Handler — Minimal chat interface with @mention routing
import type { CoordinatorRequest, Env, ChatMessage } from '../types';
import { getAllAgents } from '../coordinator';

const CHAT_KEY = 'chat-messages';
const MAX_MESSAGES = 100;

// ─── KV helpers ────────────────────────────────────────
async function getMessages(env: Env): Promise<ChatMessage[]> {
  const store = (env as any).LOGS ?? (env as any).STATE;
  const data: ChatMessage[] | null = await store.get(CHAT_KEY, 'json');
  return data ?? [];
}

async function saveMessage(env: Env, msg: ChatMessage): Promise<void> {
  const store = (env as any).LOGS ?? (env as any).STATE;
  const messages = await getMessages(env);
  messages.push(msg);
  await store.put(CHAT_KEY, JSON.stringify(messages.slice(-MAX_MESSAGES)));
}

// ─── Parse @mentions ───────────────────────────────────
function parseMention(content: string): string | null {
  const match = content.match(/@(\w[\w-]*)/);
  return match ? match[1] : null;
}

// ─── POST /chat/send ──────────────────────────────────
export async function send(request: CoordinatorRequest, env: Env): Promise<Response> {
  const body = await request.json() as any;
  const content = body.content?.trim();
  if (!content) {
    return Response.json({ error: 'Missing content' }, { status: 400 });
  }

  const to = parseMention(content);
  const agents = await getAllAgents(env);

  // Save user message
  const userMsg: ChatMessage = {
    id: crypto.randomUUID(),
    from: 'user',
    to,
    content,
    timestamp: Date.now(),
    type: 'user',
  };
  await saveMessage(env, userMsg);

  // If @mention, generate agent response
  if (to) {
    const agent = agents.find(a => a.name === to || a.role === to);
    if (agent) {
      const agentMsg: ChatMessage = {
        id: crypto.randomUUID(),
        from: agent.name,
        to: 'user',
        content: generateAgentResponse(agent, content),
        timestamp: Date.now() + 1,
        type: 'agent',
      };
      await saveMessage(env, agentMsg);
    } else {
      const sysMsg: ChatMessage = {
        id: crypto.randomUUID(),
        from: 'system',
        to: null,
        content: `Agent "${to}" not found. Available: ${agents.map(a => a.name).join(', ') || 'none'}`,
        timestamp: Date.now() + 1,
        type: 'system',
      };
      await saveMessage(env, sysMsg);
    }
  }

  return Response.json({ ok: true, message: userMsg });
}

// ─── Agent response generator ─────────────────────────
function generateAgentResponse(agent: any, userMessage: string): string {
  const role = agent.role;
  const caps = agent.capabilities.join(', ');

  if (role === 'researcher') {
    return `🔬 [${agent.name}] I can research that. My capabilities: ${caps}. Analyzing your request: "${userMessage.slice(0, 80)}..."`;
  }
  if (role === 'writer') {
    return `✍️ [${agent.name}] I'll draft something for that. Capabilities: ${caps}. Working on: "${userMessage.slice(0, 80)}..."`;
  }
  if (role === 'reviewer') {
    return `📋 [${agent.name}] I'll review that. Capabilities: ${caps}. Evaluating: "${userMessage.slice(0, 80)}..."`;
  }
  return `🤖 [${agent.name}] Received. Role: ${role}. Capabilities: ${caps}. Processing: "${userMessage.slice(0, 80)}..."`;
}

// ─── GET /chat/messages ───────────────────────────────
export async function messages(request: CoordinatorRequest, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') ?? '50', 10);
  const all = await getMessages(env);
  const recent = all.slice(-limit);

  return Response.json({
    messages: recent,
    count: recent.length,
  });
}

// ─── GET /chat (HTML UI) ──────────────────────────────
export async function chatUI(request: CoordinatorRequest, env: Env): Promise<Response> {
  const agents = await getAllAgents(env);
  const agentList = agents.map(a => `"${a.name}"`).join(', ');

  return new Response(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Agent Chat</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; background: #0a0a0a; color: #fafafa; height: 100vh; display: flex; flex-direction: column; }
    .header { padding: 1rem 1.5rem; border-bottom: 1px solid #222; display: flex; justify-content: space-between; align-items: center; }
    .header h1 { font-size: 1.2rem; font-weight: 400; letter-spacing: 0.15em; }
    .header .agents { font-size: 0.75rem; color: #666; }
    .header a { color: #60a5fa; text-decoration: none; font-size: 0.8rem; }
    .messages { flex: 1; overflow-y: auto; padding: 1rem 1.5rem; display: flex; flex-direction: column; gap: 0.75rem; }
    .msg { max-width: 80%; padding: 0.6rem 1rem; border-radius: 8px; font-size: 0.9rem; line-height: 1.4; word-break: break-word; }
    .msg--user { align-self: flex-end; background: #1a3a5a; color: #fafafa; }
    .msg--agent { align-self: flex-start; background: #1a2a1a; color: #c8e6c9; border-left: 3px solid #4ade80; }
    .msg--system { align-self: center; background: #1a1a2a; color: #888; font-size: 0.8rem; font-style: italic; }
    .msg .meta { font-size: 0.65rem; color: #666; margin-top: 0.25rem; }
    .msg--agent .meta { color: #4ade80; }
    .input-area { padding: 1rem 1.5rem; border-top: 1px solid #222; display: flex; gap: 0.75rem; }
    .input-area input { flex: 1; background: #111; border: 1px solid #333; color: #fafafa; padding: 0.7rem 1rem; border-radius: 6px; font-size: 0.9rem; outline: none; }
    .input-area input:focus { border-color: #60a5fa; }
    .input-area input::placeholder { color: #555; }
    .input-area button { background: #1a3a5a; color: #fafafa; border: none; padding: 0.7rem 1.5rem; border-radius: 6px; cursor: pointer; font-size: 0.9rem; }
    .input-area button:hover { background: #2a4a6a; }
    .hint { padding: 0.5rem 1.5rem; font-size: 0.7rem; color: #555; border-top: 1px solid #1a1a1a; }
  </style>
</head>
<body>
  <div class="header">
    <h1>CHAT</h1>
    <span class="agents">Agents: ${agentList || 'none registered'}</span>
    <a href="/dashboard">← Dashboard</a>
  </div>
  <div class="messages" id="messages"></div>
  <div class="input-area">
    <input type="text" id="input" placeholder="Type a message... Use @agent-name to mention" autofocus />
    <button onclick="send()">Send</button>
  </div>
  <div class="hint">Mention agents with @name — e.g. @researcher-1 research edge computing trends</div>

  <script>
    const input = document.getElementById('input');
    const box = document.getElementById('messages');
    let lastId = '';

    input.addEventListener('keydown', e => { if (e.key === 'Enter') send(); });

    async function send() {
      const content = input.value.trim();
      if (!content) return;
      input.value = '';
      await fetch('/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      load();
    }

    async function load() {
      const res = await fetch('/chat/messages?limit=50');
      const data = await res.json();
      if (data.messages.length === 0) return;
      const latest = data.messages[data.messages.length - 1].id;
      if (latest === lastId) return;
      lastId = latest;
      box.innerHTML = data.messages.map(m => {
        const cls = m.type === 'user' ? 'user' : m.type === 'agent' ? 'agent' : 'system';
        const time = new Date(m.timestamp).toLocaleTimeString();
        const name = m.type === 'user' ? 'You' : m.type === 'agent' ? m.from : 'system';
        return '<div class="msg msg--' + cls + '">'
          + '<div>' + escHtml(m.content) + '</div>'
          + '<div class="meta">' + name + ' · ' + time + '</div>'
          + '</div>';
      }).join('');
      box.scrollTop = box.scrollHeight;
    }

    function escHtml(s) {
      return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    load();
    setInterval(load, 2000);
  </script>
</body>
</html>`, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
}
