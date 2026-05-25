/**
 * Generic Multi-Select Field Component
 * Reusable form field for selecting multiple items from a list
 * Eliminates code duplication across subject, class, and other multi-select fields
 */

import { Badge } from '@/components/ui/badge';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { X } from 'lucide-react';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface GenericMultiSelectFieldProps<TFieldValues extends FieldValues, TValue = string> {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  description?: string;
  isLoading?: boolean;
  options: SelectOption[];
  /** Function to format display value for selected items */
  formatDisplayValue?: (value: TValue) => string;
  /** Empty state message when all items are selected */
  allSelectedMessage?: string;
  /** Empty state message when no items are available */
  noItemsMessage?: string;
  /** Loading state message */
  loadingMessage?: string;
  /** Custom class for the badge container */
  badgeContainerClassName?: string;
}

export function GenericMultiSelectField<TFieldValues extends FieldValues, TValue = string>({
  control,
  name,
  label,
  placeholder = 'Select items...',
  searchPlaceholder = 'Search...',
  disabled = false,
  description,
  isLoading = false,
  options,
  formatDisplayValue,
  allSelectedMessage = 'All items selected',
  noItemsMessage = 'No items available',
  loadingMessage = 'Loading...',
  badgeContainerClassName,
}: GenericMultiSelectFieldProps<TFieldValues, TValue>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const selectedValues: TValue[] = Array.isArray(field.value) ? field.value : [];
        const selectedValuesAsStrings = selectedValues.map(String);

        // Filter out already selected options
        const availableOptions = options.filter(
          (opt) => !selectedValuesAsStrings.includes(opt.value)
        );

        const handleRemove = (valueToRemove: TValue) => {
          field.onChange(selectedValues.filter((v) => v !== valueToRemove));
        };

        const getSelectOptions = (): SelectOption[] => {
          if (isLoading) {
            return [{ value: '__loading__', label: loadingMessage, disabled: true }];
          }
          if (availableOptions.length === 0) {
            return [
              {
                value: '__empty__',
                label: selectedValues.length > 0 ? allSelectedMessage : noItemsMessage,
                disabled: true,
              },
            ];
          }
          return availableOptions;
        };

        const getDisplayValue = (value: TValue): string => {
          if (formatDisplayValue) {
            return formatDisplayValue(value);
          }
          const option = options.find((opt) => opt.value === String(value));
          return option?.label || String(value);
        };

        return (
          <FormItem>
            {label && <FormLabel className="font-medium">{label}</FormLabel>}
            <div className="space-y-2">
              {/* Searchable dropdown to add items */}
              <FormControl>
                <SearchableSelect
                  options={getSelectOptions()}
                  value=""
                  onValueChange={(value) => {
                    if (value && !value.startsWith('__')) {
                      // Convert back to original type if needed
                      const newValue = value as unknown as TValue;
                      if (!selectedValuesAsStrings.includes(value)) {
                        field.onChange([...selectedValues, newValue]);
                      }
                    }
                  }}
                  placeholder={placeholder}
                  searchPlaceholder={searchPlaceholder}
                  emptyText={noItemsMessage}
                  disabled={disabled || isLoading || availableOptions.length === 0}
                  className="border-gray-300 bg-gray-50 focus:bg-white"
                />
              </FormControl>

              {/* Display selected items as badges */}
              {selectedValues.length > 0 && (
                <div
                  className={
                    badgeContainerClassName ||
                    'flex max-h-[200px] flex-wrap gap-2 overflow-y-auto rounded-md border bg-gray-50 p-3'
                  }
                >
                  {selectedValues.map((value, index) => (
                    <Badge
                      key={`${String(value)}-${index}`}
                      variant="secondary"
                      className="gap-1.5 px-3 py-1.5 text-sm"
                    >
                      <span>{getDisplayValue(value)}</span>
                      {!disabled && (
                        <button
                          type="button"
                          onClick={() => handleRemove(value)}
                          className="ml-1 rounded-full p-0.5 transition-colors hover:bg-gray-300"
                          aria-label={`Remove ${getDisplayValue(value)}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </Badge>
                  ))}
                </div>
              )}

              {description && <FormDescription className="text-xs">{description}</FormDescription>}
            </div>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
