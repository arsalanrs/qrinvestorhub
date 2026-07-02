'use client';

import { useFieldArray, useFormContext } from 'react-hook-form';
import type { InvestorApplication, PropertyData } from '@/types/investor-application';
import { PropertyCard } from './PropertyCard';
import { fmt, toNum } from '@/lib/loan-calculations';

function blankProperty(index: number): PropertyData {
  return {
    id: `prop-${Date.now()}-${index}`,
    isMain: index === 0,
    address: '', unit: '', city: '', state: '', zip: '',
    propertyType: '', numUnits: '', bedrooms: '', bathrooms: '', sqft: '',
    currentAsIsValue: '', estimatedMarketRent: '', occupancyStatus: '',
    annualHazardInsurance: '', annualFloodInsurance: '', annualPropertyTax: '',
    annualHOA: '', currentMortgageBalance: '', currentLender: '',
    monthlyPayment: '', leaseStatus: '',
  };
}

export function PortfolioBuilder() {
  const { control, watch } = useFormContext<InvestorApplication>();
  const { fields, append, remove } = useFieldArray({ control, name: 'properties' });
  const properties = watch('properties');

  const totalValue = properties.reduce((s, p) => s + toNum(p.currentAsIsValue), 0);
  const totalRent = properties.reduce((s, p) => s + toNum(p.estimatedMarketRent), 0);
  const totalDebt = properties.reduce((s, p) => s + toNum(p.currentMortgageBalance), 0);
  const equity = totalValue - totalDebt;

  return (
    <div>
      {fields.map((field, index) => (
        <PropertyCard
          key={field.id}
          index={index}
          showRemove={fields.length > 1}
          onRemove={() => remove(index)}
        />
      ))}

      <button
        type="button"
        onClick={() => append(blankProperty(fields.length))}
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
          marginBottom: '20px',
        }}
      >
        + Add Another Property
      </button>

      {properties.length > 0 && (
        <div style={{
          background: 'var(--ink)',
          borderRadius: '4px',
          padding: '16px 20px',
          color: '#fff',
        }}>
          <p style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--slate-light)', margin: '0 0 12px', fontFamily: 'IBM Plex Mono, monospace' }}>
            Portfolio Summary — {fields.length} {fields.length === 1 ? 'Property' : 'Properties'}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px' }}>
            {[
              { label: 'Total Value', val: fmt(totalValue) },
              { label: 'Total Debt', val: fmt(totalDebt) },
              { label: 'Net Equity', val: fmt(equity) },
              { label: 'Monthly Rent', val: fmt(totalRent) },
            ].map(({ label, val }) => (
              <div key={label}>
                <p style={{ fontSize: '11px', color: 'var(--slate-light)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                <p style={{ fontSize: '16px', fontFamily: 'IBM Plex Mono, monospace', fontWeight: 600, margin: 0 }}>{val}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
