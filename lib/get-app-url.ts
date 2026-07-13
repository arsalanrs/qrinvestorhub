import 'server-only';

/**
 * Canonical app origin for auth redirects and email links.
 * Must be a full URL with protocol (https://...) in production.
 */
export function getAppOrigin(): string {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL?.trim()
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')
    || 'http://localhost:3003';

  return normalizeOrigin(raw);
}

export function normalizeOrigin(value: string): string {
  let url = value.trim().replace(/\/$/, '');
  if (!url) return 'http://localhost:3003';
  if (!/^https?:\/\//i.test(url)) {
    // Bare hostname (e.g. qrinvestorhub.vercel.app) breaks Supabase magic links
    url = `https://${url}`;
  }
  return url;
}

export function authCallbackUrl(redirectTo = '/portal'): string {
  const origin = getAppOrigin();
  return `${origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`;
}
