'use client';

interface YesNoToggleProps {
  value: boolean | null;
  onChange: (val: boolean) => void;
  label?: string;
  labels?: [string, string];
}

export function YesNoToggle({ value, onChange, label, labels = ['Yes', 'No'] }: YesNoToggleProps) {
  return (
    <div>
      {label && (
        <p style={{
          fontSize: '13.5px',
          fontWeight: 600,
          color: 'var(--ink)',
          marginBottom: '10px',
          marginTop: 0,
          lineHeight: '1.4',
        }}>
          {label}
        </p>
      )}
      <div style={{
        display: 'inline-flex',
      borderRadius: '12px',
      border: '1.5px solid var(--line)',
      overflow: 'hidden',
      background: 'var(--paper-dim)',
      gap: 0,
    }}>
      {([true, false] as const).map((v, i) => {
        const isSelected = value === v;
        const label = labels[i];
        return (
          <button
            key={String(v)}
            type="button"
            onClick={() => onChange(v)}
            style={{
              padding: '9px 22px',
              fontSize: '13.5px',
              fontWeight: 600,
              fontFamily: 'Inter, sans-serif',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.18s ease',
              background: isSelected
                ? (v ? 'linear-gradient(135deg, var(--ledger-green), #0f6d49)' : 'linear-gradient(135deg, var(--clay), #8f3820)')
                : 'transparent',
              color: isSelected ? '#fff' : 'var(--slate)',
              boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
              position: 'relative',
              zIndex: isSelected ? 1 : 0,
            }}
          >
            {label}
          </button>
        );
      })}
      </div>
    </div>
  );
}
