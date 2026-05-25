/**
 * Multi-Select Component
 * A simple multi-select component using checkboxes in a dropdown
 */

import * as React from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@radix-ui/react-scroll-area';

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  disabled?: boolean;
}

export function MultiSelect({
  options,
  value = [],
  onChange,
  placeholder = 'Select items...',
  searchPlaceholder = 'Search...',
  emptyMessage = 'No items found.',
  className,
  disabled,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');

  const filteredOptions = React.useMemo(() => {
    if (!search) {
      return options;
    }
    return options.filter((option) => option.label.toLowerCase().includes(search.toLowerCase()));
  }, [options, search]);

  const selectedLabels = React.useMemo(() => {
    return value.map((v) => options.find((o) => o.value === v)?.label).filter(Boolean) as string[];
  }, [value, options]);

  const handleSelect = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const handleRemove = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((v) => v !== optionValue));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'h-auto min-h-10 w-full justify-between',
            !value.length && 'text-muted-foreground',
            className
          )}
          disabled={disabled}
          type="button"
        >
          <div className="flex flex-1 flex-wrap gap-1 text-left">
            {value.length > 0 ? (
              selectedLabels.map((label, index) => (
                <Badge key={value[index]} variant="secondary" className="mr-1">
                  {label}
                  <button
                    type="button"
                    className="ring-offset-background focus:ring-ring ml-1 rounded-full outline-none focus:ring-2 focus:ring-offset-2"
                    onClick={(e) => handleRemove(value[index], e)}
                    disabled={disabled}
                  >
                    <X className="h-3 w-3" />
                    <span className="sr-only">Remove {label}</span>
                  </button>
                </Badge>
              ))
            ) : (
              <span>{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <div className="border-b p-2">
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8"
          />
        </div>
        <ScrollArea className="max-h-60 overflow-auto">
          <div className="p-2">
            {filteredOptions.length === 0 ? (
              <p className="text-muted-foreground py-2 text-center text-sm">{emptyMessage}</p>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  tabIndex={0}
                  aria-selected={value.includes(option.value)}
                  className="hover:bg-muted flex cursor-pointer items-center space-x-2 rounded-sm px-2 py-1.5"
                  onClick={() => handleSelect(option.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelect(option.value);
                    }
                  }}
                >
                  <Checkbox
                    id={option.value}
                    checked={value.includes(option.value)}
                    onCheckedChange={() => handleSelect(option.value)}
                  />
                  <label
                    htmlFor={option.value}
                    className="flex-1 cursor-pointer text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {option.label}
                  </label>
                  {value.includes(option.value) && <Check className="text-primary h-4 w-4" />}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
