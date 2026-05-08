'use client';

import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  disabled?: boolean;
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  emptyText = 'No results found.',
  className,
  disabled = false,
}: ComboboxProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const filteredOptions = React.useMemo(() => {
    if (!searchQuery) return options;

    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        option.value.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [options, searchQuery]);

  const selectedOption = options.find((option) => option.value === value);

  // Auto-focus search input when dropdown opens
  React.useEffect(() => {
    if (open && inputRef.current && options.length > 10) {
      // Small delay to ensure the content is rendered
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  }, [open, options.length]);

  return (
    <Select
      value={value}
      onValueChange={(newValue) => {
        onValueChange?.(newValue);
        setSearchQuery('');
        setOpen(false);
      }}
      disabled={disabled}
      open={open}
      onOpenChange={setOpen}
    >
      <SelectTrigger className={cn('w-full', className)}>
        <SelectValue placeholder={placeholder}>
          {selectedOption ? selectedOption.label : placeholder}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.length > 10 && (
          <div className="px-2 pb-2 sticky top-0 bg-white z-10">
            <Input
              ref={inputRef}
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                // Prevent default Select behavior for keyboard navigation
                e.stopPropagation();
                // Allow Escape to close the dropdown
                if (e.key === 'Escape') {
                  setOpen(false);
                  setSearchQuery('');
                }
              }}
            />
          </div>
        )}
        {filteredOptions.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">{emptyText}</div>
        ) : (
          filteredOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}
