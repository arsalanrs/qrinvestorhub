'use client';

import { useFormContext, Controller } from 'react-hook-form';
import type { InvestorApplication, LoanProgram, DealStage } from '@/types/investor-application';
import { PROGRAM_LIST } from '@/config/loan-programs';
import { ChoiceCard } from '@/components/ui/ChoiceCard';
import { WizardCard } from '@/components/ui/WizardCard';

const PROGRAM_ICONS: Record<string, string> = {
  blanket_portfolio: '🏘',
  bridge: '🌉',
  construction: '🏗',
  dscr: '📊',
  rehab: '🔨',
};

const PROGRAM_BADGES: Record<string, string> = {
  blanket_portfolio: 'Up to 75% LTV',
  bridge: 'Up to 70% LTC',
  construction: 'Up to 90% LTC',
  dscr: 'No income docs',
  rehab: 'Up to 90% LTC',
};

const DEAL_STAGES: { value: DealStage; label: string; description: string }[] = [
  { value: 'general_info', label: 'Just exploring', description: 'Looking for general loan information and rates.' },
  { value: 'actively_looking', label: 'Actively looking', description: 'Searching for a property but nothing identified yet.' },
  { value: 'identified_property', label: 'Property identified', description: 'Found a target property but not under contract.' },
  { value: 'under_contract', label: 'Under contract', description: 'Have a signed purchase agreement.' },
  { value: 'own_property', label: 'Already own the property', description: 'Refinancing or pulling equity from owned property.' },
];

const inputStyle = {
  width: '100%',
  padding: '8px 10px',
  border: '1.5px solid var(--line)',
  borderRadius: '2px',
  fontSize: '13px',
  fontFamily: 'Inter, sans-serif',
  color: 'var(--ink)',
  outline: 'none',
  background: '#fff',
};

