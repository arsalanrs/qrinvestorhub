'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useForm, FormProvider, useWatch } from 'react-hook-form';
import type { InvestorApplication, PropertyData } from '@/types/investor-application';
import type { DocumentItem } from '@/types/investor-application';
import { PROGRAM_CONFIGS } from '@/config/loan-programs';
import type { ProgramKey } from '@/config/loan-programs';
import { QuestRockTopbar } from './QuestRockTopbar';
import { StepRail } from './StepRail';
import { LoanLedger } from './LoanLedger';
import { LoanOfficerStep } from './steps/LoanOfficerStep';
import { LoanGoalStep } from './steps/LoanGoalStep';
import { BorrowerProfileStep } from './steps/BorrowerProfileStep';
import { ExperienceLiquidityStep } from './steps/ExperienceLiquidityStep';
import { PropertyStep } from './steps/PropertyStep';
import { LoanStructureStep } from './steps/LoanStructureStep';
import { ProgramSpecificStep } from './steps/ProgramSpecificStep';
import { DocumentUploadStep } from './steps/DocumentUploadStep';
import { ReviewSubmitStep } from './steps/ReviewSubmitStep';
import { SuccessScreen } from './SuccessScreen';
import { FlowButton } from '@/components/ui/flow-button';
import { defaultCommercialRe } from '@/lib/default-commercial-re';
import { allRequiredConsentsChecked } from '@/lib/wizard-consents';

const WIZARD_STEPS = [
  { key: 'loan-officer', label: 'Loan Officer', Component: LoanOfficerStep },
  { key: 'goal', label: 'Loan Goal', Component: LoanGoalStep },
  { key: 'borrower', label: 'Borrower', Component: BorrowerProfileStep },
  { key: 'experience', label: 'Experience', Component: ExperienceLiquidityStep },
  { key: 'property', label: 'Property', Component: PropertyStep },
  { key: 'structure', label: 'Structure', Component: LoanStructureStep },
  { key: 'program', label: 'Program Details', Component: ProgramSpecificStep },
  { key: 'documents', label: 'Documents', Component: DocumentUploadStep },
  { key: 'review', label: 'Review & Submit', Component: ReviewSubmitStep },
];

function defaultProperty(): PropertyData {
  return {
    id: `prop-${typeof window !== 'undefined' ? Date.now() : 0}`,
    isMain: true,
    address: '', unit: '', city: '', state: '', zip: '',
    propertyType: '', numUnits: '', bedrooms: '', bathrooms: '', sqft: '',
    currentAsIsValue: '', estimatedMarketRent: '', occupancyStatus: '',
    annualHazardInsurance: '', annualFloodInsurance: '', annualPropertyTax: '',
    annualHOA: '', currentMortgageBalance: '', currentLender: '',
    monthlyPayment: '', leaseStatus: '',
  };
}

function getDefaultValues(
  initialProgram?: string,
  initialLo?: { depursLo: number; name: string },
): InvestorApplication {
  return {
    loanProgram: (initialProgram as InvestorApplication['loanProgram']) || '',
    dealStage: '',
    loanOfficer: initialLo
      ? { workingWithLo: true, depursLo: initialLo.depursLo, name: initialLo.name }
      : { workingWithLo: null, depursLo: null, name: '' },
    borrower: {
      firstName: '', lastName: '', email: '', phone: '',
      dateOfBirth: '', ssn: '',
      creditRange: '', hasCoBorrower: false,
      coBorrowerName: '', coBorrowerEmail: '', coBorrowerPhone: '',
      coBorrowerCreditRange: '',
    },
    entity: {
      borrowingAs: 'individual', entityName: '', entityType: '',
      stateOfFormation: '', authorizedSigner: '', ownershipPercentage: '',
      ein: '', additionalGuarantors: [],
    },
    experience: {
      completedFlips: false, flipsLast3Years: '', ownsRentals: false,
      rentalsOwned: '', completedNewBuilds: false, newBuildsLast3Years: '',
      isBuilderDeveloper: false, adverseHistory: false, adverseHistoryDetails: '',
    },
    liquidity: [
      { type: 'checking_savings', label: 'Checking/Savings', estimatedBalance: '' },
      { type: 'retirement', label: 'Retirement', estimatedBalance: '' },
      { type: 'stocks_brokerage', label: 'Stocks/Brokerage', estimatedBalance: '' },
      { type: 'other', label: 'Other', estimatedBalance: '' },
    ],
    properties: [defaultProperty()],
    loanRequest: {
      transactionType: '', subjectPropertyId: '', purchaseSubjectAddress: '',
      requestedLoanAmount: '', purchasePrice: '', desiredCashOut: '',
      rehabBudget: '', rehabAmountFinanced: '', arv: '', constructionBudget: '',
      constructionAmountFinanced: '', completedValue: '', fundingTimeline: '',
      closingDate: '', exitStrategy: '', backupExitStrategy: '', prepayStructure: '',
      interestOnly: false,
    },
    documents: [],
    additionalNotes: '',
    consents: {
      accuracyConfirmed: false, investmentPurpose: false, noOwnerOccupancy: false,
      contactConsent: false, electronicComms: false, creditPullConsent: false,
    },
    commercialRe: defaultCommercialRe(),
  };
}

