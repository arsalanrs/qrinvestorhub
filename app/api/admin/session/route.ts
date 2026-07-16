import 'server-only';
import { NextResponse } from 'next/server';
import { getStaffUser, canViewAllInvestorApplications } from '@/lib/staff-auth';

export async function GET() {
  const staff = await getStaffUser();
  if (!staff) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      email: staff.email,
      fullName: staff.full_name,
      role: staff.role,
      canViewAll: canViewAllInvestorApplications(staff.role),
    },
  });
}
