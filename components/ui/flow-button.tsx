'use client';

import { ArrowRight } from 'lucide-react';

interface FlowButtonProps {
  text?: string;
  variant?: 'dark' | 'green' | 'brass' | 'white';
  onClick?: () => void;
  href?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE: Record<string, string> = {
  sm: '11px 16px',
  md: '12px 20px',
  lg: '14px 24px',
};

export function FlowButton({
  text = 'Get Started',
  variant = 'dark',
  onClick,
  type = 'button',
  disabled = false,
  size = 'md',
}: FlowButtonProps) {
  const className =
    variant === 'green'
      ? 'qr-btn qr-btn-green'
      : variant === 'white'
        ? 'qr-btn qr-btn-secondary'
        : 'qr-btn qr-btn-primary';

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={className}
      style={{ padding: SIZE[size], fontSize: size === 'sm' ? 13 : size === 'lg' ? 15 : 14 }}
    >
      {text}
      <ArrowRight size={16} strokeWidth={2.25} />
    </button>
  );
}
