import { createHmac, randomBytes, timingSafeEqual, createHash } from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

/**
 * Single shared HR account, authenticated against ADMIN_PASSWORD and carried
 * in an HMAC-signed cookie. Deliberately minimal: this app is designed to run
 * on your own network. If you ever expose it to the public internet, replace
 * this with per-user accounts and real password hashing before you do.
 */

const COOKIE = 'hriq_session';
const SESSION_HOURS = 12;

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    throw new Error(
      'SESSION_SECRET is missing or too short. Set a random value of at least 32 characters in .env.local (see .env.example).',
    );
  }
  return s;
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('base64url');
}

function safeEqual(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function checkPassword(candidate: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    throw new Error('ADMIN_PASSWORD is not set. See .env.example.');
  }
  return safeEqual(candidate, expected);
}

export async function createSession(): Promise<void> {
  const exp = Date.now() + SESSION_HOURS * 3600_000;
  const payload = `${exp}.${randomBytes(12).toString('base64url')}`;
  const jar = await cookies();
  jar.set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_HOURS * 3600,
    // Enable when serving over HTTPS. Left off so plain-HTTP LAN use works.
    secure: process.env.COOKIE_SECURE === '1',
  });
}

export async function destroySession(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

export async function isAuthed(): Promise<boolean> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return false;
  const idx = raw.lastIndexOf('.');
  if (idx === -1) return false;
  const payload = raw.slice(0, idx);
  const mac = raw.slice(idx + 1);
  if (!safeEqual(mac, sign(payload))) return false;
  const exp = Number(payload.split('.')[0]);
  return Number.isFinite(exp) && exp > Date.now();
}

/** Use at the top of every admin server component and admin API route. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAuthed())) redirect('/login');
}
