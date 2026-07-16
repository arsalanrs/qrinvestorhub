import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseApiClient } from '@/lib/supabase/server';
import type { InvestorApplication } from '@/types/investor-application';
import { buildAssignedLoRecord } from '@/lib/assigned-lo';
import { findLatestDraftIdByBorrowerEmail } from '@/lib/draft-application';
import { normalizePortalEmail } from '@/lib/portal-auth';

function isMissingTableError(err: unknown): boolean {
  const code = (err as { code?: string })?.code;
  const message = (err as { message?: string })?.message ?? '';
  return code === 'PGRST205' || message.includes("Could not find the table 'public.investor_applications'");
}

function buildDraftPayload(body: InvestorApplication) {
  const borrower = {
    ...body.borrower,
    email: body.borrower.email?.trim()
      ? normalizePortalEmail(body.borrower.email)
      : body.borrower.email,
  };

  return {
    status: 'draft' as const,
    source: 'investor_hub',
    loan_program: body.loanProgram || null,
    deal_stage: body.dealStage || null,
    borrower,
    entity: body.entity,
    experience: body.experience,
    liquidity: body.liquidity,
    loan_request: body.loanRequest,
    commercial_re: body.commercialRe || null,
    additional_notes: body.additionalNotes
      || (body.commercialRe?.dealStory ? `[Commercial opportunity]\n${body.commercialRe.dealStory}` : ''),
    consents: body.consents,
    assigned_lo: buildAssignedLoRecord(body.loanOfficer),
    updated_at: new Date().toISOString(),
  };
}

async function updateDraft(
  supabase: ReturnType<typeof createSupabaseApiClient>,
  applicationId: string,
  payload: ReturnType<typeof buildDraftPayload>,
): Promise<string | null> {
  const { data, error } = await supabase
    .from('investor_applications')
    .update(payload)
    .eq('id', applicationId)
    .eq('status', 'draft')
    .select('id')
    .maybeSingle();

  if (error) {
    console.error('[draft] update error:', error.message);
    return null;
  }

  return data?.id ?? null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as InvestorApplication;
    const supabase = createSupabaseApiClient();
    const payload = buildDraftPayload(body);

    let applicationId = body.id?.trim() || null;

    if (!applicationId && body.borrower.email) {
      applicationId = await findLatestDraftIdByBorrowerEmail(supabase, body.borrower.email);
    }

    if (applicationId) {
      const updatedId = await updateDraft(supabase, applicationId, payload);
      if (updatedId) {
        return NextResponse.json({ applicationId: updatedId });
      }

      if (body.borrower.email) {
        applicationId = await findLatestDraftIdByBorrowerEmail(supabase, body.borrower.email);
        if (applicationId) {
          const retryId = await updateDraft(supabase, applicationId, payload);
          if (retryId) {
            return NextResponse.json({ applicationId: retryId });
          }
        }
      }
    }

    const { data, error } = await supabase
      .from('investor_applications')
      .insert(payload)
      .select('id')
      .single();

    if (error) throw error;

    return NextResponse.json({ applicationId: data?.id });
  } catch (err) {
    console.error('[draft] error:', err);
    if (isMissingTableError(err)) {
      return NextResponse.json({
        error: 'Database not set up. Run supabase/migrations/20260702000100_investor_hub.sql in the Supabase SQL Editor for this project.',
      }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to save draft' }, { status: 500 });
  }
}
