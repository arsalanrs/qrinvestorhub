'use client';

import { useFormContext, Controller } from 'react-hook-form';
import type { InvestorApplication } from '@/types/investor-application';
import { RhfDictationInput } from '@/components/ui/RhfDictationInput';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { YesNoToggle } from '@/components/ui/YesNoToggle';
import { creGrid2, creInputStyle, creLabelStyle, CreDivider, CreSectionTitle } from './form-styles';

export function CommercialPropertyCard() {
  const { control, register, watch } = useFormContext<InvestorApplication>();
  const prop = watch('properties.0');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <CreSectionTitle>Property Location</CreSectionTitle>
      <div style={creGrid2}>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={creLabelStyle}>Property address</label>
          <RhfDictationInput control={control} name="properties.0.address" placeholder="Street address" style={creInputStyle} />
        </div>
        <div>
          <label style={creLabelStyle}>City</label>
          <RhfDictationInput control={control} name="properties.0.city" style={creInputStyle} />
        </div>
        <div>
          <label style={creLabelStyle}>State</label>
          <input {...register('properties.0.state')} style={creInputStyle} maxLength={2} placeholder="ST" />
        </div>
        <div>
          <label style={creLabelStyle}>ZIP</label>
          <input {...register('properties.0.zip')} style={creInputStyle} />
        </div>
      </div>

      <CreDivider />
      <CreSectionTitle>Commercial Property Details</CreSectionTitle>
      <div style={creGrid2}>
        <div>
          <label style={creLabelStyle}>Year built</label>
          <input {...register('commercialRe.yearBuilt')} type="number" style={creInputStyle} placeholder="e.g. 1998" />
        </div>
        <div>
          <label style={creLabelStyle}>Total square footage</label>
          <input {...register('commercialRe.totalSqft')} style={creInputStyle} placeholder="e.g. 12500" />
        </div>
        <div>
          <label style={creLabelStyle}>Lot size / acreage</label>
          <input {...register('commercialRe.lotSizeAcres')} style={creInputStyle} placeholder="e.g. 1.2 acres" />
        </div>
        <div>
          <label style={creLabelStyle}>Number of buildings</label>
          <input {...register('commercialRe.numBuildings')} type="number" min="1" style={creInputStyle} />
        </div>
        <div>
          <label style={creLabelStyle}>Number of units or tenant spaces</label>
          <input {...register('commercialRe.numUnitsOrSpaces')} style={creInputStyle} />
        </div>
        <div>
          <label style={creLabelStyle}>Current occupancy %</label>
          <input {...register('commercialRe.occupancyPct')} style={creInputStyle} placeholder="e.g. 92" />
        </div>
        <div>
          <label style={creLabelStyle}>Estimated current value</label>
          <Controller
            control={control}
            name="properties.0.currentAsIsValue"
            render={({ field }) => <CurrencyInput value={field.value} onChange={field.onChange} placeholder="0" />}
          />
        </div>
        <div>
          <label style={creLabelStyle}>Purchase price (if applicable)</label>
          <Controller
            control={control}
            name="loanRequest.purchasePrice"
            render={({ field }) => <CurrencyInput value={field.value} onChange={field.onChange} placeholder="0" />}
          />
        </div>
        <div>
          <label style={creLabelStyle}>Is the property currently operating?</label>
          <Controller
            control={control}
            name="commercialRe.isOperating"
            render={({ field }) => <YesNoToggle value={field.value ?? false} onChange={field.onChange} />}
          />
        </div>
        <div>
          <label style={creLabelStyle}>Is the property stabilized?</label>
          <p style={{ fontSize: '11px', color: 'var(--slate-light)', margin: '0 0 6px', lineHeight: 1.4 }}>
            Generally means substantially occupied and producing consistent income.
          </p>
          <Controller
            control={control}
            name="commercialRe.isStabilized"
            render={({ field }) => <YesNoToggle value={field.value ?? false} onChange={field.onChange} />}
          />
        </div>
      </div>

      {prop?.address && (
        <p style={{ fontSize: '12px', color: 'var(--slate)', margin: 0 }}>
          Subject: {[prop.address, prop.city, prop.state, prop.zip].filter(Boolean).join(', ')}
        </p>
      )}
    </div>
  );
}
