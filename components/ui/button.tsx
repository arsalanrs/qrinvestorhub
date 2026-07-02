import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-bold transition-all outline-offset-2 focus-visible:outline focus-visible:outline-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:   'bg-[#14213D] text-white shadow-sm hover:opacity-90',
        green:     'bg-[#1F6F54] text-white shadow-sm hover:opacity-90',
        brass:     'bg-[#B08D57] text-white shadow-sm hover:opacity-90',
        outline:   'border-[1.5px] border-[#DAD4C4] bg-white text-[#14213D] hover:border-[#14213D]',
        ghost:     'bg-transparent text-[#5B6472] hover:bg-[#EFEBE1] hover:text-[#14213D]',
        destructive: 'bg-[#B3492D] text-white hover:opacity-90',
      },
      size: {
        sm:   'h-8 px-4 text-xs',
        default: 'h-10 px-5',
        lg:   'h-11 px-7 text-[14px]',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
