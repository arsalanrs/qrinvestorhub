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
  const ctx = await getPortalLoginContext(email);
  return ctx.hasApplications;
}

export async function getPortalLoginContext(email: string): Promise<{
  hasApplications: boolean;
  firstName: string | null;
}> {
  const normalized = normalizePortalEmail(email);
  if (!normalized.includes('@')) {
    return { hasApplications: false, firstName: null };
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('investor_applications')
    .select('borrower, updated_at')
    .neq('status', 'draft')
    .order('updated_at', { ascending: false });

  if (error) throw error;

  for (const row of data || []) {
    if (!borrowerMatchesPortalEmail(row.borrower, normalized)) continue;
    const b = row.borrower as { firstName?: string } | null;
    return {
      hasApplications: true,
      firstName: b?.firstName?.trim() || null,
    };
  }

  return { hasApplications: false, firstName: null };
}
