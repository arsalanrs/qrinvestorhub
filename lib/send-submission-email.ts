import 'server-only';
import type { InvestorApplication } from '@/types/investor-application';
import type { LoanMetrics } from '@/lib/loan-calculations';
import { buildSubmissionOnePager } from '@/lib/submission-one-pager';

export type SendSubmissionEmailResult =
  | { sent: true; channel: 'formspree' | 'resend' }
  | { sent: false; skipped: true; reason: string }
  | { sent: false; error: string };

const DEFAULT_NOTIFY_EMAIL = 'nikksmith@questrock.com';

function getNotifyEmails(): string[] {
  const raw = process.env.INVESTOR_SUBMISSION_NOTIFY_EMAIL || DEFAULT_NOTIFY_EMAIL;
  return raw.split(',').map(e => e.trim()).filter(Boolean);
}

async function sendViaFormspree(
  endpoint: string,
  subject: string,
  text: string,
  replyTo: string,
  borrowerName: string
): Promise<SendSubmissionEmailResult> {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      _subject: subject,
      _replyto: replyTo,
      name: borrowerName,
      email: replyTo,
      message: text,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => res.statusText);
    console.error('[submission-email] Formspree error:', res.status, body);
    return { sent: false, error: `Formspree ${res.status}: ${body}` };
  }

  return { sent: true, channel: 'formspree' };
}

async function sendViaResend(
  subject: string,
  html: string,
  text: string,
  replyTo: string
): Promise<SendSubmissionEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { sent: false, skipped: true, reason: 'RESEND_API_KEY not configured' };
  }

  const from = process.env.INVESTOR_SUBMISSION_FROM_EMAIL?.trim()
    || process.env.REPORT_FROM?.trim()
    || 'QuestRock Investor Hub <notifications@questrock.com>';

  const to = getNotifyEmails();

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to,
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

  return { sent: true, channel: 'resend' };
}

export async function sendSubmissionEmail(
  app: InvestorApplication,
  metrics: LoanMetrics,
  warnings: string[],
  aiSummary: string,
  applicationId: string
): Promise<SendSubmissionEmailResult> {
  const { subject, text, html } = buildSubmissionOnePager(
    app,
    metrics,
    warnings,
    aiSummary,
    applicationId
  );

  const borrowerName = `${app.borrower.firstName} ${app.borrower.lastName}`.trim();
  const replyTo = app.borrower.email?.trim() || '';

  const formspreeUrl = process.env.FORMSPREE_INVESTOR_SUBMISSION_URL?.trim();
  if (formspreeUrl) {
    try {
      return await sendViaFormspree(formspreeUrl, subject, text, replyTo, borrowerName);
    } catch (err) {
      console.error('[submission-email] Formspree fetch failed:', err);
    }
  }

  if (process.env.RESEND_API_KEY?.trim()) {
    try {
      return await sendViaResend(subject, html, text, replyTo);
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
