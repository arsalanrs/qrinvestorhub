'use client';

import { useFormContext, Controller, useFieldArray } from 'react-hook-form';
import type { InvestorApplication } from '@/types/investor-application';
import { WizardCard } from '@/components/ui/WizardCard';

const CREDIT_RANGES = [
  { value: '620-659', label: '620–659' },
  { value: '660-699', label: '660–699' },
  { value: '700-739', label: '700–739' },
  { value: '740+', label: '740+' },
  { value: 'not_sure', label: 'Not Sure' },
];

const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC'];

const ENTITY_TYPES = ['LLC', 'Corporation', 'Trust', 'Partnership', 'Other'];

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

function CreditRangePicker({ name }: { name: 'borrower.creditRange' | 'borrower.coBorrowerCreditRange' }) {
  const { control } = useFormContext<InvestorApplication>();
  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      {CREDIT_RANGES.map(({ value, label }) => (
        <Controller
          key={value}
          control={control}
          name={name}
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
  );
}

export function BorrowerProfileStep() {
  const { register, watch, control } = useFormContext<InvestorApplication>();
  const { fields, append, remove } = useFieldArray({ control, name: 'entity.additionalGuarantors' });
  const hasCoBorrower = watch('borrower.hasCoBorrower');
  const borrowingAs = watch('entity.borrowingAs');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <WizardCard title="Borrower & Ownership" subtitle="Tell us how you're borrowing and who is on the loan. This information helps us match you with the right program.">
        {/* Individual vs Entity */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ ...labelStyle, marginBottom: '10px' }}>Borrowing As</label>
          <Controller
            control={control}
            name="entity.borrowingAs"
            render={({ field }) => (
              <div style={{ display: 'flex', gap: '12px' }}>
                {[{ value: 'individual', label: '👤 Individual' }, { value: 'entity', label: '🏢 Entity (LLC/Corp/Trust)' }].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => field.onChange(opt.value)}
                    style={{
                      flex: 1,
                      padding: '14px 16px',
                      border: `1.5px solid ${field.value === opt.value ? 'var(--ledger-green)' : 'var(--line)'}`,
                      borderRadius: '4px',
                      background: field.value === opt.value ? 'var(--ledger-green-soft)' : '#fff',
                      color: field.value === opt.value ? 'var(--ledger-green)' : 'var(--slate)',
                      fontSize: '14px',
                      fontWeight: 500,
                      fontFamily: 'Inter, sans-serif',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          />
        </div>

        {borrowingAs === 'entity' && (
          <>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ ...labelStyle, marginBottom: '10px' }}>Entity Type</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {ENTITY_TYPES.map(type => (
                  <Controller
                    key={type}
                    control={control}
                    name="entity.entityType"
                    render={({ field }) => (
                      <button
                        type="button"
                        onClick={() => field.onChange(type)}
                        style={{
                          padding: '7px 14px',
                          border: `1.5px solid ${field.value === type ? 'var(--ledger-green)' : 'var(--line)'}`,
                          borderRadius: '2px',
                          background: field.value === type ? 'var(--ledger-green-soft)' : '#fff',
                          color: field.value === type ? 'var(--ledger-green)' : 'var(--slate)',
                          fontSize: '13px',
                          fontWeight: field.value === type ? 600 : 400,
                          cursor: 'pointer',
                          fontFamily: 'Inter, sans-serif',
                        }}
                      >
                        {type}
                      </button>
                    )}
                  />
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Entity Name <span style={{ color: 'var(--clay)' }}>*</span></label>
                <input {...register('entity.entityName', { required: borrowingAs === 'entity' })} placeholder="ABC Investments LLC" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>State of Formation</label>
                <select {...register('entity.stateOfFormation')} style={inputStyle}>
                  <option value="">Select state...</option>
                  {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Authorized Signer</label>
                <input {...register('entity.authorizedSigner')} placeholder="Member / Manager name" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Ownership % <span style={{ fontSize: '11px', color: 'var(--slate-light)', fontWeight: 400 }}>(your share)</span></label>
                <input {...register('entity.ownershipPercentage')} type="number" min="0" max="100" placeholder="100" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>EIN <span style={{ fontSize: '11px', color: 'var(--slate-light)', fontWeight: 400 }}>(optional)</span></label>
                <input {...register('entity.ein')} placeholder="XX-XXXXXXX" style={{ ...inputStyle, fontFamily: 'IBM Plex Mono, monospace' }} />
              </div>
            </div>

            {/* Additional Guarantors */}
            <div style={{ borderTop: '1px solid var(--line)', paddingTop: '24px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '17px', fontWeight: 600, color: 'var(--ink)', margin: 0 }}>Additional Guarantors</h3>
                  <p style={{ fontSize: '13px', color: 'var(--slate)', margin: '4px 0 0' }}>Add anyone else who will personally guarantee the loan.</p>
                </div>
                <button
                  type="button"
                  onClick={() => append({ name: '', email: '', phone: '' })}
                  style={{
                    padding: '8px 14px',
                    border: '1.5px solid var(--blue)',
                    borderRadius: '2px',
                    background: 'var(--blue-soft)',
                    color: 'var(--blue)',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  + Add Guarantor
                </button>
              </div>

              {fields.map((field, i) => (
                <div key={field.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '12px', marginBottom: '12px', alignItems: 'end' }}>
                  <div>
                    <label style={labelStyle}>Full Name</label>
                    <input {...register(`entity.additionalGuarantors.${i}.name`)} placeholder="Name" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Email</label>
                    <input {...register(`entity.additionalGuarantors.${i}.email`)} type="email" placeholder="Email" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Phone</label>
                    <input {...register(`entity.additionalGuarantors.${i}.phone`)} type="tel" placeholder="Phone" style={inputStyle} />
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    style={{ padding: '9px 12px', background: 'none', border: '1.5px solid var(--line)', borderRadius: '2px', color: 'var(--clay)', cursor: 'pointer', fontSize: '14px' }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </WizardCard>

      {/* Individual / Guarantor Profile — always shown */}
      <WizardCard
        title={borrowingAs === 'entity' ? 'Individual Guarantor Profile' : 'Borrower Profile'}
        subtitle={borrowingAs === 'entity'
          ? 'Even when borrowing through an entity, we need the personal information of the individual guarantor(s).'
          : 'Tell us about yourself. This information is used to match you with the right loan program.'}
      >
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
          <div>
            <label style={labelStyle}>Date of Birth</label>
            <input {...register('borrower.dateOfBirth')} type="date" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Social Security Number</label>
            <input
              {...register('borrower.ssn')}
              type="password"
              placeholder="XXX-XX-XXXX"
              autoComplete="off"
              style={{ ...inputStyle, fontFamily: 'IBM Plex Mono, monospace' }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ ...labelStyle, marginBottom: '10px' }}>Estimated Credit Score Range</label>
          <CreditRangePicker name="borrower.creditRange" />
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px', background: 'var(--paper-dim)', borderRadius: '4px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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
              <div>
                <label style={{ ...labelStyle, marginBottom: '10px' }}>Co-Borrower Estimated Credit Score Range</label>
                <CreditRangePicker name="borrower.coBorrowerCreditRange" />
              </div>
            </div>
          )}
        </div>
      </WizardCard>
    </div>
  );
}
