'use client';

import type { DocumentItem } from '@/types/investor-application';
import { PROGRAM_CONFIGS } from '@/config/loan-programs';
import type { ProgramKey } from '@/config/loan-programs';
import { FlowButton } from '@/components/ui/flow-button';

interface SuccessScreenProps {
  applicationId: string;
  loanProgram: string;
  borrowerName: string;
  missingDocs: DocumentItem[];
  aiSummary?: string;
}

export function SuccessScreen({ applicationId, loanProgram, borrowerName, missingDocs, aiSummary }: SuccessScreenProps) {
  const programConfig = PROGRAM_CONFIGS[loanProgram as ProgramKey];
  const programLabel = programConfig?.label || loanProgram;

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
        {/* Check circle */}
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

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 14px',
          borderRadius: '999px',
          background: 'var(--ledger-green-soft)',
          border: '1px solid rgba(31,111,84,0.2)',
          marginBottom: '16px',
        }}>
          <span style={{ fontSize: '11px', fontFamily: 'IBM Plex Mono, monospace', fontWeight: 700, color: 'var(--ledger-green)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            {programLabel}
          </span>
        </div>

        <h1 style={{
          fontFamily: 'Fraunces, serif',
          fontSize: '30px',
          fontWeight: 700,
          color: 'var(--ink)',
          margin: '0 0 12px',
          letterSpacing: '-0.015em',
        }}>
          Application Submitted
        </h1>

        <p style={{ fontSize: '15.5px', color: 'var(--slate)', margin: '0 0 36px', lineHeight: '1.7' }}>
          Thank you, <strong style={{ color: 'var(--ink)' }}>{borrowerName}</strong>. Your investor loan request has been received and is being reviewed by the QuestRock team.
        </p>

        {/* Application ID */}
        <div style={{
          background: 'var(--paper-dim)',
          border: '1px solid var(--line)',
          borderRadius: '14px',
          padding: '16px 20px',
          marginBottom: '20px',
          textAlign: 'left',
        }}>
          <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--slate-light)', margin: '0 0 6px', fontFamily: 'IBM Plex Mono, monospace', fontWeight: 700 }}>Application ID</p>
          <p style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '14px', color: 'var(--ink)', margin: 0, wordBreak: 'break-all', fontWeight: 500 }}>{applicationId}</p>
        </div>

        {aiSummary && (
          <div style={{
            background: 'var(--blue-soft)',
            border: '1px solid rgba(46,92,138,0.18)',
            borderRadius: '14px',
            padding: '16px 20px',
            marginBottom: '20px',
            textAlign: 'left',
          }}>
            <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--blue)', margin: '0 0 8px', fontFamily: 'IBM Plex Mono, monospace', fontWeight: 700 }}>AI Scenario Summary</p>
            <p style={{ fontSize: '13px', color: 'var(--ink-soft)', margin: 0, lineHeight: '1.65' }}>{aiSummary}</p>
          </div>
        )}

        {missingDocs.filter(d => d.required).length > 0 && (
          <div style={{
            background: 'var(--brass-soft)',
            border: '1px solid rgba(176,141,87,0.28)',
            borderRadius: '14px',
            padding: '16px 20px',
            marginBottom: '20px',
            textAlign: 'left',
          }}>
            <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--brass)', margin: '0 0 10px', fontFamily: 'IBM Plex Mono, monospace', fontWeight: 700 }}>Required Documents Still Needed</p>
            {missingDocs.filter(d => d.required).map(d => (
              <div key={d.id} style={{ fontSize: '13px', color: 'var(--ink-soft)', padding: '4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--brass)', fontWeight: 700 }}>○</span> {d.label}
              </div>
            ))}
            <p style={{ fontSize: '12px', color: 'var(--slate)', marginTop: '10px', marginBottom: 0, fontStyle: 'italic' }}>
              A QuestRock team member will reach out to collect remaining documents.
            </p>
          </div>
        )}

        {/* Next Steps */}
        <div style={{
          display: 'flex',
          gap: '12px',
          padding: '16px 18px',
          background: 'var(--ledger-green-soft)',
          border: '1px solid rgba(31,111,84,0.18)',
          borderRadius: '14px',
          alignItems: 'flex-start',
          marginBottom: '28px',
          textAlign: 'left',
        }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'var(--ledger-green)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 17,
            flexShrink: 0,
          }}>📞</div>
          <div>
            <p style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--ledger-green)', margin: '0 0 3px' }}>What Happens Next</p>
            <p style={{ fontSize: '13px', color: 'var(--ink-soft)', margin: 0, lineHeight: '1.6' }}>
              A QuestRock loan officer will review your application and contact you within 1 business day to discuss terms and next steps.
            </p>
          </div>
        </div>

        <FlowButton
          text="Back to Investor Hub"
          variant="green"
          size="md"
          onClick={() => { window.location.href = '/investor-hub'; }}
        />
      </div>
    </div>
  );
}
