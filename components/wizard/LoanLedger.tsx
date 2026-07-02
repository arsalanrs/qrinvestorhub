'use client';

import { useMemo } from 'react';
import { useWatch, useFormContext } from 'react-hook-form';
import type { InvestorApplication } from '@/types/investor-application';
import { calcMetrics, getGuidelineWarnings, fmt, pct } from '@/lib/loan-calculations';

interface LoanLedgerProps {
  inline?: boolean;
}

function LedgerRow({ label, value, mono = true, highlight }: { label: string; value: string; mono?: boolean; highlight?: 'good' | 'warn' | 'bad' }) {
  const color = highlight === 'good' ? 'var(--ledger-green)' : highlight === 'warn' ? 'var(--brass)' : highlight === 'bad' ? 'var(--clay)' : '#fff';
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
      <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', fontFamily: 'Inter, sans-serif' }}>{label}</span>
      <span style={{ fontSize: '13px', fontFamily: mono ? 'IBM Plex Mono, monospace' : 'Inter, sans-serif', fontWeight: 500, color }}>{value}</span>
    </div>
  );
}

function DSCRGauge({ dscr }: { dscr: number }) {
  const pct = Math.min(Math.max(dscr / 2, 0), 1) * 100;
  const color = dscr >= 1.25 ? 'var(--ledger-green)' : dscr >= 1.0 ? 'var(--brass)' : 'var(--clay)';
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>DSCR</span>
        <span style={{ fontSize: '18px', fontFamily: 'IBM Plex Mono, monospace', fontWeight: 600, color }}>{dscr.toFixed(2)}</span>
      </div>
      <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '3px', transition: 'width 0.3s, background 0.3s' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px' }}>
        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>0.0</span>
        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>1.0 min</span>
        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>2.0</span>
      </div>
    </div>
  );
}

