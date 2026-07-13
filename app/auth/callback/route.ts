import { NextResponse } from 'next/server';

/** Legacy Supabase Auth callback — portal now uses /auth/portal-verify via Zapier email. */
export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  return NextResponse.redirect(
    `${origin}/portal?error=${encodeURIComponent('Please request a new sign-in link from the portal.')}`,
  );
}
