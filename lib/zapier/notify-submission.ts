import 'server-only';
import type { ZapierSubmissionPayload } from '@/lib/zapier/build-submission-payload';

export type ZapierNotifyResult =
  | { sent: true; status: number }
  | { sent: false; skipped: true; reason: string }
  | { sent: false; error: string };

export async function notifyZapierSubmission(
  payload: ZapierSubmissionPayload,
): Promise<ZapierNotifyResult> {
  const webhookUrl = process.env.ZAPIER_INVESTOR_SUBMISSION_WEBHOOK_URL?.trim();
  if (!webhookUrl) {
    return {
      sent: false,
      skipped: true,
      reason: 'ZAPIER_INVESTOR_SUBMISSION_WEBHOOK_URL not configured',
    };
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  const secret = process.env.ZAPIER_WEBHOOK_SECRET?.trim();
  if (secret) {
    headers['X-QuestRock-Webhook-Secret'] = secret;
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => res.statusText);
      console.error('[zapier] webhook error:', res.status, body);
      return { sent: false, error: `Zapier webhook ${res.status}: ${body}` };
    }

    return { sent: true, status: res.status };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[zapier] webhook fetch failed:', msg);
    return { sent: false, error: msg };
  }
}
