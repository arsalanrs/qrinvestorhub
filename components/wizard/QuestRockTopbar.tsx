'use client';

import { AutoSaveIndicator } from './AutoSaveIndicator';

interface QuestRockTopbarProps {
  programLabel?: string;
  autoSaveState?: 'saved' | 'saving' | 'unsaved';
}

export function QuestRockTopbar({ programLabel, autoSaveState }: QuestRockTopbarProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 32px',
      height: '60px',
      background: 'linear-gradient(145deg, rgba(31,181,119,0.98) 0%, rgba(8,127,122,0.98) 46%, rgba(23,76,62,1) 100%)',
      borderBottom: '1px solid rgba(255,255,255,0.14)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      boxShadow: '0 4px 18px rgba(14,43,30,0.22)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Logo mark */}
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 9,
          background: 'rgba(255,255,255,0.15)',
          border: '1px solid rgba(255,255,255,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Fraunces, serif',
          fontWeight: 700,
          fontSize: 16,
          color: '#fff',
          letterSpacing: '-0.01em',
          flexShrink: 0,
        }}>
          Q
        </div>

        <div>
          <div style={{
            fontFamily: 'Fraunces, serif',
            fontWeight: 600,
            fontSize: '16px',
            color: '#fff',
            letterSpacing: '-0.01em',
            lineHeight: 1.1,
          }}>
            QuestRock
          </div>
          <div style={{
            fontSize: '10px',
            color: 'rgba(255,255,255,0.75)',
            fontFamily: 'IBM Plex Mono, monospace',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            lineHeight: 1,
          }}>
            Investor Hub
          </div>
        </div>

        {programLabel && (
          <span style={{
            fontSize: '11px',
            fontWeight: 600,
            padding: '4px 10px',
            borderRadius: '999px',
            background: 'rgba(255,255,255,0.16)',
            border: '1px solid rgba(255,255,255,0.24)',
            color: '#fff',
            fontFamily: 'IBM Plex Mono, monospace',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            backdropFilter: 'blur(8px)',
          }}>
            {programLabel}
          </span>
        )}
      </div>

      {autoSaveState && <AutoSaveIndicator state={autoSaveState} />}
    </div>
  );
}
