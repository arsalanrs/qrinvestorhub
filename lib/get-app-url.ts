import 'server-only';

/** Canonical production URL — used when env points at localhost on Vercel. */
export const INVESTOR_HUB_PRODUCTION_URL = 'https://qrinvestorhub.vercel.app';

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
  const explicit =
    process.env.INVESTOR_HUB_PUBLIC_URL?.trim()
    || process.env.NEXT_PUBLIC_APP_URL?.trim();
  const vercelProduction = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  const vercelUrl = process.env.VERCEL_URL?.trim();
  const onVercel = Boolean(process.env.VERCEL);
  const isProductionDeploy = process.env.VERCEL_ENV === 'production';

  if (explicit && !isLocalOrigin(explicit)) {
    return normalizeOrigin(explicit);
  }

  if (onVercel) {
    if (isProductionDeploy) {
      if (vercelProduction) {
        return normalizeOrigin(`https://${vercelProduction}`);
      }
      return INVESTOR_HUB_PRODUCTION_URL;
    }
    if (vercelUrl) {
      return normalizeOrigin(`https://${vercelUrl}`);
    }
  }

  if (explicit) {
    return normalizeOrigin(explicit);
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
