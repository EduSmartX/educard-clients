import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface MonthYearPickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  className?: string;
}

export function MonthYearPicker({
  value,
  onChange,
  placeholder = 'Select month',
  className,
}: MonthYearPickerProps) {
  const [currentYear, setCurrentYear] = useState(
    value ? value.getFullYear() : new Date().getFullYear()
  );

  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = new Date(currentYear, monthIndex, 1);
    onChange(newDate);
  };

  const handleYearChange = (delta: number) => {
    setCurrentYear((prev) => prev + delta);
  };

  const isSelectedMonth = (monthIndex: number) => {
    if (!value) {
      return false;
    }
    return value.getMonth() === monthIndex && value.getFullYear() === currentYear;
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, 'MMMM yyyy') : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="start">
        <div className="space-y-4">
          {/* Year Selector */}
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => handleYearChange(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm font-semibold">{currentYear}</div>
            <Button variant="outline" size="sm" onClick={() => handleYearChange(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Month Grid */}
          <div className="grid grid-cols-3 gap-2">
            {months.map((month, index) => (
              <Button
                key={month}
                variant={isSelectedMonth(index) ? 'default' : 'outline'}
                size="sm"
                className={cn(
                  'h-9',
                  isSelectedMonth(index) && 'bg-primary text-primary-foreground'
                )}
                onClick={() => handleMonthSelect(index)}
              >
                {month.slice(0, 3)}
              </Button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
