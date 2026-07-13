import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseApiClient } from '@/lib/supabase/server';
import type { InvestorApplication } from '@/types/investor-application';
import { calcMetrics, getGuidelineWarnings } from '@/lib/loan-calculations';
import { generateAISummary } from '@/lib/ai-summary';
import { upsertShapeLead } from '@/integrations/shape/client';
import { SHAPE_STATUS_MAP } from '@/integrations/shape/field-map';
import { getSubmissionEmailRouting } from '@/lib/investor-submission-routing';
import { lookupCallTranscriptSummary } from '@/lib/call-transcript-lookup';
import { buildShapeSubmissionNote } from '@/lib/shape-submission-note';
import { buildZapierSubmissionPayload } from '@/lib/zapier/build-submission-payload';
import { notifyZapierSubmission } from '@/lib/zapier/notify-submission';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as InvestorApplication;
    const supabase = createSupabaseApiClient();

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

    const aiSummary = await generateAISummary(body, metrics, warnings);
    const routing = getSubmissionEmailRouting(body.loanRequest.requestedLoanAmount);
    const transcript = await lookupCallTranscriptSummary(body.borrower.phone);

    const uploadedDocLabels = (body.documents || [])
      .filter(d => d.status === 'uploaded')
      .map(d => `${d.label}${d.fileName ? ` (${d.fileName})` : ''}`);

    // Optional in-app Shape sync — leave ENABLE_SHAPE_SYNC=false when Zapier owns Shape
    let shapeLeadId: string | undefined;
    let shapeResult: Awaited<ReturnType<typeof upsertShapeLead>> | undefined;
    const shapeNote = buildShapeSubmissionNote(body, aiSummary, body.id || 'pending', {
      documentList: uploadedDocLabels,
    });

    if (process.env.ENABLE_SHAPE_SYNC === 'true') {
      try {
        shapeResult = await upsertShapeLead({
          firstName: body.borrower.firstName,
          lastName: body.borrower.lastName,
          email: body.borrower.email,
          phone: body.borrower.phone,
          loanProgram: body.loanProgram || '',
          loanAmount: body.loanRequest.requestedLoanAmount,
          status: SHAPE_STATUS_MAP[body.loanProgram || ''] || 'Loan Submitted',
          source: 'Investor Hub',
          note: shapeNote,
        });
        shapeLeadId = shapeResult.id;
      } catch (shapeErr) {
        console.error('[submit] Shape sync error:', shapeErr);
      }
    }

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

    if (body.properties && body.properties.length > 0 && applicationId) {
      for (const prop of body.properties) {
        await supabase.from('investor_properties').upsert({
          application_id: applicationId,
          is_main: prop.isMain,
          property_data: prop,
        });
      }
    }

    if (applicationId && body.documents?.length) {
      for (const doc of body.documents) {
        if (doc.status !== 'uploaded') continue;
        await supabase.from('investor_documents').upsert({
          application_id: applicationId,
          document_type: doc.type,
          file_name: doc.fileName || doc.label,
          file_url: doc.fileUrl || null,
          status: 'uploaded',
          required: doc.required,
        });
      }
    }

    if (applicationId) {
      await supabase.from('investor_application_events').insert({
        application_id: applicationId,
        event_type: 'submitted',
        payload: {
          warnings,
          metrics: { dscr: metrics.dscr, marketLTV: metrics.marketLTV },
          emailRouting: routing,
          shape: shapeResult,
          transcriptFound: transcript.found,
        },
      });
    }

    let zapierStatus: string = 'skipped';
    if (applicationId) {
      const zapierPayload = buildZapierSubmissionPayload(
        body,
        metrics,
        warnings,
        aiSummary,
        applicationId,
        { routing, transcript, shapeResult },
      );

      try {
        const zapResult = await notifyZapierSubmission(zapierPayload);
        zapierStatus = zapResult.sent
          ? 'sent'
          : ('skipped' in zapResult && zapResult.skipped)
            ? 'skipped'
            : 'failed';
        if (!zapResult.sent) {
          const detail = 'error' in zapResult ? zapResult.error : zapResult.reason;
          console.error('[submit] Zapier webhook failed:', detail);
        }
      } catch (zapErr) {
        console.error('[submit] Zapier webhook error:', zapErr);
        zapierStatus = 'failed';
      }
    }

    return NextResponse.json({
      applicationId,
      aiSummary,
      shapeStatus: shapeLeadId ? (shapeResult?.action || 'synced') : 'skipped',
      shapeLeadId: shapeLeadId || null,
      shapeMatchedExisting: shapeResult?.matchedExisting ?? false,
      lendingpadStatus: 'pending',
      zapierStatus,
      emailRouting: routing,
    });
  } catch (err) {
    console.error('[submit] error:', err);
    const message = (err as { message?: string })?.message ?? '';
    const code = (err as { code?: string })?.code;
    if (code === 'PGRST205' || message.includes("Could not find the table 'public.investor_applications'")) {
      return NextResponse.json({
        error: 'Database not set up. Run supabase/migrations/20260702000100_investor_hub.sql in the Supabase SQL Editor for this project.',
      }, { status: 503 });
    }
    return NextResponse.json({ error: 'Submission failed. Please try again.' }, { status: 500 });
  }
}
