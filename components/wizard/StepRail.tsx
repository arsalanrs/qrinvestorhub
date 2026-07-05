'use client';

interface Step {
  key: string;
  label: string;
}

interface StepRailProps {
  steps: Step[];
  currentStep: number;
}

export function StepRail({ steps, currentStep }: StepRailProps) {
  const pct = steps.length > 1 ? (currentStep / (steps.length - 1)) * 100 : 0;

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Step {currentStep + 1} of {steps.length}
        </span>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ledger-green)' }}>{steps[currentStep]?.label}</span>
      </div>
      <div style={{ height: 4, background: 'var(--line)', borderRadius: 99, overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: 'var(--ledger-green)',
            borderRadius: 99,
            transition: 'width 0.25s ease',
          }}
        />
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
        {steps.map((step, i) => {
          const done = i < currentStep;
          const active = i === currentStep;
          return (
            <span
              key={step.key}
              style={{
                fontSize: 11,
                fontWeight: active ? 600 : 500,
                color: active ? 'var(--ink)' : done ? 'var(--ledger-green)' : 'var(--slate-light)',
                padding: '4px 10px',
                borderRadius: 99,
                background: active ? 'var(--ledger-green-soft)' : 'transparent',
                border: active ? '1px solid rgba(15,118,110,0.2)' : '1px solid transparent',
              }}
            >
              {step.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
