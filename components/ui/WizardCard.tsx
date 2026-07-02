'use client';

interface WizardCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  style?: React.CSSProperties;
}

export function WizardCard({ children, title, subtitle, style }: WizardCardProps) {
  return (
    <div style={{
      background: '#fff',
      border: '1.5px solid var(--line)',
      borderRadius: '22px',
      padding: '32px 36px 28px',
      boxShadow: '0 1px 3px rgba(20,33,61,0.04), 0 6px 24px rgba(20,33,61,0.05)',
      marginBottom: '20px',
      ...style,
    }}>
      {(title || subtitle) && (
        <div style={{ marginBottom: 28 }}>
          {title && (
            <h2 style={{
              fontFamily: 'Fraunces, serif',
              fontSize: '22px',
              fontWeight: 700,
              color: 'var(--ink)',
              margin: '0 0 8px',
              letterSpacing: '-0.02em',
              lineHeight: 1.25,
            }}>
              {title}
            </h2>
          )}
          {subtitle && (
            <p style={{
              fontSize: '14px',
              color: 'var(--slate)',
              margin: 0,
              lineHeight: 1.65,
              fontWeight: 400,
            }}>
              {subtitle}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
