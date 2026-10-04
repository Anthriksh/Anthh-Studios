import { NextResponse } from 'next/server';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { requireAdmin } from '../_auth';

const file = path.join(process.cwd(), 'data', 'analytics.json');
export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try { return NextResponse.json(JSON.parse(await fs.readFile(file, 'utf8'))); }
  catch { return NextResponse.json([]); }
}
