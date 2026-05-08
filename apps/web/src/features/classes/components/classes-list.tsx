/**
 * Classes List Component
 * Displays the table with filtering, search, and pagination capabilities
 */

import { useState } from 'react';
import { Plus, Filter, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DataTable, type PaginationInfo } from '@/components/ui/data-table';
import { ResourceFilter, type FilterField } from '@/components/filters/resource-filter';
import { PageHeader, DeletedViewToggle } from '@/components/common';
import type { Class } from '../types';
import { createClassListColumns } from './class-table-columns';
import { BulkUploadDialog } from './bulk-upload-dialog';
import {
  getListTitle,
  getListDescription,
  getEmptyMessage,
} from '@/lib/utils/deleted-view-helpers';

interface ClassesListProps {
  classes: Class[];
  isLoading: boolean;
  error?: Error | null;
  pagination?: PaginationInfo;
  showDeleted?: boolean;
  onToggleDeleted?: () => void;
  onCreateNew: () => void;
  onView: (classItem: Class) => void;
  onEdit: (classItem: Class) => void;
  onDelete?: (classItem: Class) => void;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onSearch?: (query: string) => void;
  onFilterChange?: (filters: Record<string, string>) => void;
  viewMode?: 'admin' | 'employee'; // Admin = full CRUD, Employee = read-only
}

export function ClassesList({
  classes,
  isLoading,
  error,
  pagination,
  showDeleted = false,
  onToggleDeleted,
  onCreateNew,
  onView,
  onEdit,
  onDelete,
  onPageChange,
  onPageSizeChange,
  onSearch,
  onFilterChange,
  viewMode = 'admin',
}: ClassesListProps) {
  const isEmployeeView = viewMode === 'employee';
  const [appliedSearchQuery, setAppliedSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);

  const filterFields: FilterField[] = [
    {
      name: 'search',
      label: 'Search',
      type: 'text',
      placeholder: 'Search by class, section, or teacher...',
    },
  ];

  const columns = createClassListColumns({
    onView,
    onEdit,
    onDelete,
    isDeletedView: showDeleted,
    viewMode, // Pass viewMode to configure columns
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={isEmployeeView ? 'Classes' : getListTitle('Classes', showDeleted)}
        description={
          isEmployeeView
            ? 'View all classes in your organization'
            : getListDescription('Classes', showDeleted)
        }
        actions={[
          ...(!showDeleted && !isEmployeeView
            ? [
                {
                  label: 'Add Class',
                  onClick: onCreateNew,
                  variant: 'brand' as const,
                  icon: Plus,
                },
              ]
            : []),
        ]}
      >
        <div className="flex gap-2 items-center">
          {onToggleDeleted && !isEmployeeView && (
            <DeletedViewToggle
              showDeleted={showDeleted}
              onToggle={onToggleDeleted}
              resourceName="classes"
            />
          )}
          {!showDeleted && !isEmployeeView && <BulkUploadDialog />}
        </div>
      </PageHeader>

      {/* Search and Filter Bar */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                {classes.length} {classes.length === 1 ? 'class' : 'classes'} found
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
            {Object.keys(filters).length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {Object.entries(filters).map(([key, value]) => (
                  <Badge key={key} variant="secondary" className="gap-1">
                    <span className="capitalize">
                      {key.replace(/_/g, ' ')}: {value}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const newFilters = { ...filters };
                        delete newFilters[key];
                        setFilters(newFilters);

                        // Update parent state
                        if (onFilterChange) {
                          onFilterChange(newFilters);
                        }
                      }}
                      className="rounded-full p-0.5 hover:bg-muted"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFilters({});
                    setAppliedSearchQuery('');
                    setShowFilters(false);

                    // Update parent state
                    if (onSearch) {
                      onSearch('');
                    }
                    if (onFilterChange) {
                      onFilterChange({});
                    }
                  }}
                >
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
              onFilter={(appliedFilters: Record<string, string>) => {
                const { search, ...otherFilters } = appliedFilters;

                // Always update local state for UI display
                setAppliedSearchQuery(search || '');
                setFilters(otherFilters);

                // Call parent handlers if provided (for API calls)
                if (onSearch) {
                  onSearch(search || '');
                }
                if (onFilterChange) {
                  onFilterChange(otherFilters);
                }
              }}
              onReset={() => {
                // Reset local state
                setAppliedSearchQuery('');
                setFilters({});

                // Call parent handlers if provided (for API calls)
                if (onSearch) {
                  onSearch('');
                }
                if (onFilterChange) {
                  onFilterChange({});
                }
              }}
              defaultValues={{ search: appliedSearchQuery, ...filters }}
            />
          </div>
        )}
      </Card>

      {/* Table Card with Loading and Error States */}
      <Card>
        <CardContent className="p-6">
          {/* Error State - Show when filter causes error */}
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
            data={classes}
            isLoading={isLoading}
            pagination={pagination}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
            emptyMessage={getEmptyMessage(
              'Classes',
              !!(appliedSearchQuery || Object.keys(filters).length > 0),
              showDeleted
            )}
            emptyAction={
              !error &&
              !showDeleted &&
              !appliedSearchQuery &&
              Object.keys(filters).length === 0 &&
              classes.length === 0
                ? {
                    label: 'Add Your First Class',
                    onClick: onCreateNew,
                  }
                : undefined
            }
            getRowKey={(row: Class) => row.public_id}
          />
        </CardContent>
      </Card>
    </div>
  );
}
