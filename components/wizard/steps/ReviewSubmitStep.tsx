'use client';

import { useFormContext, Controller, useWatch } from 'react-hook-form';
import type { InvestorApplication } from '@/types/investor-application';
import { WizardCard } from '@/components/ui/WizardCard';
import { DictationTextarea } from '@/components/ui/DictationTextarea';
import { LoanLedger } from '@/components/wizard/LoanLedger';
import { PROGRAM_CONFIGS } from '@/config/loan-programs';
import type { ProgramKey } from '@/config/loan-programs';

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 500,
  color: 'var(--ink)',
  marginBottom: '6px',
};

function SummaryBlock({ title, rows }: { title: string; rows: Array<{ label: string; value: string }> }) {
  return (
    <div style={{ border: '1.5px solid var(--line)', borderRadius: '4px', marginBottom: '16px', overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', background: 'var(--paper-dim)', borderBottom: '1px solid var(--line)' }}>
        <p style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--slate)', margin: 0, fontFamily: 'IBM Plex Mono, monospace' }}>{title}</p>
      </div>
      <div style={{ padding: '4px 0' }}>
        {rows.filter(r => r.value).map(({ label, value }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 16px', borderBottom: '1px solid var(--paper-dim)' }}>
            <span style={{ fontSize: '13px', color: 'var(--slate)' }}>{label}</span>
            <span style={{ fontSize: '13px', color: 'var(--ink)', fontWeight: 500, textAlign: 'right', maxWidth: '60%' }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const CONSENTS = [
  { name: 'accuracyConfirmed' as const, label: 'I confirm that all information provided is accurate and complete to the best of my knowledge.' },
  { name: 'investmentPurpose' as const, label: 'I confirm this loan is for investment purposes only (non-owner-occupied property).' },
  { name: 'noOwnerOccupancy' as const, label: 'I understand that owner-occupancy of the subject property is not permitted under this loan program.' },
  { name: 'contactConsent' as const, label: 'I consent to being contacted by QuestRock or its lending partners via phone, email, or SMS regarding this application.' },
  { name: 'electronicComms' as const, label: 'I agree to receive electronic communications and disclosures related to this loan application.' },
  { name: 'creditPullConsent' as const, label: 'I agree to have my credit pulled as part of this loan application.' },
];

export function ReviewSubmitStep() {
  const { control, watch } = useFormContext<InvestorApplication>();
  const formValues = useWatch({ control }) as InvestorApplication;
  const consents = watch('consents');
  const allConsented = consents && Object.values(consents).every(Boolean);

  const program = formValues.loanProgram;
  const programLabel = program ? (PROGRAM_CONFIGS[program as ProgramKey]?.label || program) : 'Not selected';
  const b = formValues.borrower;
  const e = formValues.entity;
  const lr = formValues.loanRequest;
  const prop = formValues.properties?.[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <WizardCard title="Review Your Application" subtitle="Please review all information before submitting. You can go back to make changes.">

        {/* Summary Sections */}
        <SummaryBlock title="Loan Program" rows={[
          { label: 'Program', value: programLabel },
          { label: 'Deal Stage', value: formValues.dealStage?.replace(/_/g, ' ') || '' },
          { label: 'Transaction Type', value: lr?.transactionType?.replace(/_/g, ' ') || '' },
        ]} />

        <SummaryBlock title="Borrower" rows={[
          { label: 'Name', value: `${b?.firstName || ''} ${b?.lastName || ''}`.trim() },
          { label: 'Email', value: b?.email || '' },
          { label: 'Phone', value: b?.phone || '' },
          { label: 'Date of Birth', value: b?.dateOfBirth || '' },
          { label: 'SSN', value: b?.ssn ? '•••-••-' + b.ssn.slice(-4) : '' },
          { label: 'Credit Range', value: b?.creditRange || '' },
          { label: 'Co-Borrower', value: b?.hasCoBorrower ? b.coBorrowerName : 'None' },
          { label: 'Co-Borrower Credit', value: b?.hasCoBorrower ? (b.coBorrowerCreditRange || '') : '' },
        ]} />

        <SummaryBlock title="Entity" rows={[
          { label: 'Borrowing As', value: e?.borrowingAs || '' },
          { label: 'Entity Name', value: e?.entityName || '' },
          { label: 'Entity Type', value: e?.entityType || '' },
          { label: 'State of Formation', value: e?.stateOfFormation || '' },
        ]} />

        <SummaryBlock title="Loan Request" rows={[
          { label: 'Requested Loan Amount', value: lr?.requestedLoanAmount ? `$${Number(lr.requestedLoanAmount.replace(/[^0-9]/g, '')).toLocaleString()}` : '' },
          { label: 'Purchase Price', value: lr?.purchasePrice ? `$${Number(lr.purchasePrice.replace(/[^0-9]/g, '')).toLocaleString()}` : '' },
          { label: 'Rehab Budget', value: lr?.rehabBudget ? `$${Number(lr.rehabBudget.replace(/[^0-9]/g, '')).toLocaleString()}` : '' },
          { label: 'ARV', value: lr?.arv ? `$${Number(lr.arv.replace(/[^0-9]/g, '')).toLocaleString()}` : '' },
          { label: 'Funding Timeline', value: lr?.fundingTimeline?.replace(/_/g, ' ') || '' },
          { label: 'Exit Strategy', value: lr?.exitStrategy || '' },
        ]} />

        {prop && (
          <SummaryBlock title="Primary Property" rows={[
            { label: 'Address', value: [prop.address, prop.city, prop.state, prop.zip].filter(Boolean).join(', ') },
            { label: 'Property Type', value: prop.propertyType?.replace(/_/g, ' ') || '' },
            { label: 'Estimated Value', value: prop.currentAsIsValue ? `$${Number(prop.currentAsIsValue.replace(/[^0-9]/g, '')).toLocaleString()}` : '' },
            { label: 'Monthly Rent', value: prop.estimatedMarketRent ? `$${Number(prop.estimatedMarketRent.replace(/[^0-9]/g, '')).toLocaleString()}/mo` : '' },
            { label: 'Occupancy', value: prop.occupancyStatus?.replace(/_/g, ' ') || '' },
          ]} />
        )}
      </WizardCard>

      {/* Live Ledger */}
      <LoanLedger inline />

      {/* Document Status */}
      {formValues.documents && formValues.documents.length > 0 && (
        <WizardCard title="Uploaded Documents">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {formValues.documents.map(doc => (
              <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--paper-dim)' }}>
                <span style={{ fontSize: '13px', color: 'var(--ink-soft)' }}>{doc.label}</span>
                <span style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: '2px',
                  background: doc.status === 'uploaded' ? 'var(--ledger-green-soft)' : 'var(--paper-dim)',
                  color: doc.status === 'uploaded' ? 'var(--ledger-green)' : 'var(--slate)',
                  fontFamily: 'IBM Plex Mono, monospace',
                  fontWeight: 600,
                }}>
                  {doc.status === 'uploaded' ? 'Uploaded ✓' : 'Not uploaded'}
                </span>
              </div>
            ))}
          </div>
        </WizardCard>
      )}

      {/* Additional Notes */}
      <WizardCard title="Additional Notes" subtitle="Anything else you'd like QuestRock to know about this deal?">
        <Controller
          control={control}
          name="additionalNotes"
          render={({ field }) => (
            <DictationTextarea
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              rows={4}
              placeholder="Enter any additional context, deal background, special circumstances, or questions you have for the QuestRock team..."
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1.5px solid var(--line)',
                borderRadius: '2px',
                fontSize: '14px',
                fontFamily: 'Inter, sans-serif',
                color: 'var(--ink)',
                outline: 'none',
                background: '#fff',
                resize: 'vertical',
              }}
            />
          )}
        />
      </WizardCard>

      {/* Consents */}
      <WizardCard title="Authorization & Consents" subtitle="Please read and check each box below to complete your application.">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {CONSENTS.map(({ name, label }) => (
            <Controller
              key={name}
              control={control}
              name={`consents.${name}`}
              render={({ field }) => (
                <label style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: 'pointer' }}>
                  <div
                    onClick={() => field.onChange(!field.value)}
                    style={{
                      width: '20px',
                      height: '20px',
                      border: `2px solid ${field.value ? 'var(--ledger-green)' : 'var(--line)'}`,
                      borderRadius: '2px',
                      background: field.value ? 'var(--ledger-green)' : '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '1px',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {field.value && <span style={{ color: '#fff', fontSize: '12px', lineHeight: 1 }}>✓</span>}
                  </div>
                  <span style={{ fontSize: '13px', color: 'var(--ink-soft)', lineHeight: '1.6' }}>{label}</span>
                </label>
              )}
            />
          ))}
        </div>

        {!allConsented && (
          <p style={{ fontSize: '12px', color: 'var(--slate-light)', marginTop: '16px', textAlign: 'center' }}>
            Please check all boxes above to enable submission.
          </p>
        )}
      </WizardCard>
    </div>
  );
}
