/**
 * Re-send Zapier submission webhook for a saved application (e.g. after missed env on Vercel).
 * Usage: npm run zapier:replay -- <applicationId>
 */
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import { buildZapierSubmissionPayload } from '../lib/zapier/build-submission-payload';
import { notifyZapierSubmission } from '../lib/zapier/notify-submission';
import { getSubmissionEmailRouting } from '../lib/investor-submission-routing';
import { calcMetrics } from '../lib/loan-calculations';
import type { InvestorApplication } from '../types/investor-application';

function loadEnvLocal(): void {
  const envPath = resolve(__dirname, '../.env.local');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || '';
const isLocalAppUrl = /localhost|127\.0\.0\.1/i.test(configuredAppUrl);
if (!configuredAppUrl || isLocalAppUrl) {
  process.env.NEXT_PUBLIC_APP_URL =
    process.env.INVESTOR_HUB_PUBLIC_URL?.trim() || 'https://qrinvestorhub.vercel.app';
}

const applicationId = process.argv[2]?.trim();
if (!applicationId) {
  console.error('Usage: npm run zapier:replay -- <applicationId>');
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
if (!url || !key) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

async function main() {
  const supabase = createClient(url!, key!);
  const { data: row, error } = await supabase
    .from('investor_applications')
    .select('*')
    .eq('id', applicationId)
    .maybeSingle();

  if (error || !row) {
    console.error('Application not found:', error?.message || applicationId);
    process.exit(1);
  }

  const { data: props } = await supabase
    .from('investor_properties')
    .select('property_data')
    .eq('application_id', applicationId);

  const app: InvestorApplication = {
    id: row.id,
    loanProgram: row.loan_program,
    dealStage: row.deal_stage,
    borrower: row.borrower,
    entity: row.entity,
    experience: row.experience,
    liquidity: row.liquidity || [],
    properties: (props || []).map((p) => p.property_data),
    loanRequest: row.loan_request,
    documents: [],
    additionalNotes: row.additional_notes || '',
    consents: row.consents,
  };

  const metrics = calcMetrics({
    liquidAssets: app.liquidity,
    properties: app.properties,
    requestedLoanAmount: app.loanRequest.requestedLoanAmount,
    purchasePrice: app.loanRequest.purchasePrice,
    rehabBudget: app.loanRequest.rehabBudget,
    constructionBudget: app.loanRequest.constructionBudget,
    arv: app.loanRequest.arv,
    completedValue: app.loanRequest.completedValue,
  });

  const routing = getSubmissionEmailRouting(app.loanRequest.requestedLoanAmount);
  const payload = buildZapierSubmissionPayload(
    app,
    metrics,
    row.guideline_warnings || [],
    row.ai_summary || '',
    applicationId,
    { routing, transcript: { found: false, summary: '', callDate: '', statusLabel: '' } },
  );

  console.log('Webhook:', process.env.ZAPIER_INVESTOR_SUBMISSION_WEBHOOK_URL);
  console.log('Staff To:', payload.emails.staff.to);
  console.log('Customer To:', payload.emails.customer.to);

  const result = await notifyZapierSubmission(payload);
  console.log('Result:', result);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
