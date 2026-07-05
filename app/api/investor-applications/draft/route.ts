import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseApiClient } from '@/lib/supabase/server';
import type { InvestorApplication } from '@/types/investor-application';

function isMissingTableError(err: unknown): boolean {
  const code = (err as { code?: string })?.code;
  const message = (err as { message?: string })?.message ?? '';
  return code === 'PGRST205' || message.includes("Could not find the table 'public.investor_applications'");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as InvestorApplication;
    const supabase = createSupabaseApiClient();

    const payload = {
      status: 'draft',
      source: 'investor_hub',
      loan_program: body.loanProgram || null,
      deal_stage: body.dealStage || null,
      borrower: body.borrower,
      entity: body.entity,
      experience: body.experience,
      liquidity: body.liquidity,
      loan_request: body.loanRequest,
      additional_notes: body.additionalNotes,
      consents: body.consents,
    };

    let applicationId = body.id;

    if (applicationId) {
      const { error } = await supabase
        .from('investor_applications')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', applicationId)
        .eq('status', 'draft');

      if (error) {
        const { data, error: insertError } = await supabase
          .from('investor_applications')
          .insert(payload)
          .select('id')
          .single();
        if (insertError) throw insertError;
        applicationId = data?.id;
      }
    } else {
      const { data, error } = await supabase
        .from('investor_applications')
        .insert(payload)
        .select('id')
        .single();
      if (error) throw error;
      applicationId = data?.id;
    }

    return NextResponse.json({ applicationId });
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
