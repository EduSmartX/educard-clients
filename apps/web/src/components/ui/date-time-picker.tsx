/**
 * Date Time Picker Component
 * Using react-datepicker with time selection
 */
import React from 'react';
import ReactDatePicker from 'react-datepicker';
import { CalendarIcon, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import 'react-datepicker/dist/react-datepicker.css';

interface DateTimePickerProps {
  value?: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
  containerClassName?: string;
  showTimeSelect?: boolean;
  timeIntervals?: number;
  dateFormat?: string;
  error?: boolean;
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = 'Select date and time',
  disabled = false,
  minDate,
  maxDate,
  className,
  containerClassName,
  showTimeSelect = true,
  timeIntervals = 15,
  dateFormat = 'MMMM d, yyyy h:mm aa',
  error = false,
}: DateTimePickerProps) {
  const CustomInput = React.forwardRef<HTMLButtonElement, { value?: string; onClick?: () => void }>(
    ({ value, onClick }, ref) => (
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
          error && 'border-red-500 focus-visible:ring-red-500',
          className
        )}
      >
        <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0 text-gray-500" />
        <span className="flex-1 truncate text-sm">{value || placeholder}</span>
        {showTimeSelect && <Clock className="ml-2 h-4 w-4 flex-shrink-0 text-gray-400" />}
      </Button>
    )
  );
  CustomInput.displayName = 'DateTimeCustomInput';

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
        customInput={<CustomInput />}
        dateFormat={dateFormat}
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
        showTimeSelect={showTimeSelect}
        timeIntervals={timeIntervals}
        timeCaption="Time"
      />
    </div>
  );
}

export default DateTimePicker;
