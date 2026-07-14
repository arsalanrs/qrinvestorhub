'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { PROGRAM_CONFIGS } from '@/config/loan-programs';
import type { ProgramKey } from '@/config/loan-programs';
import type { EntityInfo, ExperienceInfo, InvestorApplication } from '@/types/investor-application';
import { fmt, toNum } from '@/lib/loan-calculations';
import {
  APPLICATION_STATUS_STEPS,
  getApplicationStatusIndex,
  getInvestorTierInfo,
} from '@/lib/investor-status';
import { SHOW_INVESTOR_TIER, SHOW_PORTAL_RESOURCES } from '@/lib/portal-feature-flags';
import { PORTAL_RESOURCES } from '@/lib/investor-portal-resources';
import { buildZillowSearchUrl } from '@/lib/zillow-link';
import { FlowButton } from '@/components/ui/flow-button';

type PortfolioProperty = InvestorApplication['properties'][number] & {
  dbId?: string;
  heroImageUrl?: string | null;
};

type PortfolioPayload = {
  id: string;
  status: string;
  loanProgram: string;
  borrower: InvestorApplication['borrower'];
  entity: EntityInfo;
  experience: ExperienceInfo;
  loanRequest: InvestorApplication['loanRequest'];
  calculations: Record<string, number | null | undefined>;
  properties: PortfolioProperty[];
  aiSummary?: string;
  submittedAt?: string;
};

function propertyHeroStyle(address: string): React.CSSProperties {
  let hash = 0;
  for (let i = 0; i < address.length; i += 1) hash = address.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return {
    background: `linear-gradient(135deg, hsl(${hue}, 35%, 28%) 0%, hsl(${(hue + 40) % 360}, 45%, 42%) 100%)`,
  };
}

