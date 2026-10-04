import { NextResponse } from 'next/server';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { requireAdmin } from '../_auth';

export const runtime = 'nodejs';

const MAX = 200 * 1024 * 1024;
const allowed = new Map([
  ['image/jpeg','.jpg'], ['image/png','.png'], ['image/webp','.webp'], ['image/gif','.gif'],
  ['video/mp4','.mp4'], ['video/webm','.webm'], ['audio/mpeg','.mp3'], ['audio/wav','.wav'], ['audio/x-wav','.wav'], ['audio/ogg','.ogg'], ['audio/mp4','.m4a']
]);

export async function POST(request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const form = await request.formData();
    const file = form.get('file');
    if (!file || typeof file === 'string') return NextResponse.json({ error: 'No file selected.' }, { status: 400 });
    const ext = allowed.get(file.type);
    if (!ext) return NextResponse.json({ error: `Unsupported file type: ${file.type || 'unknown'}` }, { status: 400 });
    if (file.size > MAX) return NextResponse.json({ error: 'File too large. Maximum is 200 MB.' }, { status: 400 });
    const name = `${crypto.randomUUID()}${ext}`;
    const dir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
    const kind = file.type.startsWith('image/') ? 'IMAGE' : file.type.startsWith('video/') ? 'VIDEO' : 'AUDIO';
    return NextResponse.json({ ok: true, url: `/uploads/${name}`, name: file.name, type: file.type, kind });
  } catch (error) {
    return NextResponse.json({ error: error?.message || 'Upload failed.' }, { status: 500 });
  }
}
