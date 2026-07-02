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

export function ChoiceCard({ title, description, icon, selected, onClick, badge, disabled, compact }: ChoiceCardProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: compact ? 8 : 12,
        padding: compact ? '14px 16px' : '18px 18px 16px',
        border: selected ? '2.5px solid var(--ink)' : '1.5px solid var(--line)',
        borderRadius: '16px',
        background: selected ? 'var(--paper-dim)' : '#fff',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        textAlign: 'left',
        width: '100%',
        transition: 'border-color 0.15s, background 0.15s, box-shadow 0.15s, transform 0.15s',
        outline: 'none',
        boxShadow: selected
          ? 'none'
          : '0 1px 3px rgba(20,33,61,0.04)',
        transform: 'translateY(0)',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        if (!selected && !disabled) {
          e.currentTarget.style.borderColor = 'var(--slate)';
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(20,33,61,0.08)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }
      }}
      onMouseLeave={(e) => {
        if (!selected && !disabled) {
          e.currentTarget.style.borderColor = 'var(--line)';
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(20,33,61,0.04)';
          e.currentTarget.style.transform = 'translateY(0)';
        }
      }}
    >
      {/* Selected checkmark */}
      {selected && (
        <div style={{
          position: 'absolute',
          top: 12, right: 12,
          width: 22, height: 22,
          borderRadius: '50%',
          background: 'var(--ink)',
          color: '#fff',
          fontSize: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700,
          flexShrink: 0,
        }}>✓</div>
      )}

      {/* Icon */}
      {icon && (
        <div style={{
          width: compact ? 36 : 46,
          height: compact ? 36 : 46,
          borderRadius: compact ? 10 : 12,
          background: selected ? 'rgba(20,33,61,0.07)' : 'var(--paper-dim)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: compact ? 18 : 22,
          flexShrink: 0,
          transition: 'background 0.15s',
        }}>
          {icon}
        </div>
      )}

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
          <span style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 700,
            fontSize: compact ? 13 : 14,
            color: 'var(--ink)',
            lineHeight: 1.3,
          }}>
            {title}
          </span>
          {badge && (
            <span style={{
              fontSize: 10,
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '999px',
              background: 'var(--brass-soft)',
              color: 'var(--brass)',
              fontFamily: 'IBM Plex Mono, monospace',
              letterSpacing: '0.03em',
            }}>
              {badge}
            </span>
          )}
        </div>
        {description && !compact && (
          <p style={{
            fontSize: 13,
            color: 'var(--slate)',
            lineHeight: 1.55,
            margin: '5px 0 0',
            fontFamily: 'Inter, sans-serif',
          }}>
            {description}
          </p>
        )}
      </div>
    </button>
  );
}
