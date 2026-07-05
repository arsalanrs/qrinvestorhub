'use client';

interface ChoiceCardProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  selected: boolean;
  onClick: () => void;
  badge?: string;
  disabled?: boolean;
  compact?: boolean;
}

export function ChoiceCard({
  title,
  description,
  selected,
  onClick,
  badge,
  disabled,
  compact,
}: ChoiceCardProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: compact ? 6 : 8,
        padding: compact ? '12px 14px' : '16px 18px',
        border: selected ? '2px solid var(--ledger-green)' : '1px solid var(--line)',
        borderRadius: 'var(--radius-lg)',
        background: selected ? 'var(--ledger-green-soft)' : '#fff',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        textAlign: 'left',
        width: '100%',
        transition: 'border-color 0.15s, background 0.15s, box-shadow 0.15s',
        outline: 'none',
        boxShadow: selected ? 'var(--shadow-sm)' : 'none',
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', width: '100%', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span
              style={{
                fontWeight: 600,
                fontSize: compact ? 13 : 14,
                color: 'var(--ink)',
                lineHeight: 1.35,
              }}
            >
              {title}
            </span>
            {badge && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-pill)',
                  background: 'var(--paper-dim)',
                  color: 'var(--ink-500)',
                  letterSpacing: '0.02em',
                  textTransform: 'uppercase',
                }}
              >
                {badge}
              </span>
            )}
          </div>
          {description && !compact && (
            <p
              style={{
                fontSize: 13,
                color: 'var(--slate)',
                lineHeight: 1.55,
                margin: '6px 0 0',
              }}
            >
              {description}
            </p>
          )}
        </div>
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: '50%',
            border: selected ? '5px solid var(--ledger-green)' : '2px solid #cbd5e1',
            background: '#fff',
            flexShrink: 0,
            marginTop: 2,
          }}
        />
      </div>
    </button>
  );
}
