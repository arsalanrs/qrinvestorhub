'use client';

import { useFormContext, Controller, useWatch } from 'react-hook-form';
import type { InvestorApplication } from '@/types/investor-application';
import { WizardCard } from '@/components/ui/WizardCard';
import { RhfDictationInput } from '@/components/ui/RhfDictationInput';
import { YesNoToggle } from '@/components/ui/YesNoToggle';
import { fmt, toNum } from '@/lib/loan-calculations';

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

function DSCRStep() {
  const { control, register, watch } = useFormContext<InvestorApplication>();
  const properties = useWatch({ control, name: 'properties' }) as InvestorApplication['properties'];
  const loanAmt = toNum(watch('loanRequest.requestedLoanAmount'));

  const prop = properties?.[0];
  const monthlyRent = toNum(prop?.estimatedMarketRent || '');
  const annualTax = toNum(prop?.annualPropertyTax || '');
  const annualInsurance = toNum(prop?.annualHazardInsurance || '') + toNum(prop?.annualFloodInsurance || '');
  const annualHOA = toNum(prop?.annualHOA || '');
  const monthlyExpenses = (annualTax + annualInsurance + annualHOA) / 12;

  const monthlyRate = 0.085 / 12;
  const n = 360;
  const estimatedPI = loanAmt > 0
    ? loanAmt * (monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1)
    : 0;
  const totalPITIA = estimatedPI + monthlyExpenses;
  const dscr = totalPITIA > 0 ? monthlyRent / totalPITIA : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <WizardCard title="Rental Income Details" subtitle="DSCR loans qualify on the property's rental income. Let's verify the numbers.">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          <div>
            <label style={labelStyle}>Is the property currently rented?</label>
            <Controller control={control} name="dscrGoal.currentlyRented" render={({ field }) => (
              <YesNoToggle value={field.value ?? false} onChange={field.onChange} />
            )} />
          </div>
          <div>
            <label style={labelStyle}>Do you have a signed lease?</label>
            <Controller control={control} name="dscrGoal.signedLease" render={({ field }) => (
              <YesNoToggle value={field.value ?? false} onChange={field.onChange} />
            )} />
          </div>
        </div>

        {/* PITIA Breakdown Table */}
        <div style={{ background: 'var(--ink)', borderRadius: '4px', padding: '20px', color: '#fff' }}>
          <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)', margin: '0 0 16px', fontFamily: 'IBM Plex Mono, monospace' }}>
            PITIA Breakdown (Estimated at 8.5% / 30yr)
          </p>
          {[
            { label: 'Principal & Interest', value: estimatedPI },
            { label: 'Monthly Property Tax', value: annualTax / 12 },
            { label: 'Monthly Insurance', value: annualInsurance / 12 },
            { label: 'Monthly HOA', value: annualHOA / 12 },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>{label}</span>
              <span style={{ fontSize: '13px', fontFamily: 'IBM Plex Mono, monospace', color: value > 0 ? '#fff' : 'rgba(255,255,255,0.3)' }}>
                {value > 0 ? fmt(value) + '/mo' : '—'}
              </span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', marginTop: '4px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>Total PITIA</span>
            <span style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'IBM Plex Mono, monospace', color: totalPITIA > 0 ? '#fff' : 'rgba(255,255,255,0.3)' }}>
              {totalPITIA > 0 ? fmt(totalPITIA) + '/mo' : '—'}
            </span>
          </div>
              {dscr !== null && (
            <div style={{ borderTop: '2px solid var(--brass)', paddingTop: '12px', marginTop: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>DSCR</span>
                <span style={{
                  fontSize: '20px',
                  fontFamily: 'IBM Plex Mono, monospace',
                  fontWeight: 700,
                  color: '#fff',
                }}>
                  {dscr.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>

        <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Prepay Structure Preference</label>
            <select {...register('loanRequest.prepayStructure')} style={inputStyle}>
              <option value="">No preference</option>
              <option value="5yr">5-Year Step-Down</option>
              <option value="3yr">3-Year Step-Down</option>
              <option value="1yr">1-Year</option>
              <option value="none">No Prepay</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Closing Timeline</label>
            <select {...register('dscrGoal.closingTimeline')} style={inputStyle}>
              <option value="">Select...</option>
              <option value="asap">ASAP</option>
              <option value="2_4_weeks">2–4 Weeks</option>
              <option value="30_60_days">30–60 Days</option>
              <option value="flexible">Flexible</option>
            </select>
          </div>
        </div>
      </WizardCard>
    </div>
  );
}

function RehabStep() {
  const { control, register } = useFormContext<InvestorApplication>();
  return (
    <WizardCard title="Rehab Details" subtitle="Tell us about the scope of work and your plans for the property.">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Rehab Timeline</label>
            <select {...register('rehabGoal.rehabTimeline')} style={inputStyle}>
              <option value="">Select...</option>
              <option value="1_3_months">1–3 months</option>
              <option value="3_6_months">3–6 months</option>
              <option value="6_12_months">6–12 months</option>
              <option value="12_plus">12+ months</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Funding Timeline</label>
            <select {...register('rehabGoal.fundingTimeline')} style={inputStyle}>
              <option value="">Select...</option>
              <option value="asap">ASAP</option>
              <option value="2_4_weeks">2–4 Weeks</option>
              <option value="30_60_days">30–60 Days</option>
              <option value="flexible">Flexible</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Is this a mid-construction property?</label>
            <Controller control={control} name="rehabGoal.isMidConstruction" render={({ field }) => (
              <YesNoToggle value={field.value ?? false} onChange={field.onChange} />
            )} />
          </div>
          <div>
            <label style={labelStyle}>Are you adding square footage?</label>
            <Controller control={control} name="rehabGoal.addingSqft" render={({ field }) => (
              <YesNoToggle value={field.value ?? false} onChange={field.onChange} />
            )} />
          </div>
          <div>
            <label style={labelStyle}>Is scope of work available?</label>
            <Controller control={control} name="rehabGoal.scopeAvailable" render={({ field }) => (
              <YesNoToggle value={field.value ?? false} onChange={field.onChange} />
            )} />
          </div>
          <div>
            <label style={labelStyle}>Contractor selected?</label>
            <Controller control={control} name="rehabGoal.contractorSelected" render={({ field }) => (
              <YesNoToggle value={field.value ?? false} onChange={field.onChange} />
            )} />
          </div>
        </div>
      </div>
    </WizardCard>
  );
}

function ConstructionStep() {
  const { control, register } = useFormContext<InvestorApplication>();
  return (
    <WizardCard title="Builder & Permit Details" subtitle="Construction loans require verified builder credentials and permit status.">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Builder / GC Name</label>
            <RhfDictationInput control={control} name="constructionGoal.builderName" placeholder="ABC Construction LLC" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Builder Phone</label>
            <input {...register('constructionGoal.builderPhone')} type="tel" placeholder="(555) 000-0000" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Builder License #</label>
            <RhfDictationInput control={control} name="constructionGoal.builderLicense" placeholder="License number" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Construction Timeline</label>
            <select {...register('constructionGoal.constructionTimeline')} style={inputStyle}>
              <option value="">Select...</option>
              <option value="6_12_months">6–12 months</option>
              <option value="12_18_months">12–18 months</option>
              <option value="18_24_months">18–24 months</option>
              <option value="24_plus">24+ months</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Permit Status</label>
            <select {...register('constructionGoal.permitStatus')} style={inputStyle}>
              <option value="">Select...</option>
              <option value="not_applied">Not yet applied</option>
              <option value="submitted">Submitted / Pending</option>
              <option value="approved">Approved</option>
              <option value="issued">Permits Issued</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Plans Status</label>
            <select {...register('constructionGoal.plansStatus')} style={inputStyle}>
              <option value="">Select...</option>
              <option value="not_started">Not started</option>
              <option value="in_progress">In progress</option>
              <option value="complete">Complete</option>
              <option value="approved">City approved</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Draw schedule available?</label>
            <Controller control={control} name="constructionGoal.drawScheduleAvailable" render={({ field }) => (
              <YesNoToggle value={field.value ?? false} onChange={field.onChange} />
            )} />
          </div>
          <div>
            <label style={labelStyle}>Scope of work available?</label>
            <Controller control={control} name="constructionGoal.scopeAvailable" render={({ field }) => (
              <YesNoToggle value={field.value ?? false} onChange={field.onChange} />
            )} />
          </div>
          <div>
            <label style={labelStyle}>Ground-up construction?</label>
            <Controller control={control} name="constructionGoal.isGroundUp" render={({ field }) => (
              <YesNoToggle value={field.value ?? false} onChange={field.onChange} />
            )} />
          </div>
          <div>
            <label style={labelStyle}>Adding square footage?</label>
            <Controller control={control} name="constructionGoal.addingSqft" render={({ field }) => (
              <YesNoToggle value={field.value ?? false} onChange={field.onChange} />
            )} />
          </div>
        </div>
      </div>
    </WizardCard>
  );
}

function BridgeStep() {
  const { register, control } = useFormContext<InvestorApplication>();
  return (
    <WizardCard title="Bridge Loan — Exit Strategy" subtitle="Bridge loans are short-term. Lenders want to understand your exit plan.">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Primary Exit Strategy <span style={{ color: 'var(--clay)' }}>*</span></label>
          <select {...register('loanRequest.exitStrategy')} style={inputStyle}>
            <option value="">Select exit strategy...</option>
            <option value="sell_after_stabilization">Sell after stabilization</option>
            <option value="refi_conventional">Refinance into conventional loan</option>
            <option value="refi_dscr">Refinance into DSCR loan</option>
            <option value="refi_portfolio">Refinance into portfolio loan</option>
            <option value="sell_as_is">Sell as-is</option>
          </select>
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Backup Exit Strategy</label>
          <RhfDictationInput control={control} name="loanRequest.backupExitStrategy" placeholder="e.g. hold as rental if sale market softens" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Funding Timeline Needed</label>
          <select {...register('bridgeGoal.fundingTimeline')} style={inputStyle}>
            <option value="">Select...</option>
            <option value="asap">ASAP (&lt; 2 weeks)</option>
            <option value="2_4_weeks">2–4 weeks</option>
            <option value="30_60_days">30–60 days</option>
            <option value="flexible">Flexible</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Target Closing Date</label>
          <input {...register('bridgeGoal.closingDate')} type="date" style={inputStyle} />
        </div>
      </div>
    </WizardCard>
  );
}

function BlanketPortfolioStep() {
  const { control, register, watch } = useFormContext<InvestorApplication>();
  const properties = watch('properties') || [];
  const totalValue = properties.reduce((s: number, p: InvestorApplication['properties'][0]) => s + toNum(p.currentAsIsValue), 0);
  const totalRent = properties.reduce((s: number, p: InvestorApplication['properties'][0]) => s + toNum(p.estimatedMarketRent), 0);

  return (
    <WizardCard title="Portfolio Summary & Flexibility" subtitle="Confirm your portfolio details and let us know your financial goals.">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Properties', value: String(properties.length) },
          { label: 'Total Portfolio Value', value: totalValue > 0 ? fmt(totalValue) : '—' },
          { label: 'Total Monthly Rent', value: totalRent > 0 ? fmt(totalRent) : '—' },
        ].map(({ label, value }) => (
          <div key={label} style={{ padding: '16px', background: 'var(--paper-dim)', borderRadius: '4px', textAlign: 'center' }}>
            <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--slate-light)', margin: '0 0 6px', fontFamily: 'IBM Plex Mono, monospace' }}>{label}</p>
            <p style={{ fontSize: '20px', fontFamily: 'IBM Plex Mono, monospace', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>{value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label style={labelStyle}>Any properties under contract?</label>
          <Controller control={control} name="blanketGoal.anyUnderContract" render={({ field }) => (
            <YesNoToggle value={field.value ?? false} onChange={field.onChange} />
          )} />
        </div>
        <div>
          <label style={labelStyle}>Closing Timeline</label>
          <select {...register('blanketGoal.closingTimeline')} style={inputStyle}>
            <option value="">Select...</option>
            <option value="asap">ASAP</option>
            <option value="30_days">30 Days</option>
            <option value="60_days">60 Days</option>
            <option value="90_plus">90+ Days</option>
            <option value="flexible">Flexible</option>
          </select>
        </div>
      </div>
    </WizardCard>
  );
}

export function ProgramSpecificStep() {
  const { watch } = useFormContext<InvestorApplication>();
  const program = watch('loanProgram');

  switch (program) {
    case 'dscr': return <DSCRStep />;
    case 'rehab': return <RehabStep />;
    case 'construction': return <ConstructionStep />;
    case 'bridge': return <BridgeStep />;
    case 'blanket_portfolio': return <BlanketPortfolioStep />;
    default:
      return (
        <WizardCard title="Program Details" subtitle="Select a loan program to continue.">
          <p style={{ color: 'var(--slate)', textAlign: 'center', padding: '20px' }}>Please go back and select a loan program.</p>
        </WizardCard>
      );
  }
}
