import { promises as fs } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const file = path.join(process.cwd(), 'data', 'analytics.json');

async function load() {
  try { return JSON.parse(await fs.readFile(file, 'utf8')); }
  catch { return []; }
}

function hash(value) {
  return crypto.createHash('sha256').update(value || '').digest('hex').slice(0, 12);
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const event = {
    id: crypto.randomUUID(),
    sessionId: String(body.sessionId || '').slice(0, 80),
    path: String(body.path || '/').slice(0, 200),
    referrer: String(body.referrer || '').slice(0, 300),
    device: String(body.device || 'unknown').slice(0, 40),
    screen: String(body.screen || '').slice(0, 40),
    language: String(body.language || '').slice(0, 40),
    visitor: hash(`${request.headers.get('user-agent') || ''}|${request.headers.get('accept-language') || ''}`),
    at: new Date().toISOString()
  };
  const events = await load();
  events.push(event);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(events.slice(-5000), null, 2));
  return Response.json({ ok: true });
}
