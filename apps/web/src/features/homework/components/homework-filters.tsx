/**
 * Homework Filters Component
 * Filter controls for homework list
 */

import { memo, useCallback } from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';

import {
  HOMEWORK_STATUS_OPTIONS,
  HOMEWORK_PRIORITY_OPTIONS,
  type HomeworkListParams,
  type HomeworkStatus,
  type HomeworkPriority,
} from '../types';

interface HomeworkFiltersProps {
  filters: HomeworkListParams;
  onFiltersChange: (filters: HomeworkListParams) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  classOptions?: { value: string; label: string }[];
  subjectOptions?: { value: string; label: string }[];
}

export const HomeworkFilters = memo(
  ({
    filters,
    onFiltersChange,
    searchQuery,
    onSearchChange,
    classOptions = [],
    subjectOptions = [],
  }: HomeworkFiltersProps) => {
    const activeFilterCount = [
      filters.status,
      filters.priority,
      filters.class_public_id,
      filters.subject_public_id,
    ].filter(Boolean).length;

    const handleFilterChange = useCallback(
      (key: keyof HomeworkListParams, value: string | undefined) => {
        onFiltersChange({
          ...filters,
          [key]: value,
        });
      },
      [filters, onFiltersChange]
    );

    const clearFilters = useCallback(() => {
      onFiltersChange({});
      onSearchChange('');
    }, [onFiltersChange, onSearchChange]);

    return (
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative w-full max-w-sm">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search homework..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <SearchableSelect
            options={[
              { value: 'all', label: 'All Status' },
              ...HOMEWORK_STATUS_OPTIONS.map((opt) => ({
                value: opt.value,
                label: opt.label,
              })),
            ]}
            value={filters.status || 'all'}
            onValueChange={(value) =>
              handleFilterChange('status', value === 'all' ? undefined : (value as HomeworkStatus))
            }
            placeholder="Status"
            className="w-[130px]"
          />

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="leading-none font-medium">Filters</h4>
                  <p className="text-muted-foreground text-sm">Narrow down your homework list</p>
                </div>

                <div className="grid gap-3">
                  <div className="grid gap-1.5">
                    <Label>Priority</Label>
                    <SearchableSelect
                      options={[
                        { value: 'all', label: 'All Priorities' },
                        ...HOMEWORK_PRIORITY_OPTIONS.map((opt) => ({
                          value: opt.value,
                          label: opt.label,
                        })),
                      ]}
                      value={filters.priority || 'all'}
                      onValueChange={(value) =>
                        handleFilterChange(
                          'priority',
                          value === 'all' ? undefined : (value as HomeworkPriority)
                        )
                      }
                      placeholder="All Priorities"
                    />
                  </div>

                  {classOptions.length > 0 && (
                    <div className="grid gap-1.5">
                      <Label>Class</Label>
                      <SearchableSelect
                        options={[{ value: 'all', label: 'All Classes' }, ...classOptions]}
                        value={filters.class_public_id || 'all'}
                        onValueChange={(value) =>
                          handleFilterChange('class_public_id', value === 'all' ? undefined : value)
                        }
                        placeholder="All Classes"
                        searchPlaceholder="Search classes..."
                      />
                    </div>
                  )}

                  {subjectOptions.length > 0 && (
                    <div className="grid gap-1.5">
                      <Label>Subject</Label>
                      <SearchableSelect
                        options={[{ value: 'all', label: 'All Subjects' }, ...subjectOptions]}
                        value={filters.subject_public_id || 'all'}
                        onValueChange={(value) =>
                          handleFilterChange(
                            'subject_public_id',
                            value === 'all' ? undefined : value
                          )
                        }
                        placeholder="All Subjects"
                        searchPlaceholder="Search subjects..."
                      />
                    </div>
                  )}
                </div>

                {activeFilterCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="w-full text-red-500 hover:text-red-600"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Clear All Filters
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    );
  }
);

export default HomeworkFilters;
