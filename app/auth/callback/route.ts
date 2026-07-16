import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { canAccessInvestorHubOps, getStaffUser } from '@/lib/staff-auth';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const accessToken = searchParams.get('sso_at');
  const refreshToken = searchParams.get('sso_rt');
  const redirectTo = searchParams.get('redirectTo') || '/ops/investor-hub';

  const supabase = await createSupabaseServerClient();

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  } else if (accessToken && refreshToken) {
    await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  }

  const staff = await getStaffUser();
  if (!staff) {
    await supabase.auth.signOut();
    return NextResponse.redirect(
      `${origin}/ops/investor-hub?error=${encodeURIComponent('Investor Hub ops access is limited to authorized QuestRock staff.')}`,
    );
  }

  if (redirectTo.startsWith('/ops') && !canAccessInvestorHubOps(staff.role)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(
      `${origin}/ops/investor-hub?error=${encodeURIComponent('Your account does not have ops access.')}`,
    );
  }

  return NextResponse.redirect(`${origin}${redirectTo}`);
}
