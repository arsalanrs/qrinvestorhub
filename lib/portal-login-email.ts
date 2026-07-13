import 'server-only';

function esc(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function step(num: number, text: string): string {
  return `<tr><td style="padding:0 0 12px;font-size:14px;line-height:1.55;color:#475569;">
    <span style="display:inline-block;width:22px;height:22px;background:#1f6f54;color:#fff;border-radius:50%;text-align:center;line-height:22px;font-size:12px;font-weight:700;margin-right:8px;vertical-align:top;">${num}</span>
    ${text}
  </td></tr>`;
}

export type PortalLoginEmailOptions = {
  firstName?: string | null;
  expiresInMinutes?: number;
};

export function buildPortalLoginEmailHtml(
  email: string,
  loginUrl: string,
  options: PortalLoginEmailOptions = {},
): string {
  const expiresInMinutes = options.expiresInMinutes ?? 30;
  const greetingName = options.firstName?.trim() || null;
  const headline = greetingName ? `Hi ${esc(greetingName)},` : 'Your secure sign-in link';
  const intro = greetingName
    ? 'Tap the button below to open your QuestRock Investor Portal. This link is private to you and works only once.'
    : 'Tap the button below to securely access your QuestRock Investor Portal. This link is private to you and works only once.';

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f7f5f0;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#14213D;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f7f5f0;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;">

  <tr><td style="background:#14213D;border-radius:14px 14px 0 0;padding:32px 28px;text-align:center;">
    <div style="font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.65);margin-bottom:10px;">QuestRock Investor Portal</div>
    <div style="font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:700;color:#fff;line-height:1.25;margin-bottom:8px;">${headline}</div>
    <div style="font-size:15px;color:rgba(255,255,255,0.85);">One-time sign-in · expires in ${expiresInMinutes} minutes</div>
  </td></tr>

  <tr><td style="background:#fff;border-left:1px solid #e5e2db;border-right:1px solid #e5e2db;padding:28px;">
    <p style="margin:0 0 20px;font-size:15px;line-height:1.65;color:#334155;">${intro}</p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f5f0;border:1px solid #e5e2db;border-radius:12px;margin-bottom:24px;">
      <tr><td style="padding:16px 18px;">
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.08em;color:#64748b;margin-bottom:12px;">Sign-in details</div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid #ebe6dc;font-size:13px;color:#64748b;width:38%;vertical-align:top;">Account</td>
            <td style="padding:8px 0;border-bottom:1px solid #ebe6dc;font-size:13px;font-weight:600;color:#14213D;vertical-align:top;">${esc(email)}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid #ebe6dc;font-size:13px;color:#64748b;vertical-align:top;">Link expires</td>
            <td style="padding:8px 0;border-bottom:1px solid #ebe6dc;font-size:13px;font-weight:500;color:#14213D;vertical-align:top;">${expiresInMinutes} minutes after this email</td>
          </tr>
          <tr>
            <td style="padding:8px 0;font-size:13px;color:#64748b;vertical-align:top;">Security</td>
            <td style="padding:8px 0;font-size:13px;font-weight:500;color:#14213D;vertical-align:top;">Single use — do not forward this email</td>
          </tr>
        </table>
      </td></tr>
    </table>

    <div style="text-align:center;margin-bottom:20px;">
      <a href="${esc(loginUrl)}" style="display:inline-block;padding:16px 32px;background:#1f6f54;color:#ffffff;text-decoration:none;border-radius:10px;font-size:16px;font-weight:700;box-shadow:0 2px 8px rgba(31,111,84,0.25);">Sign in to Investor Portal →</a>
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;margin-bottom:24px;">
      <tr><td style="padding:14px 16px;font-size:13px;line-height:1.55;color:#1e40af;">
        <strong>Button not working?</strong> Copy and paste this link into your browser:<br>
        <span style="display:block;margin-top:8px;word-break:break-all;font-family:'IBM Plex Mono',Consolas,monospace;font-size:11px;color:#334155;">${esc(loginUrl)}</span>
      </td></tr>
    </table>

    <div style="font-size:13px;font-weight:700;color:#14213D;margin-bottom:12px;">In your portal</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
      ${step(1, 'Track application status and next steps from your QuestRock team.')}
      ${step(2, 'View your portfolio, property details, and investor tier benefits.')}
      ${step(3, 'Upload documents and access resources when your advisor requests them.')}
    </table>
  </td></tr>

  <tr><td style="background:#fff;border:1px solid #e5e2db;border-top:none;border-radius:0 0 14px 14px;padding:0 28px 24px;">
    <div style="border-top:1px solid #ebe6dc;padding-top:18px;font-size:12px;color:#64748b;line-height:1.6;text-align:center;">
      Didn't request this? You can safely ignore this email — your account stays secure.<br>
      Questions? Reply to this email or contact your QuestRock advisor.<br>
      <span style="color:#94a3b8;">QuestRock Home Loans · Investor lending for builders &amp; landlords</span>
    </div>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

export function buildPortalLoginEmailText(
  email: string,
  loginUrl: string,
  options: PortalLoginEmailOptions = {},
): { subject: string; text: string } {
  const expiresInMinutes = options.expiresInMinutes ?? 30;
  const greetingName = options.firstName?.trim();
  const greeting = greetingName ? `Hi ${greetingName},` : 'Hello,';

  return {
    subject: 'Your QuestRock Investor Portal sign-in link',
    text: [
      greeting,
      '',
      'Use the link below to sign in to your QuestRock Investor Portal.',
      '',
      `Account: ${email}`,
      `Expires in: ${expiresInMinutes} minutes (single use)`,
      '',
      loginUrl,
      '',
      'In your portal you can track applications, view your portfolio, and upload documents.',
      '',
      "If you didn't request this email, you can ignore it.",
      '',
      '— QuestRock Home Loans',
    ].join('\n'),
  };
}
