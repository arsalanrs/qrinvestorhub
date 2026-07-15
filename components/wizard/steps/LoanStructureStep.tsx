'use client';

import { useFormContext, Controller } from 'react-hook-form';
import type { InvestorApplication } from '@/types/investor-application';
import { WizardCard } from '@/components/ui/WizardCard';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { RhfDictationInput } from '@/components/ui/RhfDictationInput';

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

const ALL_TRANSACTION_TYPES = [
  { value: 'purchase', label: 'Purchase', programs: ['all'] },
  { value: 'cash_out_refi', label: 'Cash-Out Refi', programs: ['all'] },
  { value: 'rate_term_refi', label: 'Rate & Term Refi', programs: ['dscr', 'blanket_portfolio', 'commercial_re'] },
  { value: 'delayed_purchase', label: 'Delayed Purchase Refi', programs: ['dscr'] },
  { value: 'line_of_credit', label: 'Line of Credit', programs: ['blanket_portfolio'] },
  { value: 'refinance', label: 'Refinance', programs: ['bridge'] },
  { value: 'maturing_balloon_refi', label: 'Maturing Balloon Refinance', programs: ['commercial_re'] },
  { value: 'construction_to_permanent', label: 'Construction-to-Permanent', programs: ['commercial_re'] },
];

