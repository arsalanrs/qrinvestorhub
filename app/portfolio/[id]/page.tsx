'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PROGRAM_CONFIGS } from '@/config/loan-programs';
import type { ProgramKey } from '@/config/loan-programs';
import { fmt, toNum } from '@/lib/loan-calculations';
import { FlowButton } from '@/components/ui/flow-button';

interface PortfolioData {
  id: string;
  status: string;
  loanProgram: string;
  borrower: { firstName?: string; lastName?: string; email?: string };
  entity: { borrowingAs?: string; entityName?: string };
  loanRequest: { requestedLoanAmount?: string; transactionType?: string };
  calculations: {
    totalPortfolioValue?: number;
    totalPortfolioDebt?: number;
    marketLTV?: number | null;
    dscr?: number | null;
    totalLiquidAssets?: number;
    totalMonthlyRent?: number;
  };
  properties: Array<{
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    currentAsIsValue?: string;
    estimatedMarketRent?: string;
    occupancyStatus?: string;
  }>;
  submittedAt?: string;
}

export default function PortfolioPage() {
  const params = useParams();
  const id = params?.id as string;
  const [data, setData] = useState<PortfolioData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/investor-applications/${id}`)
      .then(res => res.json())
      .then(json => {
        if (json.error) setError(json.error);
        else setData(json);
      })
      .catch(() => setError('Failed to load portfolio'))
      .finally(() => setLoading(false));
  }, [id]);

  const programLabel = data?.loanProgram
    ? (PROGRAM_CONFIGS[data.loanProgram as ProgramKey]?.label || data.loanProgram)
    : '';

  const borrowerName = data?.borrower
    ? `${data.borrower.firstName || ''} ${data.borrower.lastName || ''}`.trim()
    : '';

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F5F0' }}>
        <p style={{ color: 'var(--slate)', fontFamily: 'Inter, sans-serif' }}>Loading your portfolio…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F5F0', padding: '40px' }}>
        <div style={{ textAlign: 'center', maxWidth: '480px' }}>
          <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: '24px', color: 'var(--ink)' }}>Portfolio Not Found</h1>
          <p style={{ color: 'var(--slate)', marginBottom: '24px' }}>{error || 'We could not find this application.'}</p>
          <FlowButton text="Back to Investor Hub" variant="green" size="md" onClick={() => { window.location.href = '/investor-hub'; }} />
        </div>
      </div>
    );
  }

  const calc = data.calculations || {};
  const properties = data.properties || [];
  const loanAmt = toNum(data.loanRequest?.requestedLoanAmount || '');

  return (
    <div style={{
      minHeight: '100vh',
      background: `
        radial-gradient(900px 420px at 8% -8%, rgba(176,141,87,0.08), transparent 60%),
        radial-gradient(1100px 520px at 100% 0%, rgba(31,111,84,0.06), transparent 55%),
        #F7F5F0
      `,
      padding: '40px 24px',
    }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--slate-light)', fontFamily: 'IBM Plex Mono, monospace', margin: '0 0 8px' }}>
            QuestRock Investor Hub
          </p>
          <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: '32px', fontWeight: 700, color: 'var(--ink)', margin: '0 0 8px' }}>
            Your Portfolio
          </h1>
          <p style={{ color: 'var(--slate)', margin: 0 }}>
            {borrowerName}{programLabel ? ` · ${programLabel}` : ''}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Requested Loan', value: loanAmt > 0 ? fmt(loanAmt) : '—' },
            { label: 'Portfolio Value', value: calc.totalPortfolioValue ? fmt(calc.totalPortfolioValue) : '—' },
            { label: 'Monthly Rent', value: calc.totalMonthlyRent ? fmt(calc.totalMonthlyRent) : '—' },
            { label: 'Liquid Assets', value: calc.totalLiquidAssets ? fmt(calc.totalLiquidAssets) : '—' },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
              <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--slate-light)', margin: '0 0 8px', fontFamily: 'IBM Plex Mono, monospace' }}>{label}</p>
              <p style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'IBM Plex Mono, monospace', color: 'var(--ink)', margin: 0 }}>{value}</p>
            </div>
          ))}
        </div>

        {properties.length > 0 && (
          <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
            <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '20px', fontWeight: 600, color: 'var(--ink)', margin: '0 0 16px' }}>Properties</h2>
            {properties.map((p, i) => (
              <div key={i} style={{ padding: '14px 0', borderBottom: i < properties.length - 1 ? '1px solid var(--paper-dim)' : 'none' }}>
                <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--ink)', margin: '0 0 4px' }}>
                  {[p.address, p.city, p.state, p.zip].filter(Boolean).join(', ') || `Property ${i + 1}`}
                </p>
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                  {p.currentAsIsValue && <span style={{ fontSize: '13px', color: 'var(--slate)' }}>Value: {fmt(toNum(p.currentAsIsValue))}</span>}
                  {p.estimatedMarketRent && <span style={{ fontSize: '13px', color: 'var(--slate)' }}>Rent: {fmt(toNum(p.estimatedMarketRent))}/mo</span>}
                  {p.occupancyStatus && <span style={{ fontSize: '13px', color: 'var(--slate)' }}>{p.occupancyStatus.replace(/_/g, ' ')}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <FlowButton text="Back to Investor Hub" variant="green" size="md" onClick={() => { window.location.href = '/investor-hub'; }} />
          <FlowButton text="Visit QuestRock Home Loans" variant="dark" size="md" onClick={() => { window.open('https://questrockhomeloans.com', '_blank'); }} />
        </div>
      </div>
    </div>
  );
}
