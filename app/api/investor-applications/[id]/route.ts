import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    const { data: properties } = await supabase
      .from('investor_properties')
      .select('property_data, is_main')
      .eq('application_id', id);

    const borrower = application.borrower as { firstName?: string; lastName?: string; ssn?: string };
    const safeBorrower = borrower ? { ...borrower, ssn: borrower.ssn ? '•••-••-' + String(borrower.ssn).slice(-4) : '' } : borrower;

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
      properties: (properties || []).map(p => p.property_data),
      submittedAt: application.submitted_at,
      createdAt: application.created_at,
    });
  } catch (err) {
    console.error('[portfolio] error:', err);
    return NextResponse.json({ error: 'Failed to load portfolio' }, { status: 500 });
  }
}
