import 'server-only';

export type SendPortalInviteResult =
  | { sent: true }
  | { sent: false; skipped: true; reason: string }
  | { sent: false; error: string };

export async function sendCustomerPortalInvite(
  borrowerEmail: string,
  borrowerName: string,
  applicationId: string,
): Promise<SendPortalInviteResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { sent: false, skipped: true, reason: 'RESEND_API_KEY not configured' };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || '';
  if (!appUrl) {
    return { sent: false, skipped: true, reason: 'NEXT_PUBLIC_APP_URL not configured' };
  }

  const portalUrl = `${appUrl}/portal`;
  const from = process.env.INVESTOR_SUBMISSION_FROM_EMAIL?.trim()
    || 'QuestRock Investor Hub <notifications@questrock.com>';

  const subject = 'Your QuestRock Investor Portal is ready';
  const text = [
    `Hi ${borrowerName || 'there'},`,
    '',
    'Thank you for submitting your investor loan application with QuestRock.',
    '',
    `Sign in to your portal to track progress, view your portfolio, and access investor tools:`,
    portalUrl,
    '',
    'Use the same email address from your application — we will send you a secure one-time sign-in link.',
    '',
    `Application reference: ${applicationId}`,
    '',
    '— QuestRock Home Loans',
  ].join('\n');

  const html = `
<p>Hi ${borrowerName || 'there'},</p>
<p>Thank you for submitting your investor loan application with QuestRock.</p>
<p><a href="${portalUrl}" style="color:#1f6f54;font-weight:600;">Open your Investor Portal →</a></p>
<p>Use the same email from your application — we&apos;ll email you a secure one-time sign-in link.</p>
<p style="font-size:12px;color:#6b7280;">Application reference: ${applicationId}</p>
<p>— QuestRock Home Loans</p>`.trim();

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [borrowerEmail.trim()],
        subject,
        html,
        text,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => res.statusText);
      return { sent: false, error: `Resend ${res.status}: ${body}` };
    }

    return { sent: true };
  } catch (err) {
    return { sent: false, error: err instanceof Error ? err.message : String(err) };
  }
}
