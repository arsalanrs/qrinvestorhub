import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full font-semibold transition-colors',
  {
    variants: {
      variant: {
        default:   'bg-[#14213D] text-white px-2.5 py-0.5 text-[11px]',
        green:     'bg-[#E4EFE9] text-[#1F6F54] px-2.5 py-0.5 text-[11px]',
        brass:     'bg-[#F0E6D3] text-[#B08D57] px-2.5 py-0.5 text-[11px]',
        clay:      'bg-[#F7E7E1] text-[#B3492D] px-2.5 py-0.5 text-[11px]',
        outline:   'border border-[#DAD4C4] text-[#5B6472] px-2.5 py-0.5 text-[11px]',
        muted:     'bg-[#EFEBE1] text-[#5B6472] px-2.5 py-0.5 text-[11px]',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