export function LoanStructureStep() {
  const { control, watch, register } = useFormContext<InvestorApplication>();
  const program = watch('loanProgram');
  const transactionType = watch('loanRequest.transactionType');
  const properties = watch('properties') || [];

  const propertyOptions = properties
    .filter(p => p.address?.trim())
    .map(p => ({
      id: p.id,
      label: [p.address, p.city, p.state, p.zip].filter(Boolean).join(', '),
    }));

  const availableTypes = ALL_TRANSACTION_TYPES.filter(
    t => t.programs.includes('all') || t.programs.includes(program || '')
  );

  const showPurchasePrice = ['purchase', 'delayed_purchase'].includes(transactionType || '');
  const showCashOut = ['cash_out_refi', 'delayed_purchase'].includes(transactionType || '');
  const showRehabBudget = ['rehab', 'construction'].includes(program || '');
  const showARV = ['rehab', 'construction'].includes(program || '');

  return (
    <WizardCard title="Loan Structure" subtitle="Tell us about the loan you're requesting. These numbers help us size the deal and identify the right structure.">
      {/* Transaction Type */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ ...labelStyle, marginBottom: '10px' }}>Transaction Type <span style={{ color: 'var(--clay)' }}>*</span></label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {availableTypes.map(t => (
            <Controller
              key={t.value}
              control={control}
              name="loanRequest.transactionType"
              render={({ field }) => (
                <button
                  type="button"
                  onClick={() => field.onChange(t.value)}
                  style={{
                    padding: '8px 16px',
                    border: `1.5px solid ${field.value === t.value ? 'var(--ledger-green)' : 'var(--line)'}`,
                    borderRadius: '2px',
                    background: field.value === t.value ? 'var(--ledger-green-soft)' : '#fff',
                    color: field.value === t.value ? 'var(--ledger-green)' : 'var(--slate)',
                    fontSize: '13px',
                    fontWeight: field.value === t.value ? 600 : 400,
                    cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif',
                    transition: 'all 0.15s',
                  }}
                >
                  {t.label}
                </button>
              )}
            />
          ))}
        </div>
      </div>

      {/* Subject Property */}
      {transactionType && (
        <div style={{ marginBottom: '24px' }}>
          {transactionType === 'purchase' ? (
            <div>
              <label style={labelStyle}>
                Property Address{' '}
                <span style={{ fontSize: '11px', color: 'var(--slate-light)', fontWeight: 400 }}>(if you have one)</span>
              </label>
              <RhfDictationInput
                control={control}
                name="loanRequest.purchaseSubjectAddress"
                placeholder="123 Main St, City, ST 12345"
                style={inputStyle}
              />
            </div>
          ) : propertyOptions.length > 0 ? (
            <div>
              <label style={labelStyle}>Subject Property</label>
              <select {...register('loanRequest.subjectPropertyId')} style={inputStyle}>
                <option value="">Select a property...</option>
                {propertyOptions.map(p => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>
          ) : null}
        </div>
      )}

      {/* Loan Amount Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
        <Controller
          control={control}
          name="loanRequest.requestedLoanAmount"
          render={({ field }) => (
            <CurrencyInput
              label="Requested Loan Amount *"
              value={field.value}
              onChange={field.onChange}
              required
            />
          )}
        />

        {showPurchasePrice && (
          <Controller
            control={control}
            name="loanRequest.purchasePrice"
            render={({ field }) => (
              <CurrencyInput label="Purchase Price" value={field.value} onChange={field.onChange} />
            )}
          />
        )}

        {showCashOut && (
          <Controller
            control={control}
            name="loanRequest.desiredCashOut"
            render={({ field }) => (
              <CurrencyInput label="Desired Cash-Out" value={field.value} onChange={field.onChange} />
            )}
          />
        )}

        {showRehabBudget && program === 'rehab' && (
          <>
            <Controller
              control={control}
              name="loanRequest.rehabBudget"
              render={({ field }) => (
                <CurrencyInput label="Total Rehab Budget" value={field.value} onChange={field.onChange} />
              )}
            />
            <Controller
              control={control}
              name="loanRequest.rehabAmountFinanced"
              render={({ field }) => (
                <CurrencyInput label="Rehab Amount to Finance" value={field.value} onChange={field.onChange} />
              )}
            />
          </>
        )}

        {showRehabBudget && program === 'construction' && (
          <>
            <Controller
              control={control}
              name="loanRequest.constructionBudget"
              render={({ field }) => (
                <CurrencyInput label="Total Construction Budget" value={field.value} onChange={field.onChange} />
              )}
            />
            <Controller
              control={control}
              name="loanRequest.constructionAmountFinanced"
              render={({ field }) => (
                <CurrencyInput label="Construction Amount to Finance" value={field.value} onChange={field.onChange} />
              )}
            />
          </>
        )}

        {showARV && (
          <Controller
            control={control}
            name="loanRequest.arv"
            render={({ field }) => (
              <CurrencyInput label="After Repair / Completed Value (ARV)" value={field.value} onChange={field.onChange} />
            )}
          />
        )}
      </div>

      {/* Timing */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
        <div>
          <label style={labelStyle}>Funding Timeline</label>
          <select {...register('loanRequest.fundingTimeline')} style={inputStyle}>
            <option value="">Select...</option>
            <option value="asap">ASAP (under 2 weeks)</option>
            <option value="2_4_weeks">2–4 Weeks</option>
            <option value="30_60_days">30–60 Days</option>
            <option value="60_plus_days">60+ Days</option>
            <option value="flexible">Flexible</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Target Closing Date <span style={{ fontSize: '11px', color: 'var(--slate-light)', fontWeight: 400 }}>(optional)</span></label>
          <input {...register('loanRequest.closingDate')} type="date" style={inputStyle} />
        </div>
      </div>

      {/* Loan Terms */}
      <div style={{ borderTop: '1px solid var(--line)', paddingTop: '20px', marginBottom: '20px' }}>
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '16px', fontWeight: 600, color: 'var(--ink)', margin: '0 0 16px' }}>Preferred Loan Terms</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Prepay Structure</label>
            <select {...register('loanRequest.prepayStructure')} style={inputStyle}>
              <option value="">No preference</option>
              <option value="5yr">5-Year Prepay</option>
              <option value="3yr">3-Year Prepay</option>
              <option value="1yr">1-Year Prepay</option>
              <option value="none">No Prepay Penalty</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '26px' }}>
            <Controller
              control={control}
              name="loanRequest.interestOnly"
              render={({ field }) => (
                <button
                  type="button"
                  onClick={() => field.onChange(!field.value)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '9px 16px',
                    border: `1.5px solid ${field.value ? 'var(--brass)' : 'var(--line)'}`,
                    borderRadius: '2px',
                    background: field.value ? 'var(--brass-soft)' : '#fff',
                    color: field.value ? 'var(--brass)' : 'var(--slate)',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif',
                    width: '100%',
                  }}
                >
                  <span>{field.value ? '✓' : '○'}</span>
                  Interest-Only Period
                </button>
              )}
            />
          </div>
        </div>
      </div>

      {/* Exit Strategy */}
      {['rehab', 'bridge', 'construction'].includes(program || '') && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Exit Strategy</label>
              <RhfDictationInput
                control={control}
                name="loanRequest.exitStrategy"
                placeholder="e.g. sell after renovation, refi into DSCR loan"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Backup Exit Strategy <span style={{ fontSize: '11px', color: 'var(--slate-light)', fontWeight: 400 }}>(optional)</span></label>
              <RhfDictationInput
                control={control}
                name="loanRequest.backupExitStrategy"
                placeholder="e.g. hold as rental if market softens"
                style={inputStyle}
              />
            </div>
          </div>
        </div>
      )}
    </WizardCard>
  );
}
