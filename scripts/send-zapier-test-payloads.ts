/**
 * Sends production-format Zapier payloads (real email HTML) for testing.
 * Usage: npm run zapier:test
 */
import { buildZapierSubmissionPayload } from '../lib/zapier/build-submission-payload';
import { getSubmissionEmailRouting } from '../lib/investor-submission-routing';
import type { InvestorApplication } from '../types/investor-application';

import type { LoanMetrics } from '../lib/loan-calculations';
import { calcMetrics } from '../lib/loan-calculations';

const WEBHOOK =
  process.argv[2]?.trim() ||
  process.env.ZAPIER_INVESTOR_SUBMISSION_WEBHOOK_URL ||
  'https://hooks.zapier.com/hooks/catch/12042550/4ulo3bi/';

process.env.NEXT_PUBLIC_APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || 'https://qrinvestorhub.vercel.app';

function baseApp(overrides: Partial<InvestorApplication>): InvestorApplication {
  return {
    id: overrides.id,
    loanProgram: overrides.loanProgram || 'dscr',
    dealStage: overrides.dealStage || 'under_contract',
    borrower: overrides.borrower!,
    entity: overrides.entity!,
    experience: overrides.experience!,
    liquidity: overrides.liquidity || [],
    properties: overrides.properties || [],
    loanRequest: overrides.loanRequest!,
    documents: overrides.documents || [],
    additionalNotes: overrides.additionalNotes || '',
    consents: {
      accuracyConfirmed: true,
      investmentPurpose: true,
      noOwnerOccupancy: true,
      contactConsent: true,
      electronicComms: true,
      creditPullConsent: true,
    },
    ...overrides,
  } as InvestorApplication;
}

const SCENARIOS: Array<{
  label: string;
  id: string;
  app: InvestorApplication;
  warnings: string[];
  aiSummary: string;
}> = [
  {
    label: 'NIKK_TIER_750K_BRIDGE',
    id: '22222222-2222-4222-8222-222222222222',
    app: baseApp({
      loanProgram: 'bridge',
      dealStage: 'identified_property',
      borrower: {
        firstName: 'Sarah', lastName: 'Chen', email: 'sarah.chen.test@questrock.com',
        phone: '7135550202', dateOfBirth: '1978-11-02', ssn: '987654321', creditRange: '700-739',
        hasCoBorrower: true, coBorrowerName: 'David Chen', coBorrowerEmail: 'david.chen.test@questrock.com',
        coBorrowerPhone: '7135550203', coBorrowerCreditRange: '700-739',
      },
      entity: {
        borrowingAs: 'entity', entityName: 'Chen Property Group LLC', entityType: 'LLC',
        stateOfFormation: 'TX', authorizedSigner: 'Sarah Chen', ownershipPercentage: '60',
        ein: '98-7654321', additionalGuarantors: [{ name: 'David Chen', email: 'david.chen.test@questrock.com', phone: '7135550203' }],
      },
      experience: {
        completedFlips: true, flipsLast3Years: '4', ownsRentals: true, rentalsOwned: '6',
        completedNewBuilds: false, newBuildsLast3Years: '0', isBuilderDeveloper: false,
        adverseHistory: false, adverseHistoryDetails: '',
      },
      liquidity: [{ type: 'checking_savings', label: 'Operating account', estimatedBalance: '310000' }],
      loanRequest: {
        transactionType: 'purchase', subjectPropertyId: 'prop-1', purchaseSubjectAddress: '902 Memorial Dr, Houston, TX',
        requestedLoanAmount: '$750,000', purchasePrice: '$980,000', desiredCashOut: '', rehabBudget: '$120,000',
        rehabAmountFinanced: '$90,000', arv: '$1,350,000', constructionBudget: '', constructionAmountFinanced: '',
        completedValue: '', fundingTimeline: '21_days', closingDate: '2026-07-28',
        exitStrategy: 'Fix and flip within 9 months', backupExitStrategy: 'Refinance to DSCR',
        prepayStructure: '1yr', interestOnly: true,
      },
      properties: [{
        id: 'prop-1', isMain: true, address: '902 Memorial Dr', unit: '', city: 'Houston', state: 'TX', zip: '77007',
        propertyType: 'two_to_four_unit', numUnits: '2', bedrooms: '6', bathrooms: '4', sqft: '3200',
        currentAsIsValue: '$980,000', estimatedMarketRent: '$4,800', occupancyStatus: 'vacant',
        annualHazardInsurance: '$2,800', annualFloodInsurance: '', annualPropertyTax: '$14,200', annualHOA: '$0',
        currentMortgageBalance: '', currentLender: '', monthlyPayment: '', leaseStatus: 'vacant',
      }],
      documents: [{ id: 'd1', type: 'scope_of_work', label: 'Scope of work', status: 'uploaded', fileName: 'sow.pdf', required: true }],
      additionalNotes: 'TEST — Nikk tier routing. Safe to ignore.',
    }),
    warnings: ['Estimated LTC near guideline max for bridge program'],
    aiSummary: 'Sarah Chen requests bridge financing on a vacant duplex in Houston. $750K loan, $120K rehab, ARV $1.35M. PRO-tier investor.',
  },
];

async function main() {
  console.log(`Webhook: ${WEBHOOK}\n`);

  for (const s of SCENARIOS) {
    const routing = getSubmissionEmailRouting(s.app.loanRequest.requestedLoanAmount);
    const metrics: LoanMetrics = calcMetrics({
      liquidAssets: s.app.liquidity,
      properties: s.app.properties,
      requestedLoanAmount: s.app.loanRequest.requestedLoanAmount,
      purchasePrice: s.app.loanRequest.purchasePrice,
      rehabBudget: s.app.loanRequest.rehabBudget,
      arv: s.app.loanRequest.arv,
    });
    const payload = buildZapierSubmissionPayload(
      s.app,
      metrics,
      s.warnings,
      s.aiSummary,
      s.id,
      { routing, transcript: { found: false, summary: '', callDate: '', statusLabel: '' } },
    );
    const payloadBody = { ...payload, _test: true, _testScenario: s.label };

    const res = await fetch(WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadBody),
    });
    const resText = await res.text();
    console.log(`[${s.label}] HTTP ${res.status}`);
    console.log(`  Staff To: ${payload.emails.staff.to}`);
    console.log(`  HTML length: ${payload.emails.staff.html.length} chars`);
    console.log(`  Response: ${resText.slice(0, 100)}\n`);
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log('Done — re-test Outlook step in Zapier with the latest Catch Hook record.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
