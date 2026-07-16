import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { normalizePortalEmail } from '@/lib/portal-auth';
import {
  hashLoginToken,
  setPortalSessionCookie,
} from '@/lib/portal-session';
import { sanitizePortalRedirect } from '@/lib/portal-login-token';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')?.trim();
  const origin = req.nextUrl.origin;

  if (!token) {
    return NextResponse.redirect(
      `${origin}/portal?error=${encodeURIComponent('Invalid sign-in link.')}`,
    );
  }

  const tokenHash = hashLoginToken(token);
  const supabase = createSupabaseAdminClient();

  const { data: row, error } = await supabase
    .from('portal_login_tokens')
    .select('id, email, expires_at, used_at')
    .eq('token_hash', tokenHash)
    .maybeSingle();

  if (error || !row) {
    return NextResponse.redirect(
      `${origin}/portal?error=${encodeURIComponent('Sign-in link invalid or expired. Request a new one.')}`,
    );
  }

  if (row.used_at || new Date(row.expires_at).getTime() < Date.now()) {
    return NextResponse.redirect(
      `${origin}/portal?error=${encodeURIComponent('That sign-in link expired. Request a new one from the portal.')}`,
    );
  }

  await supabase
    .from('portal_login_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('id', row.id);

  await setPortalSessionCookie(normalizePortalEmail(row.email));

  const redirect = sanitizePortalRedirect(req.nextUrl.searchParams.get('redirect'));
  return NextResponse.redirect(`${origin}${redirect || '/portal'}`);
}
