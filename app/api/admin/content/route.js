import { NextResponse } from 'next/server';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { requireAdmin } from '../_auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const file = path.join(process.cwd(), 'data', 'content.json');

async function readContent() {
  await fs.mkdir(path.dirname(file), { recursive: true });
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch {
    const empty = { artist: {}, music: [], guitars: [], archive: [], currently: {}, media: [] };
    await fs.writeFile(file, JSON.stringify(empty, null, 2), 'utf8');
    return empty;
  }
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized. Please log in again.' }, { status: 401 });
  try {
    return NextResponse.json(await readContent(), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ error: error?.message || 'Could not read content.' }, { status: 500 });
  }
}

export async function PUT(request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized. Please log in again.' }, { status: 401 });
  try {
    const body = await request.json();
    if (!body || typeof body !== 'object') throw new Error('Invalid content payload.');
    await fs.mkdir(path.dirname(file), { recursive: true });
    const tmp = `${file}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(body, null, 2), 'utf8');
    await fs.rename(tmp, file);
    const saved = JSON.parse(await fs.readFile(file, 'utf8'));
    return NextResponse.json({ ok: true, content: saved, publishedAt: new Date().toISOString() }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ error: error?.message || 'Could not publish.' }, { status: 500 });
  }
}
