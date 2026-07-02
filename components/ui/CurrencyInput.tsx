'use client';

import { useState } from 'react';

interface CurrencyInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  label?: string;
  hint?: string;
  required?: boolean;
}

export function CurrencyInput({ value, onChange, placeholder = '0', label, hint, required }: CurrencyInputProps) {
  const [focused, setFocused] = useState(false);

  const rawNum = Number(value.replace(/[^0-9]/g, '')) || 0;
  const displayValue = focused
    ? value.replace(/[^0-9]/g, '')
    : rawNum > 0
    ? rawNum.toLocaleString('en-US')
    : '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      {label && (
        <label style={{
          fontSize: '12.5px',
          fontWeight: 600,
          color: 'var(--ink)',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
        }}>
          {label}
          {required && <span style={{ color: 'var(--clay)', fontSize: '11px' }}>*</span>}
          {hint && <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--slate-light)' }}>{hint}</span>}
        </label>
      )}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        border: `1.5px solid ${focused ? 'var(--brass)' : 'var(--line)'}`,
        borderRadius: '12px',
        background: focused ? '#fff' : 'var(--paper)',
        overflow: 'hidden',
        transition: 'border-color 0.15s, background 0.15s',
        boxShadow: focused ? '0 0 0 3px rgba(176,141,87,0.12)' : 'none',
      }}>
        <span style={{
          padding: '10px 12px 10px 14px',
          fontSize: '13.5px',
          color: focused ? 'var(--ink)' : 'var(--slate)',
          fontFamily: 'IBM Plex Mono, monospace',
          fontWeight: 500,
          background: focused ? 'rgba(176,141,87,0.06)' : 'var(--paper-dim)',
          borderRight: '1px solid var(--line)',
          flexShrink: 0,
        }}>$</span>
        <input
          type="text"
          inputMode="numeric"
          value={displayValue}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(e) => {
            const digits = e.target.value.replace(/[^0-9]/g, '');
            onChange(digits);
          }}
          style={{
            flex: 1,
            padding: '10px 14px',
            fontSize: '14px',
            fontFamily: 'IBM Plex Mono, monospace',
            fontWeight: 500,
            color: 'var(--ink)',
            border: 'none',
            outline: 'none',
            background: 'transparent',
          }}
        />
      </div>
    </div>
  );
}
