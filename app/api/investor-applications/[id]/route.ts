import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import {
  borrowerMatchesPortalEmail,
  getPortalSessionEmail,
} from '@/lib/portal-auth';
import { getPropertyHeroPublicUrl } from '@/lib/property-ai-image';
import type { PropertyData } from '@/types/investor-application';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const portalEmail = await getPortalSessionEmail();
    if (!portalEmail) {
      return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const supabase = createSupabaseAdminClient();
    const { data: application, error } = await supabase
      .from('investor_applications')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (!borrowerMatchesPortalEmail(application.borrower, portalEmail)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { data: propertyRows } = await supabase
      .from('investor_properties')
      .select('id, property_data, is_main, ai_hero_path')
      .eq('application_id', id);

    const borrower = application.borrower as { firstName?: string; lastName?: string; email?: string; ssn?: string };
    const safeBorrower = borrower
      ? { ...borrower, ssn: borrower.ssn ? '•••-••-' + String(borrower.ssn).slice(-4) : '' }
      : borrower;

    const properties = await Promise.all(
      (propertyRows || []).map(async row => {
        const propertyData = row.property_data as PropertyData;
        const heroImageUrl = await getPropertyHeroPublicUrl(supabase, row.ai_hero_path);
        return {
          ...propertyData,
          dbId: row.id,
          isMain: row.is_main,
          heroImageUrl,
        };
      })
    );

    return NextResponse.json({
      id: application.id,
      status: application.status,
      loanProgram: application.loan_program,
      dealStage: application.deal_stage,
      borrower: safeBorrower,
      entity: application.entity,
      experience: application.experience,
      liquidity: application.liquidity,
      loanRequest: application.loan_request,
      calculations: application.calculations,
      aiSummary: application.ai_summary,
      additionalNotes: application.additional_notes,
      properties,
      submittedAt: application.submitted_at,
      createdAt: application.created_at,
    });
  } catch (err) {
    console.error('[portfolio] error:', err);
    return NextResponse.json({ error: 'Failed to load portfolio' }, { status: 500 });
  }
}
