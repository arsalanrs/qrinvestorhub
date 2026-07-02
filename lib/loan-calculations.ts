export function toNum(val: string | number | undefined | null): number {
  if (val == null) return 0;
  return Number(String(val).replace(/[^0-9.-]/g, '')) || 0;
}

export function fmt(n: number): string {
  return '$' + Math.round(n).toLocaleString('en-US');
}

export function pct(n: number): string {
  return n.toFixed(1) + '%';
}

export interface LoanMetrics {
  totalLiquidAssets: number;
  totalPortfolioValue: number;
  totalPortfolioDebt: number;
  totalMonthlyRent: number;
  totalAnnualExpenses: number;
  totalProjectCost: number;
  cashOut: number | null;
  cashOutNote: string | null;
  acquisitionLTV: number | null;
  marketLTV: number | null;
  ltc: number | null;
  simpleARV: number | null;
  fullARV: number | null;
  portfolioLTV: number | null;
  estimatedMonthlyPITIA: number;
  dscr: number | null;
  dscrNote: string | null;
}

export function calcMetrics(params: {
  liquidAssets?: Array<{ estimatedValue: string; amountOwed: string }>;
  properties?: Array<{
    currentAsIsValue: string;
    currentMortgageBalance: string;
    estimatedMarketRent: string;
    annualPropertyTax: string;
    annualHazardInsurance: string;
    annualFloodInsurance: string;
    annualHOA: string;
  }>;
  requestedLoanAmount?: string;
  purchasePrice?: string;
  rehabBudget?: string;
  constructionBudget?: string;
  arv?: string;
  completedValue?: string;
  currentMortgageBalance?: string;
  desiredCashOut?: string;
  estimatedRate?: number;
  loanTermMonths?: number;
}): LoanMetrics {
  const {
    liquidAssets = [],
    properties = [],
    requestedLoanAmount = '',
    purchasePrice = '',
    rehabBudget = '',
    constructionBudget = '',
    arv = '',
    completedValue = '',
    currentMortgageBalance: singleMtgBalance = '',
    estimatedRate = 8.5,
    loanTermMonths = 360,
  } = params;

  const totalLiquidAssets = liquidAssets.reduce(
    (sum, a) => sum + toNum(a.estimatedValue) - toNum(a.amountOwed), 0
  );

  const totalPortfolioValue = properties.reduce((s, p) => s + toNum(p.currentAsIsValue), 0);
  const totalPortfolioDebt = properties.reduce((s, p) => s + toNum(p.currentMortgageBalance), 0);
  const totalMonthlyRent = properties.reduce((s, p) => s + toNum(p.estimatedMarketRent), 0);
  const totalAnnualExpenses = properties.reduce(
    (s, p) => s + toNum(p.annualPropertyTax) + toNum(p.annualHazardInsurance) + toNum(p.annualFloodInsurance) + toNum(p.annualHOA), 0
  );

  const loanAmt = toNum(requestedLoanAmount);
  const price = toNum(purchasePrice);
  const rehab = toNum(rehabBudget) || toNum(constructionBudget);
  const arvNum = toNum(arv) || toNum(completedValue);
  const propValue = totalPortfolioValue || toNum(properties[0]?.currentAsIsValue);
  const mtgBalance = toNum(singleMtgBalance) || totalPortfolioDebt;

  const totalProjectCost = (price || propValue) + rehab;

  let cashOut: number | null = null;
  let cashOutNote: string | null = null;
  if (loanAmt && mtgBalance) {
    const diff = loanAmt - mtgBalance;
    if (diff > 0) {
      cashOut = diff;
    } else {
      cashOutNote = 'Cash-out needs clarification based on payoff and requested loan amount.';
    }
  }

  const acquisitionLTV = loanAmt && price ? loanAmt / price : null;
  const marketLTV = loanAmt && propValue ? loanAmt / propValue : null;
  const ltc = loanAmt && totalProjectCost > 0 ? loanAmt / totalProjectCost : null;
  const simpleARV = loanAmt && arvNum ? loanAmt / arvNum : null;
  const fullARV = totalProjectCost > 0 && arvNum ? totalProjectCost / arvNum : null;
  const portfolioLTV = loanAmt && totalPortfolioValue > 0 ? loanAmt / totalPortfolioValue : null;

  const monthlyRate = estimatedRate / 100 / 12;
  const estimatedPI = loanAmt && monthlyRate > 0
    ? loanAmt * (monthlyRate * Math.pow(1 + monthlyRate, loanTermMonths)) / (Math.pow(1 + monthlyRate, loanTermMonths) - 1)
    : 0;
  const monthlyExpenses = totalAnnualExpenses / 12;
  const estimatedMonthlyPITIA = estimatedPI + monthlyExpenses;

  let dscr: number | null = null;
  let dscrNote: string | null = null;
  if (totalMonthlyRent > 0 && estimatedMonthlyPITIA > 0) {
    dscr = totalMonthlyRent / estimatedMonthlyPITIA;
    if (!toNum(properties[0]?.annualPropertyTax)) {
      dscrNote = 'Estimated — add taxes, insurance, and HOA for accurate DSCR.';
    }
  } else if (totalMonthlyRent > 0) {
    dscrNote = 'Add loan amount and expenses to calculate DSCR.';
  }

  return {
    totalLiquidAssets,
    totalPortfolioValue,
    totalPortfolioDebt,
    totalMonthlyRent,
    totalAnnualExpenses,
    totalProjectCost,
    cashOut,
    cashOutNote,
    acquisitionLTV,
    marketLTV,
    ltc,
    simpleARV,
    fullARV,
    portfolioLTV,
    estimatedMonthlyPITIA,
    dscr,
    dscrNote,
  };
}

export function getGuidelineWarnings(
  metrics: LoanMetrics,
  programKey: string,
  occupancyStatuses: string[]
): string[] {
  const warnings: string[] = [];

  if (occupancyStatuses.includes('owner_occupied')) {
    warnings.push('Owner occupancy was selected. These programs are for investment properties only.');
  }
  if (metrics.marketLTV && metrics.marketLTV > 0.80 && ['bridge', 'dscr'].includes(programKey)) {
    warnings.push('Your requested loan amount appears higher than typical program guidelines. QuestRock may suggest a lower loan amount or alternative structure.');
  }
  if (metrics.ltc && metrics.ltc > 0.90 && ['construction', 'rehab'].includes(programKey)) {
    warnings.push('LTC exceeds typical guidelines. QuestRock may suggest a lower rehab or construction financed amount.');
  }
  if (metrics.simpleARV && metrics.simpleARV > 0.75 && ['construction', 'rehab'].includes(programKey)) {
    warnings.push('ARV leverage is above typical program range. This deal may need review.');
  }
  if (metrics.dscr !== null && metrics.dscr < 1.0 && programKey === 'dscr') {
    warnings.push("Rent doesn't fully cover the payment at this loan amount. QuestRock may suggest an alternative structure.");
  }
  if (metrics.portfolioLTV && metrics.portfolioLTV > 0.75 && programKey === 'blanket_portfolio') {
    warnings.push('Portfolio LTV is above typical guidelines. QuestRock may suggest a lower loan amount.');
  }
  if (metrics.cashOutNote) {
    warnings.push(metrics.cashOutNote);
  }
  return warnings;
}
