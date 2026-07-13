import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const redirectTo = searchParams.get('redirectTo') || '/portal';
  const safeRedirect = redirectTo.startsWith('/') ? redirectTo : '/portal';

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
