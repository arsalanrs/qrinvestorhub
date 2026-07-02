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
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 0,
      marginBottom: '28px',
      overflowX: 'auto',
      paddingBottom: '2px',
    }}>
      {steps.map((step, i) => {
        const isCompleted = i < currentStep;
        const isActive    = i === currentStep;
        const isLast      = i === steps.length - 1;

        return (
          <div key={step.key} style={{ display: 'flex', alignItems: 'flex-start', flexShrink: 0 }}>
            {/* Step item */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '7px' }}>

              {/* Bubble */}
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontFamily: 'IBM Plex Mono, monospace',
                fontWeight: 700,
                background: isCompleted
                  ? 'linear-gradient(135deg, #22a86a, #0f6d49)'
                  : isActive
                  ? 'linear-gradient(135deg, #B08D57, #8f6e3c)'
                  : 'var(--paper-dim)',
                color: isCompleted || isActive ? '#fff' : 'var(--slate-light)',
                boxShadow: isActive
                  ? '0 0 0 4px rgba(176,141,87,0.22), 0 2px 8px rgba(176,141,87,0.3)'
                  : isCompleted
                  ? '0 2px 8px rgba(31,111,84,0.25)'
                  : 'none',
                transition: 'all 0.25s ease',
                flexShrink: 0,
              }}>
                {isCompleted ? '✓' : String(i + 1)}
              </div>

              {/* Label */}
              <span style={{
                fontSize: '10px',
                fontFamily: 'Inter, sans-serif',
                fontWeight: isActive ? 700 : 400,
                color: isActive
                  ? 'var(--ink)'
                  : isCompleted
                  ? 'var(--ledger-green)'
                  : 'var(--slate-light)',
                whiteSpace: 'nowrap',
                textAlign: 'center',
                maxWidth: '70px',
                lineHeight: '1.3',
                letterSpacing: isActive ? '0.01em' : 0,
                transition: 'color 0.2s',
              }}>
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {!isLast && (
              <div style={{
                width: '28px',
                height: '1.5px',
                background: isCompleted
                  ? 'linear-gradient(90deg, #22a86a, #62c99a)'
                  : 'var(--line)',
                margin: '0 3px',
                marginTop: '15px',
                flexShrink: 0,
                transition: 'background 0.25s',
                borderRadius: '1px',
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
