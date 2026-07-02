'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Clock, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

const PROGRAMS = [
  {
    num: '01', key: 'blanket_portfolio',
    label: 'Blanket / Portfolio', short: 'Portfolio',
    maxLeverage: '75%', maxLeverageLabel: 'Max Portfolio LTV',
    typicalClose: '14–21 days', highlight: 'Rent roll qualifies',
    tags: ['Refinance', 'Cash-Out', 'Portfolio'],
    description: 'Ideal for investors with multiple rentals who want to streamline debt, consolidate mortgages, or pull equity — all in one loan structure.',
    color: '#1F6F54',
    bg: '#E4EFE9',
  },
  {
    num: '02', key: 'bridge',
    label: 'Bridge Loan', short: 'Bridge',
    maxLeverage: '70%', maxLeverageLabel: 'Max LTC',
    typicalClose: '5–10 days', highlight: 'Fast close',
    tags: ['Purchase', 'Refinance', 'Cash-Out'],
    description: 'Short-term capital to move fast. Bridge to sale, DSCR refi, or stabilization. Exit strategy required. Close in days, not weeks.',
    color: '#2E5C8A',
    bg: '#E7EEF5',
  },
  {
    num: '03', key: 'construction',
    label: 'Construction', short: 'Construction',
    maxLeverage: '90%', maxLeverageLabel: 'Max LTC',
    typicalClose: '10–21 days', highlight: 'Draw schedule',
    tags: ['Ground-Up', 'Mid-Build', 'ARV'],
    description: 'Finance new builds from land acquisition through C/O. Covers construction budgets, draw schedules, builder contracts, and permits.',
    color: '#B08D57',
    bg: '#F0E6D3',
  },
  {
    num: '04', key: 'dscr',
    label: 'DSCR Rental', short: 'DSCR',
    maxLeverage: '80%', maxLeverageLabel: 'Max LTV',
    typicalClose: '7–14 days', highlight: 'No tax returns',
    tags: ['No Income Docs', 'Rental', 'DSCR'],
    description: 'Qualify on property cash flow alone — no personal income docs, no tax returns. Based on market rent and estimated DSCR.',
    color: '#1F6F54',
    bg: '#E4EFE9',
    popular: true,
  },
  {
    num: '05', key: 'rehab',
    label: 'Rehab / Fix & Flip', short: 'Rehab',
    maxLeverage: '90%', maxLeverageLabel: 'Max LTC',
    typicalClose: '5–10 days', highlight: 'ARV-based',
    tags: ['Fix & Flip', 'Fix & Hold', 'Scope of Work'],
    description: 'Purchase plus renovation in one loan. Covers ARV, rehab budget, scope of work, contractor details, and exit strategy.',
    color: '#B3492D',
    bg: '#F7E7E1',
  },
];

