#!/usr/bin/env node
/**
 * Sends sample Investor Hub submission payloads to a Zapier Catch Hook.
 * Usage: node scripts/send-zapier-test-payloads.mjs [webhook-url]
 */

const WEBHOOK =
  process.argv[2]?.trim() ||
  process.env.ZAPIER_INVESTOR_SUBMISSION_WEBHOOK_URL ||
  'https://hooks.zapier.com/hooks/catch/12042550/4ulo3bi/';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'https://qrinvestorhub.vercel.app';

function staffHtml(borrowerName, program, loan, routedTo) {
  return `<!DOCTYPE html><html><body style="font-family:Inter,sans-serif;color:#14213D">
<div style="background:#14213D;color:#fff;padding:20px"><h1>New Submission — ${borrowerName}</h1>
<p>${program} · ${loan} → ${routedTo}</p></div>
<p style="padding:20px">Test payload from QuestRock Investor Hub webhook tester.</p></body></html>`;
}

function customerHtml(name, portalUrl, appId) {
  return `<!DOCTYPE html><html><body style="font-family:Inter,sans-serif">
<h1>Welcome to your Investor Portal</h1>
<p>Hi ${name}, your application is being reviewed.</p>
<p><a href="${portalUrl}">Open Investor Portal →</a></p>
<p style="font-size:12px;color:#666">Ref: ${appId}</p></body></html>`;
}

function buildPayload(scenario) {
  const appId = scenario.applicationId;
  const portal = `${APP_URL}/portal`;
  const portfolio = `${APP_URL}/portfolio/${appId}`;
  const admin = `${APP_URL}/ops/investor-hub`;
  const cc = ['nikksmith@questrock.com', 'jfriday@questrock.com'];

  return {
    event: 'investor_application.submitted',
    applicationId: appId,
    submittedAt: new Date().toISOString(),
    source: 'investor_hub',
    loanProgram: scenario.loanProgram,
    loanProgramLabel: scenario.loanProgramLabel,
    dealStage: scenario.dealStage,
    borrower: scenario.borrower,
    entity: scenario.entity,
    experience: scenario.experience,
    liquidity: scenario.liquidity,
    loanRequest: scenario.loanRequest,
    properties: scenario.properties,
    documents: scenario.documents,
    calculations: scenario.calculations,
    guidelineWarnings: scenario.guidelineWarnings,
    aiSummary: scenario.aiSummary,
    additionalNotes: scenario.additionalNotes,
    consents: { creditPull: true, termsAccepted: true },
    emailRouting: scenario.emailRouting,
    links: { portal, portfolio, admin },
    emails: {
      staff: {
        to: scenario.emailRouting.to,
        toName: scenario.emailRouting.toName,
        cc,
        ccCsv: cc.join(','),
        subject: `Investor Hub — ${scenario.borrower.firstName} ${scenario.borrower.lastName} · ${scenario.loanProgramLabel} · ${scenario.loanRequest.requestedLoanAmount} → ${scenario.emailRouting.toName}`,
        html: staffHtml(
          `${scenario.borrower.firstName} ${scenario.borrower.lastName}`,
          scenario.loanProgramLabel,
          scenario.loanRequest.requestedLoanAmount,
          scenario.emailRouting.toName,
        ),
        text: `TEST PAYLOAD [${scenario.label}]\nBorrower: ${scenario.borrower.firstName} ${scenario.borrower.lastName}\nRouted to: ${scenario.emailRouting.toName}`,
      },
      customer: {
        to: scenario.borrower.email,
        toName: `${scenario.borrower.firstName} ${scenario.borrower.lastName}`,
        subject: 'Your QuestRock Investor Portal is ready',
        html: customerHtml(
          scenario.borrower.firstName,
          portal,
          appId,
        ),
        text: `Hi ${scenario.borrower.firstName}, sign in at ${portal}`,
      },
    },
    shape: {
      firstName: scenario.borrower.firstName,
      lastName: scenario.borrower.lastName,
      email: scenario.borrower.email,
      phone: scenario.borrower.phone,
      loanProgram: scenario.loanProgram,
      loanAmount: scenario.loanRequest.requestedLoanAmount,
      status: scenario.shapeStatus,
      source: 'Investor Hub',
      note: `<strong>[INVESTOR HUB SUBMISSION — TEST ${scenario.label}]</strong><br>Application ID: ${appId}<br>${scenario.aiSummary}`,
    },
    transcript: scenario.transcript,
    zapierPaths: ['shape_sync', 'staff_email', 'customer_email'],
    _test: true,
    _testScenario: scenario.label,
  };
}

