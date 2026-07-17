import 'server-only';
import type { InvestorApplication } from '@/types/investor-application';
import type { DocumentItem } from '@/types/investor-application';
import { toNum } from '@/lib/loan-calculations';
import { buildParkPlaceChecklist } from '@/lib/lender-exports/park-place';

export type OpsVerificationResult = {
  generatedAt: string;
  verdict: 'pass' | 'review' | 'fail';
  summary: string;
  blockers: string[];
  warnings: string[];
  highlights: string[];
  checklist?: Array<{
    label: string;
    required: boolean;
    uploaded: boolean;
  }>;
};

function buildBaseHighlights(app: InvestorApplication): string[] {
  const borrower = `${app.borrower.firstName} ${app.borrower.lastName}`.trim();
  const highlights = [
    `Borrower: ${borrower || 'Unknown'}`,
    `Program: ${app.loanProgram || 'N/A'}`,
    `Requested Loan Amount: ${app.loanRequest.requestedLoanAmount || 'N/A'}`,
    `Transaction Type: ${app.loanRequest.transactionType || 'N/A'}`,
  ];
  return highlights;
}

function hasConstructionExperience(app: InvestorApplication): boolean {
  const exp = app.experience;
  return Boolean(
    exp.completedFlips
      || exp.completedNewBuilds
      || toNum(exp.flipsLast3Years) > 0
      || toNum(exp.newBuildsLast3Years) > 0,
  );
}

export function runOpsVerificationBot(
  app: InvestorApplication,
  documents: DocumentItem[],
): OpsVerificationResult {
  const blockers: string[] = [];
  const warnings: string[] = [];
  const highlights = buildBaseHighlights(app);

  if (!app.borrower.email?.trim()) blockers.push('Borrower email missing.');
  if (!app.borrower.phone?.trim()) warnings.push('Borrower phone missing.');
  if (!app.loanRequest.requestedLoanAmount?.trim()) blockers.push('Requested loan amount missing.');
  if (!app.loanRequest.transactionType?.trim()) blockers.push('Transaction type missing.');

  let checklist:
    | Array<{
      label: string;
      required: boolean;
      uploaded: boolean;
    }>
    | undefined;

  if (app.loanProgram === 'construction') {
    const includeReo = hasConstructionExperience(app);
    const check = buildParkPlaceChecklist(documents, includeReo);
    checklist = check.map(item => ({
      label: item.label,
      required: item.required,
      uploaded: item.uploaded,
    }));

    const missingRequired = check.filter(item => item.required && !item.uploaded);
    if (missingRequired.length > 0) {
      blockers.push(
        `Missing required construction docs: ${missingRequired.map(d => d.label).join(', ')}`,
      );
    }

    if (includeReo) {
      highlights.push('Experience indicates PPF REO is required.');
    } else {
      highlights.push('No prior construction/flip experience detected; PPF REO not required.');
    }

    if (!app.constructionGoal?.builderName?.trim()) {
      warnings.push('Builder name is missing.');
    }
    if (!app.constructionGoal?.builderLicense?.trim()) {
      warnings.push('Builder license field is blank in the application.');
    }
  }

  if (app.experience.adverseHistory && !app.experience.adverseHistoryDetails?.trim()) {
    warnings.push('Adverse history is marked Yes but details are blank.');
  }

  const verdict: OpsVerificationResult['verdict'] =
    blockers.length > 0 ? 'fail' : warnings.length > 0 ? 'review' : 'pass';

  const summary =
    verdict === 'pass'
      ? 'Submission passed baseline ops verification.'
      : verdict === 'review'
        ? 'Submission is mostly complete but needs manual review for warnings.'
        : 'Submission has blocking gaps and is not lender-ready.';

  return {
    generatedAt: new Date().toISOString(),
    verdict,
    summary,
    blockers,
    warnings,
    highlights,
    checklist,
  };
}

