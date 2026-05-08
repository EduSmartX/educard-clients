import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary/10 text-primary hover:bg-primary/20',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-rose-100 text-rose-700 hover:bg-rose-200',
        outline: 'border-2 border-slate-200 text-slate-600 bg-white hover:border-slate-300',
        success: 'border-transparent bg-emerald-100 text-emerald-700 hover:bg-emerald-200',
        warning: 'border-transparent bg-amber-100 text-amber-700 hover:bg-amber-200',
        info: 'border-transparent bg-blue-100 text-blue-700 hover:bg-blue-200',
        purple: 'border-transparent bg-violet-100 text-violet-700 hover:bg-violet-200',
        gradient: 'border-transparent bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
