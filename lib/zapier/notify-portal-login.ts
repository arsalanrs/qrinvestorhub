import 'server-only';
import { getAppOrigin } from '@/lib/get-app-url';
import {
  buildPortalLoginEmailHtml,
  buildPortalLoginEmailText,
} from '@/lib/portal-login-email';

export type PortalLoginZapierPayload = {
  event: 'investor_portal.login_requested';
  email: string;
  loginUrl: string;
  expiresInMinutes: number;
  emails: {
    customer: {
      to: string;
      subject: string;
      html: string;
      text: string;
    };
  };
};

export function buildPortalLoginZapierPayload(
  email: string,
  loginUrl: string,
  options?: { firstName?: string | null; expiresInMinutes?: number },
): PortalLoginZapierPayload {
  const expiresInMinutes = options?.expiresInMinutes ?? 30;
  const emailOpts = { firstName: options?.firstName, expiresInMinutes };
  const { subject, text } = buildPortalLoginEmailText(email, loginUrl, emailOpts);
  return {
    event: 'investor_portal.login_requested',
    email,
    loginUrl,
    expiresInMinutes,
    emails: {
      customer: {
        to: email,
        subject,
        html: buildPortalLoginEmailHtml(email, loginUrl, emailOpts),
        text,
      },
    },
  };
}

export function buildPortalVerifyUrl(
  token: string,
  options?: { redirect?: string },
): string {
  const origin = getAppOrigin();
  const base = `${origin}/auth/portal-verify?token=${encodeURIComponent(token)}`;
  if (options?.redirect) {
    return `${base}&redirect=${encodeURIComponent(options.redirect)}`;
  }
  return base;
}

export type ZapierNotifyResult =
  | { sent: true; status: number }
  | { sent: false; skipped: true; reason: string }
  | { sent: false; error: string };

export async function notifyZapierPortalLogin(
  payload: PortalLoginZapierPayload,
): Promise<ZapierNotifyResult> {
  const webhookUrl = process.env.ZAPIER_PORTAL_LOGIN_WEBHOOK_URL?.trim();

  if (!webhookUrl) {
    return {
      sent: false,
      skipped: true,
      reason: 'ZAPIER_PORTAL_LOGIN_WEBHOOK_URL not configured (separate Catch Hook required)',
    };
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  const secret = process.env.ZAPIER_WEBHOOK_SECRET?.trim();
  if (secret) headers['X-QuestRock-Webhook-Secret'] = secret;

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => res.statusText);
      console.error('[zapier/portal-login]', res.status, body);
      return { sent: false, error: `Zapier webhook ${res.status}: ${body}` };
    }

    return { sent: true, status: res.status };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[zapier/portal-login]', msg);
    return { sent: false, error: msg };
  }
}
