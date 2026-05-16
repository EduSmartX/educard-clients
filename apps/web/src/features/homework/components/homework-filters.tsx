/**
 * Homework Filters Component
 * Filter controls for homework list
 */

import { memo, useCallback } from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
          {/* Quick Status Filter */}
          <Select
            value={filters.status || 'all'}
            onValueChange={(value) =>
              handleFilterChange('status', value === 'all' ? undefined : (value as HomeworkStatus))
            }
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {HOMEWORK_STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* More Filters Popover */}
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
                  {/* Priority */}
                  <div className="grid gap-1.5">
                    <Label>Priority</Label>
                    <Select
                      value={filters.priority || 'all'}
                      onValueChange={(value) =>
                        handleFilterChange(
                          'priority',
                          value === 'all' ? undefined : (value as HomeworkPriority)
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Priorities" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Priorities</SelectItem>
                        {HOMEWORK_PRIORITY_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            <span className="flex items-center gap-2">
                              <span
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: opt.color }}
                              />
                              {opt.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Class */}
                  {classOptions.length > 0 && (
                    <div className="grid gap-1.5">
                      <Label>Class</Label>
                      <Select
                        value={filters.class_public_id || 'all'}
                        onValueChange={(value) =>
                          handleFilterChange('class_public_id', value === 'all' ? undefined : value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All Classes" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Classes</SelectItem>
                          {classOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Subject */}
                  {subjectOptions.length > 0 && (
                    <div className="grid gap-1.5">
                      <Label>Subject</Label>
                      <Select
                        value={filters.subject_public_id || 'all'}
                        onValueChange={(value) =>
                          handleFilterChange(
                            'subject_public_id',
                            value === 'all' ? undefined : value
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All Subjects" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Subjects</SelectItem>
                          {subjectOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Clear Button */}
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
