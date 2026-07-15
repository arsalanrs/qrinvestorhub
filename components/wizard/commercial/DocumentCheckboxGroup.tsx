'use client';

import { useFormContext } from 'react-hook-form';
import type { InvestorApplication } from '@/types/investor-application';

type Option = { value: string; label: string };

export function DocumentCheckboxGroup({
  name,
  options,
}: {
  name: 'commercialRe.propertyDocumentsAvailable' | 'commercialRe.businessDocumentsAvailable';
  options: Option[];
}) {
  const { watch, setValue } = useFormContext<InvestorApplication>();
  const selected = (watch(name) as string[] | undefined) || [];

  const toggle = (value: string) => {
    const next = selected.includes(value)
      ? selected.filter(v => v !== value)
      : [...selected, value];
    setValue(name, next, { shouldDirty: true });
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
      {options.map(opt => (
        <label
          key={opt.value}
          style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'flex-start',
            padding: '10px 12px',
            border: `1.5px solid ${selected.includes(opt.value) ? 'var(--ledger-green)' : 'var(--line)'}`,
            borderRadius: '4px',
            background: selected.includes(opt.value) ? 'var(--ledger-green-soft)' : '#fff',
            cursor: 'pointer',
            fontSize: '13px',
            lineHeight: 1.45,
          }}
        >
          <input
            type="checkbox"
            checked={selected.includes(opt.value)}
            onChange={() => toggle(opt.value)}
            style={{ marginTop: 2 }}
          />
          <span>{opt.label}</span>
        </label>
      ))}
    </div>
  );
}
