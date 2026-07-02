'use client';

import { ArrowRight } from 'lucide-react';

interface FlowButtonProps {
  text?: string;
  /**
   * dark  – black fill, dark text (on light backgrounds)
   * green – ledger-green fill
   * brass – QuestRock brass/gold fill
   * white – white fill (for use on dark/navy backgrounds)
   */
  variant?: 'dark' | 'green' | 'brass' | 'white';
  onClick?: () => void;
  href?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const FILL: Record<string, { bg: string; text: string; border: string; hoverText: string }> = {
  dark:  { bg: '#14213D', text: '#14213D', border: 'rgba(20,33,61,0.35)',   hoverText: '#fff' },
  green: { bg: '#1F6F54', text: '#1F6F54', border: 'rgba(31,111,84,0.38)',  hoverText: '#fff' },
  brass: { bg: '#B08D57', text: '#B08D57', border: 'rgba(176,141,87,0.38)', hoverText: '#fff' },
  white: { bg: '#ffffff', text: 'rgba(247,245,240,0.85)', border: 'rgba(247,245,240,0.28)', hoverText: '#14213D' },
};

const SIZE: Record<string, { px: string; py: string; font: string }> = {
  sm: { px: '22px', py: '9px',  font: '12px' },
  md: { px: '28px', py: '12px', font: '13.5px' },
  lg: { px: '34px', py: '14px', font: '15px' },
};

export function FlowButton({
  text = 'Get Started',
  variant = 'dark',
  onClick,
  type = 'button',
  disabled = false,
  size = 'md',
}: FlowButtonProps) {
  const c = FILL[variant];
  const s = SIZE[size];

  const style: React.CSSProperties = {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    overflow: 'hidden',
    borderRadius: 100,
    border: `1.5px solid ${c.border}`,
    background: 'transparent',
    paddingLeft: s.px,
    paddingRight: s.px,
    paddingTop: s.py,
    paddingBottom: s.py,
    fontSize: s.font,
    fontWeight: 700,
    fontFamily: 'Inter, sans-serif',
    color: c.text,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'all 600ms cubic-bezier(0.23,1,0.32,1)',
    letterSpacing: '-0.01em',
    whiteSpace: 'nowrap',
  };

  const cls = `qr-flow-btn qr-flow-btn--${variant}`;

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={style}
      className={cls}
    >
      {/* Scoped CSS — injected once globally, scoped by variant class */}
      <style>{`
        .qr-flow-btn { --fill: ${c.bg}; }

        .qr-flow-btn:hover {
          border-color: transparent !important;
          color: ${c.hoverText} !important;
          border-radius: 14px !important;
        }
        .qr-flow-btn:active { transform: scale(0.96); }

        /* Arrows */
        .qr-flow-btn .arr-left {
          position: absolute; left: -28%; width: 16px; height: 16px; z-index: 9;
          transition: left 800ms cubic-bezier(0.34,1.56,0.64,1);
        }
        .qr-flow-btn:hover .arr-left { left: 14px; }

        .qr-flow-btn .arr-right {
          position: absolute; right: 14px; width: 16px; height: 16px; z-index: 9;
          transition: right 800ms cubic-bezier(0.34,1.56,0.64,1);
        }
        .qr-flow-btn:hover .arr-right { right: -28%; }

        /* Text */
        .qr-flow-btn .btn-text {
          position: relative; z-index: 1;
          transform: translateX(0);
          transition: transform 800ms ease-out, color 200ms;
        }
        .qr-flow-btn:hover .btn-text { transform: translateX(12px); }

        /* Expanding fill circle */
        .qr-flow-btn .btn-circle {
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 16px; height: 16px;
          background: var(--fill);
          border-radius: 50%; opacity: 0;
          transition: width 800ms cubic-bezier(0.19,1,0.22,1),
                      height 800ms cubic-bezier(0.19,1,0.22,1),
                      opacity 600ms ease;
        }
        .qr-flow-btn:hover .btn-circle { width: 280px; height: 280px; opacity: 1; }

        /* Arrow colour on hover */
        .qr-flow-btn:hover .arr-left,
        .qr-flow-btn:hover .arr-right {
          stroke: ${c.hoverText} !important;
        }
      `}</style>

      {/* Left arrow */}
      <ArrowRight className="arr-left" style={{ stroke: c.text, fill: 'none' }} />

      {/* Text */}
      <span className="btn-text">{text}</span>

      {/* Expanding circle fill */}
      <span className="btn-circle" />

      {/* Right arrow */}
      <ArrowRight className="arr-right" style={{ stroke: c.text, fill: 'none' }} />
    </button>
  );
}
