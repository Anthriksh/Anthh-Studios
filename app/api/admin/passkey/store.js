import fs from 'node:fs/promises';
import path from 'node:path';

const file = path.join(process.cwd(), 'data', 'passkey.json');

export async function readPasskey() {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch {
    return {};
  }
}

export async function writePasskey(value) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(value, null, 2));
}

export function base64urlFromBytes(bytes) {
  return Buffer.from(bytes).toString('base64url');
}

export function bytesFromBase64url(value) {
  return new Uint8Array(Buffer.from(value, 'base64url'));
}
