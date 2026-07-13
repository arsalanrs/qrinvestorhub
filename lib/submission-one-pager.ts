import 'server-only';
import type { InvestorApplication } from '@/types/investor-application';
import type { LoanMetrics } from '@/lib/loan-calculations';
import { fmt, pct, toNum } from '@/lib/loan-calculations';
import { PROGRAM_CONFIGS } from '@/config/loan-programs';
import type { ProgramKey } from '@/config/loan-programs';
import type { SubmissionEmailContext } from '@/lib/submission-email-context';

function maskSsn(ssn?: string): string {
  if (!ssn?.trim()) return '—';
  const digits = ssn.replace(/\D/g, '');
  if (digits.length >= 4) return `•••-••-${digits.slice(-4)}`;
  return 'On file';
}

function line(label: string, value: string | undefined | null): string {
  const v = value?.toString().trim();
  if (!v) return '';
  return `${label}: ${v}`;
}

function money(value?: string | number | null): string {
  if (value === null || value === undefined || value === '') return '';
  const n = typeof value === 'number' ? value : toNum(value);
  return n > 0 ? fmt(n) : '';
}

export function buildSubmissionOnePager(
  app: InvestorApplication,
  metrics: LoanMetrics,
  warnings: string[],
  aiSummary: string,
  applicationId: string,
  context?: SubmissionEmailContext,
): { subject: string; text: string; html: string } {
  const b = app.borrower;
  const e = app.entity;
  const lr = app.loanRequest;
  const programLabel = app.loanProgram
    ? (PROGRAM_CONFIGS[app.loanProgram as ProgramKey]?.label || app.loanProgram)
    : 'Not selected';

  const borrowerName = `${b.firstName} ${b.lastName}`.trim();
  const loanDisplay = money(lr.requestedLoanAmount) || '—';
  const routing = context?.routing;
  const subject = routing
    ? `Investor Hub — ${borrowerName} · ${programLabel} · ${loanDisplay} → ${routing.toName}`
    : `Investor Hub — ${borrowerName} · ${programLabel}`;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || '';
  const portfolioLink = appUrl ? `${appUrl}/portfolio/${applicationId}` : '';
  const portalLink = appUrl ? `${appUrl}/portal` : '';
  const adminLink = appUrl ? `${appUrl}/ops/investor-hub` : '';

  const uploadedDocs = (app.documents || []).filter(d => d.status === 'uploaded').map(d => d.label);
  const notUploadedDocs = (app.documents || []).filter(d => d.status !== 'uploaded').map(d => d.label);

  const propertyLines = (app.properties || []).map((p, i) => {
    const addr = [p.address, p.city, p.state, p.zip].filter(Boolean).join(', ');
    const parts = [
      addr || `Property ${i + 1}`,
      p.currentAsIsValue ? `Value ${money(p.currentAsIsValue)}` : '',
      p.estimatedMarketRent ? `Rent ${money(p.estimatedMarketRent)}/mo` : '',
      p.occupancyStatus ? p.occupancyStatus.replace(/_/g, ' ') : '',
    ].filter(Boolean);
    return `  • ${parts.join(' · ')}`;
  });

  const liquidityTotal = (app.liquidity || []).reduce(
    (sum, a) => sum + toNum(a.estimatedBalance ?? (a as { estimatedValue?: string }).estimatedValue),
    0
  );

  const sections: string[] = [
    'QUESTROCK INVESTOR HUB — NEW SUBMISSION',
    '═'.repeat(48),
    '',
    line('Application ID', applicationId),
    line('Submitted', new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }) + ' ET'),
    line('Program', programLabel),
    line('Deal Stage', app.dealStage?.replace(/_/g, ' ')),
    line('Transaction', lr.transactionType?.replace(/_/g, ' ')),
    '',
    routing
      ? `ROUTING\n${'─'.repeat(24)}\nPrimary: ${routing.toName} (${routing.to})\nCC: ${routing.cc.join(', ')}\nLoan amount tier: ${routing.tier} ($${routing.loanAmount.toLocaleString()})`
      : '',
    context?.shapeResult
      ? `\nSHAPE CRM\n${'─'.repeat(24)}\nAction: ${context.shapeResult.action || '—'}\nLead ID: ${context.shapeResult.id || '—'}${context.shapeResult.matchedExisting ? ' (matched existing)' : ' (new lead)'}${context.shapeResult.nameMismatch ? `\n⚠ ${context.shapeResult.nameMismatch}` : ''}${context.shapeResult.leadSource ? `\nPrior source: ${context.shapeResult.leadSource}` : ''}`
      : '',
    '',
    'BORROWER',
    '─'.repeat(24),
    line('Name', borrowerName),
    line('Email', b.email),
    line('Phone', b.phone),
    line('DOB', b.dateOfBirth),
    line('SSN', maskSsn(b.ssn)),
    line('Credit Range', b.creditRange?.replace(/_/g, ' ')),
    b.hasCoBorrower ? line('Co-Borrower', `${b.coBorrowerName} · ${b.coBorrowerEmail} · Credit ${b.coBorrowerCreditRange || '—'}`) : '',
    '',
    'ENTITY / OWNERSHIP',
    '─'.repeat(24),
    line('Borrowing As', e.borrowingAs),
    line('Entity Name', e.entityName),
    line('Entity Type', e.entityType),
    line('State of Formation', e.stateOfFormation),
    line('Authorized Signer', e.authorizedSigner),
    line('Ownership %', e.ownershipPercentage ? `${e.ownershipPercentage}%` : ''),
    '',
    'LOAN REQUEST',
    '─'.repeat(24),
    line('Requested Amount', money(lr.requestedLoanAmount)),
    line('Purchase Price', money(lr.purchasePrice)),
    line('Rehab Budget', money(lr.rehabBudget)),
    line('Construction Budget', money(lr.constructionBudget)),
    line('ARV / Completed Value', money(lr.arv || lr.completedValue)),
    line('Desired Cash-Out', money(lr.desiredCashOut)),
    line('Funding Timeline', lr.fundingTimeline?.replace(/_/g, ' ')),
    line('Exit Strategy', lr.exitStrategy),
    '',
    'KEY METRICS',
    '─'.repeat(24),
    metrics.totalPortfolioValue ? line('Portfolio Value', fmt(metrics.totalPortfolioValue)) : '',
    metrics.marketLTV !== null ? line('Market LTV', pct(metrics.marketLTV * 100)) : '',
    metrics.ltc !== null ? line('LTC', pct(metrics.ltc * 100)) : '',
    metrics.dscr !== null ? line('DSCR', metrics.dscr.toFixed(2)) : '',
    metrics.totalMonthlyRent ? line('Monthly Rent', fmt(metrics.totalMonthlyRent)) : '',
    liquidityTotal > 0 ? line('Liquid Assets', fmt(liquidityTotal)) : '',
    '',
    propertyLines.length ? 'PROPERTIES\n' + '─'.repeat(24) + '\n' + propertyLines.join('\n') : '',
    '',
    warnings.length ? 'GUIDELINE FLAGS (INTERNAL)\n' + '─'.repeat(24) + '\n' + warnings.map(w => `  ⚠ ${w}`).join('\n') : '',
    '',
    'AI SUMMARY',
    '─'.repeat(24),
    aiSummary || '—',
    '',
    context?.transcript?.found
      ? `PRIOR CALL TRANSCRIPT SUMMARY\n${'─'.repeat(24)}\n${context.transcript.statusLabel ? `Call status: ${context.transcript.statusLabel}\n` : ''}${context.transcript.callDate ? `Call date: ${context.transcript.callDate}\n` : ''}${context.transcript.summary}`
      : context?.transcript
        ? 'PRIOR CALL TRANSCRIPT\n─\nNo matching inbound call transcript found for this phone.'
        : '',
    '',
    uploadedDocs.length ? `Documents uploaded: ${uploadedDocs.join(', ')}` : '',
    notUploadedDocs.length ? `Not yet uploaded: ${notUploadedDocs.join(', ')}` : '',
    uploadedDocs.length
      ? '\nDocument storage: Supabase bucket `investor-documents` (private). Staff: Investor Hub admin or ops portal.'
      : '',
    app.additionalNotes ? `\nADDITIONAL NOTES\n${app.additionalNotes}` : '',
    '',
    portfolioLink ? `Portfolio: ${portfolioLink}` : '',
    portalLink ? `Customer portal (magic link sign-in): ${portalLink}` : '',
    adminLink ? `Staff admin: ${adminLink}` : '',
  ];

  const text = sections.filter(s => s !== undefined).join('\n').replace(/\n{3,}/g, '\n\n').trim();

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Inter, -apple-system, sans-serif; color: #14213D; line-height: 1.5; max-width: 640px; margin: 0 auto; padding: 24px;">
  <div style="background: #14213D; color: #fff; padding: 20px 24px; border-radius: 8px 8px 0 0;">
    <p style="margin: 0 0 4px; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; opacity: 0.7;">QuestRock Investor Hub</p>
    <h1 style="margin: 0; font-size: 20px; font-weight: 600;">New Submission — ${borrowerName}</h1>
    <p style="margin: 8px 0 0; font-size: 14px; opacity: 0.85;">${programLabel} · ${lr.transactionType?.replace(/_/g, ' ') || 'Transaction TBD'} · ${loanDisplay}</p>
    ${routing ? `<p style="margin: 6px 0 0; font-size: 12px; opacity: 0.75;">Routed to <strong>${routing.toName}</strong> · CC: ${routing.cc.join(', ')}</p>` : ''}
  </div>
  <div style="border: 1px solid #e5e2db; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
    <table style="width: 100%; font-size: 13px; border-collapse: collapse; margin-bottom: 20px;">
      <tr><td style="padding: 4px 0; color: #6b7280; width: 140px;">Application ID</td><td style="font-family: monospace;">${applicationId}</td></tr>
      <tr><td style="padding: 4px 0; color: #6b7280;">Email</td><td><a href="mailto:${b.email}">${b.email}</a></td></tr>
      <tr><td style="padding: 4px 0; color: #6b7280;">Phone</td><td>${b.phone || '—'}</td></tr>
      <tr><td style="padding: 4px 0; color: #6b7280;">Credit</td><td>${b.creditRange || '—'}</td></tr>
      <tr><td style="padding: 4px 0; color: #6b7280;">Requested Loan</td><td><strong>${money(lr.requestedLoanAmount) || '—'}</strong></td></tr>
      ${e.entityName ? `<tr><td style="padding: 4px 0; color: #6b7280;">Entity</td><td>${e.entityName} (${e.entityType || e.borrowingAs})</td></tr>` : ''}
    </table>

    <h2 style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; color: #6b7280; margin: 0 0 8px;">Key Metrics</h2>
    <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 20px;">
      ${metrics.marketLTV !== null ? `<span style="background: #f0faf5; padding: 8px 12px; border-radius: 6px; font-size: 13px;"><strong>LTV</strong> ${pct(metrics.marketLTV * 100)}</span>` : ''}
      ${metrics.dscr !== null ? `<span style="background: #f0faf5; padding: 8px 12px; border-radius: 6px; font-size: 13px;"><strong>DSCR</strong> ${metrics.dscr.toFixed(2)}</span>` : ''}
      ${liquidityTotal > 0 ? `<span style="background: #f0faf5; padding: 8px 12px; border-radius: 6px; font-size: 13px;"><strong>Liquidity</strong> ${fmt(liquidityTotal)}</span>` : ''}
    </div>

    ${warnings.length ? `
    <h2 style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; color: #b3492d; margin: 0 0 8px;">Guideline Flags</h2>
    <ul style="margin: 0 0 20px; padding-left: 20px; font-size: 13px;">${warnings.map(w => `<li>${w}</li>`).join('')}</ul>
    ` : ''}

    <h2 style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; color: #6b7280; margin: 0 0 8px;">Summary</h2>
    <p style="font-size: 14px; margin: 0 0 20px; background: #f7f5f0; padding: 14px; border-radius: 6px;">${aiSummary || '—'}</p>

    ${context?.transcript?.found ? `
    <h2 style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; color: #6b7280; margin: 0 0 8px;">Prior Call Transcript</h2>
    <p style="font-size: 13px; margin: 0 0 20px; background: #eff6ff; padding: 14px; border-radius: 6px; white-space: pre-wrap;">${context.transcript.summary.replace(/</g, '&lt;')}</p>
    ` : ''}

    ${context?.shapeResult?.id ? `
    <p style="font-size: 12px; color: #6b7280; margin: 0 0 12px;">Shape lead #${context.shapeResult.id} · ${context.shapeResult.action}${context.shapeResult.nameMismatch ? ` · ⚠ ${context.shapeResult.nameMismatch}` : ''}</p>
    ` : ''}

    ${portalLink || portfolioLink ? `<p style="margin: 0 0 8px;"><a href="${portalLink || portfolioLink}" style="color: #1f6f54; font-weight: 600;">Customer portal →</a>${portfolioLink ? ` · <a href="${portfolioLink}" style="color: #1f6f54;">Portfolio view</a>` : ''}${adminLink ? ` · <a href="${adminLink}" style="color: #2e5c8a;">Staff admin →</a>` : ''}</p>` : ''}

    <hr style="border: none; border-top: 1px solid #e5e2db; margin: 24px 0;">
    <pre style="font-size: 11px; white-space: pre-wrap; color: #6b7280; margin: 0; font-family: ui-monospace, monospace;">${text.replace(/</g, '&lt;')}</pre>
  </div>
</body>
</html>`.trim();

  return { subject, text, html };
}
