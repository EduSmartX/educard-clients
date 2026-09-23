/**
 * Form Error Component
 * Reusable inline error message display
 */
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormErrorProps {
  message?: string;
  className?: string;
  /** Compact mode for inline errors */
  compact?: boolean;
}

/**
 * FormError - Displays form validation error messages
 *
 * @example
 * // Simple usage
 * <FormError message={errors.email?.message} />
 *
 * @example
 * // Compact inline
 * <FormError message="This field is required" compact />
 */
export function FormError({ message, className, compact = false }: Readonly<FormErrorProps>) {
  if (!message) {
    return null;
  }

  if (compact) {
    return <p className={cn('mt-1 text-sm text-red-500', className)}>{message}</p>;
  }

  return (
    <div
      className={cn(
        'mt-2 flex items-start gap-2 rounded-lg border p-3',
        'border-red-200 bg-red-50/80 backdrop-blur-sm',
        'animate-in fade-in-50 slide-in-from-top-1 duration-300',
        className
      )}
    >
      <div className="mt-0.5 flex-shrink-0">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-red-500 opacity-30 blur-sm" />
          <AlertCircle className="relative h-5 w-5 text-red-600" strokeWidth={2.5} />
        </div>
      </div>
      <p className="flex-1 text-sm leading-relaxed font-medium text-red-700">{message}</p>
    </div>
  );
}

export default FormError;
