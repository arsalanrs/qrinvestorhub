import 'server-only';
import type { InvestorApplication } from '@/types/investor-application';
import type { LoanMetrics } from '@/lib/loan-calculations';
import { fmt, pct, toNum } from '@/lib/loan-calculations';
import { PROGRAM_CONFIGS } from '@/config/loan-programs';
import type { ProgramKey } from '@/config/loan-programs';
import type { SubmissionEmailContext } from '@/lib/submission-email-context';
import { getInvestorTierInfo } from '@/lib/investor-status';

function esc(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function money(value?: string | number | null): string {
  if (value === null || value === undefined || value === '') return '—';
  const n = typeof value === 'number' ? value : toNum(value);
  return n > 0 ? fmt(n) : '—';
}

function labelize(value?: string | null): string {
  if (!value?.trim()) return '—';
  return value.replace(/_/g, ' ');
}

function maskSsn(ssn?: string): string {
  if (!ssn?.trim()) return '—';
  const digits = ssn.replace(/\D/g, '');
  if (digits.length >= 4) return `•••-••-${digits.slice(-4)}`;
  return 'On file';
}

function row(label: string, value: string): string {
  if (!value || value === '—') return '';
  return `<tr>
    <td style="padding:10px 12px;border-bottom:1px solid #ebe6dc;color:#64748b;font-size:13px;width:38%;vertical-align:top;">${esc(label)}</td>
    <td style="padding:10px 12px;border-bottom:1px solid #ebe6dc;color:#14213D;font-size:13px;font-weight:500;vertical-align:top;">${value}</td>
  </tr>`;
}

function section(title: string, inner: string): string {
  if (!inner.trim()) return '';
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;background:#fff;border:1px solid #e5e2db;border-radius:12px;overflow:hidden;">
  <tr><td style="padding:14px 16px;background:#f7f5f0;border-bottom:1px solid #e5e2db;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;">${esc(title)}</td></tr>
  <tr><td style="padding:0;">${inner}</td></tr>
</table>`;
}

function metricChip(label: string, value: string): string {
  return `<td style="padding:8px;width:25%;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0faf5;border:1px solid #cce8dc;border-radius:10px;">
      <tr><td style="padding:12px 10px;text-align:center;">
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.06em;color:#64748b;margin-bottom:4px;">${esc(label)}</div>
        <div style="font-size:18px;font-weight:700;color:#1f6f54;font-family:Georgia,serif;">${esc(value)}</div>
      </td></tr>
    </table>
  </td>`;
}

function btn(href: string, label: string, primary = true): string {
  if (!href) return '';
  const bg = primary ? '#1f6f54' : '#14213D';
  return `<a href="${esc(href)}" style="display:inline-block;margin:0 8px 8px 0;padding:12px 20px;background:${bg};color:#ffffff;text-decoration:none;border-radius:8px;font-size:13px;font-weight:600;">${esc(label)}</a>`;
}

export type StaffEmailLinks = {
  admin: string;
  portfolio: string;
  portal: string;
};

export function buildStaffSubmissionEmailHtml(
  app: InvestorApplication,
  metrics: LoanMetrics,
  warnings: string[],
  aiSummary: string,
  applicationId: string,
  links: StaffEmailLinks,
  context?: SubmissionEmailContext,
): string {
  const b = app.borrower;
  const e = app.entity;
  const lr = app.loanRequest;
  const routing = context?.routing;
  const programLabel = app.loanProgram
    ? (PROGRAM_CONFIGS[app.loanProgram as ProgramKey]?.label || app.loanProgram)
    : 'Not selected';
  const borrowerName = `${b.firstName} ${b.lastName}`.trim();
  const submittedEt = new Date().toLocaleString('en-US', {
    timeZone: 'America/New_York',
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const liquidityTotal = (app.liquidity || []).reduce(
    (sum, a) => sum + toNum(a.estimatedBalance ?? (a as { estimatedValue?: string }).estimatedValue),
    0,
  );

  const tierInfo = getInvestorTierInfo(app.experience);
  const uploadedDocs = (app.documents || []).filter(d => d.status === 'uploaded');
  const missingDocs = (app.documents || []).filter(d => d.status !== 'uploaded' && d.required);

  const metricsRow = [
    metrics.marketLTV !== null ? metricChip('Market LTV', pct(metrics.marketLTV * 100)) : '',
    metrics.dscr !== null ? metricChip('DSCR', metrics.dscr.toFixed(2)) : '',
    metrics.ltc !== null ? metricChip('LTC', pct(metrics.ltc * 100)) : '',
    liquidityTotal > 0 ? metricChip('Liquidity', fmt(liquidityTotal)) : '',
  ].filter(Boolean).join('');

  const propertyBlocks = (app.properties || []).map((p, i) => {
    const addr = [p.address, p.city, p.state, p.zip].filter(Boolean).join(', ') || `Property ${i + 1}`;
    return `<div style="padding:12px 16px;border-bottom:1px solid #ebe6dc;">
      <div style="font-weight:600;color:#14213D;margin-bottom:4px;">${esc(addr)}</div>
      <div style="font-size:12px;color:#64748b;line-height:1.6;">
        ${p.propertyType ? `${labelize(p.propertyType)} · ` : ''}
        ${p.currentAsIsValue ? `Value ${money(p.currentAsIsValue)} · ` : ''}
        ${p.estimatedMarketRent ? `Rent ${money(p.estimatedMarketRent)}/mo · ` : ''}
        ${p.occupancyStatus ? labelize(p.occupancyStatus) : ''}
      </div>
    </div>`;
  }).join('');

  const flagsHtml = warnings.length
    ? `<ul style="margin:0;padding:12px 16px 12px 32px;color:#b3492d;font-size:13px;line-height:1.6;">${warnings.map(w => `<li>${esc(w)}</li>`).join('')}</ul>`
    : '';

  const transcriptHtml = context?.transcript?.found
    ? `<div style="padding:14px 16px;font-size:13px;line-height:1.6;color:#14213D;background:#eff6ff;">${esc(context.transcript.summary)}</div>`
    : '';

  const borrowerTable = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    ${row('Name', esc(borrowerName))}
    ${row('Email', `<a href="mailto:${esc(b.email)}" style="color:#1f6f54;">${esc(b.email)}</a>`)}
    ${row('Phone', `<a href="tel:${esc(b.phone)}" style="color:#1f6f54;">${esc(b.phone)}</a>`)}
    ${row('Credit range', esc(labelize(b.creditRange)))}
    ${row('DOB', esc(b.dateOfBirth))}
    ${row('SSN', esc(maskSsn(b.ssn)))}
    ${b.hasCoBorrower ? row('Co-borrower', esc(`${b.coBorrowerName} · ${b.coBorrowerEmail}`)) : ''}
  </table>`;

  const entityTable = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    ${row('Borrowing as', esc(labelize(e.borrowingAs)))}
    ${row('Entity', esc(e.entityName || '—'))}
    ${row('Entity type', esc(e.entityType || '—'))}
    ${row('Ownership', e.ownershipPercentage ? esc(`${e.ownershipPercentage}%`) : '—')}
    ${row('Authorized signer', esc(e.authorizedSigner))}
  </table>`;

  const loanTable = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    ${row('Requested amount', `<strong style="font-size:15px;color:#1f6f54;">${money(lr.requestedLoanAmount)}</strong>`)}
    ${row('Transaction', esc(labelize(lr.transactionType)))}
    ${row('Purchase price', money(lr.purchasePrice))}
    ${row('Rehab budget', money(lr.rehabBudget))}
    ${row('Construction budget', money(lr.constructionBudget))}
    ${row('ARV / completed value', money(lr.arv || lr.completedValue))}
    ${row('Cash-out requested', money(lr.desiredCashOut))}
    ${row('Funding timeline', esc(labelize(lr.fundingTimeline)))}
    ${row('Exit strategy', esc(lr.exitStrategy))}
    ${row('Closing target', esc(lr.closingDate))}
  </table>`;

  const experienceTable = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    ${row('Investor tier', `<strong>${esc(tierInfo.label)}</strong> (${tierInfo.dealsLast3Years} deals / 3 yr)`)}
    ${row('Flips (3 yr)', esc(app.experience.flipsLast3Years || '0'))}
    ${row('Rentals owned', esc(app.experience.rentalsOwned || '0'))}
    ${row('New builds (3 yr)', esc(app.experience.newBuildsLast3Years || '0'))}
  </table>`;

  const docsHtml = `<div style="padding:12px 16px;font-size:13px;line-height:1.7;color:#14213D;">
    ${uploadedDocs.length ? `<div style="margin-bottom:8px;"><strong style="color:#1f6f54;">Uploaded:</strong> ${uploadedDocs.map(d => esc(d.label)).join(', ')}</div>` : ''}
    ${missingDocs.length ? `<div style="color:#b3492d;"><strong>Still needed:</strong> ${missingDocs.map(d => esc(d.label)).join(', ')}</div>` : ''}
    ${!uploadedDocs.length && !missingDocs.length ? '—' : ''}
  </div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f7f5f0;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#14213D;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f7f5f0;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="640" cellpadding="0" cellspacing="0" border="0" style="max-width:640px;width:100%;">

  <!-- Header -->
  <tr><td style="background:#14213D;border-radius:14px 14px 0 0;padding:28px 28px 24px;">
    <div style="font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.65);margin-bottom:8px;">QuestRock Investor Hub</div>
    <div style="font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:700;color:#fff;line-height:1.2;margin-bottom:8px;">New submission — ${esc(borrowerName)}</div>
    <div style="font-size:15px;color:rgba(255,255,255,0.88);">${esc(programLabel)} · ${money(lr.requestedLoanAmount)} · ${esc(labelize(lr.transactionType))}</div>
    ${routing ? `<div style="margin-top:10px;font-size:12px;color:rgba(255,255,255,0.72);">Routed to <strong style="color:#fff;">${esc(routing.toName)}</strong> · CC ${esc(routing.cc.join(', '))}</div>` : ''}
  </td></tr>

  <!-- CTA bar -->
  <tr><td style="background:#fff;border-left:1px solid #e5e2db;border-right:1px solid #e5e2db;padding:18px 24px;text-align:center;">
    ${btn(links.admin, 'Open in Investor Hub (Staff)')}
    ${btn(links.portfolio, 'View portfolio', false)}
  </td></tr>

  <!-- Meta strip -->
  <tr><td style="background:#fff;border-left:1px solid #e5e2db;border-right:1px solid #e5e2db;padding:0 24px 20px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f5f0;border-radius:10px;">
      <tr>
        <td style="padding:12px 14px;font-size:12px;color:#64748b;width:33%;"><strong style="color:#14213D;display:block;margin-bottom:2px;">Application ID</strong>${esc(applicationId.slice(0, 8))}…</td>
        <td style="padding:12px 14px;font-size:12px;color:#64748b;width:33%;"><strong style="color:#14213D;display:block;margin-bottom:2px;">Submitted</strong>${esc(submittedEt)} ET</td>
        <td style="padding:12px 14px;font-size:12px;color:#64748b;width:33%;"><strong style="color:#14213D;display:block;margin-bottom:2px;">Deal stage</strong>${esc(labelize(app.dealStage))}</td>
      </tr>
    </table>
  </td></tr>

  <!-- Body -->
  <tr><td style="background:#fff;border-left:1px solid #e5e2db;border-right:1px solid #e5e2db;padding:4px 24px 24px;">

    ${metricsRow ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;"><tr>${metricsRow}</tr></table>` : ''}

    ${section('Loan request', loanTable)}
    ${section('Borrower', borrowerTable)}
    ${e.entityName || e.borrowingAs === 'entity' ? section('Entity & ownership', entityTable) : ''}
    ${section('Investor experience', experienceTable)}
    ${propertyBlocks ? section('Properties', propertyBlocks) : ''}
    ${section('Documents', docsHtml)}
    ${warnings.length ? section('Guideline flags', flagsHtml) : ''}

    ${section('AI summary', `<div style="padding:14px 16px;font-size:14px;line-height:1.65;color:#14213D;">${esc(aiSummary || '—')}</div>`)}

    ${context?.transcript?.found ? section('Prior call transcript', transcriptHtml) : ''}

    ${app.additionalNotes?.trim() ? section('Borrower notes', `<div style="padding:14px 16px;font-size:13px;line-height:1.6;">${esc(app.additionalNotes)}</div>`) : ''}

  </td></tr>

  <!-- Footer -->
  <tr><td style="background:#14213D;border-radius:0 0 14px 14px;padding:18px 24px;text-align:center;">
    <div style="font-size:11px;color:rgba(255,255,255,0.55);line-height:1.5;">QuestRock Home Loans · Internal staff notification<br>Reply directly to the borrower from this thread.</div>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

export function buildCustomerWelcomeEmailHtml(
  app: InvestorApplication,
  applicationId: string,
  links: { portal: string; portfolio: string },
): string {
  const b = app.borrower;
  const lr = app.loanRequest;
  const borrowerName = `${b.firstName} ${b.lastName}`.trim();
  const programLabel = app.loanProgram
    ? (PROGRAM_CONFIGS[app.loanProgram as ProgramKey]?.label || app.loanProgram)
    : 'Investor loan';
  const mainProp = app.properties?.find(p => p.isMain) || app.properties?.[0];
  const propertyLine = mainProp
    ? [mainProp.address, mainProp.city, mainProp.state].filter(Boolean).join(', ')
    : lr.purchaseSubjectAddress || 'Your subject property';

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f7f5f0;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#14213D;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f7f5f0;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;">

  <tr><td style="background:#14213D;border-radius:14px 14px 0 0;padding:32px 28px;text-align:center;">
    <div style="font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.65);margin-bottom:10px;">QuestRock Investor Hub</div>
    <div style="font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:700;color:#fff;line-height:1.25;margin-bottom:8px;">You're in, ${esc(b.firstName)}.</div>
    <div style="font-size:15px;color:rgba(255,255,255,0.85);">Your application has been received and is under review.</div>
  </td></tr>

  <tr><td style="background:#fff;border-left:1px solid #e5e2db;border-right:1px solid #e5e2db;padding:28px;">
    <p style="margin:0 0 18px;font-size:15px;line-height:1.65;color:#334155;">Hi ${esc(borrowerName)}, thank you for choosing QuestRock. Your dedicated team is reviewing your file now.</p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f5f0;border:1px solid #e5e2db;border-radius:12px;margin-bottom:24px;">
      <tr><td style="padding:16px 18px;">
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;margin-bottom:10px;">Your application snapshot</div>
        ${row('Program', esc(programLabel))}
        ${row('Requested loan', `<strong style="color:#1f6f54;">${money(lr.requestedLoanAmount)}</strong>`)}
        ${row('Property', esc(propertyLine))}
        ${row('Reference', `<span style="font-family:monospace;font-size:12px;">${esc(applicationId.slice(0, 13))}…</span>`)}
      </td></tr>
    </table>

    <div style="font-size:13px;font-weight:700;color:#14213D;margin-bottom:12px;">What happens next</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:26px;">
      <tr><td style="padding:0 0 12px;font-size:14px;line-height:1.55;color:#475569;">
        <span style="display:inline-block;width:22px;height:22px;background:#1f6f54;color:#fff;border-radius:50%;text-align:center;line-height:22px;font-size:12px;font-weight:700;margin-right:8px;">1</span>
        Open your Investor Portal — track status, view your portfolio, and upload documents.
      </td></tr>
      <tr><td style="padding:0 0 12px;font-size:14px;line-height:1.55;color:#475569;">
        <span style="display:inline-block;width:22px;height:22px;background:#1f6f54;color:#fff;border-radius:50%;text-align:center;line-height:22px;font-size:12px;font-weight:700;margin-right:8px;">2</span>
        Sign in with <strong>${esc(b.email)}</strong> — we'll email you a secure one-time link.
      </td></tr>
      <tr><td style="padding:0;font-size:14px;line-height:1.55;color:#475569;">
        <span style="display:inline-block;width:22px;height:22px;background:#1f6f54;color:#fff;border-radius:50%;text-align:center;line-height:22px;font-size:12px;font-weight:700;margin-right:8px;">3</span>
        A QuestRock advisor will reach out if we need anything else.
      </td></tr>
    </table>

    <div style="text-align:center;margin-bottom:8px;">
      <a href="${esc(links.portal)}" style="display:inline-block;padding:14px 28px;background:#1f6f54;color:#ffffff;text-decoration:none;border-radius:10px;font-size:15px;font-weight:700;">Open Investor Portal →</a>
    </div>
    ${links.portfolio ? `<div style="text-align:center;margin-top:12px;"><a href="${esc(links.portfolio)}" style="font-size:13px;color:#1f6f54;font-weight:600;text-decoration:none;">View this application →</a></div>` : ''}
  </td></tr>

  <tr><td style="background:#fff;border:1px solid #e5e2db;border-top:none;border-radius:0 0 14px 14px;padding:0 28px 24px;">
    <div style="border-top:1px solid #ebe6dc;padding-top:18px;font-size:12px;color:#64748b;line-height:1.6;text-align:center;">
      Questions? Reply to this email or call your QuestRock team.<br>
      <span style="color:#94a3b8;">QuestRock Home Loans · Investor lending for builders &amp; landlords</span>
    </div>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

export function buildCustomerWelcomeEmailText(
  app: InvestorApplication,
  applicationId: string,
  portalUrl: string,
): { subject: string; text: string } {
  const b = app.borrower;
  const borrowerName = `${b.firstName} ${b.lastName}`.trim();
  const programLabel = app.loanProgram
    ? (PROGRAM_CONFIGS[app.loanProgram as ProgramKey]?.label || app.loanProgram)
    : 'Investor loan';

  return {
    subject: `Welcome to QuestRock Investor Hub — ${programLabel}`,
    text: [
      `Hi ${borrowerName},`,
      '',
      'Thank you for submitting your investor loan application with QuestRock.',
      '',
      `Program: ${programLabel}`,
      `Requested loan: ${app.loanRequest.requestedLoanAmount || '—'}`,
      `Application reference: ${applicationId}`,
      '',
      'Open your Investor Portal:',
      portalUrl,
      '',
      `Sign in with ${b.email} — we'll send a secure one-time sign-in link.`,
      '',
      '— QuestRock Home Loans',
    ].join('\n'),
  };
}
