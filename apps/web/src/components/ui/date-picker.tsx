/**
 * Professional Date Picker Component
 * Using react-datepicker for excellent UX with month/year dropdowns
 */
import React from 'react';
import ReactDatePicker from 'react-datepicker';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import 'react-datepicker/dist/react-datepicker.css';

interface DatePickerProps {
  value?: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
  containerClassName?: string;
}

const DatePickerInput = React.forwardRef<
  HTMLButtonElement,
  {
    value?: string;
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
    placeholder?: string;
  }
>(({ value, onClick, disabled, className, placeholder }, ref) => (
  <Button
    ref={ref}
    type="button"
    variant="outline"
    onClick={onClick}
    disabled={disabled}
    className={cn(
      'h-10 w-full justify-start border-gray-300 bg-gray-50 px-3 text-left font-normal',
      'transition-colors hover:border-gray-400 hover:bg-white focus:bg-white',
      'focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:outline-none',
      !value && 'text-gray-400',
      value && 'text-gray-900',
      disabled && 'cursor-not-allowed opacity-50',
      className
    )}
  >
    <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0 text-gray-500" />
    <span className="text-sm">{value || placeholder}</span>
  </Button>
));
DatePickerInput.displayName = 'DatePickerInput';

export function DatePicker({
  value,
  onChange,
  placeholder = 'Select date',
  disabled = false,
  minDate,
  maxDate,
  className,
  containerClassName,
}: DatePickerProps) {
  return (
    <div
      className={cn(
        'w-full [&_.react-datepicker__input-container]:w-full [&_.react-datepicker-wrapper]:w-full',
        containerClassName
      )}
    >
      <ReactDatePicker
        selected={value}
        onChange={onChange}
        customInput={
          <DatePickerInput disabled={disabled} className={className} placeholder={placeholder} />
        }
        dateFormat="MMMM d, yyyy"
        minDate={minDate}
        maxDate={maxDate}
        disabled={disabled}
        showMonthDropdown
        showYearDropdown
        dropdownMode="select"
        yearDropdownItemNumber={100}
        scrollableYearDropdown
        placeholderText={placeholder}
        className="w-full"
        calendarClassName="professional-calendar"
        popperClassName="date-picker-popper"
        showPopperArrow={false}
        popperPlacement="bottom-start"
      />
    </div>
  );
}