interface SuccessData {
  applicationId: string;
  aiSummary?: string;
  missingDocs: DocumentItem[];
}

interface Props {
  initialProgram?: string;
  initialLo?: { depursLo: number; name: string; slug?: string };
}

export function InvestorApplicationWizard({ initialProgram, initialLo }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [autoSaveState, setAutoSaveState] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [successData, setSuccessData] = useState<SuccessData | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const apiSaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const methods = useForm<InvestorApplication>({
    defaultValues: getDefaultValues(initialProgram, initialLo),
    mode: 'onChange',
  });

  const { watch, setValue, handleSubmit, getValues } = methods;
  const formValues = useWatch({ control: methods.control }) as InvestorApplication;
  const program = formValues.loanProgram;
  const programConfig = program ? PROGRAM_CONFIGS[program as ProgramKey] : null;

  // Load draft from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('qr-investor-draft');
      if (saved) {
        const parsed = JSON.parse(saved) as InvestorApplication;
        Object.entries(parsed).forEach(([key, val]) => {
          setValue(key as keyof InvestorApplication, val as never);
        });
        setAutoSaveState('saved');
      }
    } catch {}
  }, [setValue]);

  // Auto-save to localStorage (debounced 1s)
  useEffect(() => {
    setAutoSaveState('unsaved');
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      try {
        setAutoSaveState('saving');
        const data = getValues();
        localStorage.setItem('qr-investor-draft', JSON.stringify(data));
        setAutoSaveState('saved');
      } catch {
        setAutoSaveState('unsaved');
      }
    }, 1000);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [formValues, getValues]);

  // API save every 30 seconds
  const saveDraftToAPI = useCallback(async () => {
    try {
      const data = getValues();
      if (!data.borrower.email) return;
      await fetch('/api/investor-applications/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    } catch {}
  }, [getValues]);

  useEffect(() => {
    apiSaveTimerRef.current = setInterval(saveDraftToAPI, 30000);
    return () => { if (apiSaveTimerRef.current) clearInterval(apiSaveTimerRef.current); };
  }, [saveDraftToAPI]);

  const handleNext = () => {
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(s => s + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(s => s - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const onSubmit = async (data: InvestorApplication) => {
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const res = await fetch('/api/investor-applications/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result.applicationId) {
        localStorage.removeItem('qr-investor-draft');
        setSuccessData({
          applicationId: result.applicationId,
          aiSummary: result.aiSummary,
          missingDocs: (data.documents || []).filter(d => d.status === 'missing'),
        });
      } else {
        setSubmitError(result.error || 'Submission failed. Please try again.');
      }
    } catch {
      setSubmitError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successData) {
    return (
      <SuccessScreen
        applicationId={successData.applicationId}
        borrowerName={`${formValues.borrower.firstName} ${formValues.borrower.lastName}`.trim() || 'Borrower'}
      />
    );
  }

  const { Component: StepComponent } = WIZARD_STEPS[currentStep];
  const isLastStep = currentStep === WIZARD_STEPS.length - 1;
  const consents = formValues.consents;
  const allConsented = allRequiredConsentsChecked(consents, program || '');

  return (
    <FormProvider {...methods}>
      <div style={{
        minHeight: '100vh',
        background: 'var(--paper)',
      }}>
        <QuestRockTopbar programLabel={programConfig?.shortLabel} autoSaveState={autoSaveState} />

        <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '28px 24px 48px', display: 'flex', gap: '28px', alignItems: 'flex-start' }}>
          {/* Left column */}
          <div style={{ flex: '1 1 0', minWidth: 0 }}>
            <StepRail
              steps={WIZARD_STEPS.map(s => ({ key: s.key, label: s.label }))}
              currentStep={currentStep}
            />

            <form onSubmit={handleSubmit(onSubmit)}>
              {WIZARD_STEPS[currentStep].key === 'loan-officer' ? (
                <LoanOfficerStep prefilledLo={initialLo} />
              ) : (
                <StepComponent />
              )}

              {/* Nav Buttons */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '24px',
              }}>
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={currentStep === 0}
                  className="qr-btn qr-btn-secondary"
                  style={{ opacity: currentStep === 0 ? 0.45 : 1 }}
                >
                  Back
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {submitError && (
                    <p style={{ fontSize: '13px', color: 'var(--clay)', margin: 0 }}>{submitError}</p>
                  )}

                  {!isLastStep ? (
                    <FlowButton
                      text="Continue"
                      variant="green"
                      size="md"
                      onClick={handleNext}
                    />
                  ) : (
                    <FlowButton
                      text={isSubmitting ? 'Submitting…' : 'Submit Application'}
                      variant={allConsented && !isSubmitting ? 'green' : 'dark'}
                      size="md"
                      type="submit"
                      disabled={isSubmitting || !allConsented}
                    />
                  )}
                </div>
              </div>
            </form>
          </div>

          {/* Right column — Loan Ledger */}
          <div className="qr-ledger-panel" style={{ flex: '0 0 360px' }}>
            <LoanLedger />
          </div>
        </div>

        <style>{`
          @media (max-width: 900px) {
            .qr-ledger-panel { display: none !important; }
          }
        `}</style>
      </div>
    </FormProvider>
  );
}
