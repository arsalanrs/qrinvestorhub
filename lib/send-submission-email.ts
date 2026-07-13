import 'server-only';
import type { InvestorApplication } from '@/types/investor-application';
import type { LoanMetrics } from '@/lib/loan-calculations';
import { buildSubmissionOnePager } from '@/lib/submission-one-pager';
import type { SubmissionEmailContext } from '@/lib/submission-email-context';
import type { SubmissionEmailRouting } from '@/lib/investor-submission-routing';

export type SendSubmissionEmailResult =
  | { sent: true; channel: 'formspree' | 'resend'; to: string; cc: string[] }
  | { sent: false; skipped: true; reason: string }
  | { sent: false; error: string };

async function sendViaFormspree(
  endpoint: string,
  subject: string,
  text: string,
  replyTo: string,
  borrowerName: string,
  routing: SubmissionEmailRouting,
): Promise<SendSubmissionEmailResult> {
  const ccList = [...new Set(routing.cc)].filter(Boolean);

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      _subject: subject,
      _replyto: replyTo,
      _cc: ccList.join(','),
      name: borrowerName,
      email: replyTo,
      message: text,
      routed_to: routing.to,
      routed_to_name: routing.toName,
      loan_amount: routing.loanAmount,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => res.statusText);
    console.error('[submission-email] Formspree error:', res.status, body);
    return { sent: false, error: `Formspree ${res.status}: ${body}` };
  }

  return { sent: true, channel: 'formspree', to: routing.to, cc: routing.cc };
}

async function sendViaResend(
  subject: string,
  html: string,
  text: string,
  replyTo: string,
  routing: SubmissionEmailRouting,
): Promise<SendSubmissionEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { sent: false, skipped: true, reason: 'RESEND_API_KEY not configured' };
  }

  const from = process.env.INVESTOR_SUBMISSION_FROM_EMAIL?.trim()
    || process.env.REPORT_FROM?.trim()
    || 'QuestRock Investor Hub <notifications@questrock.com>';

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [routing.to],
      cc: routing.cc,
      subject,
      html,
      text,
      reply_to: replyTo,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => res.statusText);
    console.error('[submission-email] Resend error:', res.status, body);
    return { sent: false, error: `Resend ${res.status}: ${body}` };
  }

  return { sent: true, channel: 'resend', to: routing.to, cc: routing.cc };
}

export async function sendSubmissionEmail(
  app: InvestorApplication,
  metrics: LoanMetrics,
  warnings: string[],
  aiSummary: string,
  applicationId: string,
  context: SubmissionEmailContext,
): Promise<SendSubmissionEmailResult> {
  const { subject, text, html } = buildSubmissionOnePager(
    app,
    metrics,
    warnings,
    aiSummary,
    applicationId,
    context,
  );

  const borrowerName = `${app.borrower.firstName} ${app.borrower.lastName}`.trim();
  const replyTo = app.borrower.email?.trim() || '';

  const formspreeUrl = process.env.FORMSPREE_INVESTOR_SUBMISSION_URL?.trim();
  if (formspreeUrl) {
    try {
      return await sendViaFormspree(
        formspreeUrl,
        subject,
        text,
        replyTo,
        borrowerName,
        context.routing,
      );
    } catch (err) {
      console.error('[submission-email] Formspree fetch failed:', err);
    }
  }

  if (process.env.RESEND_API_KEY?.trim()) {
    try {
      return await sendViaResend(subject, html, text, replyTo, context.routing);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[submission-email] Resend fetch failed:', msg);
      return { sent: false, error: msg };
    }
  }

  return {
    sent: false,
    skipped: true,
    reason: 'Set FORMSPREE_INVESTOR_SUBMISSION_URL or RESEND_API_KEY to enable submission emails',
  };
}
