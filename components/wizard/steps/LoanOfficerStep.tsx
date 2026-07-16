'use client';

import { useEffect, useState } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import type { InvestorApplication } from '@/types/investor-application';
import { WizardCard } from '@/components/ui/WizardCard';
import { YesNoToggle } from '@/components/ui/YesNoToggle';

type LoOption = {
  name: string;
  depursLo: number;
  slug?: string;
};

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius)',
  fontSize: '14px',
  color: 'var(--ink)',
  outline: 'none',
  background: '#fff',
};

interface Props {
  prefilledLo?: LoOption | null;
}

export function LoanOfficerStep({ prefilledLo }: Props) {
  const { control, watch, setValue } = useFormContext<InvestorApplication>();
  const workingWithLo = watch('loanOfficer.workingWithLo');
  const [roster, setRoster] = useState<LoOption[]>([]);

  useEffect(() => {
    fetch('/api/public/loan-officers')
      .then(res => res.json())
      .then(json => setRoster(json.loanOfficers || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (prefilledLo) {
      setValue('loanOfficer.workingWithLo', true);
      setValue('loanOfficer.depursLo', prefilledLo.depursLo);
      setValue('loanOfficer.name', prefilledLo.name);
    }
  }, [prefilledLo, setValue]);

  return (
    <WizardCard
      title="Are you working with a loan officer?"
      subtitle="If a QuestRock loan officer referred you, select their name so we can route your application correctly."
    >
      <div style={{ marginBottom: '20px' }}>
        <Controller
          control={control}
          name="loanOfficer.workingWithLo"
          render={({ field }) => (
            <YesNoToggle
              value={field.value ?? null}
              onChange={val => {
                field.onChange(val);
                if (!val) {
                  setValue('loanOfficer.depursLo', null);
                  setValue('loanOfficer.name', '');
                }
              }}
            />
          )}
        />
      </div>

      {workingWithLo === true && (
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--ink)' }}>
            Loan officer
          </label>
          <Controller
            control={control}
            name="loanOfficer.depursLo"
            render={({ field }) => (
              <select
                style={inputStyle}
                value={field.value ?? ''}
                onChange={e => {
                  const depursLo = e.target.value ? Number(e.target.value) : null;
                  field.onChange(depursLo);
                  const match = roster.find(lo => lo.depursLo === depursLo);
                  setValue('loanOfficer.name', match?.name || '');
                }}
              >
                <option value="">Select a loan officer…</option>
                {roster.map(lo => (
                  <option key={lo.depursLo} value={lo.depursLo}>{lo.name}</option>
                ))}
              </select>
            )}
          />
          {prefilledLo && (
            <p style={{ fontSize: '12px', color: 'var(--slate)', marginTop: '10px', marginBottom: 0 }}>
              Pre-selected from your referral link ({prefilledLo.name}).
            </p>
          )}
        </div>
      )}

      {workingWithLo === false && (
        <p style={{ fontSize: '13px', color: 'var(--slate)', margin: 0 }}>
          No problem — we&apos;ll assign a loan officer based on your deal size and program.
        </p>
      )}
    </WizardCard>
  );
}
