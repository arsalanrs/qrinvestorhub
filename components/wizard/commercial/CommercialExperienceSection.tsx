'use client';

import { useFormContext, Controller } from 'react-hook-form';
import type { InvestorApplication } from '@/types/investor-application';
import { WizardCard } from '@/components/ui/WizardCard';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { YesNoToggle } from '@/components/ui/YesNoToggle';
import { DictationTextarea } from '@/components/ui/DictationTextarea';
import { creGrid2, creInputStyle, creLabelStyle, CreSectionTitle } from './form-styles';

export function CommercialExperienceSection() {
  const { control, register, watch } = useFormContext<InvestorApplication>();
  const exp = watch('commercialRe.commercialExperience');
  const adverse = watch('commercialRe.financialProfile.adverseHistory');

  return (
    <WizardCard
      title="Commercial Ownership & Management Experience"
      subtitle="Help us understand your commercial real estate background."
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={creGrid2}>
          <div>
            <label style={creLabelStyle}>Do you currently own commercial real estate?</label>
            <Controller control={control} name="commercialRe.commercialExperience.currentlyOwnsCre" render={({ field }) => (
              <YesNoToggle value={field.value ?? false} onChange={field.onChange} />
            )} />
          </div>
          {exp?.currentlyOwnsCre && (
            <div>
              <label style={creLabelStyle}>How many commercial properties?</label>
              <input {...register('commercialRe.commercialExperience.numPropertiesOwned')} style={creInputStyle} />
            </div>
          )}
          <div>
            <label style={creLabelStyle}>Previously owned this type of property?</label>
            <Controller control={control} name="commercialRe.commercialExperience.previouslyOwnedThisType" render={({ field }) => (
              <YesNoToggle value={field.value ?? false} onChange={field.onChange} />
            )} />
          </div>
          <div>
            <label style={creLabelStyle}>Years of commercial ownership experience</label>
            <input {...register('commercialRe.commercialExperience.yearsOwnershipExperience')} style={creInputStyle} />
          </div>
          <div>
            <label style={creLabelStyle}>Will you manage the property yourself?</label>
            <Controller control={control} name="commercialRe.commercialExperience.selfManage" render={({ field }) => (
              <YesNoToggle value={field.value ?? false} onChange={field.onChange} />
            )} />
          </div>
          <div>
            <label style={creLabelStyle}>Third-party property manager?</label>
            <Controller control={control} name="commercialRe.commercialExperience.thirdPartyManager" render={({ field }) => (
              <YesNoToggle value={field.value ?? false} onChange={field.onChange} />
            )} />
          </div>
          <div>
            <label style={creLabelStyle}>Completed commercial renovations or construction?</label>
            <Controller control={control} name="commercialRe.commercialExperience.completedRenovationsOrConstruction" render={({ field }) => (
              <YesNoToggle value={field.value ?? false} onChange={field.onChange} />
            )} />
          </div>
          <div>
            <label style={creLabelStyle}>Licensed contractor, developer, or property manager?</label>
            <Controller control={control} name="commercialRe.commercialExperience.licensedContractorDeveloperManager" render={({ field }) => (
              <YesNoToggle value={field.value ?? false} onChange={field.onChange} />
            )} />
          </div>
          <div>
            <label style={creLabelStyle}>Prior commercial foreclosure or lender transfer?</label>
            <Controller control={control} name="commercialRe.commercialExperience.priorForeclosureOrTransfer" render={({ field }) => (
              <YesNoToggle value={field.value ?? false} onChange={field.onChange} />
            )} />
          </div>
        </div>

        <CreSectionTitle>Borrower Financial Profile</CreSectionTitle>
        <div style={creGrid2}>
          <div>
            <label style={creLabelStyle}>Approximate personal net worth</label>
            <Controller control={control} name="commercialRe.financialProfile.personalNetWorth" render={({ field }) => (
              <CurrencyInput value={field.value ?? ''} onChange={field.onChange} />
            )} />
          </div>
          <div>
            <label style={creLabelStyle}>Approximate business liquidity</label>
            <Controller control={control} name="commercialRe.financialProfile.businessLiquidity" render={({ field }) => (
              <CurrencyInput value={field.value ?? ''} onChange={field.onChange} />
            )} />
          </div>
          <div>
            <label style={creLabelStyle}>Funds available for closing</label>
            <Controller control={control} name="commercialRe.financialProfile.fundsForClosing" render={({ field }) => (
              <CurrencyInput value={field.value ?? ''} onChange={field.onChange} />
            )} />
          </div>
          <div>
            <label style={creLabelStyle}>Liquidity remaining after closing</label>
            <Controller control={control} name="commercialRe.financialProfile.liquidityAfterClosing" render={({ field }) => (
              <CurrencyInput value={field.value ?? ''} onChange={field.onChange} />
            )} />
          </div>
          <div>
            <label style={creLabelStyle}>Other commercial real estate owned?</label>
            <Controller control={control} name="commercialRe.financialProfile.otherCreOwned" render={({ field }) => (
              <YesNoToggle value={field.value ?? false} onChange={field.onChange} />
            )} />
          </div>
          <div>
            <label style={creLabelStyle}>Business loans currently outstanding?</label>
            <Controller control={control} name="commercialRe.financialProfile.businessLoansOutstanding" render={({ field }) => (
              <YesNoToggle value={field.value ?? false} onChange={field.onChange} />
            )} />
          </div>
          <div>
            <label style={creLabelStyle}>SBA loans currently outstanding?</label>
            <Controller control={control} name="commercialRe.financialProfile.sbaLoansOutstanding" render={({ field }) => (
              <YesNoToggle value={field.value ?? false} onChange={field.onChange} />
            )} />
          </div>
          <div>
            <label style={creLabelStyle}>Outstanding tax liens or payment plans?</label>
            <Controller control={control} name="commercialRe.financialProfile.taxLiensOrPaymentPlans" render={({ field }) => (
              <YesNoToggle value={field.value ?? false} onChange={field.onChange} />
            )} />
          </div>
        </div>

        <div>
          <Controller
            control={control}
            name="commercialRe.financialProfile.adverseHistory"
            render={({ field }) => (
              <YesNoToggle
                value={field.value ?? false}
                onChange={field.onChange}
                label="Any bankruptcies, foreclosures, short sales, tax liens, loan defaults, or late commercial mortgage payments within the last seven years?"
              />
            )}
          />
          {adverse && (
            <div style={{ marginTop: '12px' }}>
              <label style={creLabelStyle}>Please briefly explain what happened, when, and whether resolved:</label>
              <Controller
                control={control}
                name="commercialRe.financialProfile.adverseHistoryDetails"
                render={({ field }) => (
                  <DictationTextarea
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    rows={3}
                    style={{ ...creInputStyle, resize: 'vertical' }}
                  />
                )}
              />
            </div>
          )}
        </div>
      </div>
    </WizardCard>
  );
}
