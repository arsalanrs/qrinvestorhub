'use client';

import { useFormContext, Controller } from 'react-hook-form';
import type { InvestorApplication } from '@/types/investor-application';
import { WizardCard } from '@/components/ui/WizardCard';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { YesNoToggle } from '@/components/ui/YesNoToggle';
import { RhfDictationInput } from '@/components/ui/RhfDictationInput';
import { DictationTextarea } from '@/components/ui/DictationTextarea';
import {
  BUSINESS_DOCUMENT_OPTIONS,
  CASH_OUT_PURPOSES,
  DOWN_PAYMENT_SOURCES,
  PROPERTY_DOCUMENT_OPTIONS,
} from '@/config/commercial-re-options';
import {
  isIncomeProducingCommercialUse,
  isOwnerOccupiedCommercialUse,
} from '@/lib/default-commercial-re';
import { DocumentCheckboxGroup } from './DocumentCheckboxGroup';
import { creGrid2, creInputStyle, creLabelStyle, CreDivider, CreSectionTitle } from './form-styles';

export function CommercialReProgramStep() {
  const { control, register, watch } = useFormContext<InvestorApplication>();
  const propertyUse = watch('commercialRe.propertyUse') || '';
  const transactionType = watch('loanRequest.transactionType') || '';

  const showIncome = isIncomeProducingCommercialUse(propertyUse);
  const showOwnerOcc = isOwnerOccupiedCommercialUse(propertyUse);
  const showPurchase = transactionType === 'purchase';
  const showRefi = ['rate_term_refi', 'cash_out_refi', 'maturing_balloon_refi', 'construction_to_permanent'].includes(transactionType);
  const showCashOut = transactionType === 'cash_out_refi' || transactionType === 'maturing_balloon_refi';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {showIncome && (
        <WizardCard title="Property Income" subtitle="For income-producing or partially leased properties.">
          <div style={creGrid2}>
            <div>
              <label style={creLabelStyle}>Current monthly rental income</label>
              <Controller control={control} name="commercialRe.propertyIncome.monthlyRentalIncome" render={({ field }) => (
                <CurrencyInput value={field.value} onChange={field.onChange} />
              )} />
            </div>
            <div>
              <label style={creLabelStyle}>Current annual gross income</label>
              <Controller control={control} name="commercialRe.propertyIncome.annualGrossIncome" render={({ field }) => (
                <CurrencyInput value={field.value} onChange={field.onChange} />
              )} />
            </div>
            <div>
              <label style={creLabelStyle}>Current annual operating expenses</label>
              <Controller control={control} name="commercialRe.propertyIncome.annualOperatingExpenses" render={({ field }) => (
                <CurrencyInput value={field.value} onChange={field.onChange} />
              )} />
            </div>
            <div>
              <label style={creLabelStyle}>Current annual net operating income (NOI)</label>
              <Controller control={control} name="commercialRe.propertyIncome.annualNOI" render={({ field }) => (
                <CurrencyInput value={field.value} onChange={field.onChange} />
              )} />
            </div>
            <div>
              <label style={creLabelStyle}>Number of occupied units</label>
              <input {...register('commercialRe.propertyIncome.occupiedUnits')} style={creInputStyle} />
            </div>
            <div>
              <label style={creLabelStyle}>Number of vacant units</label>
              <input {...register('commercialRe.propertyIncome.vacantUnits')} style={creInputStyle} />
            </div>
            <div>
              <label style={creLabelStyle}>Are rents at market level?</label>
              <Controller control={control} name="commercialRe.propertyIncome.rentsAtMarket" render={({ field }) => (
                <YesNoToggle value={field.value ?? false} onChange={field.onChange} />
              )} />
            </div>
            <div>
              <label style={creLabelStyle}>Are any tenants delinquent?</label>
              <Controller control={control} name="commercialRe.propertyIncome.tenantsDelinquent" render={({ field }) => (
                <YesNoToggle value={field.value ?? false} onChange={field.onChange} />
              )} />
            </div>
            <div>
              <label style={creLabelStyle}>Major leases expiring within 12 months?</label>
              <Controller control={control} name="commercialRe.propertyIncome.majorLeasesExpiring12mo" render={({ field }) => (
                <YesNoToggle value={field.value ?? false} onChange={field.onChange} />
              )} />
            </div>
          </div>

          <CreDivider />
          <CreSectionTitle>Lease Information</CreSectionTitle>
          <div style={creGrid2}>
            <div>
              <label style={creLabelStyle}>Current rent roll available?</label>
              <Controller control={control} name="commercialRe.leaseInfo.hasRentRoll" render={({ field }) => (
                <YesNoToggle value={field.value ?? false} onChange={field.onChange} />
              )} />
            </div>
            <div>
              <label style={creLabelStyle}>Written leases in place?</label>
              <Controller control={control} name="commercialRe.leaseInfo.writtenLeasesInPlace" render={({ field }) => (
                <YesNoToggle value={field.value ?? false} onChange={field.onChange} />
              )} />
            </div>
            <div>
              <label style={creLabelStyle}>Average remaining lease term</label>
              <input {...register('commercialRe.leaseInfo.avgRemainingLeaseTerm')} style={creInputStyle} placeholder="e.g. 3 years" />
            </div>
            <div>
              <label style={creLabelStyle}>Largest tenant name</label>
              <RhfDictationInput control={control} name="commercialRe.leaseInfo.largestTenantName" style={creInputStyle} />
            </div>
            <div>
              <label style={creLabelStyle}>% of income from largest tenant</label>
              <input {...register('commercialRe.leaseInfo.largestTenantIncomePct')} style={creInputStyle} placeholder="e.g. 35" />
            </div>
            <div>
              <label style={creLabelStyle}>Any tenant related to borrower?</label>
              <Controller control={control} name="commercialRe.leaseInfo.tenantRelatedToBorrower" render={({ field }) => (
                <YesNoToggle value={field.value ?? false} onChange={field.onChange} />
              )} />
            </div>
          </div>

          <CreDivider />
          <CreSectionTitle>Property Documents Available</CreSectionTitle>
          <p style={{ fontSize: '12px', color: 'var(--slate)', margin: '0 0 12px' }}>
            Check all that apply — helps our team gauge how complete the file is. Upload is not required at intake.
          </p>
          <DocumentCheckboxGroup name="commercialRe.propertyDocumentsAvailable" options={PROPERTY_DOCUMENT_OPTIONS} />
        </WizardCard>
      )}

      {showOwnerOcc && (
        <WizardCard title="Operating Business" subtitle="For owner-occupied or partially owner-occupied properties.">
          <div style={creGrid2}>
            <div>
              <label style={creLabelStyle}>Legal business name</label>
              <RhfDictationInput control={control} name="commercialRe.operatingBusiness.legalName" style={creInputStyle} />
            </div>
            <div>
              <label style={creLabelStyle}>Business type / industry</label>
              <RhfDictationInput control={control} name="commercialRe.operatingBusiness.businessType" style={creInputStyle} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={creLabelStyle}>Business address</label>
              <RhfDictationInput control={control} name="commercialRe.operatingBusiness.businessAddress" style={creInputStyle} />
            </div>
            <div>
              <label style={creLabelStyle}>Years in business</label>
              <input {...register('commercialRe.operatingBusiness.yearsInBusiness')} style={creInputStyle} />
            </div>
            <div>
              <label style={creLabelStyle}>% of property business will occupy</label>
              <input {...register('commercialRe.operatingBusiness.occupancyPct')} style={creInputStyle} placeholder="e.g. 60" />
            </div>
            <div>
              <label style={creLabelStyle}>Number of employees</label>
              <input {...register('commercialRe.operatingBusiness.numEmployees')} style={creInputStyle} />
            </div>
            <div>
              <label style={creLabelStyle}>Approx. annual business revenue</label>
              <Controller control={control} name="commercialRe.operatingBusiness.annualRevenue" render={({ field }) => (
                <CurrencyInput value={field.value} onChange={field.onChange} />
              )} />
            </div>
            <div>
              <label style={creLabelStyle}>Approx. annual net income</label>
              <Controller control={control} name="commercialRe.operatingBusiness.annualNetIncome" render={({ field }) => (
                <CurrencyInput value={field.value} onChange={field.onChange} />
              )} />
            </div>
            <div>
              <label style={creLabelStyle}>Business currently profitable?</label>
              <Controller control={control} name="commercialRe.operatingBusiness.isProfitable" render={({ field }) => (
                <YesNoToggle value={field.value ?? false} onChange={field.onChange} />
              )} />
            </div>
            <div>
              <label style={creLabelStyle}>Revenue trend (past 2 years)</label>
              <select {...register('commercialRe.operatingBusiness.revenueTrend')} style={creInputStyle}>
                <option value="">Select...</option>
                <option value="increased">Increased</option>
                <option value="decreased">Decreased</option>
                <option value="stable">Remained stable</option>
              </select>
            </div>
            <div>
              <label style={creLabelStyle}>Business currently pays rent?</label>
              <Controller control={control} name="commercialRe.operatingBusiness.paysRentCurrently" render={({ field }) => (
                <YesNoToggle value={field.value ?? false} onChange={field.onChange} />
              )} />
            </div>
            <div>
              <label style={creLabelStyle}>Current monthly rent</label>
              <Controller control={control} name="commercialRe.operatingBusiness.currentMonthlyRent" render={({ field }) => (
                <CurrencyInput value={field.value} onChange={field.onChange} />
              )} />
            </div>
            <div>
              <label style={creLabelStyle}>Business continue during move/renovation?</label>
              <Controller control={control} name="commercialRe.operatingBusiness.continueDuringMoveOrReno" render={({ field }) => (
                <YesNoToggle value={field.value ?? false} onChange={field.onChange} />
              )} />
            </div>
          </div>

          <CreDivider />
          <CreSectionTitle>Business Ownership</CreSectionTitle>
          <div style={creGrid2}>
            <div>
              <label style={creLabelStyle}>Borrower ownership %</label>
              <input {...register('commercialRe.businessOwnership.ownershipPct')} style={creInputStyle} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={creLabelStyle}>Owners with 20%+ ownership (names)</label>
              <RhfDictationInput control={control} name="commercialRe.businessOwnership.owners20Plus" style={creInputStyle} placeholder="Name, Name..." />
            </div>
            <div>
              <label style={creLabelStyle}>All required owners will personally guarantee?</label>
              <Controller control={control} name="commercialRe.businessOwnership.allOwnersGuarantee" render={({ field }) => (
                <YesNoToggle value={field.value ?? false} onChange={field.onChange} />
              )} />
            </div>
            <div>
              <label style={creLabelStyle}>Any owners unwilling to guarantee?</label>
              <Controller control={control} name="commercialRe.businessOwnership.ownersUnwillingGuarantee" render={({ field }) => (
                <YesNoToggle value={field.value ?? false} onChange={field.onChange} />
              )} />
            </div>
          </div>

          <CreDivider />
          <CreSectionTitle>Business Documents Available</CreSectionTitle>
          <DocumentCheckboxGroup name="commercialRe.businessDocumentsAvailable" options={BUSINESS_DOCUMENT_OPTIONS} />
        </WizardCard>
      )}

      {showPurchase && (
        <WizardCard title="Purchase Details">
          <div style={creGrid2}>
            <div>
              <label style={creLabelStyle}>Total down payment available</label>
              <Controller control={control} name="commercialRe.purchaseDetails.totalDownPayment" render={({ field }) => (
                <CurrencyInput value={field.value} onChange={field.onChange} />
              )} />
            </div>
            <div>
              <label style={creLabelStyle}>Earnest money deposited</label>
              <Controller control={control} name="commercialRe.purchaseDetails.earnestMoneyDeposited" render={({ field }) => (
                <CurrencyInput value={field.value} onChange={field.onChange} />
              )} />
            </div>
            <div>
              <label style={creLabelStyle}>Contract expiration</label>
              <input {...register('commercialRe.purchaseDetails.contractExpiration')} type="date" style={creInputStyle} />
            </div>
            <div>
              <label style={creLabelStyle}>Due diligence expiration</label>
              <input {...register('commercialRe.purchaseDetails.dueDiligenceExpiration')} type="date" style={creInputStyle} />
            </div>
            <div>
              <label style={creLabelStyle}>Target closing date</label>
              <input {...register('loanRequest.closingDate')} type="date" style={creInputStyle} />
            </div>
            <div>
              <label style={creLabelStyle}>Seller financing?</label>
              <Controller control={control} name="commercialRe.purchaseDetails.sellerFinancing" render={({ field }) => (
                <YesNoToggle value={field.value ?? false} onChange={field.onChange} />
              )} />
            </div>
            <div>
              <label style={creLabelStyle}>Arm&apos;s-length transaction?</label>
              <Controller control={control} name="commercialRe.purchaseDetails.armLengthTransaction" render={({ field }) => (
                <YesNoToggle value={field.value ?? false} onChange={field.onChange} />
              )} />
            </div>
            <div>
              <label style={creLabelStyle}>Purchasing real estate only (not business)?</label>
              <Controller control={control} name="commercialRe.purchaseDetails.purchasingRealEstateOnly" render={({ field }) => (
                <YesNoToggle value={field.value ?? false} onChange={field.onChange} />
              )} />
            </div>
            <div>
              <label style={creLabelStyle}>Renovations required after closing?</label>
              <Controller control={control} name="commercialRe.purchaseDetails.renovationsRequiredAfterClosing" render={({ field }) => (
                <YesNoToggle value={field.value ?? false} onChange={field.onChange} />
              )} />
            </div>
            <div>
              <label style={creLabelStyle}>Estimated renovation budget</label>
              <Controller control={control} name="commercialRe.purchaseDetails.renovationBudget" render={({ field }) => (
                <CurrencyInput value={field.value} onChange={field.onChange} />
              )} />
            </div>
            <div>
              <label style={creLabelStyle}>Source of down payment</label>
              <select {...register('commercialRe.purchaseDetails.downPaymentSource')} style={creInputStyle}>
                <option value="">Select...</option>
                {DOWN_PAYMENT_SOURCES.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            {watch('commercialRe.purchaseDetails.downPaymentSource') === 'other' && (
              <div>
                <label style={creLabelStyle}>Describe down payment source</label>
                <RhfDictationInput control={control} name="commercialRe.purchaseDetails.downPaymentSourceOther" style={creInputStyle} />
              </div>
            )}
          </div>
        </WizardCard>
      )}

      {showRefi && (
        <WizardCard title="Existing Loan Information">
          <div style={creGrid2}>
            <div>
              <label style={creLabelStyle}>Current lender</label>
              <RhfDictationInput control={control} name="commercialRe.existingLoan.currentLender" style={creInputStyle} />
            </div>
            <div>
              <label style={creLabelStyle}>Current mortgage balance</label>
              <Controller control={control} name="commercialRe.existingLoan.currentBalance" render={({ field }) => (
                <CurrencyInput value={field.value} onChange={field.onChange} />
              )} />
            </div>
            <div>
              <label style={creLabelStyle}>Current interest rate</label>
              <input {...register('commercialRe.existingLoan.currentRate')} style={creInputStyle} placeholder="e.g. 6.75%" />
            </div>
            <div>
              <label style={creLabelStyle}>Current monthly payment</label>
              <Controller control={control} name="commercialRe.existingLoan.currentMonthlyPayment" render={({ field }) => (
                <CurrencyInput value={field.value} onChange={field.onChange} />
              )} />
            </div>
            <div>
              <label style={creLabelStyle}>Original loan amount</label>
              <Controller control={control} name="commercialRe.existingLoan.originalLoanAmount" render={({ field }) => (
                <CurrencyInput value={field.value} onChange={field.onChange} />
              )} />
            </div>
            <div>
              <label style={creLabelStyle}>Loan maturity date</label>
              <input {...register('commercialRe.existingLoan.maturityDate')} type="date" style={creInputStyle} />
            </div>
            <div>
              <label style={creLabelStyle}>Balloon payment due date</label>
              <input {...register('commercialRe.existingLoan.balloonDueDate')} type="date" style={creInputStyle} />
            </div>
            <div>
              <label style={creLabelStyle}>Prepayment penalty?</label>
              <Controller control={control} name="commercialRe.existingLoan.prepaymentPenalty" render={({ field }) => (
                <YesNoToggle value={field.value ?? false} onChange={field.onChange} />
              )} />
            </div>
            <div>
              <label style={creLabelStyle}>Loan ever late?</label>
              <Controller control={control} name="commercialRe.existingLoan.everLate" render={({ field }) => (
                <YesNoToggle value={field.value ?? false} onChange={field.onChange} />
              )} />
            </div>
            <div>
              <label style={creLabelStyle}>Currently in default?</label>
              <Controller control={control} name="commercialRe.existingLoan.currentlyInDefault" render={({ field }) => (
                <YesNoToggle value={field.value ?? false} onChange={field.onChange} />
              )} />
            </div>
            <div>
              <label style={creLabelStyle}>Lender requiring refinance?</label>
              <Controller control={control} name="commercialRe.existingLoan.lenderRequiringRefi" render={({ field }) => (
                <YesNoToggle value={field.value ?? false} onChange={field.onChange} />
              )} />
            </div>
          </div>

          {showCashOut && (
            <>
              <CreDivider />
              <CreSectionTitle>Cash-Out Information</CreSectionTitle>
              <div style={creGrid2}>
                <div>
                  <label style={creLabelStyle}>Requested cash-out amount</label>
                  <Controller control={control} name="commercialRe.cashOut.requestedAmount" render={({ field }) => (
                    <CurrencyInput value={field.value} onChange={field.onChange} />
                  )} />
                </div>
                <div>
                  <label style={creLabelStyle}>Purpose of cash-out</label>
                  <select {...register('commercialRe.cashOut.purpose')} style={creInputStyle}>
                    <option value="">Select...</option>
                    {CASH_OUT_PURPOSES.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                {watch('commercialRe.cashOut.purpose') === 'other' && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={creLabelStyle}>Describe purpose</label>
                    <RhfDictationInput control={control} name="commercialRe.cashOut.purposeOther" style={creInputStyle} />
                  </div>
                )}
              </div>
            </>
          )}
        </WizardCard>
      )}

      <WizardCard title="Tell Us About the Opportunity" subtitle="Briefly describe the property, your financing request, and anything unusual about the transaction.">
        <Controller
          control={control}
          name="commercialRe.dealStory"
          render={({ field }) => (
            <DictationTextarea
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              rows={5}
              placeholder="Property overview, financing goals, timeline, tenant situation, or anything Jason and your loan officer should know..."
              style={{ ...creInputStyle, resize: 'vertical' }}
            />
          )}
        />
      </WizardCard>
    </div>
  );
}
