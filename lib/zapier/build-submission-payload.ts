import 'server-only';
import type { InvestorApplication } from '@/types/investor-application';
import type { LoanMetrics } from '@/lib/loan-calculations';
import { buildSubmissionOnePager } from '@/lib/submission-one-pager';
import { buildShapeSubmissionNote } from '@/lib/shape-submission-note';
import { getSubmissionEmailRouting } from '@/lib/investor-submission-routing';
import { assignedLoDepursLo } from '@/lib/assigned-lo';
import { getShapeLoName } from '@/integrations/shape/lo-roster';
import { SHAPE_STATUS_MAP } from '@/integrations/shape/field-map';
import { PROGRAM_CONFIGS } from '@/config/loan-programs';
import type { ProgramKey } from '@/config/loan-programs';
import type { SubmissionEmailContext } from '@/lib/submission-email-context';
import {
  buildCustomerWelcomeEmailHtml,
  buildCustomerWelcomeEmailText,
} from '@/lib/investor-email-templates';
import { getAppOrigin } from '@/lib/get-app-url';

export type ZapierEmailBlock = {
  to: string;
  toName: string;
  subject: string;
  html: string;
  text: string;
  replyTo: string;
};

export type ZapierStaffEmailBlock = ZapierEmailBlock & {
  cc: string[];
  ccCsv: string;
};

export type ZapierSubmissionPayload = {
  event: 'investor_application.submitted';
  applicationId: string;
  submittedAt: string;
  source: 'investor_hub';
  loanProgram: string | null;
  loanProgramLabel: string;
  dealStage: string | null;
  borrower: InvestorApplication['borrower'];
  entity: InvestorApplication['entity'];
  experience: InvestorApplication['experience'];
  liquidity: InvestorApplication['liquidity'];
  loanRequest: InvestorApplication['loanRequest'];
  properties: InvestorApplication['properties'];
  documents: InvestorApplication['documents'];
  calculations: LoanMetrics;
  guidelineWarnings: string[];
  aiSummary: string;
  additionalNotes: string;
  consents: InvestorApplication['consents'];
  emailRouting: ReturnType<typeof getSubmissionEmailRouting>;
  links: {
    portal: string;
    portfolio: string;
    admin: string;
  };
  emails: {
    staff: ZapierStaffEmailBlock;
    customer: ZapierEmailBlock;
  };
  shape: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    loanProgram: string;
    loanAmount: string;
    status: string;
    source: string;
    note: string;
    depursLo?: number;
    assignedLoName?: string;
  };
  transcript: SubmissionEmailContext['transcript'];
  /** Suggested Zapier paths — one webhook, branch in Zapier */
  zapierPaths: Array<'shape_sync' | 'staff_email' | 'customer_email'>;
};

export function buildZapierSubmissionPayload(
  app: InvestorApplication,
  metrics: LoanMetrics,
  warnings: string[],
  aiSummary: string,
  applicationId: string,
  context: SubmissionEmailContext,
): ZapierSubmissionPayload {
  const routing = context.routing ?? getSubmissionEmailRouting(app.loanRequest.requestedLoanAmount);
  const appUrl = getAppOrigin();
  const portalUrl = appUrl ? `${appUrl}/portal` : '';
  const portfolioUrl = appUrl ? `${appUrl}/portfolio/${applicationId}` : '';
  const adminUrl = appUrl ? `${appUrl}/ops/investor-hub` : '';

  const uploadedDocLabels = (app.documents || [])
    .filter(d => d.status === 'uploaded')
    .map(d => `${d.label}${d.fileName ? ` (${d.fileName})` : ''}`);

  const staffEmail = buildSubmissionOnePager(
    app,
    metrics,
    warnings,
    aiSummary,
    applicationId,
    context,
  );

  const borrowerName = `${app.borrower.firstName} ${app.borrower.lastName}`.trim();
  const customerText = buildCustomerWelcomeEmailText(app, applicationId, portalUrl);
  const customerHtml = buildCustomerWelcomeEmailHtml(app, applicationId, {
    portal: portalUrl,
    portfolio: portfolioUrl,
  });

  const programLabel = app.loanProgram
    ? (PROGRAM_CONFIGS[app.loanProgram as ProgramKey]?.label || app.loanProgram)
    : 'Investor Hub';

  const depursLo = assignedLoDepursLo(app);
  const assignedLoName = depursLo
    ? (app.loanOfficer?.name || getShapeLoName(depursLo) || undefined)
    : undefined;

  const shapeNote = buildShapeSubmissionNote(app, aiSummary, applicationId, {
    documentList: uploadedDocLabels,
    shapeAction: context.shapeResult?.action === 'updated' ? 'updated' : context.shapeResult?.action === 'created' ? 'created' : undefined,
    nameMismatch: context.shapeResult?.nameMismatch,
  });

  return {
    event: 'investor_application.submitted',
    applicationId,
    submittedAt: new Date().toISOString(),
    source: 'investor_hub',
    loanProgram: app.loanProgram || null,
    loanProgramLabel: programLabel,
    dealStage: app.dealStage || null,
    borrower: app.borrower,
    entity: app.entity,
    experience: app.experience,
    liquidity: app.liquidity,
    loanRequest: app.loanRequest,
    properties: app.properties,
    documents: app.documents,
    calculations: metrics,
    guidelineWarnings: warnings,
    aiSummary,
    additionalNotes: app.additionalNotes,
    consents: app.consents,
    emailRouting: routing,
    links: {
      portal: portalUrl,
      portfolio: portfolioUrl,
      admin: adminUrl,
    },
    emails: {
      staff: {
        to: routing.to,
        toName: routing.toName,
        cc: routing.cc,
        ccCsv: routing.cc.join(','),
        subject: staffEmail.subject,
        html: staffEmail.html,
        text: staffEmail.text,
        replyTo: app.borrower.email,
      },
      customer: {
        to: app.borrower.email,
        toName: borrowerName,
        subject: customerText.subject,
        html: customerHtml,
        text: customerText.text,
        replyTo: 'notifications@questrock.com',
      },
    },
    shape: {
      firstName: app.borrower.firstName,
      lastName: app.borrower.lastName,
      email: app.borrower.email,
      phone: app.borrower.phone,
      loanProgram: app.loanProgram || '',
      loanAmount: app.loanRequest.requestedLoanAmount || '',
      status: SHAPE_STATUS_MAP[app.loanProgram || ''] || 'Loan Submitted',
      source: 'Investor Hub',
      note: shapeNote,
      ...(depursLo ? { depursLo, assignedLoName } : {}),
    },
    transcript: context.transcript,
    zapierPaths: ['shape_sync', 'staff_email', 'customer_email'],
  };
}
