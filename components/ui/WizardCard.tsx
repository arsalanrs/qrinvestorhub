'use client';

interface WizardCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  style?: React.CSSProperties;
}

export function WizardCard({ children, title, subtitle, style }: WizardCardProps) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid var(--line)',
        borderRadius: 'var(--radius-xl)',
        padding: '28px 32px',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: '16px',
        ...style,
      }}
    >
      {(title || subtitle) && (
        <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid var(--line)' }}>
          {title && (
            <h2
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: 'var(--ink)',
                margin: '0 0 6px',
                letterSpacing: '-0.02em',
                lineHeight: 1.3,
              }}
            >
              {title}
            </h2>
          )}
          {subtitle && (
            <p
              style={{
                fontSize: '14px',
                color: 'var(--slate)',
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
