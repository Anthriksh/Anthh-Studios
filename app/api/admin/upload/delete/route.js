import { NextResponse } from 'next/server';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { requireAdmin } from '../../_auth';

export const runtime = 'nodejs';

export async function DELETE(request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { url } = await request.json().catch(() => ({}));
  if (!url || !url.startsWith('/uploads/')) return NextResponse.json({ error: 'Invalid upload.' }, { status: 400 });
  const filename = path.basename(url);
  try { await fs.unlink(path.join(process.cwd(), 'public', 'uploads', filename)); }
  catch (e) { if (e.code !== 'ENOENT') return NextResponse.json({ error: 'Could not delete file.' }, { status: 500 }); }
  return NextResponse.json({ ok: true });
}
