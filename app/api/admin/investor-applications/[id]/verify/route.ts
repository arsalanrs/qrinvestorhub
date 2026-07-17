import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/admin-request';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import type { InvestorApplication, DocumentItem } from '@/types/investor-application';
import { defaultCommercialRe } from '@/lib/default-commercial-re';
import { runOpsVerificationBot } from '@/lib/ops-verification-bot';

type RouteContext = { params: Promise<{ id: string }> };

function rowToInvestorApplication(row: Record<string, unknown>, docs: DocumentItem[]): InvestorApplication {
  return {
    id: String(row.id || ''),
    loanProgram: (row.loan_program as InvestorApplication['loanProgram']) || '',
    dealStage: (row.deal_stage as InvestorApplication['dealStage']) || '',
    loanOfficer: undefined,
    borrower: (row.borrower as InvestorApplication['borrower']) || {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      ssn: '',
      creditRange: '',
      hasCoBorrower: false,
      coBorrowerName: '',
      coBorrowerEmail: '',
      coBorrowerPhone: '',
      coBorrowerCreditRange: '',
    },
    entity: (row.entity as InvestorApplication['entity']) || {
      borrowingAs: 'individual',
      entityName: '',
      entityType: '',
      stateOfFormation: '',
      authorizedSigner: '',
      ownershipPercentage: '',
      ein: '',
      additionalGuarantors: [],
    },
    experience: (row.experience as InvestorApplication['experience']) || {
      completedFlips: false,
      flipsLast3Years: '',
      ownsRentals: false,
      rentalsOwned: '',
      completedNewBuilds: false,
      newBuildsLast3Years: '',
      isBuilderDeveloper: false,
      adverseHistory: false,
      adverseHistoryDetails: '',
    },
    liquidity: (row.liquidity as InvestorApplication['liquidity']) || [],
    properties: [],
    loanRequest: (row.loan_request as InvestorApplication['loanRequest']) || {
      transactionType: '',
      subjectPropertyId: '',
      purchaseSubjectAddress: '',
      requestedLoanAmount: '',
      purchasePrice: '',
      desiredCashOut: '',
      rehabBudget: '',
      rehabAmountFinanced: '',
      arv: '',
      constructionBudget: '',
      constructionAmountFinanced: '',
      completedValue: '',
      fundingTimeline: '',
      closingDate: '',
      exitStrategy: '',
      backupExitStrategy: '',
      prepayStructure: '',
      interestOnly: false,
    },
    blanketGoal: undefined,
    bridgeGoal: undefined,
    constructionGoal: (row.construction_goal as InvestorApplication['constructionGoal']) || undefined,
    dscrGoal: undefined,
    rehabGoal: undefined,
    commercialRe: (row.commercial_re as InvestorApplication['commercialRe']) || defaultCommercialRe(),
    documents: docs,
    additionalNotes: (row.additional_notes as string) || '',
    consents: (row.consents as InvestorApplication['consents']) || {
      accuracyConfirmed: false,
      investmentPurpose: false,
      noOwnerOccupancy: false,
      contactConsent: false,
      electronicComms: false,
      creditPullConsent: false,
    },
    status: (row.status as InvestorApplication['status']) || 'submitted',
  };
}

async function getLatestVerification(applicationId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('investor_application_events')
    .select('payload, created_at')
    .eq('application_id', applicationId)
    .eq('event_type', 'verification_bot_run')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.payload || null;
}

export async function GET(req: NextRequest, context: RouteContext) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await context.params;
  try {
    const latest = await getLatestVerification(id);
    return NextResponse.json({ verification: latest });
  } catch (err) {
    console.error('[admin] verification get error:', err);
    return NextResponse.json({ error: 'Failed to load verification' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, context: RouteContext) {
  if (!(await verifyAdminRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id } = await context.params;
  try {
    const supabase = createSupabaseAdminClient();
    const { data: row, error: rowError } = await supabase
      .from('investor_applications')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (rowError || !row) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }
    if ((row.status as string) !== 'submitted') {
      return NextResponse.json({ error: 'Verification bot runs only on submitted applications' }, { status: 400 });
    }

    const { data: docRows, error: docError } = await supabase
      .from('investor_documents')
      .select('id, document_type, file_name, file_url, status, required')
      .eq('application_id', id);
    if (docError) throw docError;

    const docs: DocumentItem[] = (docRows || []).map(d => ({
      id: String(d.id),
      label: String(d.file_name || d.document_type || 'Document'),
      type: String(d.document_type || ''),
      required: Boolean(d.required),
      status: (d.status as DocumentItem['status']) || 'missing',
      fileName: d.file_name || undefined,
      fileUrl: d.file_url || undefined,
    }));

    const app = rowToInvestorApplication(row as Record<string, unknown>, docs);
    const result = runOpsVerificationBot(app, docs);

    await supabase.from('investor_application_events').insert({
      application_id: id,
      event_type: 'verification_bot_run',
      payload: result,
    });

    return NextResponse.json({ verification: result });
  } catch (err) {
    console.error('[admin] verification run error:', err);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}

