'use client';

import { useFormContext, Controller } from 'react-hook-form';
import type { InvestorApplication } from '@/types/investor-application';
import { WizardCard } from '@/components/ui/WizardCard';

const CREDIT_RANGES = [
  { value: '620-659', label: '620–659' },
  { value: '660-699', label: '660–699' },
  { value: '700-739', label: '700–739' },
  { value: '740+', label: '740+' },
  { value: 'not_sure', label: 'Not Sure' },
];

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

export function BorrowerProfileStep() {
  const { register, watch, control } = useFormContext<InvestorApplication>();
  const hasCoBorrower = watch('borrower.hasCoBorrower');
  const creditRange = watch('borrower.creditRange');

  return (
    <WizardCard title="Borrower Profile" subtitle="Tell us about yourself. This information is used to match you with the right loan program.">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
        <div>
          <label style={labelStyle}>First Name <span style={{ color: 'var(--clay)' }}>*</span></label>
          <input {...register('borrower.firstName', { required: true })} placeholder="Jane" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Last Name <span style={{ color: 'var(--clay)' }}>*</span></label>
          <input {...register('borrower.lastName', { required: true })} placeholder="Smith" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Email Address <span style={{ color: 'var(--clay)' }}>*</span></label>
          <input {...register('borrower.email', { required: true })} type="email" placeholder="jane@example.com" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Phone Number <span style={{ color: 'var(--clay)' }}>*</span></label>
          <input {...register('borrower.phone')} type="tel" placeholder="(555) 000-0000" style={inputStyle} />
        </div>
      </div>

      {/* Credit Score */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ ...labelStyle, marginBottom: '10px' }}>Estimated Credit Score Range</label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {CREDIT_RANGES.map(({ value, label }) => (
            <Controller
              key={value}
              control={control}
              name="borrower.creditRange"
              render={({ field }) => (
                <button
                  type="button"
                  onClick={() => field.onChange(value)}
                  style={{
                    padding: '8px 16px',
                    border: `1.5px solid ${field.value === value ? 'var(--ledger-green)' : 'var(--line)'}`,
                    borderRadius: '2px',
                    background: field.value === value ? 'var(--ledger-green-soft)' : '#fff',
                    color: field.value === value ? 'var(--ledger-green)' : 'var(--slate)',
                    fontSize: '13px',
                    fontWeight: field.value === value ? 600 : 400,
                    fontFamily: 'IBM Plex Mono, monospace',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {label}
                </button>
              )}
            />
          ))}
        </div>
        {creditRange && creditRange !== 'not_sure' && Number(creditRange.split('-')[0]) < 660 && (
          <p style={{ fontSize: '12px', color: 'var(--clay)', marginTop: '8px' }}>
            ⚠ Most programs require a minimum 660 score. Contact us to discuss options.
          </p>
        )}
      </div>

      {/* Broker Referral */}
      <div style={{ marginBottom: '24px' }}>
        <label style={labelStyle}>Broker / Referral Partner <span style={{ fontSize: '11px', color: 'var(--slate-light)', fontWeight: 400 }}>(optional)</span></label>
        <input {...register('borrower.brokerReferral')} placeholder="Broker name or referral code" style={inputStyle} />
      </div>

      {/* Co-Borrower */}
      <div style={{ borderTop: '1px solid var(--line)', paddingTop: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '17px', fontWeight: 600, color: 'var(--ink)', margin: 0 }}>Co-Borrower</h3>
            <p style={{ fontSize: '13px', color: 'var(--slate)', margin: '4px 0 0' }}>Add a co-borrower who will also be on the loan.</p>
          </div>
          <Controller
            control={control}
            name="borrower.hasCoBorrower"
            render={({ field }) => (
              <button
                type="button"
                onClick={() => field.onChange(!field.value)}
                style={{
                  padding: '8px 16px',
                  border: `1.5px solid ${field.value ? 'var(--ledger-green)' : 'var(--line)'}`,
                  borderRadius: '2px',
                  background: field.value ? 'var(--ledger-green-soft)' : '#fff',
                  color: field.value ? 'var(--ledger-green)' : 'var(--slate)',
                  fontSize: '13px',
                  fontWeight: 500,
                  fontFamily: 'Inter, sans-serif',
                  cursor: 'pointer',
                }}
              >
                {field.value ? '✓ Yes' : 'Add Co-Borrower'}
              </button>
            )}
          />
        </div>

        {hasCoBorrower && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', padding: '20px', background: 'var(--paper-dim)', borderRadius: '4px' }}>
            <div>
              <label style={labelStyle}>Co-Borrower Full Name</label>
              <input {...register('borrower.coBorrowerName')} placeholder="Full name" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Co-Borrower Email</label>
              <input {...register('borrower.coBorrowerEmail')} type="email" placeholder="coborrower@example.com" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Co-Borrower Phone</label>
              <input {...register('borrower.coBorrowerPhone')} type="tel" placeholder="(555) 000-0000" style={inputStyle} />
            </div>
          </div>
        )}
      </div>
    </WizardCard>
  );
}
