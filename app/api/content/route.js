import { NextResponse } from 'next/server';
import { promises as fs } from 'node:fs';
import path from 'node:path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const file = path.join(process.cwd(), 'data', 'content.json');

export async function GET() {
  try {
    const content = JSON.parse(await fs.readFile(file, 'utf8'));
    return NextResponse.json(content, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'Content is unavailable.' }, { status: 500 });
  }
}
