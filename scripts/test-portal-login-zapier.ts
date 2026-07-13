#!/usr/bin/env tsx
/**
 * POST a sample portal login payload (real HTML template) to Zap #2 Catch Hook.
 * Usage: ZAPIER_PORTAL_LOGIN_WEBHOOK_URL=https://hooks.zapier.com/... npm run zapier:test-login
 */
import { buildPortalLoginZapierPayload } from '../lib/zapier/notify-portal-login';

const WEBHOOK = process.env.ZAPIER_PORTAL_LOGIN_WEBHOOK_URL?.trim();
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'https://qrinvestorhub.vercel.app');

if (!WEBHOOK) {
  console.error('Set ZAPIER_PORTAL_LOGIN_WEBHOOK_URL first.');
  process.exit(1);
}

const email = 'sarah.chen.test@questrock.com';
const loginUrl = `${APP_URL}/auth/portal-verify?token=TEST_TOKEN_PREVIEW_ONLY`;

const payload = {
  ...buildPortalLoginZapierPayload(email, loginUrl, { firstName: 'Sarah', expiresInMinutes: 30 }),
  _test: true,
};

async function main() {
  const res = await fetch(WEBHOOK!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const body = await res.text();
  console.log(`HTTP ${res.status}`, body.slice(0, 200));
  if (!res.ok) process.exit(1);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
