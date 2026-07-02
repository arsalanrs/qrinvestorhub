'use client';

import { useState } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import type { InvestorApplication } from '@/types/investor-application';
import { CurrencyInput } from './CurrencyInput';

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC',
];

interface PropertyCardProps {
  index: number;
  onRemove?: () => void;
  showRemove?: boolean;
}

const inputStyle = {
  width: '100%',
  padding: '8px 10px',
  border: '1.5px solid var(--line)',
  borderRadius: '2px',
  fontSize: '13px',
  fontFamily: 'Inter, sans-serif',
  color: 'var(--ink)',
  outline: 'none',
  background: '#fff',
};

const labelStyle = {
  display: 'block' as const,
  fontSize: '12px',
  fontWeight: 500 as const,
  color: 'var(--slate)',
  marginBottom: '4px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
};

export function PropertyCard({ index, onRemove, showRemove }: PropertyCardProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { register, watch, control, setValue } = useFormContext<InvestorApplication>();
  const address = watch(`properties.${index}.address`);
  const occupancy = watch(`properties.${index}.occupancyStatus`);

  const prefix = `properties.${index}` as const;

  return (
    <div style={{
      border: '1.5px solid var(--line)',
      borderRadius: '4px',
      background: '#fff',
      marginBottom: '16px',
      overflow: 'hidden',
    }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px',
          background: 'var(--paper-dim)',
          borderBottom: collapsed ? 'none' : '1px solid var(--line)',
          cursor: 'pointer',
        }}
        onClick={() => setCollapsed(!collapsed)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink-soft)' }}>
            Property {index + 1}
            {index === 0 && <span style={{ marginLeft: '8px', fontSize: '11px', color: 'var(--ledger-green)', fontWeight: 600 }}>PRIMARY</span>}
          </span>
          {address && (
            <span style={{ fontSize: '13px', color: 'var(--slate)' }}>{address}</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {showRemove && onRemove && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              style={{ fontSize: '12px', color: 'var(--clay)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
            >
              Remove
            </button>
          )}
          <span style={{ color: 'var(--slate-light)', fontSize: '12px' }}>{collapsed ? '▼' : '▲'}</span>
        </div>
      </div>

      {!collapsed && (
        <div style={{ padding: '20px' }}>
          {/* Address */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={labelStyle}>Street Address *</label>
              <input {...register(`${prefix}.address`)} placeholder="123 Main St" style={inputStyle} />
            </div>
            <div style={{ width: '100px' }}>
              <label style={labelStyle}>Unit</label>
              <input {...register(`${prefix}.unit`)} placeholder="Apt 2" style={inputStyle} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={labelStyle}>City *</label>
              <input {...register(`${prefix}.city`)} placeholder="City" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>State</label>
              <select {...register(`${prefix}.state`)} style={inputStyle}>
                <option value="">—</option>
                {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>ZIP</label>
              <input {...register(`${prefix}.zip`)} placeholder="00000" style={inputStyle} />
            </div>
          </div>

          {/* Property Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={labelStyle}>Property Type *</label>
              <select {...register(`${prefix}.propertyType`)} style={inputStyle}>
                <option value="">Select...</option>
                <option value="single_family">Single Family</option>
                <option value="two_to_four_unit">2-4 Unit</option>
                <option value="multifamily_5plus">Multifamily 5+</option>
                <option value="condo">Condo</option>
                <option value="townhome">Townhome</option>
                <option value="mixed_use">Mixed Use</option>
                <option value="commercial">Commercial</option>
                <option value="land">Land</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Units</label>
              <input {...register(`${prefix}.numUnits`)} type="number" min="1" placeholder="1" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Sq Ft</label>
              <input {...register(`${prefix}.sqft`)} type="number" placeholder="1,500" style={inputStyle} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={labelStyle}>Beds</label>
              <input {...register(`${prefix}.bedrooms`)} type="number" min="0" placeholder="3" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Baths</label>
              <input {...register(`${prefix}.bathrooms`)} type="number" min="0" step="0.5" placeholder="2" style={inputStyle} />
            </div>
          </div>

          {/* Financials */}
          <div style={{ borderTop: '1px solid var(--line)', paddingTop: '16px', marginBottom: '16px' }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px' }}>Financials</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Controller
                control={control}
                name={`${prefix}.currentAsIsValue`}
                render={({ field }) => (
                  <CurrencyInput label="Current / As-Is Value" value={field.value} onChange={field.onChange} />
                )}
              />
              <Controller
                control={control}
                name={`${prefix}.estimatedMarketRent`}
                render={({ field }) => (
                  <CurrencyInput label="Est. Monthly Market Rent" value={field.value} onChange={field.onChange} placeholder="2,000/mo" />
                )}
              />
              <Controller
                control={control}
                name={`${prefix}.currentMortgageBalance`}
                render={({ field }) => (
                  <CurrencyInput label="Current Mortgage Balance" value={field.value} onChange={field.onChange} />
                )}
              />
              <div>
                <label style={labelStyle}>Current Lender</label>
                <input {...register(`${prefix}.currentLender`)} placeholder="Lender name" style={inputStyle} />
              </div>
            </div>
          </div>

          {/* Annual Expenses */}
          <div style={{ borderTop: '1px solid var(--line)', paddingTop: '16px', marginBottom: '16px' }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px' }}>Annual Expenses</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Controller control={control} name={`${prefix}.annualPropertyTax`} render={({ field }) => (
                <CurrencyInput label="Annual Property Tax" value={field.value} onChange={field.onChange} />
              )} />
              <Controller control={control} name={`${prefix}.annualHazardInsurance`} render={({ field }) => (
                <CurrencyInput label="Annual Hazard Insurance" value={field.value} onChange={field.onChange} />
              )} />
              <Controller control={control} name={`${prefix}.annualFloodInsurance`} render={({ field }) => (
                <CurrencyInput label="Annual Flood Insurance" value={field.value} onChange={field.onChange} />
              )} />
              <Controller control={control} name={`${prefix}.annualHOA`} render={({ field }) => (
                <CurrencyInput label="Annual HOA" value={field.value} onChange={field.onChange} />
              )} />
            </div>
          </div>

          {/* Occupancy */}
          <div style={{ borderTop: '1px solid var(--line)', paddingTop: '16px' }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px' }}>Occupancy & Lease</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Occupancy Status</label>
                <select {...register(`${prefix}.occupancyStatus`)} style={inputStyle}>
                  <option value="">Select...</option>
                  <option value="vacant">Vacant</option>
                  <option value="tenant_occupied">Tenant Occupied</option>
                  <option value="owner_occupied">Owner Occupied</option>
                  <option value="partially_occupied">Partially Occupied</option>
                </select>
                {occupancy === 'owner_occupied' && (
                  <p style={{ fontSize: '12px', color: 'var(--clay)', marginTop: '4px' }}>
                    ⚠ Investment programs require non-owner-occupied properties.
                  </p>
                )}
              </div>
              <div>
                <label style={labelStyle}>Lease Status</label>
                <select {...register(`${prefix}.leaseStatus`)} style={inputStyle}>
                  <option value="">Select...</option>
                  <option value="leased">Leased</option>
                  <option value="month_to_month">Month-to-Month</option>
                  <option value="vacant">Vacant</option>
                  <option value="short_term_rental">Short-Term Rental</option>
                  <option value="market_rent_only">Market Rent Only (no tenant)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
