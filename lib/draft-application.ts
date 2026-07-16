import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { normalizePortalEmail } from '@/lib/portal-auth';

export async function findLatestDraftIdByBorrowerEmail(
  supabase: SupabaseClient,
  email: string,
): Promise<string | null> {
  const normalized = normalizePortalEmail(email);
  if (!normalized.includes('@')) return null;

  const { data, error } = await supabase
    .from('investor_applications')
    .select('id')
    .eq('status', 'draft')
    .ilike('borrower->>email', normalized)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[draft] lookup by email:', error.message);
    return null;
  }

  return data?.id ?? null;
}
