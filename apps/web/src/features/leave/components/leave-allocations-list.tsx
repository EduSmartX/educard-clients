/**
 * Leave Allocations List Component
 * Displays the table with filtering, search, and pagination capabilities
 */

import { useState } from 'react';
import { Plus, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DataTable, type PaginationInfo } from '@/components/ui/data-table';
import { ResourceFilter, type FilterField } from '@/components/filters/resource-filter';
import { describeFilter } from '@/components/filters/filter-labels';
import { withClearedKeys } from '@/components/filters/filter-utils';
import { PageHeader } from '@/components/common';
import type { LeaveAllocation } from '@/lib/api/leave-api';
import { createLeaveAllocationColumns } from './leave-allocation-table-columns';
import { LeaveAllocationStats } from './leave-allocation-stats';
import { LeaveAllocationFeatureBanner } from './leave-allocation-feature-banner';
import { LeaveAllocationDeleteDialog } from './leave-allocation-delete-dialog';
import { useDeleteLeaveAllocation } from '../hooks/use-leave-allocations';

interface LeaveAllocationsListProps {
  allocations: LeaveAllocation[];
  isLoading: boolean;
  error?: Error | null;
  pagination?: PaginationInfo;
  onCreateNew: () => void;
  onView: (allocation: LeaveAllocation) => void;
  onEdit: (allocation: LeaveAllocation) => void;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onSearch?: (query: string) => void;
  onFilterChange?: (filters: Record<string, string>) => void;
  readOnly?: boolean;
}

function getEmptyMessage(
  error: Error | null | undefined,
  searchQuery: string,
  filters: Record<string, string>
): string {
  if (error) {
    return 'Unable to load data due to an error';
  }
  if (searchQuery || Object.keys(filters).length > 0) {
    return 'No policies found matching your filters';
  }
  return 'No leave allocation policies found';
}

export function LeaveAllocationsList({
  allocations,
  isLoading,
  error,
  pagination,
  onCreateNew,
  onView,
  onEdit,
  onPageChange,
  onPageSizeChange,
  onSearch,
  onFilterChange,
  readOnly = false,
}: Readonly<LeaveAllocationsListProps>) {
  const [appliedSearchQuery, setAppliedSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    allocation: LeaveAllocation | null;
  }>({
    open: false,
    allocation: null,
  });

  const deleteMutation = useDeleteLeaveAllocation();

  // Extract unique leave types and roles for filter options
  const leaveTypes = Array.from(
    new Set(
      allocations.map((a) => {
        const fullName = a.leave_type_name;
        const nameOnly = fullName.includes('(') ? fullName.split('(')[0].trim() : fullName;
        return nameOnly;
      })
    )
  ).map((name) => ({
    value: name,
    label: allocations.find((a) => a.leave_type_name.startsWith(name))?.leave_type_name || name,
  }));

  const allRoles = Array.from(
    new Set(
      allocations
        .filter((a) => !a.applies_to_all_roles && a.roles)
        .flatMap((a) => (a.roles ? a.roles.split(',').map((r: string) => r.trim()) : []))
    )
  ).map((role) => ({ value: role, label: role }));

  const filterFields: FilterField[] = [
    {
      name: 'search',
      label: 'Search',
      type: 'text',
      placeholder: 'Search by name, leave type, or role...',
    },
    {
      name: 'leave_type__name',
      label: 'Leave Type',
      type: 'select',
      placeholder: 'All leave types',
      options: leaveTypes,
      searchable: true,
    },
    {
      name: 'role',
      label: 'Role',
      type: 'select',
      placeholder: 'All roles',
      options: allRoles,
      searchable: true,
    },
  ];

  const handleDelete = (allocation: LeaveAllocation) => {
    setDeleteDialog({ open: true, allocation });
  };

  const confirmDelete = () => {
    if (deleteDialog.allocation) {
      deleteMutation.mutate(deleteDialog.allocation.public_id, {
        onSettled: () => {
          setDeleteDialog({ open: false, allocation: null });
        },
      });
    }
  };

  const columns = createLeaveAllocationColumns({
    onView,
    onEdit,
    onDelete: handleDelete,
    readOnly,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Leave Allocation Policies"
        description={
          readOnly
            ? 'View leave policies and entitlements'
            : 'Manage leave policies and entitlements for your organization'
        }
      >
        {!readOnly && (
          <Button
            onClick={onCreateNew}
            variant="brand"
            size="lg"
            className="gap-2 font-semibold shadow-md transition-all duration-200 hover:shadow-lg"
          >
            <Plus className="h-5 w-5" />
            <span>Create Policy</span>
          </Button>
        )}
      </PageHeader>

      {/* Feature Banner */}
      <LeaveAllocationFeatureBanner />

      {/* Stats Cards */}
      <LeaveAllocationStats allocations={allocations} />

      {/* Search and Filter Bar */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <div className="text-muted-foreground text-sm">
                {allocations.length} {allocations.length === 1 ? 'policy' : 'policies'} found
              </div>
            </div>

            {/* Active filters display */}
            {Object.keys(filters).length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground text-sm">Active filters:</span>
                {Object.entries(filters).map(([key, value]) => (
                  <Badge
                    key={key}
                    variant="default"
                    className="gap-1 border border-blue-200 bg-blue-100 text-blue-800 hover:bg-blue-200"
                  >
                    <span>{describeFilter(filterFields, key, value)}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const newFilters = { ...filters };
                        delete newFilters[key];
                        setFilters(newFilters);

                        // Update parent state
                        if (onFilterChange) {
                          onFilterChange({ ...newFilters, [key]: '' });
                        }
                      }}
                      className="hover:bg-muted rounded-full p-0.5"
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
                      onFilterChange(withClearedKeys(filters, {}));
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
        <div className="px-6 pb-6">
          <ResourceFilter
            fields={filterFields}
            onFilter={(appliedFilters: Record<string, string>) => {
              const { search, ...otherFilters } = appliedFilters;

              // Always update local state for UI display
              setAppliedSearchQuery(search || '');
              setFilters(otherFilters);

              if (onSearch) {
                onSearch(search || '');
              }
              if (onFilterChange) {
                onFilterChange(withClearedKeys(filters, otherFilters));
              }

              // Keep the filter panel open (removed setShowFilters(false))
            }}
            onReset={() => {
              // Reset local state
              setAppliedSearchQuery('');
              setFilters({});

              if (onSearch) {
                onSearch('');
              }
              if (onFilterChange) {
                onFilterChange(withClearedKeys(filters, {}));
              }

              // Keep the filter panel open (removed setShowFilters(false))
            }}
            defaultValues={{ search: appliedSearchQuery, ...filters }}
          />
        </div>
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
            data={allocations}
            isLoading={isLoading}
            pagination={pagination}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
            emptyMessage={getEmptyMessage(error, appliedSearchQuery, filters)}
            emptyAction={
              !error && !appliedSearchQuery && Object.keys(filters).length === 0
                ? {
                    label: 'Create Your First Policy',
                    onClick: onCreateNew,
                  }
                : undefined
            }
            getRowKey={(row: LeaveAllocation) => row.public_id}
          />
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <LeaveAllocationDeleteDialog
        open={deleteDialog.open}
        allocation={deleteDialog.allocation}
        isPending={deleteMutation.isPending}
        onOpenChange={(open) => !open && setDeleteDialog({ open, allocation: null })}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
