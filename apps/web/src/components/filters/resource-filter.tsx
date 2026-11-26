/**
 * Generic Resource Filter Component
 * Reusable filter for any resource with dynamic filter fields
 * Supports text inputs, selects, date pickers, combobox, and multiselect
 */

import { Filter, RotateCcw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Combobox } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { MultiSelect } from '@/components/ui/multi-select';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Badge } from '@/components/ui/badge';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import { formatLocalDate, parseLocalDate } from '@/lib/utils/date-utils';

/** Text inputs wait this long after the last keystroke before filtering. */
const DEFAULT_SEARCH_DEBOUNCE_MS = 3000;

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
  /** Debounce for text inputs. Blur and Enter still apply immediately. */
  searchDebounceMs?: number;
}

export function ResourceFilter({
  fields = [],
  onFilter,
  onReset,
  defaultValues = {},
  className = '',
  onFieldChange,
  searchDebounceMs = DEFAULT_SEARCH_DEBOUNCE_MS,
}: ResourceFilterProps) {
  // Multiselect values travel to the parent as "a,b" strings (see emit); turn them back
  // into lists when they come back in, or the picker would show nothing selected.
  const multiselectNames = fields
    .filter((field) => field.type === 'multiselect')
    .map((field) => field.name)
    .join('|');
  const normalize = useCallback(
    (values: Record<string, string | string[]>) => {
      const names = multiselectNames ? multiselectNames.split('|') : [];
      const result: Record<string, string | string[]> = { ...values };
      for (const name of names) {
        const value = result[name];
        if (typeof value === 'string') {
          result[name] = value.split(',').filter(Boolean);
        }
      }
      return result;
    },
    [multiselectNames]
  );

  const [filters, setFilters] = useState<Record<string, string | string[]>>(() =>
    normalize(defaultValues)
  );

  // Mirror the applied values so clearing/removing a filter upstream resets the
  // inputs. Compared by value because the parent passes a fresh object each render.
  const appliedSignature = JSON.stringify(defaultValues);
  useEffect(() => {
    setFilters(normalize(JSON.parse(appliedSignature) as Record<string, string | string[]>));
  }, [appliedSignature, normalize]);

  const emit = useCallback(
    (source: Record<string, string | string[]>) => {
      const activeFilters = Object.entries(source).reduce(
        (acc, [key, value]) => {
          if (Array.isArray(value)) {
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
    },
    [onFilter]
  );

  const {
    schedule: scheduleEmit,
    flush: flushEmit,
    cancel: cancelEmit,
  } = useDebouncedCallback(emit, searchDebounceMs);

  const handleFilterChange = (
    name: string,
    value: string | string[],
    options?: { debounced?: boolean }
  ) => {
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);

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

    if (options?.debounced) {
      scheduleEmit(newFilters);
      return;
    }

    // A picker change supersedes any half-typed text still waiting to fire.
    cancelEmit();
    emit(newFilters);
  };

  const handleReset = () => {
    cancelEmit();
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
                        value={parseLocalDate(filters[startName] as string) ?? null}
                        onChange={(date) => {
                          const dateString = date ? formatLocalDate(date) : '';
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
                        value={parseLocalDate(filters[endName] as string) ?? null}
                        onChange={(date) => {
                          const dateString = date ? formatLocalDate(date) : '';
                          handleFilterChange(endName, dateString);
                        }}
                        placeholder="Select end date"
                        disabled={field.disabled}
                        minDate={parseLocalDate(filters[startName] as string) ?? undefined}
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
                      onChange={(e) =>
                        handleFilterChange(field.name, e.target.value, { debounced: true })
                      }
                      onBlur={flushEmit}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          flushEmit();
                        }
                      }}
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
                      const threshold = field.searchThreshold ?? 10;
                      const showSearchThreshold = field.searchable ? 0 : threshold;

                      const options = [{ value: 'all', label: 'All' }, ...field.options];
                      return (
                        <SearchableSelect
                          options={options}
                          value={(filters[field.name] as string) || 'all'}
                          onValueChange={(value: string) => {
                            handleFilterChange(field.name, value);
                          }}
                          placeholder={field.placeholder || 'Select...'}
                          searchPlaceholder={field.searchPlaceholder || 'Search...'}
                          emptyText={field.emptyText || 'No results found.'}
                          disabled={field.disabled}
                          showSearchThreshold={showSearchThreshold}
                        />
                      );
                    })()}

                  {field.type === 'multiselect' && field.options && (
                    // Tick several in one go; the chosen ones show as badges in the box
                    // (each removable), like every other multi-select in the app.
                    <MultiSelect
                      options={field.options}
                      value={
                        Array.isArray(filters[field.name]) ? (filters[field.name] as string[]) : []
                      }
                      onChange={(values) => handleFilterChange(field.name, values)}
                      placeholder={field.placeholder || 'Select...'}
                      searchPlaceholder={field.searchPlaceholder || 'Search...'}
                      emptyMessage={field.emptyText || 'No results found.'}
                      disabled={field.disabled}
                      maxBadges={3}
                    />
                  )}

                  {field.type === 'date' && (
                    <DatePicker
                      value={parseLocalDate(filters[field.name] as string) ?? null}
                      onChange={(date) => {
                        const dateString = date ? formatLocalDate(date) : '';
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

          {hasActiveFilters && (
            <div className="flex gap-2 pt-2">
              <Button onClick={handleReset} variant="outline" size="sm">
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
