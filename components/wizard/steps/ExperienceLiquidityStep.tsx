'use client';

import { useFormContext, Controller, useWatch } from 'react-hook-form';
import type { InvestorApplication } from '@/types/investor-application';
import { WizardCard } from '@/components/ui/WizardCard';
import { DictationTextarea } from '@/components/ui/DictationTextarea';
import { YesNoToggle } from '@/components/ui/YesNoToggle';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { toNum, fmt } from '@/lib/loan-calculations';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  border: '1.5px solid var(--line)',
  borderRadius: '2px',
  fontSize: '14px',
  fontFamily: 'Inter, sans-serif',
  color: 'var(--ink)',
  outline: 'none',
  background: '#fff',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 500,
  color: 'var(--ink)',
  marginBottom: '6px',
};

export function ExperienceLiquidityStep() {
  const { register, control, watch } = useFormContext<InvestorApplication>();
  const experience = watch('experience');
  const liquidity = useWatch({ control, name: 'liquidity' }) as InvestorApplication['liquidity'];

  const totalLiquid = (liquidity || []).reduce((sum, a) => sum + toNum(a.estimatedBalance ?? (a as { estimatedValue?: string }).estimatedValue), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Experience */}
      <WizardCard title="Investment Experience" subtitle="Help us understand your real estate investing background. Experience can improve your loan terms.">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Fix & Flips */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', alignItems: 'start' }}>
            <div>
              <Controller
                control={control}
                name="experience.completedFlips"
                render={({ field }) => (
                  <YesNoToggle value={field.value} onChange={field.onChange} label="Have you completed any fix & flips?" />
                )}
              />
            </div>
            {experience?.completedFlips && (
              <div style={{ minWidth: '140px' }}>
                <label style={labelStyle}>How many in last 3 years?</label>
                <input {...register('experience.flipsLast3Years')} type="number" min="0" placeholder="0" style={inputStyle} />
              </div>
            )}
          </div>

          {/* Rentals */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', alignItems: 'start' }}>
            <Controller
              control={control}
              name="experience.ownsRentals"
              render={({ field }) => (
                <YesNoToggle value={field.value} onChange={field.onChange} label="Do you currently own rental properties?" />
              )}
            />
            {experience?.ownsRentals && (
              <div style={{ minWidth: '140px' }}>
                <label style={labelStyle}>How many rentals?</label>
                <input {...register('experience.rentalsOwned')} type="number" min="0" placeholder="0" style={inputStyle} />
              </div>
            )}
          </div>

          {/* New Builds */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', alignItems: 'start' }}>
            <Controller
              control={control}
              name="experience.completedNewBuilds"
              render={({ field }) => (
                <YesNoToggle value={field.value} onChange={field.onChange} label="Have you completed new construction projects?" />
              )}
            />
            {experience?.completedNewBuilds && (
              <div style={{ minWidth: '140px' }}>
                <label style={labelStyle}>How many in last 3 years?</label>
                <input {...register('experience.newBuildsLast3Years')} type="number" min="0" placeholder="0" style={inputStyle} />
              </div>
            )}
          </div>

          {/* Builder/Developer */}
          <Controller
            control={control}
            name="experience.isBuilderDeveloper"
            render={({ field }) => (
              <YesNoToggle value={field.value} onChange={field.onChange} label="Are you a professional builder or developer?" />
            )}
          />

          {/* Adverse History */}
          <div>
            <Controller
              control={control}
              name="experience.adverseHistory"
              render={({ field }) => (
                <YesNoToggle value={field.value} onChange={field.onChange} label="Any adverse credit history? (foreclosure, short sale, bankruptcy in last 7 years)" />
              )}
            />
            {experience?.adverseHistory && (
              <div style={{ marginTop: '12px' }}>
                <label style={labelStyle}>Please briefly explain:</label>
                <Controller
                  control={control}
                  name="experience.adverseHistoryDetails"
                  render={({ field }) => (
                    <DictationTextarea
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      rows={3}
                      placeholder="Provide details about the adverse history..."
                      style={{ ...inputStyle, resize: 'vertical' }}
                    />
                  )}
                />
              </div>
            )}
          </div>
        </div>
      </WizardCard>

      {/* Liquidity */}
      <WizardCard title="Liquidity & Assets" subtitle="We always ask for an account of your liquidity/assets. It is not always needed, but sometimes showing reserves can help with getting a better deal or overall qualification. Add your liquid assets below — this stays confidential.">
        <div style={{ marginBottom: '20px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.5fr 1fr',
            gap: '12px',
            padding: '10px 12px',
            background: 'var(--paper-dim)',
            borderRadius: '2px',
            marginBottom: '8px',
          }}>
            <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--slate)' }}>Asset Type</span>
            <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--slate)' }}>Estimated Balance</span>
          </div>

          {[
            { index: 0, label: 'Checking / Savings' },
            { index: 1, label: 'Retirement (401k, IRA)' },
            { index: 2, label: 'Stocks / Brokerage' },
            { index: 3, label: 'Other Assets' },
          ].map(({ index, label }) => (
            <div key={index} style={{
              display: 'grid',
              gridTemplateColumns: '1.5fr 1fr',
              gap: '12px',
              padding: '8px 12px',
              borderBottom: '1px solid var(--line)',
              alignItems: 'center',
            }}>
              <span style={{ fontSize: '14px', color: 'var(--ink-soft)', fontFamily: 'Inter, sans-serif' }}>{label}</span>
              <Controller
                control={control}
                name={`liquidity.${index}.estimatedBalance`}
                render={({ field }) => (
                  <CurrencyInput value={field.value} onChange={field.onChange} placeholder="0" />
                )}
              />
            </div>
          ))}

          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            padding: '12px',
            background: 'var(--ledger-green-soft)',
            borderRadius: '2px',
            marginTop: '8px',
          }}>
            <span style={{ fontSize: '14px', fontWeight: 600, fontFamily: 'IBM Plex Mono, monospace', color: 'var(--ledger-green)' }}>
              Total Liquid Assets: {fmt(totalLiquid)}
            </span>
          </div>
        </div>

        <p style={{ fontSize: '12px', color: 'var(--slate-light)', margin: 0, lineHeight: '1.5' }}>
          💡 Tip: Lenders typically want to see 3–6 months of PITIA in reserves after closing.
        </p>
      </WizardCard>
    </div>
  );
}
