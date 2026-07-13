import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const redirectTo = searchParams.get('redirectTo') || '/portal';
  const safeRedirect = redirectTo.startsWith('/') ? redirectTo : '/portal';

  const authError = searchParams.get('error');
  const errorCode = searchParams.get('error_code');
  const errorDescription = searchParams.get('error_description');

  if (authError || errorCode) {
    const message =
      errorCode === 'otp_expired'
        ? 'That sign-in link expired. Request a new one from the portal.'
        : errorDescription?.replace(/\+/g, ' ')
        || authError
        || 'Sign-in failed. Request a new link.';
    return NextResponse.redirect(
      `${origin}/portal?error=${encodeURIComponent(message)}`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${origin}/portal?error=${encodeURIComponent('Sign-in link expired or invalid. Request a new one.')}`
    );
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${origin}/portal?error=${encodeURIComponent(error.message)}`
    );
  }

  return NextResponse.redirect(`${origin}${safeRedirect}`);
}
