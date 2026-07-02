import 'server-only';
import type { InvestorApplication } from '@/types/investor-application';
import type { LoanMetrics } from './loan-calculations';
import { fmt, pct } from './loan-calculations';

export async function generateAISummary(
  app: InvestorApplication,
  metrics: LoanMetrics,
  warnings: string[]
): Promise<string> {
  if (process.env.ENABLE_AI_SUMMARY !== 'true') {
    return buildFallbackSummary(app, metrics, warnings);
  }

  try {
    const OpenAI = (await import('openai')).default;
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = buildPrompt(app, metrics, warnings);
    const res = await client.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0,
      max_tokens: 600,
      messages: [
        {
          role: 'system',
          content:
            'You are a senior mortgage underwriting analyst. Write a concise internal loan scenario summary for QuestRock underwriters. Be factual, flag missing info, and note guideline concerns. 4-6 sentences.',
        },
        { role: 'user', content: prompt },
      ],
    });
    return res.choices[0]?.message?.content ?? buildFallbackSummary(app, metrics, warnings);
  } catch {
    return buildFallbackSummary(app, metrics, warnings);
  }
}

function buildPrompt(app: InvestorApplication, metrics: LoanMetrics, warnings: string[]): string {
  const b = app.borrower;
  const lr = app.loanRequest;
  const prop = app.properties[0];
  return [
    `Loan Program: ${app.loanProgram}`,
    `Borrower: ${b.firstName} ${b.lastName}, ${b.email}, credit ${b.creditRange}`,
    `Transaction: ${lr.transactionType}`,
    `Requested Loan: ${lr.requestedLoanAmount}`,
    `Purchase Price: ${lr.purchasePrice || 'N/A'}`,
    `Property Value: ${prop?.currentAsIsValue || metrics.totalPortfolioValue}`,
    `Current Debt: ${prop?.currentMortgageBalance || metrics.totalPortfolioDebt}`,
    `Rehab/Construction Budget: ${lr.rehabBudget || lr.constructionBudget || 'N/A'}`,
    `ARV/Completed Value: ${lr.arv || lr.completedValue || 'N/A'}`,
    `Market LTV: ${metrics.marketLTV ? pct(metrics.marketLTV * 100) : 'N/A'}`,
    `LTC: ${metrics.ltc ? pct(metrics.ltc * 100) : 'N/A'}`,
    `DSCR: ${metrics.dscr ? metrics.dscr.toFixed(2) : 'N/A'}`,
    `Monthly Rent: ${metrics.totalMonthlyRent ? fmt(metrics.totalMonthlyRent) : 'N/A'}`,
    `Est. Liquidity: ${fmt(metrics.totalLiquidAssets)}`,
    `Rentals owned: ${app.experience.rentalsOwned}`,
    `Exit strategy: ${lr.exitStrategy || 'N/A'}`,
    `Warnings: ${warnings.join('; ') || 'None'}`,
    `Missing docs: ${app.documents.filter((d) => d.status === 'missing').map((d) => d.label).join(', ') || 'None'}`,
    `Notes: ${app.additionalNotes || 'None'}`,
  ].join('\n');
}

function buildFallbackSummary(
  app: InvestorApplication,
  metrics: LoanMetrics,
  warnings: string[]
): string {
  const b = app.borrower;
  const lr = app.loanRequest;
  const propCount = app.properties.length;
  const parts: string[] = [];
  parts.push(
    `${b.firstName} ${b.lastName} is requesting a ${app.loanProgram?.replace(/_/g, ' ')} (${
      lr.transactionType?.replace(/_/g, ' ') || 'type TBD'
    }) on ${propCount} propert${propCount === 1 ? 'y' : 'ies'}.`
  );
  if (metrics.totalPortfolioValue > 0)
    parts.push(`Estimated property value: ${fmt(metrics.totalPortfolioValue)}.`);
  if (lr.requestedLoanAmount)
    parts.push(
      `Requested loan amount: ${fmt(Number(lr.requestedLoanAmount.replace(/[^0-9]/g, '')))}. Estimated market LTV: ${
        metrics.marketLTV ? pct(metrics.marketLTV * 100) : 'TBD'
      }.`
    );
  if (metrics.dscr !== null) parts.push(`Estimated DSCR: ${metrics.dscr.toFixed(2)}.`);
  if (lr.exitStrategy) parts.push(`Exit strategy: ${lr.exitStrategy}.`);
  if (metrics.totalLiquidAssets > 0)
    parts.push(`Reported liquidity: ${fmt(metrics.totalLiquidAssets)}.`);
  if (warnings.length > 0) parts.push(`Flags: ${warnings.slice(0, 2).join(' ')}`);
  const missingDocs = app.documents.filter((d) => d.status === 'missing').map((d) => d.label);
  if (missingDocs.length > 0) parts.push(`Missing: ${missingDocs.slice(0, 3).join(', ')}.`);
  return parts.join(' ');
}
