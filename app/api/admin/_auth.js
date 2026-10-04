import crypto from 'node:crypto';
import { cookies } from 'next/headers';

export const SESSION_MAX_AGE = 30 * 24 * 60 * 60;

function sign(value) {
  return crypto
    .createHmac('sha256', process.env.ADMIN_SESSION_SECRET || 'dev-secret')
    .update(value)
    .digest('hex');
}

export function createAdminToken() {
  const exp = Date.now() + SESSION_MAX_AGE * 1000;
  const payload = String(exp);
  return `${payload}.${sign(payload)}`;
}

export async function requireAdmin() {
  const token = (await cookies()).get('anthriksh_admin')?.value;
  if (!token) return false;
  const [exp, signature] = token.split('.');
  if (!exp || !signature || Number(exp) < Date.now()) return false;
  const expected = sign(exp);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
