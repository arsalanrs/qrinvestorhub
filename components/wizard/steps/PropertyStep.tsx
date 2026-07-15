'use client';

import { useFormContext, useFieldArray } from 'react-hook-form';
import type { InvestorApplication, PropertyData } from '@/types/investor-application';
import { WizardCard } from '@/components/ui/WizardCard';
import { PropertyCard } from '@/components/ui/PropertyCard';
import { PortfolioBuilder } from '@/components/ui/PortfolioBuilder';
import { CommercialPropertyCard } from '@/components/wizard/commercial/CommercialPropertyCard';

function blankProperty(): PropertyData {
  return {
    id: `prop-${Date.now()}`,
    isMain: false,
    address: '', unit: '', city: '', state: '', zip: '',
    propertyType: '', numUnits: '', bedrooms: '', bathrooms: '', sqft: '',
    currentAsIsValue: '', estimatedMarketRent: '', occupancyStatus: '',
    annualHazardInsurance: '', annualFloodInsurance: '', annualPropertyTax: '',
    annualHOA: '', currentMortgageBalance: '', currentLender: '',
    monthlyPayment: '', leaseStatus: '',
  };
}

export function PropertyStep() {
  const { watch, control } = useFormContext<InvestorApplication>();
  const { fields, append, remove } = useFieldArray({ control, name: 'properties' });
  const program = watch('loanProgram');

  if (program === 'commercial_re') {
    return (
      <WizardCard
        title="Commercial Property"
        subtitle="Subject property details for your commercial real estate loan request."
      >
        <CommercialPropertyCard />
      </WizardCard>
    );
  }

  if (program === 'blanket_portfolio') {
    return (
      <WizardCard
        title="Portfolio Properties"
        subtitle="Add all properties in your portfolio that will be included in the blanket loan. Minimum 2 properties required."
      >
        <PortfolioBuilder />
      </WizardCard>
    );
  }

  const titleMap: Record<string, { title: string; subtitle: string }> = {
    dscr: {
      title: 'Rental Property Details',
      subtitle: 'Tell us about the property. Accurate values help us calculate your DSCR and identify the best loan structure.',
    },
    rehab: {
      title: 'Subject Property',
      subtitle: 'Provide details about the property you are purchasing or rehabbing.',
    },
    construction: {
      title: 'Land / Subject Property',
      subtitle: 'Provide information about the land or subject property for construction.',
    },
    bridge: {
      title: 'Subject Property',
      subtitle: 'Details about the property being financed with this bridge loan.',
    },
  };

  const { title, subtitle } = titleMap[program] || { title: 'Subject Property', subtitle: 'Tell us about the property.' };

  return (
    <WizardCard title={title} subtitle={subtitle}>
      {fields.map((field, index) => (
        <PropertyCard
          key={field.id}
          index={index}
          showRemove={fields.length > 1}
          onRemove={() => remove(index)}
        />
      ))}

      {program !== 'construction' && (
        <button
          type="button"
          onClick={() => append(blankProperty())}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            border: '1.5px dashed var(--line)',
            borderRadius: '4px',
            background: 'transparent',
            color: 'var(--blue)',
            fontSize: '13px',
            fontWeight: 500,
            fontFamily: 'Inter, sans-serif',
            cursor: 'pointer',
            width: '100%',
            justifyContent: 'center',
          }}
        >
          + Add Additional Collateral Property
        </button>
      )}
    </WizardCard>
  );
}
