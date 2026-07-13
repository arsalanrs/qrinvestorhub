import 'server-only';
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import { normalizePortalEmail } from '@/lib/portal-auth';

export const PORTAL_SESSION_COOKIE = 'qr-portal-session';
const SESSION_DAYS = 7;

function sessionSecret(): string {
  const secret =
    process.env.PORTAL_SESSION_SECRET?.trim()
    || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
    || process.env.INVESTOR_HUB_ADMIN_PASSWORD?.trim();
  if (!secret) {
    throw new Error('PORTAL_SESSION_SECRET is not configured');
  }
  return secret;
}

function sign(payload: string): string {
  return createHmac('sha256', sessionSecret()).update(payload).digest('base64url');
}

function encodeSession(email: string): string {
  const exp = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const body = Buffer.from(JSON.stringify({ email: normalizePortalEmail(email), exp }), 'utf8').toString('base64url');
  return `${body}.${sign(body)}`;
}

function decodeSession(value: string): string | null {
  const [body, sig] = value.split('.');
  if (!body || !sig) return null;
  const expected = sign(body);
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as { email?: string; exp?: number };
    if (!parsed.email || !parsed.exp || Date.now() > parsed.exp) return null;
    return normalizePortalEmail(parsed.email);
  } catch {
    return null;
  }
}

export async function setPortalSessionCookie(email: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(PORTAL_SESSION_COOKIE, encodeSession(email), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function clearPortalSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(PORTAL_SESSION_COOKIE);
}

export async function getPortalSessionEmailFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(PORTAL_SESSION_COOKIE)?.value;
  if (!value) return null;
  return decodeSession(value);
}

export function hashLoginToken(token: string): string {
  return createHmac('sha256', sessionSecret()).update(token).digest('hex');
}

export function generateLoginToken(): string {
  return randomBytes(32).toString('base64url');
}
