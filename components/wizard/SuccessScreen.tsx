'use client';

import { FlowButton } from '@/components/ui/flow-button';

interface SuccessScreenProps {
  applicationId: string;
  borrowerName: string;
}

export function SuccessScreen({ applicationId, borrowerName }: SuccessScreenProps) {
  return (
    <div style={{
      minHeight: '100vh',
      background: `
        radial-gradient(900px 420px at 8% -8%, rgba(176,141,87,0.08), transparent 60%),
        radial-gradient(1100px 520px at 100% 0%, rgba(31,111,84,0.06), transparent 55%),
        #F7F5F0
      `,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
    }}>
      <div style={{
        maxWidth: '640px',
        width: '100%',
        background: '#fff',
        border: '1px solid var(--line)',
        borderRadius: '24px',
        padding: '52px 48px',
        boxShadow: '0 8px 32px rgba(20,33,61,0.09)',
        textAlign: 'center',
      }}>
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--ledger-green), #0f6d49)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 28px',
          fontSize: '30px',
          color: '#fff',
          boxShadow: '0 8px 24px rgba(31,111,84,0.3)',
        }}>
          ✓
        </div>

        <h1 style={{
          fontFamily: 'Fraunces, serif',
          fontSize: '30px',
          fontWeight: 700,
          color: 'var(--ink)',
          margin: '0 0 12px',
          letterSpacing: '-0.015em',
        }}>
          Welcome to the QuestRock Investor Hub
        </h1>

        <p style={{ fontSize: '15.5px', color: 'var(--slate)', margin: '0 0 36px', lineHeight: '1.7' }}>
          Thank you, <strong style={{ color: 'var(--ink)' }}>{borrowerName}</strong>. Your investor loan request has been received and is being reviewed by the QuestRock team.
        </p>

        <div style={{
          background: 'var(--paper-dim)',
          border: '1px solid var(--line)',
          borderRadius: '14px',
          padding: '16px 20px',
          marginBottom: '28px',
          textAlign: 'left',
        }}>
          <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--slate-light)', margin: '0 0 6px', fontFamily: 'IBM Plex Mono, monospace', fontWeight: 700 }}>Application ID</p>
          <p style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '14px', color: 'var(--ink)', margin: 0, wordBreak: 'break-all', fontWeight: 500 }}>{applicationId}</p>
        </div>

        <p style={{ fontSize: '14px', color: 'var(--slate)', margin: '0 0 28px', lineHeight: 1.6 }}>
          Check your email for a portal invite, or sign in anytime with a secure magic link sent to the email on your application.
        </p>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          alignItems: 'center',
        }}>
          <FlowButton
            text="Open Investor Portal"
            variant="brass"
            size="md"
            onClick={() => { window.location.href = '/portal'; }}
          />
          <FlowButton
            text="View This Application"
            variant="green"
            size="md"
            onClick={() => { window.location.href = `/portfolio/${applicationId}`; }}
          />
        </div>
      </div>
    </div>
  );
}
