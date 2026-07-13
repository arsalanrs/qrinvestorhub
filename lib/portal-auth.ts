import 'server-only';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { getPortalSessionEmailFromCookie } from '@/lib/portal-session';

export function normalizePortalEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function emailsForBorrower(borrower: unknown): string[] {
  const b = borrower as {
    email?: string;
    coBorrowerEmail?: string;
    hasCoBorrower?: boolean;
  } | null;
  if (!b) return [];
  const emails: string[] = [];
  if (b.email?.trim()) emails.push(normalizePortalEmail(b.email));
  if (b.hasCoBorrower && b.coBorrowerEmail?.trim()) {
    emails.push(normalizePortalEmail(b.coBorrowerEmail));
  }
  return emails;
}

export function borrowerMatchesPortalEmail(borrower: unknown, portalEmail: string): boolean {
  const normalized = normalizePortalEmail(portalEmail);
  return emailsForBorrower(borrower).includes(normalized);
}

export async function getPortalSessionEmail(): Promise<string | null> {
  return getPortalSessionEmailFromCookie();
}

export async function portalEmailHasApplications(email: string): Promise<boolean> {
  const normalized = normalizePortalEmail(email);
  if (!normalized.includes('@')) return false;

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('investor_applications')
    .select('borrower')
    .neq('status', 'draft');

  if (error) throw error;

  return (data || []).some(row => borrowerMatchesPortalEmail(row.borrower, normalized));
}
