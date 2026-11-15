import { createHmac, timingSafeEqual, createHash } from 'node:crypto';
export const sessionCookie = 'cimp_session';
export const sessionSeconds = 60 * 60 * 24 * 7;
export function passwordConfigured() { return (process.env.ADMIN_PASSWORD?.length || 0) >= 16; }
function secret() {
  if (!passwordConfigured()) throw new Error('Set ADMIN_PASSWORD to at least 16 characters.');
  return process.env.ADMIN_PASSWORD!;
}
export function matchesPassword(input: string) {
  const digest = (value: string) => createHash('sha256').update(value).digest();
  return timingSafeEqual(digest(input), digest(secret()));
}
export function signSession(expires = Math.floor(Date.now() / 1000) + sessionSeconds) {
  const payload = String(expires);
  return `${payload}.${createHmac('sha256', secret()).update(payload).digest('hex')}`;
}
export function validSession(token?: string, now = Math.floor(Date.now() / 1000)) {
  if (!passwordConfigured() || !token || !/^\d{10}\.[a-f0-9]{64}$/.test(token)) return false;
  const expiry = Number(token.split('.')[0]);
  if (expiry <= now || expiry > now + sessionSeconds + 60) return false;
  return timingSafeEqual(Buffer.from(token), Buffer.from(signSession(expiry)));
}
export function sameOrigin(request: Request) {
  try {
    const origin = new URL(request.headers.get('origin') || '');
    const url = new URL(request.url);
    return origin.protocol === url.protocol && origin.host === (request.headers.get('host') || url.host);
  } catch { return false; }
}
