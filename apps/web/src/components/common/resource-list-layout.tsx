/**
 * ResourceListLayout - Reusable list page layout for entity management
 * Eliminates duplicate code across classes-list, subjects-list, teachers-list, etc.
 * Provides: PageHeader, Filter bar with active filters, DataTable with error state
 */

import { useState } from 'react';
import { Plus, Filter, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DataTable, type PaginationInfo, type Column } from '@/components/ui/data-table';
import { ResourceFilter, type FilterField } from '@/components/filters/resource-filter';
import { PageHeader } from './page-header';
import { DeletedViewToggle } from './deleted-view-toggle';
import {
  getListTitle,
  getListDescription,
  getEmptyMessage,
} from '@/lib/utils/deleted-view-helpers';

// --- Types ---

export interface ResourceListProps<TData> {
  /** Resource name (e.g. 'Classes', 'Teachers', 'Subjects') */
  resourceName: string;
  /** Singular form for count display (e.g. 'class', 'teacher', 'subject') */
  resourceNameSingular?: string;
  /** Data array */
  data: TData[];
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error?: Error | null;
  /** Pagination info from API */
  pagination?: PaginationInfo;
  /** Table column definitions */
  columns: Column<TData>[];
  /** Filter field definitions */
  filterFields: FilterField[];
  /** Whether showing deleted records */
  showDeleted?: boolean;
  /** Toggle between active/deleted view */
  onToggleDeleted?: () => void;
  /** Navigate to create form */
  onCreateNew: () => void;
  /** Page change handler */
  onPageChange?: (page: number) => void;
  /** Page size change handler */
  onPageSizeChange?: (pageSize: number) => void;
  /** Search handler */
  onSearch?: (query: string) => void;
  /** Filter change handler */
  onFilterChange?: (filters: Record<string, string>) => void;
  /** Get unique key for each row */
  getRowKey: (row: TData, index: number) => string | number;
  /** Additional header actions (e.g. BulkUpload button) */
  headerExtra?: React.ReactNode;
  /** Label for the create button */
  createButtonLabel?: string;
  /** Label for the empty state action */
  emptyActionLabel?: string;
  /** View mode for conditional rendering */
  viewMode?: 'admin' | 'employee';
}

// --- Component ---

export function ResourceListLayout<TData>({
  resourceName,
  resourceNameSingular,
  data,
  isLoading,
  error,
  pagination,
  columns,
  filterFields,
  showDeleted = false,
  onToggleDeleted,
  onCreateNew,
  onPageChange,
  onPageSizeChange,
  onSearch,
  onFilterChange,
  getRowKey,
  headerExtra,
  createButtonLabel,
  emptyActionLabel,
  viewMode = 'admin',
}: ResourceListProps<TData>) {
  const isEmployeeView = viewMode === 'employee';
  const [appliedSearchQuery, setAppliedSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);

  const singular = resourceNameSingular || resourceName.toLowerCase().replace(/s$/, '');
  const itemCount = data.length;

  const handleFilterApply = (appliedFilters: Record<string, string>) => {
    const { search, ...otherFilters } = appliedFilters;
    setAppliedSearchQuery(search || '');
    setFilters(otherFilters);
    if (onSearch) {
      onSearch(search || '');
    }
    if (onFilterChange) {
      onFilterChange(otherFilters);
    }
  };

  const handleFilterReset = () => {
    setAppliedSearchQuery('');
    setFilters({});
    if (onSearch) {
      onSearch('');
    }
    if (onFilterChange) {
      onFilterChange({});
    }
  };

  const handleRemoveFilter = (key: string) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    setFilters(newFilters);
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };

  const handleClearAll = () => {
    setFilters({});
    setAppliedSearchQuery('');
    setShowFilters(false);
    if (onSearch) {
      onSearch('');
    }
    if (onFilterChange) {
      onFilterChange({});
    }
  };

  const hasActiveFilters = Object.keys(filters).length > 0;
  const hasSearchOrFilters = !!(appliedSearchQuery || hasActiveFilters);

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={isEmployeeView ? resourceName : getListTitle(resourceName, showDeleted)}
        description={
          isEmployeeView
            ? `View all ${resourceName.toLowerCase()} in your organization`
            : getListDescription(resourceName, showDeleted)
        }
        actions={[
          ...(!showDeleted && !isEmployeeView
            ? [
                {
                  label:
                    createButtonLabel ||
                    `Add ${singular.charAt(0).toUpperCase() + singular.slice(1)}`,
                  onClick: onCreateNew,
                  variant: 'brand' as const,
                  icon: Plus,
                },
              ]
            : []),
        ]}
      >
        <div className="flex items-center gap-2">
          {onToggleDeleted && !isEmployeeView && (
            <DeletedViewToggle
              showDeleted={showDeleted}
              onToggle={onToggleDeleted}
              resourceName={resourceName.toLowerCase()}
            />
          )}
          {headerExtra}
        </div>
      </PageHeader>

      {/* Search and Filter Bar */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <div className="text-muted-foreground text-sm">
                {itemCount} {itemCount === 1 ? singular : resourceName.toLowerCase()} found
              </div>
              <Button
                variant={showFilters ? 'default' : 'outline'}
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
            </div>

            {/* Active filters display */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground text-sm">Active filters:</span>
                {Object.entries(filters).map(([key, value]) => (
                  <Badge key={key} variant="secondary" className="gap-1">
                    <span className="capitalize">
                      {key.replaceAll('_', ' ')}: {value}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFilter(key)}
                      className="hover:bg-muted rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <Button variant="ghost" size="sm" onClick={handleClearAll}>
                  Clear all
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        {/* Filter Panel */}
        {showFilters && (
          <div className="px-6 pb-6">
            <ResourceFilter
              fields={filterFields}
              onFilter={handleFilterApply}
              onReset={handleFilterReset}
              defaultValues={{ search: appliedSearchQuery, ...filters }}
            />
          </div>
        )}
      </Card>

      {/* Table Card with Loading and Error States */}
      <Card>
        <CardContent className="p-6">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Error loading data:</strong>{' '}
                {error.message ||
                  'An unexpected error occurred. Please try adjusting your filters.'}
              </AlertDescription>
            </Alert>
          )}

          <DataTable
            columns={columns}
            data={data}
            isLoading={isLoading}
            pagination={pagination}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
            emptyMessage={getEmptyMessage(resourceName, hasSearchOrFilters, showDeleted)}
            emptyAction={
              !error && !showDeleted && !hasSearchOrFilters && data.length === 0
                ? {
                    label:
                      emptyActionLabel ||
                      `Add Your First ${singular.charAt(0).toUpperCase() + singular.slice(1)}`,
                    onClick: onCreateNew,
                  }
                : undefined
            }
            getRowKey={getRowKey}
          />
        </CardContent>
      </Card>
    </div>
  );
}
