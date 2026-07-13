import 'server-only';

export function buildPortalLoginEmailHtml(email: string, loginUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f7f5f0;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#14213D;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f7f5f0;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="520" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;width:100%;">
  <tr><td style="background:#14213D;border-radius:14px 14px 0 0;padding:28px;text-align:center;">
    <div style="font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.65);margin-bottom:8px;">QuestRock Investor Portal</div>
    <div style="font-family:Georgia,serif;font-size:24px;font-weight:700;color:#fff;">Sign in to your portal</div>
  </td></tr>
  <tr><td style="background:#fff;border:1px solid #e5e2db;border-top:none;border-radius:0 0 14px 14px;padding:28px;">
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;">Use the button below to securely access your investor applications and portfolio. This link is single-use and expires in 30 minutes.</p>
    <p style="margin:0 0 24px;font-size:14px;color:#64748b;">Signing in as <strong style="color:#14213D;">${email.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</strong></p>
    <div style="text-align:center;margin-bottom:20px;">
      <a href="${loginUrl.replace(/&/g, '&amp;')}" style="display:inline-block;padding:14px 28px;background:#1f6f54;color:#fff;text-decoration:none;border-radius:10px;font-size:15px;font-weight:700;">Sign in to Investor Portal →</a>
    </div>
    <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.5;text-align:center;">If you did not request this email, you can ignore it.<br>QuestRock Home Loans</p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

export function buildPortalLoginEmailText(email: string, loginUrl: string): { subject: string; text: string } {
  return {
    subject: 'Sign in to QuestRock Investor Portal',
    text: [
      'QuestRock Investor Portal — Sign in',
      '',
      `Use this link to sign in as ${email}:`,
      loginUrl,
      '',
      'This link expires in 30 minutes and can only be used once.',
      '',
      'If you did not request this, ignore this email.',
    ].join('\n'),
  };
}
