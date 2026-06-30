import type { NesaRequest, Env } from '../types';

// Sitemap handler — XML sitemap for agent discovery
// Helps agents and search engines discover all endpoints
export function sitemap(request: NesaRequest, env: Env): Response {
  const url = new URL(request.url);
  const base = `${url.protocol}//${url.host}`;

  const routes = [
    { path: '/', priority: '1.0', changefreq: 'daily' },
    { path: '/health', priority: '0.5', changefreq: 'hourly' },
    { path: '/agent/info', priority: '0.8', changefreq: 'weekly' },
    { path: '/agent/tools', priority: '0.8', changefreq: 'weekly' },
    { path: '/robots.txt', priority: '0.3', changefreq: 'monthly' },
    { path: '/llms.txt', priority: '0.3', changefreq: 'monthly' },
  ];

  const urls = routes.map(r => `  <url>
    <loc>${base}${r.path}</loc>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`).join('\n');

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml;charset=UTF-8' },
  });
}
