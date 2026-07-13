import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { normalizePortalEmail, portalEmailHasApplications } from '@/lib/portal-auth';

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

    const origin =
      req.headers.get('origin')?.replace(/\/$/, '')
      || process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')
      || 'http://localhost:3003';

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${origin}/auth/callback?redirectTo=${encodeURIComponent('/portal')}`,
      },
    });

    if (error) {
      console.error('[portal/magic-link]', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, sent: true });
  } catch (err) {
    console.error('[portal/magic-link]', err);
    return NextResponse.json({ error: 'Could not send sign-in link' }, { status: 500 });
  }
}
