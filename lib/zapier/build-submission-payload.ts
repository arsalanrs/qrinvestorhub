import 'server-only';
import type { InvestorApplication } from '@/types/investor-application';
import type { LoanMetrics } from '@/lib/loan-calculations';
import { buildSubmissionOnePager } from '@/lib/submission-one-pager';
import { buildShapeSubmissionNote } from '@/lib/shape-submission-note';
import { getSubmissionEmailRouting } from '@/lib/investor-submission-routing';
import { SHAPE_STATUS_MAP } from '@/integrations/shape/field-map';
import { PROGRAM_CONFIGS } from '@/config/loan-programs';
import type { ProgramKey } from '@/config/loan-programs';
import type { SubmissionEmailContext } from '@/lib/submission-email-context';

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
    staff: {
      to: string;
      toName: string;
      cc: string[];
      ccCsv: string;
      subject: string;
      html: string;
      text: string;
    };
    customer: {
      to: string;
      toName: string;
      subject: string;
      html: string;
      text: string;
    };
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
  };
  transcript: SubmissionEmailContext['transcript'];
  /** Suggested Zapier paths — one webhook, branch in Zapier */
  zapierPaths: Array<'shape_sync' | 'staff_email' | 'customer_email'>;
};

function buildCustomerPortalEmail(
  borrowerName: string,
  borrowerEmail: string,
  applicationId: string,
  portalUrl: string,
): { subject: string; html: string; text: string } {
  const subject = 'Your QuestRock Investor Portal is ready';
  const text = [
    `Hi ${borrowerName || 'there'},`,
    '',
    'Thank you for submitting your investor loan application with QuestRock.',
    '',
    'Sign in to your portal to track progress, view your portfolio, and access investor tools:',
    portalUrl,
    '',
    'Use the same email address from your application — we will send you a secure one-time sign-in link.',
    '',
    `Application reference: ${applicationId}`,
    '',
    '— QuestRock Home Loans',
  ].join('\n');

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Inter, -apple-system, sans-serif; color: #14213D; line-height: 1.6; max-width: 560px; margin: 0 auto; padding: 24px;">
  <div style="background: #14213D; color: #fff; padding: 20px 24px; border-radius: 8px 8px 0 0;">
    <p style="margin: 0 0 4px; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; opacity: 0.75;">QuestRock Investor Hub</p>
    <h1 style="margin: 0; font-size: 20px; font-weight: 600;">Welcome to your Investor Portal</h1>
  </div>
  <div style="border: 1px solid #e5e2db; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
    <p>Hi ${borrowerName || 'there'},</p>
    <p>Thank you for submitting your investor loan application. Your file is being reviewed by the QuestRock team.</p>
    <p style="margin: 24px 0;"><a href="${portalUrl}" style="display: inline-block; background: #1f6f54; color: #fff; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: 600;">Open Investor Portal →</a></p>
    <p style="font-size: 14px; color: #4b5563;">Use the same email from your application (${borrowerEmail}). We&apos;ll send a secure one-time sign-in link.</p>
    <p style="font-size: 12px; color: #6b7280; margin-top: 24px;">Application reference: ${applicationId}</p>
  </div>
</body>
</html>`.trim();

  return { subject, html, text };
}

export function buildZapierSubmissionPayload(
  app: InvestorApplication,
  metrics: LoanMetrics,
  warnings: string[],
  aiSummary: string,
  applicationId: string,
  context: SubmissionEmailContext,
): ZapierSubmissionPayload {
  const routing = context.routing ?? getSubmissionEmailRouting(app.loanRequest.requestedLoanAmount);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || '';
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
  const customerEmail = buildCustomerPortalEmail(
    borrowerName,
    app.borrower.email,
    applicationId,
    portalUrl,
  );

  const programLabel = app.loanProgram
    ? (PROGRAM_CONFIGS[app.loanProgram as ProgramKey]?.label || app.loanProgram)
    : 'Investor Hub';

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
      },
      customer: {
        to: app.borrower.email,
        toName: borrowerName,
        subject: customerEmail.subject,
        html: customerEmail.html,
        text: customerEmail.text,
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
    },
    transcript: context.transcript,
    zapierPaths: ['shape_sync', 'staff_email', 'customer_email'],
  };
}
