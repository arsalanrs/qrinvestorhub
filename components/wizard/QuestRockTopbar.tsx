'use client';

import Link from 'next/link';
import { AutoSaveIndicator } from './AutoSaveIndicator';

interface QuestRockTopbarProps {
  programLabel?: string;
  autoSaveState?: 'saved' | 'saving' | 'unsaved';
}

export function QuestRockTopbar({ programLabel, autoSaveState }: QuestRockTopbarProps) {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        height: 56,
        background: 'linear-gradient(135deg, #0f766e 0%, #115e59 100%)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        color: '#fff',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Link href="/investor-hub" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                background: 'rgba(255, 255, 255, 0.18)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              Q
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#fff', lineHeight: 1.1 }}>QuestRock</div>
              <div style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.72)', lineHeight: 1 }}>Investor intake</div>
            </div>
          </div>
        </Link>

        {programLabel && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: '4px 10px',
              borderRadius: 99,
              background: 'rgba(255, 255, 255, 0.14)',
              color: '#fff',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            {programLabel}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {autoSaveState && <AutoSaveIndicator state={autoSaveState} />}
      </div>
    </header>
  );
}
