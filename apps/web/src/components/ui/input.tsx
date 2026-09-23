import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          type={type}
          className={cn(
            'border-input bg-background ring-offset-background file:text-foreground placeholder:text-muted-foreground/60 focus-visible:border-primary focus-visible:ring-primary/10 hover:border-primary/30 flex h-11 w-full rounded-xl border-2 px-4 py-2.5 text-sm transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-4 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-400 focus-visible:border-red-500 focus-visible:ring-red-500/10',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-red-500">
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
