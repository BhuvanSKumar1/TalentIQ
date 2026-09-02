import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-brand-500/10 text-brand-300 border border-brand-500/18',
        secondary: 'bg-surface-100 text-surface-700 border border-surface-300',
        success: 'bg-success-500/8 text-success-500 border border-success-500/16',
        warning: 'bg-warning-500/8 text-warning-500 border border-warning-500/16',
        danger: 'bg-danger-500/8 text-danger-500 border border-danger-500/16',
        outline: 'border border-surface-400 text-surface-700',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
