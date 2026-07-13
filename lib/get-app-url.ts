import 'server-only';

function isLocalHostname(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return h === 'localhost' || h === '127.0.0.1' || h.endsWith('.local');
}

function isLocalOrigin(value: string): boolean {
  try {
    return isLocalHostname(new URL(normalizeOrigin(value)).hostname);
  } catch {
    return false;
  }
}

/**
 * Canonical app origin for auth redirects and email links.
 * Must be a full URL with protocol (https://...) in production.
 *
 * On Vercel, ignores localhost in NEXT_PUBLIC_APP_URL so email links never
 * point at a dev server when production env was copied from .env.local.
 */
export function getAppOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const vercelProduction = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  const vercelUrl = process.env.VERCEL_URL?.trim();
  const onVercel = Boolean(process.env.VERCEL);

  if (configured && !isLocalOrigin(configured)) {
    return normalizeOrigin(configured);
  }

  if (onVercel) {
    if (process.env.VERCEL_ENV === 'production' && vercelProduction) {
      return normalizeOrigin(`https://${vercelProduction}`);
    }
    if (vercelUrl) {
      return normalizeOrigin(`https://${vercelUrl}`);
    }
  }

  if (configured) {
    return normalizeOrigin(configured);
  }

  return 'http://localhost:3003';
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
