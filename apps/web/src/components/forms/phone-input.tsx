import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { formatPhoneNumber, getTenDigitPhoneNumber } from '@/lib/phone-utils';

interface PhoneInputProps {
  id?: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  label?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  compact?: boolean;
}

/**
 * Reusable Phone Number Input Component
 * Formats phone numbers as: XXX-XXX-XXXX
 * Can be used for Organization, Teacher, Student, Admin phone numbers
 */
export function PhoneInput({
  id = 'phone',
  value = '',
  onChange,
  error,
  label,
  required = false,
  placeholder = '999-999-9999',
  disabled = false,
  className,
  compact = false,
}: PhoneInputProps) {
  const [displayValue, setDisplayValue] = React.useState('');

  // Initialize display value when value prop changes
  React.useEffect(() => {
    if (value) {
      setDisplayValue(formatPhoneNumber(value));
    } else {
      setDisplayValue('');
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;

    // Format the input
    const formatted = formatPhoneNumber(input);
    setDisplayValue(formatted);

    // Send clean 10 digits to parent
    const digits = getTenDigitPhoneNumber(formatted);
    if (onChange) {
      onChange(digits);
    }
  };

  const inputHeight = compact ? 'h-12' : 'h-14';

  return (
    <div className="space-y-2">
      {label && (
        <Label
          htmlFor={id}
          className={cn('text-sm font-semibold text-gray-700', compact && 'text-xs')}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      <Input
        id={id}
        type="tel"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          `${inputHeight} text-base border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:ring-4 focus:ring-purple-50 transition-all`,
          error && 'border-red-500 focus:border-red-500 focus:ring-red-50',
          className
        )}
        error={error}
        maxLength={12} // XXX-XXX-XXXX = 12 chars
      />
    </div>
  );
}
