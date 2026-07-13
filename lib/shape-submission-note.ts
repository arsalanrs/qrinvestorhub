import 'server-only';
import type { InvestorApplication } from '@/types/investor-application';
import { PROGRAM_CONFIGS } from '@/config/loan-programs';
import type { ProgramKey } from '@/config/loan-programs';

export function buildShapeSubmissionNote(
  app: InvestorApplication,
  aiSummary: string,
  applicationId: string,
  extras?: {
    documentList?: string[];
    shapeAction?: 'updated' | 'created';
    nameMismatch?: string;
  },
): string {
  const b = app.borrower;
  const lr = app.loanRequest;
  const programLabel = app.loanProgram
    ? PROGRAM_CONFIGS[app.loanProgram as ProgramKey]?.label || app.loanProgram
    : 'Investor Hub';

  const lines = [
    '<strong>[INVESTOR HUB SUBMISSION]</strong>',
    `Submitted: ${new Date().toISOString()}`,
    `Application ID: ${applicationId}`,
    `Program: ${programLabel}`,
    `Requested loan: ${lr.requestedLoanAmount || '—'}`,
    `Borrower: ${b.firstName} ${b.lastName} · ${b.email} · ${b.phone}`,
    extras?.shapeAction ? `Shape action: ${extras.shapeAction}` : '',
    extras?.nameMismatch ? `⚠ Name mismatch vs Shape: ${extras.nameMismatch}` : '',
    '',
    '<strong>AI Summary</strong>',
    aiSummary || '—',
    app.additionalNotes ? `<br><br><strong>Additional Notes</strong><br>${app.additionalNotes}` : '',
    extras?.documentList?.length
      ? `<br><br><strong>Documents uploaded</strong><br>${extras.documentList.join('<br>')}`
      : '',
  ];

  return lines.filter(Boolean).join('<br>');
}
