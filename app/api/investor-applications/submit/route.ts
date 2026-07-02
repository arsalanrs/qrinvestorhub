import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { InvestorApplication } from '@/types/investor-application';
import { calcMetrics, getGuidelineWarnings } from '@/lib/loan-calculations';
import { generateAISummary } from '@/lib/ai-summary';
import { upsertShapeLead } from '@/integrations/shape/client';
import { SHAPE_STATUS_MAP } from '@/integrations/shape/field-map';
import { sendSubmissionEmail } from '@/lib/send-submission-email';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as InvestorApplication;
    const supabase = await createSupabaseServerClient();

    // Compute metrics
    const metrics = calcMetrics({
      liquidAssets: body.liquidity,
      properties: body.properties,
      requestedLoanAmount: body.loanRequest.requestedLoanAmount,
      purchasePrice: body.loanRequest.purchasePrice,
      rehabBudget: body.loanRequest.rehabBudget,
      constructionBudget: body.loanRequest.constructionBudget,
      arv: body.loanRequest.arv,
      completedValue: body.loanRequest.completedValue,
    });

    const warnings = getGuidelineWarnings(
      metrics,
      body.loanProgram || '',
      body.properties.map(p => p.occupancyStatus)
    );

    // Generate AI summary
    const aiSummary = await generateAISummary(body, metrics, warnings);

    // Shape CRM sync
    let shapeLeadId: string | undefined;
    try {
      const shapeResult = await upsertShapeLead({
        firstName: body.borrower.firstName,
        lastName: body.borrower.lastName,
        email: body.borrower.email,
        phone: body.borrower.phone,
        loanProgram: body.loanProgram || '',
        loanAmount: body.loanRequest.requestedLoanAmount,
        status: SHAPE_STATUS_MAP[body.loanProgram || ''] || 'Loan Submitted',
        source: 'investor_hub',
        note: aiSummary,
      });
      shapeLeadId = shapeResult.id;
    } catch (shapeErr) {
      console.error('[submit] Shape sync error:', shapeErr);
    }

    // Upsert application
    const payload = {
      status: 'submitted',
      source: 'investor_hub',
      loan_program: body.loanProgram || null,
      deal_stage: body.dealStage || null,
      borrower: body.borrower,
      entity: body.entity,
      experience: body.experience,
      liquidity: body.liquidity,
      loan_request: body.loanRequest,
      calculations: metrics,
      guideline_warnings: warnings,
      missing_documents: body.documents?.filter(d => d.status === 'missing').map(d => d.label),
      ai_summary: aiSummary,
      additional_notes: body.additionalNotes,
      consents: body.consents,
      shape_lead_id: shapeLeadId || null,
      submitted_at: new Date().toISOString(),
    };

    let applicationId = body.id;

    if (applicationId) {
      const { error } = await supabase
        .from('investor_applications')
        .update(payload)
        .eq('id', applicationId);
      if (error) throw error;
    } else {
      const { data, error } = await supabase
        .from('investor_applications')
        .insert(payload)
        .select('id')
        .single();
      if (error) throw error;
      applicationId = data?.id;
    }

    // Save properties
    if (body.properties && body.properties.length > 0 && applicationId) {
      for (const prop of body.properties) {
        await supabase.from('investor_properties').upsert({
          application_id: applicationId,
          is_main: prop.isMain,
          property_data: prop,
        });
      }
    }

    // Log event
    if (applicationId) {
      await supabase.from('investor_application_events').insert({
        application_id: applicationId,
        event_type: 'submitted',
        payload: { warnings, metrics: { dscr: metrics.dscr, marketLTV: metrics.marketLTV } },
      });
    }

    // Email one-pager to Nikk / staff (Formspree or Resend — non-blocking)
    let emailStatus: string = 'skipped';
    if (applicationId) {
      try {
        const emailResult = await sendSubmissionEmail(body, metrics, warnings, aiSummary, applicationId);
        emailStatus = emailResult.sent
          ? emailResult.channel
          : ('skipped' in emailResult && emailResult.skipped)
            ? 'skipped'
            : 'failed';
        if ('error' in emailResult && emailResult.error) {
          console.error('[submit] submission email error:', emailResult.error);
        }
      } catch (emailErr) {
        console.error('[submit] submission email error:', emailErr);
        emailStatus = 'failed';
      }
    }

    return NextResponse.json({
      applicationId,
      aiSummary,
      shapeStatus: shapeLeadId ? 'synced' : 'skipped',
      lendingpadStatus: 'pending',
      emailStatus,
    });
  } catch (err) {
    console.error('[submit] error:', err);
    return NextResponse.json({ error: 'Submission failed. Please try again.' }, { status: 500 });
  }
}