function PropertyCard({
  property,
  index,
}: {
  property: PortfolioProperty;
  index: number;
}) {
  const [showZillow, setShowZillow] = useState(true);
  const [heroUrl, setHeroUrl] = useState<string | null>(property.heroImageUrl || null);
  const [heroLoading, setHeroLoading] = useState(false);
  const addressLine = [property.address, property.city, property.state, property.zip].filter(Boolean).join(', ');
  const zillowUrl = buildZillowSearchUrl(property);

  useEffect(() => {
    const key = `qr-zillow-${addressLine}`;
    const stored = localStorage.getItem(key);
    if (stored === 'hidden') setShowZillow(false);
  }, [addressLine]);

  useEffect(() => {
    if (heroUrl || !property.dbId) return;

    let cancelled = false;
    setHeroLoading(true);

    fetch(`/api/portal/property-images?propertyId=${encodeURIComponent(property.dbId)}`, {
      credentials: 'same-origin',
    })
      .then(res => res.json())
      .then(json => {
        if (!cancelled && json.url) setHeroUrl(json.url);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setHeroLoading(false);
      });

    return () => { cancelled = true; };
  }, [property.dbId, heroUrl]);

  const toggleZillow = () => {
    const next = !showZillow;
    setShowZillow(next);
    localStorage.setItem(`qr-zillow-${addressLine}`, next ? 'shown' : 'hidden');
  };

  const balance = toNum(property.currentMortgageBalance);
  const rent = toNum(property.estimatedMarketRent);
  const payment = toNum(property.monthlyPayment);

  const heroStyle: React.CSSProperties = heroUrl
    ? {
        backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.1) 55%), url(${heroUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : propertyHeroStyle(addressLine || `prop-${index}`);

  return (
    <article style={{ border: '1px solid var(--line)', borderRadius: '16px', overflow: 'hidden', background: '#fff' }}>
      <div style={{ ...heroStyle, height: '200px', position: 'relative', display: 'flex', alignItems: 'flex-end', padding: '16px' }}>
        {heroLoading && !heroUrl && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.25)', color: '#fff', fontSize: '12px', letterSpacing: '0.06em',
            textTransform: 'uppercase', fontFamily: 'IBM Plex Mono, monospace',
          }}>
            Generating preview…
          </div>
        )}
        <div>
          <p style={{ margin: 0, fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.85)', fontFamily: 'IBM Plex Mono, monospace' }}>
            {heroUrl ? 'AI property preview' : 'Your property'}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '18px', fontWeight: 700, color: '#fff', fontFamily: 'Fraunces, serif' }}>
            {addressLine || `Property ${index + 1}`}
          </p>
        </div>
      </div>
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '16px' }}>
          {property.currentAsIsValue && (
            <div>
              <p style={{ margin: 0, fontSize: '10px', color: 'var(--slate-light)', textTransform: 'uppercase' }}>Est. value</p>
              <p style={{ margin: '4px 0 0', fontWeight: 600, fontFamily: 'IBM Plex Mono, monospace' }}>{fmt(toNum(property.currentAsIsValue))}</p>
            </div>
          )}
          {balance > 0 && (
            <div>
              <p style={{ margin: 0, fontSize: '10px', color: 'var(--slate-light)', textTransform: 'uppercase' }}>Mortgage balance</p>
              <p style={{ margin: '4px 0 0', fontWeight: 600, fontFamily: 'IBM Plex Mono, monospace' }}>{fmt(balance)}</p>
            </div>
          )}
          {rent > 0 && (
            <div>
              <p style={{ margin: 0, fontSize: '10px', color: 'var(--slate-light)', textTransform: 'uppercase' }}>Rent / mo</p>
              <p style={{ margin: '4px 0 0', fontWeight: 600, fontFamily: 'IBM Plex Mono, monospace' }}>{fmt(rent)}</p>
            </div>
          )}
          {payment > 0 && (
            <div>
              <p style={{ margin: 0, fontSize: '10px', color: 'var(--slate-light)', textTransform: 'uppercase' }}>Payment / mo</p>
              <p style={{ margin: '4px 0 0', fontWeight: 600, fontFamily: 'IBM Plex Mono, monospace' }}>{fmt(payment)}</p>
            </div>
          )}
        </div>
        {property.occupancyStatus && (
          <p style={{ fontSize: '13px', color: 'var(--slate)', margin: '0 0 12px' }}>Occupancy: {property.occupancyStatus.replace(/_/g, ' ')}</p>
        )}
        {zillowUrl && (
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            {showZillow ? (
              <a href={zillowUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '13px', color: 'var(--blue)', fontWeight: 600 }}>
                View on Zillow →
              </a>
            ) : (
              <span style={{ fontSize: '13px', color: 'var(--slate-light)' }}>Zillow link hidden</span>
            )}
            <button type="button" onClick={toggleZillow} style={{ fontSize: '12px', background: 'none', border: 'none', color: 'var(--slate)', cursor: 'pointer', textDecoration: 'underline' }}>
              {showZillow ? 'Hide Zillow' : 'Show Zillow'}
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

export function PortfolioPortal({ data }: { data: PortfolioPayload }) {
  const statusIdx = getApplicationStatusIndex(data.status);
  const programLabel = data.loanProgram
    ? (PROGRAM_CONFIGS[data.loanProgram as ProgramKey]?.label || data.loanProgram)
    : '';
  const borrowerName = `${data.borrower?.firstName || ''} ${data.borrower?.lastName || ''}`.trim();
  const entity = data.entity;
  const calc = data.calculations || {};
  const loanAmt = toNum(data.loanRequest?.requestedLoanAmount || '');

  const partners = [
    ...(entity?.additionalGuarantors || []).map(g => ({
      name: g.name,
      email: g.email,
      phone: g.phone,
      role: 'Guarantor',
      ownership: '',
    })),
    ...(data.borrower?.hasCoBorrower && data.borrower.coBorrowerName
      ? [{
          name: data.borrower.coBorrowerName,
          email: data.borrower.coBorrowerEmail,
          phone: data.borrower.coBorrowerPhone,
          role: 'Co-borrower',
          ownership: '',
        }]
      : []),
  ];

  const tierInfo = useMemo(
    () => (SHOW_INVESTOR_TIER ? getInvestorTierInfo(data.experience) : null),
    [data.experience],
  );
  const tierColors: Record<string, string> = {
    rookie: '#6b7280',
    pro: '#1f6f54',
    elite: '#92650a',
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      <div style={{ marginBottom: '28px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--slate-light)', fontFamily: 'IBM Plex Mono, monospace', margin: '0 0 8px' }}>
            QuestRock Investor Portal
          </p>
          <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: '32px', fontWeight: 700, color: 'var(--ink)', margin: '0 0 8px' }}>
            {borrowerName || 'Your Portfolio'}
          </h1>
          <p style={{ color: 'var(--slate)', margin: 0 }}>{programLabel} · Application {data.id.slice(0, 8)}…</p>
        </div>
        <Link href="/portal" style={{ fontSize: '13px', color: 'var(--ledger-green)', fontWeight: 600, textDecoration: 'none' }}>
          ← All applications
        </Link>
      </div>

      {/* Investor status — hidden until tier program launches */}
      {SHOW_INVESTOR_TIER && tierInfo && (
      <section style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: '16px', padding: '24px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ margin: 0, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--slate-light)' }}>Investor status</p>
            <p style={{ margin: '6px 0 0', fontSize: '28px', fontWeight: 800, fontFamily: 'IBM Plex Mono, monospace', color: tierColors[tierInfo.tier] }}>
              {tierInfo.label}
            </p>
            <p style={{ margin: '8px 0 0', fontSize: '14px', color: 'var(--slate)' }}>{tierInfo.description}</p>
            <p style={{ margin: '6px 0 0', fontSize: '13px', color: 'var(--slate)' }}>
              Deals (last 3 years): <strong>{tierInfo.dealsLast3Years}</strong>
            </p>
          </div>
          {tierInfo.nextTier && (
            <div style={{ background: 'var(--paper-dim)', borderRadius: '12px', padding: '16px 20px', maxWidth: '280px' }}>
              <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--slate-light)' }}>Reach {tierInfo.nextTierLabel}</p>
              <p style={{ margin: '8px 0 0', fontSize: '14px', color: 'var(--ink)' }}>
                Complete <strong>{tierInfo.dealsToNext}</strong> more deal{tierInfo.dealsToNext === 1 ? '' : 's'} in the next 3 years.
              </p>
            </div>
          )}
        </div>
      </section>
      )}

      {/* Application progress */}
      <section style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: '16px', padding: '24px', marginBottom: '20px' }}>
        <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '18px', margin: '0 0 16px' }}>Application progress</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {APPLICATION_STATUS_STEPS.map((step, i) => {
            const done = i <= statusIdx;
            const current = i === statusIdx;
            return (
              <div key={step.key} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{
                  width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
                  background: done ? 'var(--ledger-green)' : 'var(--paper-dim)',
                  color: done ? '#fff' : 'var(--slate-light)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700,
                  border: current ? '2px solid var(--ledger-green)' : 'none',
                }}>
                  {done ? '✓' : i + 1}
                </span>
                <span style={{ fontSize: '14px', fontWeight: current ? 600 : 400, color: done ? 'var(--ink)' : 'var(--slate-light)' }}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Portfolio metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        {[
          { label: 'Requested loan', value: loanAmt > 0 ? fmt(loanAmt) : '—' },
          { label: 'Portfolio value', value: calc.totalPortfolioValue ? fmt(calc.totalPortfolioValue) : '—' },
          { label: 'Monthly rent', value: calc.totalMonthlyRent ? fmt(calc.totalMonthlyRent) : '—' },
          { label: 'Liquid assets', value: calc.totalLiquidAssets ? fmt(calc.totalLiquidAssets) : '—' },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: '12px', padding: '18px', textAlign: 'center' }}>
            <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--slate-light)', margin: '0 0 8px', fontFamily: 'IBM Plex Mono, monospace' }}>{label}</p>
            <p style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'IBM Plex Mono, monospace', margin: 0 }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Properties */}
      {data.properties?.length > 0 && (
        <section style={{ marginBottom: '20px' }}>
          <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '20px', margin: '0 0 14px' }}>Your properties</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {data.properties.map((p, i) => (
              <PropertyCard key={p.id || i} property={p} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Partnerships */}
      {(entity?.entityName || entity?.ownershipPercentage || partners.length > 0) && (
        <section style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: '16px', padding: '24px', marginBottom: '20px' }}>
          <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '18px', margin: '0 0 14px' }}>Partnerships & ownership</h2>
          {entity?.entityName && (
            <p style={{ margin: '0 0 8px', fontSize: '14px' }}>
              <strong>{entity.entityName}</strong> ({entity.entityType || entity.borrowingAs})
              {entity.ownershipPercentage ? ` · Your ownership: ${entity.ownershipPercentage}%` : ''}
            </p>
          )}
          {entity?.authorizedSigner && (
            <p style={{ margin: '0 0 12px', fontSize: '13px', color: 'var(--slate)' }}>Authorized signer: {entity.authorizedSigner}</p>
          )}
          {partners.length > 0 && (
            <ul style={{ margin: 0, paddingLeft: '18px' }}>
              {partners.map((p, i) => (
                <li key={i} style={{ marginBottom: '8px', fontSize: '14px' }}>
                  <strong>{p.name}</strong> — {p.role}
                  {p.email ? ` · ${p.email}` : ''}
                  {p.phone ? ` · ${p.phone}` : ''}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Tools & resources — hidden until partner integrations are live */}
      {SHOW_PORTAL_RESOURCES && (
      <section style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
        <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '18px', margin: '0 0 6px' }}>Tools for your portfolio</h2>
        <p style={{ fontSize: '13px', color: 'var(--slate)', margin: '0 0 16px' }}>Tips, partners, and services QuestRock investors use.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
          {PORTAL_RESOURCES.map(r => (
            <a
              key={r.id}
              href={r.href}
              target={r.external ? '_blank' : undefined}
              rel={r.external ? 'noopener noreferrer' : undefined}
              style={{
                display: 'block', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--line)',
                textDecoration: 'none', color: 'inherit', background: 'var(--paper-dim)',
              }}
            >
              <p style={{ margin: 0, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--slate-light)' }}>{r.category}</p>
              <p style={{ margin: '6px 0 4px', fontWeight: 600, fontSize: '14px', color: 'var(--ink)' }}>{r.title}</p>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--slate)', lineHeight: 1.5 }}>{r.description}</p>
            </a>
          ))}
        </div>
      </section>
      )}

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <FlowButton text="Start another application" variant="green" size="md" onClick={() => { window.location.href = '/investor-hub/apply'; }} />
        <FlowButton text="Investor Hub home" variant="dark" size="md" onClick={() => { window.location.href = '/investor-hub'; }} />
      </div>
    </div>
  );
}
