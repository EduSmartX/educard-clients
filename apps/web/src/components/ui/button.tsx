import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-md shadow-primary/25 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30',
        brand:
          'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25 hover:from-violet-700 hover:to-indigo-700 hover:shadow-xl hover:shadow-violet-500/30 hover:scale-[1.02] disabled:hover:scale-100',
        brandOutline:
          'bg-white border-2 border-violet-200 text-violet-700 hover:bg-violet-50 hover:border-violet-300 hover:shadow-md',
        destructive:
          'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-md shadow-red-500/25 hover:from-red-600 hover:to-rose-600 hover:shadow-lg',
        outline:
          'border-2 border-input bg-background hover:bg-accent hover:text-accent-foreground hover:border-primary/30',
        secondary:
          'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 hover:shadow-md',
        ghost: 'hover:bg-accent/50 hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        success:
          'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/25 hover:from-emerald-600 hover:to-teal-600 hover:shadow-lg',
        warning:
          'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/25 hover:from-amber-600 hover:to-orange-600 hover:shadow-lg',
        info: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md shadow-blue-500/25 hover:from-blue-600 hover:to-cyan-600 hover:shadow-lg',
        glass:
          'bg-white/80 backdrop-blur-md border border-white/20 text-foreground shadow-soft hover:bg-white/90 hover:shadow-soft-lg',
      },
      size: {
        default: 'h-11 px-5 py-2.5',
        sm: 'h-9 rounded-lg px-3.5',
        lg: 'h-12 rounded-xl px-8',
        xl: 'h-14 rounded-2xl px-8 text-base',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, asChild = false, isLoading = false, disabled, children, ...props },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';

    // When using asChild, we can't render loading spinner alongside children
    // because Slot expects a single child element
    if (asChild) {
      return (
        <Comp
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          disabled={disabled || isLoading}
          {...props}
        >
          {children}
        </Comp>
      );
    }

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <svg
            className="mr-2 -ml-1 h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : null}
        {children}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
