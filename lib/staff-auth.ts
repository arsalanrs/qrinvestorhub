import 'server-only';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getShapeLoRoster } from '@/integrations/shape/lo-roster';

export type StaffRole =
  | 'executive'
  | 'admin'
  | 'manager'
  | 'loan_officer'
  | 'processor'
  | 'closer'
  | string;

export type StaffUser = {
  id: string;
  email: string;
  full_name: string | null;
  role: StaffRole;
  depursLo: number | null;
};

const OPS_ROLES = new Set(['executive', 'admin', 'manager', 'loan_officer']);
const VIEW_ALL_ROLES = new Set(['executive', 'admin', 'manager']);

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function depursLoForStaffEmail(email: string | null | undefined): number | null {
  if (!email) return null;
  const normalized = normalizeEmail(email);
  const match = getShapeLoRoster().find(
    entry => entry.email && normalizeEmail(entry.email) === normalized,
  );
  return match?.depursLo ?? null;
}

export function canAccessInvestorHubOps(role: StaffRole | null | undefined): boolean {
  if (!role) return false;
  return OPS_ROLES.has(role);
}

export function canViewAllInvestorApplications(role: StaffRole | null | undefined): boolean {
  if (!role) return false;
  return VIEW_ALL_ROLES.has(role);
}

export async function getStaffUser(): Promise<StaffUser | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.email) return null;

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id, email, full_name, role, is_active')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError || !profile || profile.is_active === false) return null;
  if (!canAccessInvestorHubOps(profile.role)) return null;

  return {
    id: profile.id,
    email: normalizeEmail(profile.email || user.email),
    full_name: profile.full_name,
    role: profile.role,
    depursLo: depursLoForStaffEmail(profile.email || user.email),
  };
}

export function applicationVisibleToStaff(
  app: { assigned_lo?: { depursLo?: number } | null },
  staff: StaffUser,
): boolean {
  if (canViewAllInvestorApplications(staff.role)) return true;
  if (!staff.depursLo) return false;
  const assigned = app.assigned_lo?.depursLo;
  return assigned != null && assigned === staff.depursLo;
}