export function LoanGoalStep() {
  const { control, watch, register } = useFormContext<InvestorApplication>();
  const selectedProgram = watch('loanProgram');
  const selectedStage = watch('dealStage');

  return (
    <div>
      <WizardCard
        title="What type of financing are you looking for?"
        subtitle="Select the loan program that best fits your deal. You can discuss other options with your QuestRock loan officer."
      >
        <Controller
          control={control}
          name="loanProgram"
          render={({ field }) => (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '32px' }}>
              {PROGRAM_LIST.map(p => (
                <ChoiceCard
                  key={p.key}
                  title={p.label}
                  description={p.description}
                  icon={PROGRAM_ICONS[p.key]}
                  badge={PROGRAM_BADGES[p.key]}
                  selected={field.value === p.key}
                  onClick={() => field.onChange(p.key as LoanProgram)}
                />
              ))}
            </div>
          )}
        />

        <div style={{ borderTop: '1px solid var(--line)', paddingTop: '28px' }}>
          <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '18px', fontWeight: 600, color: 'var(--ink)', marginTop: 0, marginBottom: '16px' }}>
            Where are you in the process?
          </h3>
          <Controller
            control={control}
            name="dealStage"
            render={({ field }) => (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
                {DEAL_STAGES.map(s => (
                  <ChoiceCard
                    key={s.value}
                    title={s.label}
                    description={s.description}
                    selected={field.value === s.value}
                    onClick={() => field.onChange(s.value)}
                  />
                ))}
              </div>
            )}
          />
        </div>

        {/* Program-specific goal fields */}
        {selectedProgram === 'bridge' && (
          <div style={{ borderTop: '1px solid var(--line)', paddingTop: '24px' }}>
            <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '16px', fontWeight: 600, color: 'var(--ink)', margin: '0 0 16px' }}>Bridge Loan Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--ink)' }}>Purpose</label>
                <select {...register('bridgeGoal.bridgePurpose')} style={inputStyle}>
                  <option value="">Select...</option>
                  <option value="purchase">Purchase</option>
                  <option value="refinance">Refinance / Cash-Out</option>
                  <option value="stabilization">Stabilization</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--ink)' }}>Funding Timeline</label>
                <select {...register('bridgeGoal.fundingTimeline')} style={inputStyle}>
                  <option value="">Select...</option>
                  <option value="asap">ASAP (&lt; 2 weeks)</option>
                  <option value="2_4_weeks">2–4 Weeks</option>
                  <option value="30_60_days">30–60 Days</option>
                  <option value="60_plus">60+ Days</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {selectedProgram === 'dscr' && (
          <div style={{ borderTop: '1px solid var(--line)', paddingTop: '24px' }}>
            <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '16px', fontWeight: 600, color: 'var(--ink)', margin: '0 0 16px' }}>DSCR Rental Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--ink)' }}>Loan Action</label>
                <select {...register('dscrGoal.action')} style={inputStyle}>
                  <option value="">Select...</option>
                  <option value="purchase">Purchase</option>
                  <option value="rate_term_refi">Rate & Term Refi</option>
                  <option value="cash_out_refi">Cash-Out Refi</option>
                  <option value="delayed_purchase">Delayed Purchase Refi</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--ink)' }}>Is it a short-term rental (STR)?</label>
                <Controller control={control} name="dscrGoal.isSTR" render={({ field }) => (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {['Yes', 'No'].map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => field.onChange(opt === 'Yes')}
                        style={{
                          flex: 1, padding: '8px', border: `1.5px solid ${field.value === (opt === 'Yes') ? 'var(--ledger-green)' : 'var(--line)'}`,
                          borderRadius: '2px', background: field.value === (opt === 'Yes') ? 'var(--ledger-green-soft)' : '#fff',
                          fontSize: '13px', fontFamily: 'Inter, sans-serif', cursor: 'pointer',
                          color: field.value === (opt === 'Yes') ? 'var(--ledger-green)' : 'var(--slate)',
                        }}
                      >{opt}</button>
                    ))}
                  </div>
                )} />
              </div>
            </div>
          </div>
        )}

        {selectedProgram === 'rehab' && (
          <div style={{ borderTop: '1px solid var(--line)', paddingTop: '24px' }}>
            <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '16px', fontWeight: 600, color: 'var(--ink)', margin: '0 0 16px' }}>Rehab Loan Details</h3>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '8px', color: 'var(--ink)' }}>Exit Strategy</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                {[{ value: 'fix_flip', label: 'Fix & Flip', desc: 'Sell after renovation' }, { value: 'fix_hold', label: 'Fix & Hold', desc: 'Refinance into rental loan' }].map(opt => (
                  <Controller key={opt.value} control={control} name="rehabGoal.exitStrategy" render={({ field }) => (
                    <ChoiceCard
                      title={opt.label}
                      description={opt.desc}
                      selected={field.value === opt.value}
                      onClick={() => field.onChange(opt.value)}
                    />
                  )} />
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedProgram === 'construction' && (
          <div style={{ borderTop: '1px solid var(--line)', paddingTop: '24px' }}>
            <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '16px', fontWeight: 600, color: 'var(--ink)', margin: '0 0 16px' }}>Construction Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--ink)' }}>Land Status</label>
                <select {...register('constructionGoal.landStatus')} style={inputStyle}>
                  <option value="">Select...</option>
                  <option value="own_land">I own the land</option>
                  <option value="purchasing_land">Purchasing land</option>
                  <option value="already_permitted">Land owned + permitted</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--ink)' }}>Exit Strategy</label>
                <select {...register('constructionGoal.exitStrategy')} style={inputStyle}>
                  <option value="">Select...</option>
                  <option value="sell">Sell after completion</option>
                  <option value="hold_rent">Hold as rental</option>
                  <option value="refi_dscr">Refi into DSCR loan</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {selectedProgram === 'blanket_portfolio' && (
          <div style={{ borderTop: '1px solid var(--line)', paddingTop: '24px' }}>
            <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '16px', fontWeight: 600, color: 'var(--ink)', margin: '0 0 16px' }}>Portfolio Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--ink)' }}>Portfolio Action</label>
                <select {...register('blanketGoal.portfolioAction')} style={inputStyle}>
                  <option value="">Select...</option>
                  <option value="consolidate">Consolidate into one loan</option>
                  <option value="cash_out">Cash-out across portfolio</option>
                  <option value="add_properties">Add more properties</option>
                  <option value="rate_term">Rate & term refi</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '6px', color: 'var(--ink)' }}>Approx. # of Properties</label>
                <input {...register('blanketGoal.numProperties')} type="number" min="2" placeholder="e.g. 5" style={inputStyle} />
              </div>
            </div>
          </div>
        )}

        {(selectedStage && !selectedProgram) && (
          <p style={{ fontSize: '13px', color: 'var(--slate)', marginTop: '16px', padding: '12px', background: 'var(--blue-soft)', borderRadius: '4px' }}>
            ↑ Select a loan program above to continue.
          </p>
        )}
      </WizardCard>
    </div>
  );
}
