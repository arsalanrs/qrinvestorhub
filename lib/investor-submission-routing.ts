import 'server-only';

export type SubmissionEmailRouting = {
  to: string;
  toName: string;
  cc: string[];
  loanAmount: number;
  tier: 'ray' | 'nikk' | 'bastian';
};

function envEmail(key: string, fallback: string): string {
  return process.env[key]?.trim() || fallback;
}

export const INVESTOR_MANAGER_EMAILS = {
  ray: envEmail('INVESTOR_EMAIL_RAY', 'rconway@questrock.com'),
  nikk: envEmail('INVESTOR_EMAIL_NIKK', 'nikksmith@questrock.com'),
  bastian: envEmail('INVESTOR_EMAIL_BASTIAN', 'bastianjohnston@questrock.com'),
  ccNikk: envEmail('INVESTOR_EMAIL_CC_NIKK', 'nikksmith@questrock.com'),
  ccJason: envEmail('INVESTOR_EMAIL_CC_JASON', 'jfriday@questrock.com'),
};

export function parseLoanAmount(raw?: string | number | null): number {
  if (raw === null || raw === undefined || raw === '') return 0;
  if (typeof raw === 'number') return raw;
  const n = Number(String(raw).replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

/** Route primary TO by loan amount; Nikk + Jason always CC. */
export function getSubmissionEmailRouting(requestedLoanAmount?: string | null): SubmissionEmailRouting {
  const loanAmount = parseLoanAmount(requestedLoanAmount);
  const cc = [
    INVESTOR_MANAGER_EMAILS.ccNikk,
    INVESTOR_MANAGER_EMAILS.ccJason,
  ].filter(Boolean);

  if (loanAmount > 1_000_000) {
    return {
      to: INVESTOR_MANAGER_EMAILS.ray,
      toName: 'Ray Conway',
      cc: [...new Set(cc)],
      loanAmount,
      tier: 'ray',
    };
  }

  if (loanAmount >= 600_000) {
    return {
      to: INVESTOR_MANAGER_EMAILS.nikk,
      toName: 'Nikk Smith',
      cc: [...new Set(cc)],
      loanAmount,
      tier: 'nikk',
    };
  }

  return {
    to: INVESTOR_MANAGER_EMAILS.bastian,
    toName: 'Bastian Johnston',
    cc: [...new Set(cc)],
    loanAmount,
    tier: 'bastian',
  };
}
