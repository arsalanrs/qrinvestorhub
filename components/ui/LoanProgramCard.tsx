'use client';

import * as React from 'react';
import { motion, type Variants } from 'framer-motion';
import { ArrowRight, Clock, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from './badge';

export interface LoanProgramCardProps {
  num: string;
  program: string;
  headline: string;
  maxLeverage: string;           // e.g. "90% LTC"
  maxLeverageLabel: string;      // e.g. "Max Loan-to-Cost"
  typicalClose: string;          // e.g. "5–14 days"
  highlight: string;             // e.g. "No income docs required"
  tags: string[];
  description: string;
  badge?: string;                // pill in top-right, e.g. "Most Popular"
  href: string;
  className?: string;
}

const cardVariants: Variants = {
  hidden:   { opacity: 0, y: 22 },
  visible:  { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.25, 0.46, 0.45, 0.94] } },
};

export const LoanProgramCard = React.forwardRef<HTMLDivElement, LoanProgramCardProps>(
  ({ num, program, headline, maxLeverage, maxLeverageLabel, typicalClose, highlight,
     tags, description, badge, href, className }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn('loan-prog-card', className)}
        variants={cardVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-40px' }}
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
      >
        <style>{`
          .loan-prog-card {
            background: #fff;
            border: 1.5px solid #DAD4C4;
            border-radius: 20px;
            padding: 26px 24px 22px;
            display: flex;
            flex-direction: column;
            gap: 0;
            box-shadow: 0 1px 3px rgba(20,33,61,.04), 0 6px 20px rgba(20,33,61,.05);
            font-family: 'Inter', sans-serif;
            cursor: pointer;
            transition: border-color .2s, box-shadow .2s;
            position: relative;
            overflow: hidden;
          }
          .loan-prog-card:hover {
            border-color: #1F6F54;
            box-shadow: 0 4px 24px rgba(31,111,84,.12), 0 1px 4px rgba(20,33,61,.06);
          }
          .loan-prog-card::before {
            content: "";
            position: absolute;
            top: 0; left: 0; right: 0;
            height: 3px;
            background: linear-gradient(90deg, #1F6F54, #B08D57);
            opacity: 0;
            transition: opacity .25s;
          }
          .loan-prog-card:hover::before { opacity: 1; }
        `}</style>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              fontFamily: 'IBM Plex Mono, monospace',
              fontSize: 11, fontWeight: 700,
              color: '#B08D57',
              background: '#F0E6D3',
              padding: '4px 9px',
              borderRadius: 999,
              letterSpacing: '0.06em',
            }}>{num}</span>
            <h3 style={{
              fontFamily: 'Fraunces, serif',
              fontSize: 17, fontWeight: 600,
              color: '#14213D',
              margin: 0,
              letterSpacing: '-0.01em',
              lineHeight: 1.25,
            }}>{program}</h3>
          </div>
          {badge && (
            <Badge variant="green" style={{ fontSize: 10, letterSpacing: '0.04em', textTransform: 'uppercase', flexShrink: 0 }}>
              {badge}
            </Badge>
          )}
        </div>

        {/* ── Divider ── */}
        <div style={{ borderTop: '1px solid #DAD4C4', marginBottom: 18 }} />

        {/* ── Headline ── */}
        <p style={{ fontSize: 13, color: '#5B6472', margin: '0 0 12px', fontStyle: 'italic', lineHeight: 1.5 }}>
          {headline}
        </p>

        {/* ── Max leverage (hero number) ── */}
        <div style={{ marginBottom: 18 }}>
          <div style={{
            fontFamily: 'Fraunces, serif',
            fontSize: 42, fontWeight: 700,
            color: '#1F6F54',
            lineHeight: 1,
            letterSpacing: '-0.03em',
          }}>
            {maxLeverage}
          </div>
          <div style={{ fontSize: 12, color: '#9AA1AC', marginTop: 4, fontWeight: 500 }}>
            {maxLeverageLabel}
          </div>
        </div>

        {/* ── Stats grid ── */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px',
          marginBottom: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Clock style={{ width: 14, height: 14, color: '#9AA1AC', flexShrink: 0 }} />
            <span style={{ fontSize: 12.5, color: '#5B6472' }}>{typicalClose}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <ShieldCheck style={{ width: 14, height: 14, color: '#1F6F54', flexShrink: 0 }} />
            <span style={{ fontSize: 12.5, color: '#1F6F54', fontWeight: 600 }}>{highlight}</span>
          </div>
        </div>

        {/* ── Tags ── */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
          {tags.map(t => (
            <Badge key={t} variant="muted" style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, letterSpacing: '0.03em' }}>
              {t}
            </Badge>
          ))}
        </div>

        {/* ── Description ── */}
        <p style={{ fontSize: 13, color: '#5B6472', lineHeight: 1.65, margin: '0 0 22px', flex: 1 }}>
          {description}
        </p>

        {/* ── CTA ── */}
        <a
          href={href}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13.5,
            fontWeight: 800,
            color: '#1F6F54',
            marginTop: 'auto',
            letterSpacing: '-0.01em',
            textDecoration: 'none',
            transition: 'gap .2s',
          }}
          className="lpc-cta"
        >
          <style>{`
            .lpc-cta:hover { gap: 10px; }
            .lpc-cta:hover .lpc-arrow { transform: translateX(2px); }
            .lpc-arrow { transition: transform .2s; }
          `}</style>
          Start intake
          <ArrowRight className="lpc-arrow" style={{ width: 15, height: 15 }} />
        </a>
      </motion.div>
    );
  }
);

LoanProgramCard.displayName = 'LoanProgramCard';
