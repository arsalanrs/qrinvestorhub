import 'server-only';
import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import {
  borrowerMatchesPortalEmail,
  getPortalSessionEmail,
} from '@/lib/portal-auth';

export async function GET() {
  const portalEmail = await getPortalSessionEmail();
  if (!portalEmail) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from('investor_applications')
      .select('id, status, loan_program, submitted_at, created_at, borrower, loan_request')
      .neq('status', 'draft')
      .order('submitted_at', { ascending: false, nullsFirst: false });

    if (error) throw error;

    const applications = (data || [])
      .filter(row => borrowerMatchesPortalEmail(row.borrower, portalEmail))
      .map(row => {
        const b = row.borrower as { firstName?: string; lastName?: string; email?: string };
        const lr = row.loan_request as { requestedLoanAmount?: string } | null;
        return {
          id: row.id,
          status: row.status,
          loanProgram: row.loan_program,
          submittedAt: row.submitted_at,
          createdAt: row.created_at,
          borrowerName: `${b?.firstName || ''} ${b?.lastName || ''}`.trim(),
          requestedLoanAmount: lr?.requestedLoanAmount || null,
        };
      });

    return NextResponse.json({ email: portalEmail, applications });
  } catch (err) {
    console.error('[portal/applications]', err);
    return NextResponse.json({ error: 'Could not load applications' }, { status: 500 });
  }
}
