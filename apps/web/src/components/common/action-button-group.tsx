import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ActionButtonGroupProps {
  children: ReactNode;
  className?: string;
}

/** Responsive action-button row: full-width stacked on mobile, wraps at sm, single right-aligned row at lg. */
export function ActionButtonGroup({ children, className }: Readonly<ActionButtonGroupProps>) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end',
        '[&>*]:w-full sm:[&>*]:w-auto',
        className
      )}
    >
      {children}
    </div>
  );
}