export function LoanLedger({ inline }: LoanLedgerProps) {
  const { control } = useFormContext<InvestorApplication>();
  const formValues = useWatch({ control }) as InvestorApplication;

  const metrics = useMemo(() => calcMetrics({
    liquidAssets: formValues.liquidity,
    properties: formValues.properties,
    requestedLoanAmount: formValues.loanRequest?.requestedLoanAmount,
    purchasePrice: formValues.loanRequest?.purchasePrice,
    rehabBudget: formValues.loanRequest?.rehabBudget,
    constructionBudget: formValues.loanRequest?.constructionBudget,
    arv: formValues.loanRequest?.arv,
    completedValue: formValues.loanRequest?.completedValue,
    desiredCashOut: formValues.loanRequest?.desiredCashOut,
  }), [formValues]);

  const warnings = useMemo(() => getGuidelineWarnings(
    metrics,
    formValues.loanProgram || '',
    (formValues.properties || []).map(p => p.occupancyStatus)
  ), [metrics, formValues.loanProgram, formValues.properties]);

  const program = formValues.loanProgram;
  const missingDocs = (formValues.documents || []).filter(d => d.status === 'missing' && d.required);

  const sealStatus = formValues.status === 'submitted' ? 'SUBMITTED'
    : warnings.length > 0 ? 'NEEDS REVIEW'
    : metrics.marketLTV ? 'READY FOR TERM SHEET'
    : 'INTAKE IN PROGRESS';

  const sealColor = sealStatus === 'SUBMITTED' ? 'var(--ledger-green)'
    : sealStatus === 'NEEDS REVIEW' ? 'var(--clay)'
    : sealStatus === 'READY FOR TERM SHEET' ? 'var(--brass)'
    : 'var(--slate)';

  const containerStyle = inline ? {
    background: 'linear-gradient(160deg, #14213D, #0d1d34)',
    borderRadius: '18px',
    padding: '26px',
    color: '#fff',
    boxShadow: '0 8px 32px rgba(14,33,61,0.2)',
  } : {
    background: 'linear-gradient(160deg, #14213D, #0d1d34)',
    borderRadius: '18px',
    padding: '26px',
    color: '#fff',
    position: 'sticky' as const,
    top: '76px',
    maxHeight: 'calc(100vh - 90px)',
    overflowY: 'auto' as const,
    boxShadow: '0 8px 32px rgba(14,33,61,0.2)',
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', margin: '0 0 4px', fontFamily: 'IBM Plex Mono, monospace' }}>Live Ledger</p>
          <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '18px', fontWeight: 600, color: '#fff', margin: 0 }}>Loan Ledger</h3>
        </div>
        <span style={{
          fontSize: '9px',
          fontWeight: 700,
          padding: '5px 10px',
          borderRadius: '999px',
          border: `1.5px solid ${sealColor}`,
          color: sealColor,
          fontFamily: 'IBM Plex Mono, monospace',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          background: `${sealColor}18`,
        }}>
          {sealStatus}
        </span>
      </div>

      {/* DSCR Gauge */}
      {program === 'dscr' && metrics.dscr !== null && (
        <DSCRGauge dscr={metrics.dscr} />
      )}

      {/* Key Metrics */}
      <div style={{ marginBottom: '16px' }}>
        <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.35)', margin: '0 0 8px', fontFamily: 'IBM Plex Mono, monospace' }}>Loan Metrics</p>

        {metrics.totalPortfolioValue > 0 && (
          <LedgerRow label="Property Value" value={fmt(metrics.totalPortfolioValue)} />
        )}
        {metrics.totalPortfolioDebt > 0 && (
          <LedgerRow label="Existing Debt" value={fmt(metrics.totalPortfolioDebt)} />
        )}
        {metrics.acquisitionLTV !== null && (
          <LedgerRow
            label="Acquisition LTV"
            value={pct(metrics.acquisitionLTV * 100)}
            highlight={metrics.acquisitionLTV > 0.80 ? 'warn' : 'good'}
          />
        )}
        {metrics.marketLTV !== null && (
          <LedgerRow
            label="Market LTV"
            value={pct(metrics.marketLTV * 100)}
            highlight={metrics.marketLTV > 0.80 ? 'bad' : metrics.marketLTV > 0.70 ? 'warn' : 'good'}
          />
        )}
        {metrics.ltc !== null && (
          <LedgerRow
            label="LTC"
            value={pct(metrics.ltc * 100)}
            highlight={metrics.ltc > 0.90 ? 'bad' : metrics.ltc > 0.80 ? 'warn' : 'good'}
          />
        )}
        {metrics.simpleARV !== null && (
          <LedgerRow
            label="Loan / ARV"
            value={pct(metrics.simpleARV * 100)}
            highlight={metrics.simpleARV > 0.75 ? 'bad' : metrics.simpleARV > 0.65 ? 'warn' : 'good'}
          />
        )}
        {metrics.portfolioLTV !== null && (
          <LedgerRow
            label="Portfolio LTV"
            value={pct(metrics.portfolioLTV * 100)}
            highlight={metrics.portfolioLTV > 0.75 ? 'bad' : 'good'}
          />
        )}
        {metrics.cashOut !== null && (
          <LedgerRow label="Est. Cash-Out" value={fmt(metrics.cashOut)} highlight="good" />
        )}
        {metrics.estimatedMonthlyPITIA > 0 && (
          <LedgerRow label="Est. Monthly PITIA" value={fmt(metrics.estimatedMonthlyPITIA)} />
        )}
        {(program === 'dscr' || program === 'blanket_portfolio') && metrics.dscr !== null && (
          <LedgerRow
            label="DSCR"
            value={metrics.dscr.toFixed(2)}
            highlight={metrics.dscr >= 1.25 ? 'good' : metrics.dscr >= 1.0 ? 'warn' : 'bad'}
          />
        )}
      </div>

      {/* Liquidity */}
      {metrics.totalLiquidAssets > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.35)', margin: '0 0 8px', fontFamily: 'IBM Plex Mono, monospace' }}>Liquidity</p>
          <LedgerRow label="Net Liquid Assets" value={fmt(metrics.totalLiquidAssets)} highlight="good" />
          {metrics.totalMonthlyRent > 0 && (
            <LedgerRow label="Monthly Rent Roll" value={fmt(metrics.totalMonthlyRent)} />
          )}
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.35)', margin: '0 0 8px', fontFamily: 'IBM Plex Mono, monospace' }}>Flags</p>
          {warnings.map((w, i) => (
            <div key={i} style={{
              display: 'flex',
              gap: '8px',
              padding: '8px 10px',
              background: 'rgba(179,73,45,0.15)',
              border: '1px solid rgba(179,73,45,0.3)',
              borderRadius: '10px',
              marginBottom: '6px',
            }}>
              <span style={{ flexShrink: 0, color: 'var(--clay)', fontSize: '12px' }}>⚠</span>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.5' }}>{w}</span>
            </div>
          ))}
        </div>
      )}

      {/* Missing Docs */}
      {missingDocs.length > 0 && (
        <div>
          <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.35)', margin: '0 0 8px', fontFamily: 'IBM Plex Mono, monospace' }}>Required Docs Missing</p>
          {missingDocs.map(d => (
            <div key={d.id} style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', padding: '4px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: 'var(--clay)' }}>○</span> {d.label}
            </div>
          ))}
        </div>
      )}

      {metrics.dscrNote && (
        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '8px', fontStyle: 'italic' }}>{metrics.dscrNote}</p>
      )}
    </div>
  );
}
