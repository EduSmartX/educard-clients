/**
 * Generic Resource Filter Component
 * Reusable filter for any resource with dynamic filter fields
 * Supports text inputs, selects, date pickers, combobox, and multiselect
 */

import { Filter, RotateCcw, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Combobox } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export interface FilterField {
  name: string;
  label: string;
  type: 'text' | 'select' | 'combobox' | 'multiselect' | 'date' | 'daterange' | 'custom';
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  customComponent?: React.ReactNode;
  disabled?: boolean;
  searchable?: boolean; // If true, regular select will use combobox. Auto-enabled if options > 10
  searchPlaceholder?: string;
  emptyText?: string;
  searchThreshold?: number; // Number of options to automatically enable search (default: 10)
  // For date range fields
  startDateName?: string;
  endDateName?: string;
}

interface ResourceFilterProps {
  fields: FilterField[];
  onFilter: (filters: Record<string, string>) => void;
  onReset: () => void;
  defaultValues?: Record<string, string | string[]>;
  className?: string;
  onFieldChange?: (name: string, value: string, allFilters: Record<string, string>) => void;
}

export function ResourceFilter({
  fields = [],
  onFilter,
  onReset,
  defaultValues = {},
  className = '',
  onFieldChange,
}: ResourceFilterProps) {
  const [filters, setFilters] = useState<Record<string, string | string[]>>(defaultValues);

  // No need for useEffect sync - the component manages its own state
  // If you need to reset externally, use the onReset callback

  const handleFilterChange = (name: string, value: string | string[]) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [name]: value };

      // Call onFieldChange callback if provided
      if (onFieldChange) {
        const stringFilters = Object.entries(newFilters).reduce(
          (acc, [key, val]) => {
            if (Array.isArray(val)) {
              acc[key] = val.join(',');
            } else {
              acc[key] = val as string;
            }
            return acc;
          },
          {} as Record<string, string>
        );
        onFieldChange(name, Array.isArray(value) ? value.join(',') : value, stringFilters);
      }

      return newFilters;
    });
  };

  const handleApplyFilters = () => {
    const activeFilters = Object.entries(filters).reduce(
      (acc, [key, value]) => {
        if (Array.isArray(value)) {
          // For array values (multiselect), join with comma
          if (value.length > 0) {
            acc[key] = value.join(',');
          }
        } else if (value && value !== 'all') {
          acc[key] = value;
        }
        return acc;
      },
      {} as Record<string, string>
    );
    onFilter(activeFilters);
  };

  const handleReset = () => {
    setFilters({});
    onReset();
  };

  const hasActiveFilters = Object.values(filters).some((value) => {
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return value && value !== 'all';
  });

  const activeFiltersCount = Object.values(filters).filter((value) => {
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return value && value !== 'all';
  }).length;

  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFiltersCount} active
                </Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {fields.map((field) => {
              // Handle daterange fields separately to span 2 columns
              if (field.type === 'daterange' && field.startDateName && field.endDateName) {
                const startName = field.startDateName;
                const endName = field.endDateName;
                return (
                  <div key={field.name} className="grid grid-cols-2 gap-4 lg:col-span-2">
                    {/* Start Date */}
                    <div className="space-y-2">
                      <Label htmlFor={startName} className="text-sm font-medium">
                        From Date
                      </Label>
                      <DatePicker
                        value={filters[startName] ? new Date(filters[startName] as string) : null}
                        onChange={(date) => {
                          const dateString = date ? date.toISOString().split('T')[0] : '';
                          handleFilterChange(startName, dateString);
                        }}
                        placeholder="Select start date"
                        disabled={field.disabled}
                      />
                    </div>

                    {/* End Date */}
                    <div className="space-y-2">
                      <Label htmlFor={endName} className="text-sm font-medium">
                        To Date
                      </Label>
                      <DatePicker
                        value={filters[endName] ? new Date(filters[endName] as string) : null}
                        onChange={(date) => {
                          const dateString = date ? date.toISOString().split('T')[0] : '';
                          handleFilterChange(endName, dateString);
                        }}
                        placeholder="Select end date"
                        disabled={field.disabled}
                        minDate={
                          filters[startName] ? new Date(filters[startName] as string) : undefined
                        }
                      />
                    </div>
                  </div>
                );
              }

              // Regular fields
              return (
                <div key={field.name} className="space-y-2">
                  <Label htmlFor={field.name} className="text-sm font-medium">
                    {field.label}
                  </Label>

                  {field.type === 'text' && (
                    <Input
                      id={field.name}
                      placeholder={field.placeholder}
                      value={(filters[field.name] as string) || ''}
                      onChange={(e) => handleFilterChange(field.name, e.target.value)}
                    />
                  )}

                  {field.type === 'combobox' && field.options && (
                    <Combobox
                      options={[{ value: 'all', label: 'All' }, ...field.options]}
                      value={(filters[field.name] as string) || 'all'}
                      onValueChange={(value) => {
                        handleFilterChange(field.name, value);
                      }}
                      placeholder={field.placeholder || 'Select...'}
                      searchPlaceholder={field.searchPlaceholder || 'Search...'}
                      emptyText={field.emptyText || 'No results found.'}
                      disabled={field.disabled}
                    />
                  )}

                  {field.type === 'select' &&
                    field.options &&
                    (() => {
                      // Automatically enable search if options exceed threshold (default 10)
                      const threshold = field.searchThreshold ?? 10;
                      const shouldUseCombobox =
                        field.searchable || field.options.length > threshold;

                      return shouldUseCombobox ? (
                        <Combobox
                          options={[{ value: 'all', label: 'All' }, ...field.options]}
                          value={(filters[field.name] as string) || 'all'}
                          onValueChange={(value) => {
                            handleFilterChange(field.name, value);
                          }}
                          placeholder={field.placeholder || 'Select...'}
                          searchPlaceholder={field.searchPlaceholder || 'Search...'}
                          emptyText={field.emptyText || 'No results found.'}
                          disabled={field.disabled}
                        />
                      ) : (
                        <Select
                          key={`${field.name}-${field.options.length}-${field.disabled}`}
                          value={(filters[field.name] as string) || 'all'}
                          onValueChange={(value) => {
                            handleFilterChange(field.name, value);
                          }}
                          disabled={field.disabled}
                        >
                          <SelectTrigger id={field.name}>
                            <SelectValue placeholder={field.placeholder || 'Select...'} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            {field.options.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      );
                    })()}

                  {field.type === 'multiselect' && field.options && (
                    <div className="space-y-2">
                      <Select
                        key={`${field.name}-${field.options.length}-${field.disabled}`}
                        value=""
                        onValueChange={(value) => {
                          if (value && value !== 'all') {
                            const currentValues = Array.isArray(filters[field.name])
                              ? (filters[field.name] as string[])
                              : [];
                            if (!currentValues.includes(value)) {
                              handleFilterChange(field.name, [...currentValues, value]);
                            }
                          }
                        }}
                        disabled={field.disabled}
                      >
                        <SelectTrigger id={field.name}>
                          <SelectValue placeholder={field.placeholder || 'Select...'} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Select an option</SelectItem>
                          {field.options
                            .filter((opt) => {
                              const currentValues = Array.isArray(filters[field.name])
                                ? (filters[field.name] as string[])
                                : [];
                              return !currentValues.includes(opt.value);
                            })
                            .map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>

                      {/* Selected items as chips */}
                      {Array.isArray(filters[field.name]) &&
                        (filters[field.name] as string[]).length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {(filters[field.name] as string[]).map((value) => {
                              const option = field.options?.find((opt) => opt.value === value);
                              return (
                                <Badge key={value} variant="secondary" className="gap-1">
                                  <span>{option?.label || value}</span>
                                  {!field.disabled && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const currentValues = filters[field.name] as string[];
                                        handleFilterChange(
                                          field.name,
                                          currentValues.filter((v) => v !== value)
                                        );
                                      }}
                                      className="rounded-full p-0.5 hover:bg-muted"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  )}
                                </Badge>
                              );
                            })}
                          </div>
                        )}
                    </div>
                  )}

                  {field.type === 'date' && (
                    <DatePicker
                      value={filters[field.name] ? new Date(filters[field.name] as string) : null}
                      onChange={(date) => {
                        const dateString = date ? date.toISOString().split('T')[0] : '';
                        handleFilterChange(field.name, dateString);
                      }}
                      placeholder={field.placeholder || 'Select date'}
                      disabled={field.disabled}
                    />
                  )}

                  {field.type === 'custom' && field.customComponent}
                </div>
              );
            })}
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleApplyFilters} size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Apply Filters
            </Button>
            {hasActiveFilters && (
              <Button onClick={handleReset} variant="outline" size="sm">
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
