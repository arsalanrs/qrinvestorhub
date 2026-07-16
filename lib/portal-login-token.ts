import 'server-only';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { normalizePortalEmail } from '@/lib/portal-auth';
import { generateLoginToken, hashLoginToken } from '@/lib/portal-session';
import { buildPortalVerifyUrl } from '@/lib/zapier/notify-portal-login';

const TOKEN_TTL_MINUTES = 30;

export function sanitizePortalRedirect(path: string | null | undefined): string | null {
  if (!path) return null;
  const trimmed = path.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return null;
  return trimmed;
}

export async function mintPortalLoginUrl(
  email: string,
  options?: { redirect?: string | null },
): Promise<{ loginUrl: string; expiresAt: string }> {
  const normalized = normalizePortalEmail(email);
  if (!normalized || !normalized.includes('@')) {
    throw new Error('Valid email required');
  }

  const token = generateLoginToken();
  const tokenHash = hashLoginToken(token);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000).toISOString();

  const supabase = createSupabaseAdminClient();
  const { error: insertError } = await supabase.from('portal_login_tokens').insert({
    email: normalized,
    token_hash: tokenHash,
    expires_at: expiresAt,
  });

  if (insertError) {
    throw new Error('Could not create sign-in link');
  }

  const redirect = sanitizePortalRedirect(options?.redirect);
  const loginUrl = buildPortalVerifyUrl(token, redirect ? { redirect } : undefined);

  return { loginUrl, expiresAt };
}
