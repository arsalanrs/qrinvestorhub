'use client';

interface AutoSaveIndicatorProps {
  state: 'saved' | 'saving' | 'unsaved';
}

export function AutoSaveIndicator({ state }: AutoSaveIndicatorProps) {
  const config = {
    saved:   { text: 'Saved',    dot: 'rgba(134,239,172,1)', color: 'rgba(255,255,255,0.85)' },
    saving:  { text: 'Saving…',  dot: 'rgba(255,255,255,0.5)', color: 'rgba(255,255,255,0.65)' },
    unsaved: { text: 'Unsaved',  dot: '#fbbf24', color: 'rgba(255,255,255,0.75)' },
  }[state];

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '6px 12px',
      borderRadius: '999px',
      background: 'rgba(255,255,255,0.1)',
      border: '1px solid rgba(255,255,255,0.18)',
    }}>
      <span style={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: config.dot,
        display: 'inline-block',
        flexShrink: 0,
      }} />
      <span style={{
        fontSize: '11.5px',
        fontFamily: 'IBM Plex Mono, monospace',
        color: config.color,
        letterSpacing: '0.03em',
        fontWeight: 500,
      }}>
        {config.text}
      </span>
    </div>
  );
}