export function LoanProgramStrip() {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div
      style={{ display: 'flex', gap: 10, height: 400, alignItems: 'stretch' }}
      onMouseLeave={() => setHovered(null)}
    >
      {PROGRAMS.map((p, i) => {
        const isActive  = hovered === i;
        const hasHover  = hovered !== null;
        const isCollapsed = hasHover && !isActive;

        return (
          <motion.div
            key={p.key}
            animate={{ flex: isActive ? 4 : isCollapsed ? 0.28 : 1 }}
            transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
            onMouseEnter={() => setHovered(i)}
            style={{
              position: 'relative',
              overflow: 'hidden',
              borderRadius: 18,
              border: `1.5px solid ${isActive ? p.color : '#DAD4C4'}`,
              background: isActive ? '#fff' : p.bg,
              cursor: 'pointer',
              minWidth: 0,
              boxShadow: isActive
                ? `0 8px 32px rgba(20,33,61,0.12), 0 2px 8px rgba(20,33,61,0.06)`
                : '0 1px 3px rgba(20,33,61,0.04)',
              transition: 'border-color 0.25s, background 0.25s, box-shadow 0.25s',
            }}
          >
            {/* ── Top gradient accent bar ── */}
            <motion.div
              animate={{ scaleX: isActive ? 1 : 0 }}
              initial={{ scaleX: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                background: `linear-gradient(90deg, ${p.color}, #B08D57)`,
                transformOrigin: 'left',
                borderRadius: '18px 18px 0 0',
              }}
            />

            {/* ── Collapsed state: rotated label strip ── */}
            <AnimatePresence>
              {isCollapsed && (
                <motion.div
                  key="collapsed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 16,
                    padding: '16px 0',
                  }}
                >
                  <span style={{
                    fontFamily: 'IBM Plex Mono, monospace',
                    fontSize: 10, fontWeight: 700,
                    color: p.color,
                    letterSpacing: '0.06em',
                    opacity: 0.7,
                  }}>{p.num}</span>
                  <span style={{
                    fontFamily: 'Fraunces, serif',
                    fontSize: 13, fontWeight: 600,
                    color: p.color,
                    writingMode: 'vertical-rl',
                    textOrientation: 'mixed',
                    whiteSpace: 'nowrap',
                    transform: 'rotate(180deg)',
                    letterSpacing: '0.01em',
                  }}>{p.short}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Default state: compact card (no hover at all) ── */}
            <AnimatePresence>
              {!hasHover && (
                <motion.div
                  key="default"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    position: 'absolute', inset: 0, padding: '22px 20px',
                    display: 'flex', flexDirection: 'column', gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{
                      fontFamily: 'IBM Plex Mono, monospace', fontSize: 10,
                      fontWeight: 700, color: p.color, opacity: 0.7,
                      letterSpacing: '0.06em',
                    }}>{p.num}</span>
                    {p.popular && (
                      <span style={{
                        fontSize: 9, fontWeight: 700, letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        background: p.bg, color: p.color,
                        padding: '3px 7px', borderRadius: 999,
                        border: `1px solid ${p.color}44`,
                        fontFamily: 'IBM Plex Mono, monospace',
                      }}>Popular</span>
                    )}
                  </div>
                  <h3 style={{
                    fontFamily: 'Fraunces, serif', fontSize: 15.5,
                    fontWeight: 600, color: '#14213D',
                    margin: 0, lineHeight: 1.25, letterSpacing: '-0.01em',
                  }}>{p.label}</h3>
                  <div style={{
                    fontFamily: 'Fraunces, serif', fontSize: 26,
                    fontWeight: 700, color: p.color, lineHeight: 1, letterSpacing: '-0.02em',
                  }}>{p.maxLeverage}</div>
                  <div style={{ fontSize: 11, color: '#9AA1AC', fontWeight: 500 }}>{p.maxLeverageLabel}</div>
                  <div style={{ marginTop: 'auto', fontSize: 11.5, fontWeight: 600, color: p.color, display: 'flex', alignItems: 'center', gap: 4 }}>
                    {p.highlight} <ArrowRight style={{ width: 11, height: 11 }} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Expanded state: full detail ── */}
            <AnimatePresence>
              {isActive && (
                <motion.div
                  key="expanded"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.28, delay: 0.12 }}
                  style={{
                    position: 'absolute', inset: 0, padding: '26px 28px',
                    display: 'flex', flexDirection: 'column', gap: 0,
                  }}
                >
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{
                        fontFamily: 'IBM Plex Mono, monospace', fontSize: 10.5,
                        fontWeight: 700, color: p.color,
                        background: p.bg, padding: '4px 10px', borderRadius: 999,
                        letterSpacing: '0.06em',
                      }}>{p.num}</span>
                      <h3 style={{
                        fontFamily: 'Fraunces, serif', fontSize: 19,
                        fontWeight: 700, color: '#14213D',
                        margin: 0, letterSpacing: '-0.015em',
                      }}>{p.label}</h3>
                    </div>
                    {p.popular && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
                        textTransform: 'uppercase', color: p.color,
                        background: p.bg, padding: '4px 10px', borderRadius: 999,
                        border: `1px solid ${p.color}33`,
                        fontFamily: 'IBM Plex Mono, monospace',
                      }}>Most Popular</span>
                    )}
                  </div>

                  {/* Divider */}
                  <div style={{ borderTop: '1px solid #DAD4C4', marginBottom: 18 }} />

                  {/* Hero number */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{
                      fontFamily: 'Fraunces, serif', fontSize: 52,
                      fontWeight: 700, color: p.color, lineHeight: 1,
                      letterSpacing: '-0.04em',
                    }}>{p.maxLeverage}</div>
                    <div style={{ fontSize: 12, color: '#9AA1AC', marginTop: 5, fontWeight: 500 }}>
                      {p.maxLeverageLabel}
                    </div>
                  </div>

                  {/* Stats */}
                  <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <Clock style={{ width: 13, height: 13, color: '#9AA1AC' }} />
                      <span style={{ fontSize: 12.5, color: '#5B6472' }}>{p.typicalClose}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <ShieldCheck style={{ width: 13, height: 13, color: p.color }} />
                      <span style={{ fontSize: 12.5, color: p.color, fontWeight: 600 }}>{p.highlight}</span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                    {p.tags.map(t => (
                      <span key={t} style={{
                        fontFamily: 'IBM Plex Mono, monospace', fontSize: 10,
                        fontWeight: 600, color: p.color,
                        background: p.bg, padding: '4px 10px',
                        borderRadius: 999, letterSpacing: '0.03em',
                        border: `1px solid ${p.color}22`,
                      }}>{t}</span>
                    ))}
                  </div>

                  {/* Description */}
                  <p style={{
                    fontSize: 13.5, color: '#5B6472', lineHeight: 1.7,
                    margin: '0 0 auto', flex: 1,
                  }}>{p.description}</p>

                  {/* CTA */}
                  <Link
                    href={`/investor-hub/apply?program=${p.key}`}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                      marginTop: 20, padding: '11px 22px',
                      background: p.color, color: '#fff',
                      borderRadius: 999, textDecoration: 'none',
                      fontSize: 13.5, fontWeight: 700,
                      fontFamily: 'Inter, sans-serif',
                      boxShadow: `0 4px 14px ${p.color}44`,
                      width: 'fit-content',
                      letterSpacing: '0.01em',
                    }}
                  >
                    Start intake
                    <ArrowRight style={{ width: 14, height: 14 }} />
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
