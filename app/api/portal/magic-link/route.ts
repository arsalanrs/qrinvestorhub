import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { normalizePortalEmail, portalEmailHasApplications } from '@/lib/portal-auth';
import {
  generateLoginToken,
  hashLoginToken,
} from '@/lib/portal-session';
import {
  buildPortalLoginZapierPayload,
  buildPortalVerifyUrl,
  notifyZapierPortalLogin,
} from '@/lib/zapier/notify-portal-login';

const TOKEN_TTL_MINUTES = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { email?: string };
    const email = normalizePortalEmail(body.email || '');

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }

    const hasApps = await portalEmailHasApplications(email);
    if (!hasApps) {
      return NextResponse.json({
        ok: true,
        sent: false,
        reason: 'no_applications',
      });
    }

    const token = generateLoginToken();
    const tokenHash = hashLoginToken(token);
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000).toISOString();

    const supabase = createSupabaseAdminClient();
    const { error: insertError } = await supabase.from('portal_login_tokens').insert({
      email,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });

    if (insertError) {
      console.error('[portal/magic-link] token insert:', insertError.message);
      return NextResponse.json({ error: 'Could not create sign-in link' }, { status: 500 });
    }

    const loginUrl = buildPortalVerifyUrl(token);
    const zapPayload = buildPortalLoginZapierPayload(email, loginUrl);
    const zapResult = await notifyZapierPortalLogin(zapPayload);

    if (!zapResult.sent) {
      console.error('[portal/magic-link] zapier:', 'error' in zapResult ? zapResult.error : zapResult.reason);
      return NextResponse.json(
        { error: 'Could not send sign-in email. Try again shortly.' },
        { status: 503 },
      );
    }

    return NextResponse.json({ ok: true, sent: true });
  } catch (err) {
    console.error('[portal/magic-link]', err);
    return NextResponse.json({ error: 'Could not send sign-in link' }, { status: 500 });
  }
}
