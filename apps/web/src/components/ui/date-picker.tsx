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
  const CustomInput = React.forwardRef<HTMLButtonElement, { value?: string; onClick?: () => void }>(
    ({ value, onClick }, ref) => (
      <Button
        ref={ref}
        type="button"
        variant="outline"
        onClick={onClick}
        disabled={disabled}
        className={cn(
          'w-full h-10 px-3 justify-start text-left font-normal bg-gray-50 border-gray-300',
          'hover:bg-white hover:border-gray-400 focus:bg-white transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
          !value && 'text-gray-400',
          value && 'text-gray-900',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
      >
        <CalendarIcon className="mr-2 h-4 w-4 text-gray-500 flex-shrink-0" />
        <span className="text-sm">{value || placeholder}</span>
      </Button>
    )
  );
  CustomInput.displayName = 'CustomInput';

  return (
    <div
      className={cn(
        'w-full [&_.react-datepicker-wrapper]:w-full [&_.react-datepicker__input-container]:w-full',
        containerClassName
      )}
    >
      <ReactDatePicker
        selected={value}
        onChange={onChange}
        customInput={<CustomInput />}
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