const SCENARIOS = [
  {
    label: 'RAY_TIER_1.2M_DSCR',
    applicationId: '11111111-1111-4111-8111-111111111111',
    loanProgram: 'dscr',
    loanProgramLabel: 'DSCR Loan',
    dealStage: 'under_contract',
    shapeStatus: 'DSCR Loan Submitted',
    borrower: {
      firstName: 'Marcus',
      lastName: 'Reeves',
      email: 'marcus.reeves.test@questrock.com',
      phone: '5125550101',
      dateOfBirth: '1982-04-15',
      ssn: '123456789',
      creditRange: '740+',
      hasCoBorrower: false,
      coBorrowerName: '',
      coBorrowerEmail: '',
      coBorrowerPhone: '',
      coBorrowerCreditRange: '',
    },
    entity: {
      borrowingAs: 'entity',
      entityName: 'Reeves Capital Holdings LLC',
      entityType: 'LLC',
      stateOfFormation: 'TX',
      authorizedSigner: 'Marcus Reeves',
      ownershipPercentage: '100',
      ein: '12-3456789',
      additionalGuarantors: [],
    },
    experience: {
      completedFlips: true,
      flipsLast3Years: '8',
      ownsRentals: true,
      rentalsOwned: '12',
      completedNewBuilds: false,
      newBuildsLast3Years: '0',
      isBuilderDeveloper: false,
      adverseHistory: false,
      adverseHistoryDetails: '',
    },
    liquidity: [
      { type: 'checking_savings', label: 'Business checking', estimatedBalance: '850000' },
      { type: 'stocks_brokerage', label: 'Fidelity brokerage', estimatedBalance: '420000' },
    ],
    loanRequest: {
      transactionType: 'purchase',
      subjectPropertyId: 'prop-1',
      purchaseSubjectAddress: '1842 Lakeline Blvd, Austin, TX 78734',
      requestedLoanAmount: '$1,250,000',
      purchasePrice: '$1,650,000',
      desiredCashOut: '',
      rehabBudget: '',
      rehabAmountFinanced: '',
      arv: '',
      constructionBudget: '',
      constructionAmountFinanced: '',
      completedValue: '',
      fundingTimeline: '30_days',
      closingDate: '2026-08-15',
      exitStrategy: 'Long-term rental hold',
      backupExitStrategy: 'Refinance to conventional',
      prepayStructure: '5yr',
      interestOnly: true,
    },
    properties: [
      {
        id: 'prop-1',
        isMain: true,
        address: '1842 Lakeline Blvd',
        unit: '',
        city: 'Austin',
        state: 'TX',
        zip: '78734',
        propertyType: 'single_family',
        numUnits: '1',
        bedrooms: '4',
        bathrooms: '3',
        sqft: '2850',
        currentAsIsValue: '$1,650,000',
        estimatedMarketRent: '$6,200',
        occupancyStatus: 'tenant_occupied',
        annualHazardInsurance: '$3,200',
        annualFloodInsurance: '',
        annualPropertyTax: '$18,500',
        annualHOA: '$0',
        currentMortgageBalance: '',
        currentLender: '',
        monthlyPayment: '',
        leaseStatus: 'leased',
      },
    ],
    documents: [
      { id: 'doc-1', type: 'bank_statement', label: 'Bank statements (2 mo)', status: 'uploaded', fileName: 'statements.pdf', required: true },
      { id: 'doc-2', type: 'purchase_contract', label: 'Purchase contract', status: 'uploaded', fileName: 'contract.pdf', required: true },
    ],
    calculations: {
      totalPortfolioValue: 1650000,
      totalPortfolioDebt: 0,
      totalMonthlyRent: 6200,
      totalLiquidAssets: 1270000,
      marketLTV: 0.7576,
      dscr: 1.42,
      ltc: null,
    },
    guidelineWarnings: [],
    aiSummary:
      'Marcus Reeves requests a DSCR purchase on a tenant-occupied SFR in Austin. $1.25M loan on $1.65M value (~76% LTV). Estimated DSCR 1.42. Strong liquidity ($1.27M) and elite investor track record (8 flips, 12 rentals).',
    additionalNotes: 'TEST PAYLOAD — Ray tier routing (loan > $1M). Safe to ignore.',
    emailRouting: {
      to: 'rconway@questrock.com',
      toName: 'Ray Conway',
      cc: ['nikksmith@questrock.com', 'jfriday@questrock.com'],
      loanAmount: 1250000,
      tier: 'ray',
    },
    transcript: {
      found: true,
      summary: 'Prior inbound call: borrower asked about DSCR on Austin rental. Credit self-reported 740+.',
      callDate: '2026-07-10',
      statusLabel: 'Qualified',
    },
  },
  {
    label: 'NIKK_TIER_750K_BRIDGE',
    applicationId: '22222222-2222-4222-8222-222222222222',
    loanProgram: 'bridge',
    loanProgramLabel: 'Bridge Loan',
    dealStage: 'identified_property',
    shapeStatus: 'Bridge Loan Submitted',
    borrower: {
      firstName: 'Sarah',
      lastName: 'Chen',
      email: 'sarah.chen.test@questrock.com',
      phone: '7135550202',
      dateOfBirth: '1978-11-02',
      ssn: '987654321',
      creditRange: '700-739',
      hasCoBorrower: true,
      coBorrowerName: 'David Chen',
      coBorrowerEmail: 'david.chen.test@questrock.com',
      coBorrowerPhone: '7135550203',
      coBorrowerCreditRange: '700-739',
    },
    entity: {
      borrowingAs: 'entity',
      entityName: 'Chen Property Group LLC',
      entityType: 'LLC',
      stateOfFormation: 'TX',
      authorizedSigner: 'Sarah Chen',
      ownershipPercentage: '60',
      ein: '98-7654321',
      additionalGuarantors: [{ name: 'David Chen', email: 'david.chen.test@questrock.com', phone: '7135550203' }],
    },
    experience: {
      completedFlips: true,
      flipsLast3Years: '4',
      ownsRentals: true,
      rentalsOwned: '6',
      completedNewBuilds: false,
      newBuildsLast3Years: '0',
      isBuilderDeveloper: false,
      adverseHistory: false,
      adverseHistoryDetails: '',
    },
    liquidity: [{ type: 'checking_savings', label: 'Operating account', estimatedBalance: '310000' }],
    loanRequest: {
      transactionType: 'purchase',
      subjectPropertyId: 'prop-1',
      purchaseSubjectAddress: '902 Memorial Dr, Houston, TX 77007',
      requestedLoanAmount: '$750,000',
      purchasePrice: '$980,000',
      desiredCashOut: '',
      rehabBudget: '$120,000',
      rehabAmountFinanced: '$90,000',
      arv: '$1,350,000',
      constructionBudget: '',
      constructionAmountFinanced: '',
      completedValue: '',
      fundingTimeline: '21_days',
      closingDate: '2026-07-28',
      exitStrategy: 'Fix and flip within 9 months',
      backupExitStrategy: 'Refinance to DSCR if market slows',
      prepayStructure: '1yr',
      interestOnly: true,
    },
    properties: [
      {
        id: 'prop-1',
        isMain: true,
        address: '902 Memorial Dr',
        unit: '',
        city: 'Houston',
        state: 'TX',
        zip: '77007',
        propertyType: 'two_to_four_unit',
        numUnits: '2',
        bedrooms: '6',
        bathrooms: '4',
        sqft: '3200',
        currentAsIsValue: '$980,000',
        estimatedMarketRent: '$4,800',
        occupancyStatus: 'vacant',
        annualHazardInsurance: '$2,800',
        annualFloodInsurance: '',
        annualPropertyTax: '$14,200',
        annualHOA: '$0',
        currentMortgageBalance: '',
        currentLender: '',
        monthlyPayment: '',
        leaseStatus: 'vacant',
      },
    ],
    documents: [
      { id: 'doc-1', type: 'scope_of_work', label: 'Scope of work', status: 'uploaded', fileName: 'sow.pdf', required: true },
    ],
    calculations: {
      totalPortfolioValue: 980000,
      totalPortfolioDebt: 0,
      totalMonthlyRent: 4800,
      totalLiquidAssets: 310000,
      marketLTV: 0.7653,
      dscr: null,
      ltc: 0.72,
    },
    guidelineWarnings: ['Estimated LTC near guideline max for bridge program'],
    aiSummary:
      'Sarah Chen (co-borrower David Chen) requests bridge financing on a vacant duplex in Houston. $750K loan, $120K rehab budget, ARV $1.35M. PRO-tier investor (4 flips in 3 years).',
    additionalNotes: 'TEST PAYLOAD — Nikk tier routing ($600K–$1M). Safe to ignore.',
    emailRouting: {
      to: 'nikksmith@questrock.com',
      toName: 'Nikk Smith',
      cc: ['nikksmith@questrock.com', 'jfriday@questrock.com'],
      loanAmount: 750000,
      tier: 'nikk',
    },
    transcript: { found: false, summary: '', callDate: '', statusLabel: '' },
  },
  {
    label: 'BASTIAN_TIER_425K_REHAB',
    applicationId: '33333333-3333-4333-8333-333333333333',
    loanProgram: 'rehab',
    loanProgramLabel: 'Rehab / Fix & Flip Loan',
    dealStage: 'actively_looking',
    shapeStatus: 'Rehab Loan Submitted',
    borrower: {
      firstName: 'Jordan',
      lastName: 'Walsh',
      email: 'jordan.walsh.test@questrock.com',
      phone: '2145550303',
      dateOfBirth: '1990-06-22',
      ssn: '555443333',
      creditRange: '660-699',
      hasCoBorrower: false,
      coBorrowerName: '',
      coBorrowerEmail: '',
      coBorrowerPhone: '',
      coBorrowerCreditRange: '',
    },
    entity: {
      borrowingAs: 'individual',
      entityName: '',
      entityType: '',
      stateOfFormation: '',
      authorizedSigner: '',
      ownershipPercentage: '',
      ein: '',
      additionalGuarantors: [],
    },
    experience: {
      completedFlips: true,
      flipsLast3Years: '2',
      ownsRentals: false,
      rentalsOwned: '0',
      completedNewBuilds: false,
      newBuildsLast3Years: '0',
      isBuilderDeveloper: false,
      adverseHistory: false,
      adverseHistoryDetails: '',
    },
    liquidity: [{ type: 'checking_savings', label: 'Personal savings', estimatedBalance: '$95000' }],
    loanRequest: {
      transactionType: 'purchase',
      subjectPropertyId: 'prop-1',
      purchaseSubjectAddress: '4418 Swiss Ave, Dallas, TX 75204',
      requestedLoanAmount: '$425,000',
      purchasePrice: '$385,000',
      desiredCashOut: '',
      rehabBudget: '$85,000',
      rehabAmountFinanced: '$75,000',
      arv: '$575,000',
      constructionBudget: '',
      constructionAmountFinanced: '',
      completedValue: '',
      fundingTimeline: '45_days',
      closingDate: '',
      exitStrategy: 'Sell within 6 months post-rehab',
      backupExitStrategy: 'Hold as rental if sale market soft',
      prepayStructure: 'none',
      interestOnly: true,
    },
    properties: [
      {
        id: 'prop-1',
        isMain: true,
        address: '4418 Swiss Ave',
        unit: '',
        city: 'Dallas',
        state: 'TX',
        zip: '75204',
        propertyType: 'single_family',
        numUnits: '1',
        bedrooms: '3',
        bathrooms: '2',
        sqft: '1650',
        currentAsIsValue: '$385,000',
        estimatedMarketRent: '$2,400',
        occupancyStatus: 'vacant',
        annualHazardInsurance: '$1,600',
        annualFloodInsurance: '',
        annualPropertyTax: '$6,800',
        annualHOA: '$0',
        currentMortgageBalance: '',
        currentLender: '',
        monthlyPayment: '',
        leaseStatus: 'vacant',
      },
    ],
    documents: [],
    calculations: {
      totalPortfolioValue: 385000,
      totalPortfolioDebt: 0,
      totalMonthlyRent: 2400,
      totalLiquidAssets: 95000,
      marketLTV: null,
      dscr: null,
      ltc: 0.78,
    },
    guidelineWarnings: ['ROOKIE-tier investor — limited flip history', 'Liquidity may be tight for rehab hold period'],
    aiSummary:
      'Jordan Walsh requests rehab financing on a vacant SFR in Dallas. $425K total loan ($385K purchase + $75K rehab financed). ARV $575K. First-time scale-up investor (2 flips in 3 years).',
    additionalNotes: 'TEST PAYLOAD — Bastian tier routing (loan < $600K). Safe to ignore.',
    emailRouting: {
      to: 'bastianjohnston@questrock.com',
      toName: 'Bastian Johnston',
      cc: ['nikksmith@questrock.com', 'jfriday@questrock.com'],
      loanAmount: 425000,
      tier: 'bastian',
    },
    transcript: { found: false, summary: '', callDate: '', statusLabel: '' },
  },
];

async function main() {
  console.log(`Webhook: ${WEBHOOK}\n`);

  for (const scenario of SCENARIOS) {
    const payload = buildPayload(scenario);
    const res = await fetch(WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    });
    const body = await res.text();
    console.log(`[${scenario.label}] HTTP ${res.status} — ${body.slice(0, 120)}`);
    await new Promise(r => setTimeout(r, 800));
  }

  console.log('\nDone — 3 test payloads sent. Check Zapier Catch Hook history.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
