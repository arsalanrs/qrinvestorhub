import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { InvestorApplication } from '@/types/investor-application';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as InvestorApplication;
    const supabase = await createSupabaseServerClient();

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
    return NextResponse.json({ error: 'Failed to save draft' }, { status: 500 });
  }
}
