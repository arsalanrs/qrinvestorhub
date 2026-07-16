import 'server-only';
import { NextRequest } from 'next/server';
import { verifyAdminCredentials } from '@/lib/admin-auth';
import { getStaffUser, type StaffUser } from '@/lib/staff-auth';

/** Prefer shared Supabase staff session; fall back to legacy header credentials. */
export async function getStaffUserFromRequest(req: NextRequest): Promise<StaffUser | null> {
  const fromSession = await getStaffUser();
  if (fromSession) return fromSession;

  const email = req.headers.get('x-admin-email');
  const password = req.headers.get('x-admin-password');
  if (!verifyAdminCredentials(email, password)) return null;

  return {
    id: 'legacy-admin',
    email: email!.trim().toLowerCase(),
    full_name: null,
    role: 'executive',
    depursLo: null,
  };
}

export async function verifyAdminRequest(req: NextRequest): Promise<boolean> {
  const staff = await getStaffUserFromRequest(req);
  return staff != null;
}
