/**
 * Exceptional Work Policy Management Component
 * Role-aware component that adapts UI based on user permissions
 */

import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  Edit,
  Filter,
  Loader2,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { DeleteConfirmationDialog, PageHeader } from '@/components/common';
import { ResourceFilter, type FilterField } from '@/components/filters/resource-filter';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { useRole } from '@/hooks/use-role';
import { cn } from '@/lib/utils';
import { fetchCalendarExceptions } from '../api/calendar-exception-api';
import { useDeleteCalendarException } from '../hooks';
import type { CalendarException } from '../types';
import { ExceptionDialog } from './exception-dialog';

export function ExceptionalWorkManagement() {
  // Get user role for conditional rendering
  const { role } = useRole();
  const isAdmin = role === 'ADMIN';

  // State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingException, setEditingException] = useState<CalendarException | undefined>();
  const [deletingException, setDeletingException] = useState<CalendarException | undefined>();
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);

  // Fetch exceptions
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['calendar-exceptions', page, pageSize, filters],
    queryFn: () =>
      fetchCalendarExceptions({
        page,
        page_size: pageSize,
        ordering: '-date',
        override_type: filters.override_type as 'FORCE_WORKING' | 'FORCE_HOLIDAY' | undefined,
        from_date: filters.from_date,
        to_date: filters.to_date,
      }),
  });

  const exceptions = data?.data || [];
  const totalCount = data?.pagination?.count || 0;
  const totalPages = data?.pagination?.total_pages || 0;

  // Filter fields configuration
  const filterFields: FilterField[] = [
    {
      name: 'override_type',
      label: 'Exception Type',
      type: 'select',
      placeholder: 'All types',
      options: [
        { value: 'FORCE_WORKING', label: 'Force Working' },
        { value: 'FORCE_HOLIDAY', label: 'Force Holiday' },
      ],
    },
    {
      name: 'from_date',
      label: 'From Date',
      type: 'date',
      placeholder: 'Select start date',
    },
    {
      name: 'to_date',
      label: 'To Date',
      type: 'date',
      placeholder: 'Select end date',
    },
  ];

  // Handlers
  const handleFilter = (appliedFilters: Record<string, string>) => {
    setFilters(appliedFilters);
    setPage(1); // Reset to first page when filtering
  };

  const handleResetFilters = () => {
    setFilters({});
    setPage(1);
  };

  // Delete mutation
  const deleteMutation = useDeleteCalendarException({
    onSuccess: () => {
      setDeletingException(undefined);
    },
    onError: () => {
      setDeletingException(undefined);
    },
  });

  // Table columns
  const columns = [
    {
      header: 'Date',
      accessor: (row: CalendarException) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <span className="font-medium">{format(new Date(row.date), 'MMM dd, yyyy')}</span>
        </div>
      ),
      sortable: true,
      sortKey: 'date',
    },
    {
      header: 'Type',
      accessor: (row: CalendarException) => {
        const isForceWorking = row.override_type === 'FORCE_WORKING';
        return (
          <Badge
            variant="secondary"
            className={cn(
              'font-medium',
              isForceWorking
                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                : 'bg-red-100 text-red-800 hover:bg-red-200'
            )}
          >
            <div className="flex items-center gap-1.5">
              <div
                className={cn(
                  'h-2 w-2 rounded-full',
                  isForceWorking ? 'bg-green-600' : 'bg-red-600'
                )}
              />
              {isForceWorking ? 'Force Working' : 'Force Holiday'}
            </div>
          </Badge>
        );
      },
      sortable: true,
      sortKey: 'override_type',
    },
    {
      header: 'Student Scope',
      accessor: (row: CalendarException) => {
        if (row.is_applicable_to_all_classes) {
          return (
            <Badge variant="outline" className="font-normal">
              All Classes
            </Badge>
          );
        }
        return (
          <Badge variant="outline" className="font-normal">
            {row.classes.length} {row.classes.length === 1 ? 'Class' : 'Classes'}
          </Badge>
        );
      },
    },
    {
      header: 'Teacher Scope',
      accessor: (row: CalendarException) => {
        if (row.is_applicable_to_all_teachers) {
          return (
            <Badge variant="default" className="font-normal bg-blue-100 text-blue-700 border-blue-200">
              All Teachers
            </Badge>
          );
        }
        return (
          <Badge variant="outline" className="font-normal text-gray-500">
            Students Only
          </Badge>
        );
      },
    },
    {
      header: 'Reason',
      accessor: (row: CalendarException) => (
        <div className="max-w-md truncate text-sm text-gray-600">{row.reason}</div>
      ),
    },
    // Conditionally add Actions column for admin users only
    ...(isAdmin
      ? [
          {
            header: 'Actions',
            accessor: (row: CalendarException) => (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingException(row)}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeletingException(row)}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ),
          },
        ]
      : []),
  ];


  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Exceptional Work Policy"
          description="Manage working day exceptions for specific dates and classes"
        />
        <Alert variant="destructive">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle>Error Loading Exceptions</AlertTitle>
          <AlertDescription>
            {(error as Error)?.message || 'Failed to load calendar exceptions'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Exceptional Work Policy"
        description={
          isAdmin
            ? 'Manage working day exceptions for specific dates and classes'
            : 'View working day exceptions for specific dates and classes'
        }
      >
        {/* Add Exception button - Admin only */}
        {isAdmin && (
          <Button
            onClick={() => setShowAddDialog(true)}
            variant="brand"
            className="shadow-sm hover:shadow-md transition-all"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Exception
          </Button>
        )}
      </PageHeader>

      {/* Info Card - Redesigned */}
      <Card className="border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50 via-white to-violet-50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-purple-900">
            <AlertTriangle className="h-5 w-5 text-purple-600" />
            About Exceptional Work Policy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="mt-1 rounded-full bg-green-100 p-1.5">
              <div className="h-2 w-2 rounded-full bg-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">Force Working</p>
              <p className="text-sm text-gray-600">
                Override holidays/weekends to make specific dates working days. Useful for makeup
                classes, special events, or exam days.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-1 rounded-full bg-red-100 p-1.5">
              <div className="h-2 w-2 rounded-full bg-red-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">Force Holiday</p>
              <p className="text-sm text-gray-600">
                Override working days to give holidays for specific dates. Useful for extended
                holidays or special circumstances.
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-3">
            <p className="text-sm text-amber-900">
              <span className="font-semibold">Note:</span> These exceptions override the standard
              working day policy and holiday calendar.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Exceptions Table with Filters */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-violet-50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Calendar Exceptions</CardTitle>
              <CardDescription>
                {totalCount > 0
                  ? `${totalCount} exception${totalCount > 1 ? 's' : ''} configured`
                  : 'No exceptions configured yet'}
              </CardDescription>
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
            <div className="flex items-center gap-2 flex-wrap mt-4">
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
                      setPage(1);
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
                onClick={handleResetFilters}
                className="h-7 px-2 text-xs"
              >
                Clear all
              </Button>
            </div>
          )}
        </CardHeader>

        {/* Filters Section */}
        {showFilters && (
          <div className="border-b bg-gray-50/50 px-6 py-4">
            <ResourceFilter
              fields={filterFields}
              onFilter={handleFilter}
              onReset={handleResetFilters}
            />
          </div>
        )}

        {/* Table Content */}
        <CardContent className="p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="mb-4 h-12 w-12 animate-spin text-purple-600" />
              <p className="text-gray-600">Loading exceptions...</p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={exceptions}
              getRowKey={(row: CalendarException) => row.public_id}
              pagination={{
                current_page: page,
                total_pages: totalPages,
                count: totalCount,
                page_size: pageSize,
                has_next: page < totalPages,
                has_previous: page > 1,
                next_page: page < totalPages ? page + 1 : null,
                previous_page: page > 1 ? page - 1 : null,
              }}
              onPageChange={setPage}
              onPageSizeChange={(newSize: number) => {
                setPageSize(newSize);
                setPage(1);
              }}
              emptyMessage="No exceptions configured yet"
              emptyAction={{
                label: 'Add Your First Exception',
                onClick: () => setShowAddDialog(true),
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <ExceptionDialog
        open={showAddDialog || !!editingException}
        onOpenChange={(open: boolean) => {
          if (!open) {
            setShowAddDialog(false);
            setEditingException(undefined);
          }
        }}
        exception={editingException}
        onSuccess={() => {
          setShowAddDialog(false);
          setEditingException(undefined);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={!!deletingException}
        onOpenChange={(open: boolean) => !open && setDeletingException(undefined)}
        onConfirm={() => {
          if (deletingException) {
            deleteMutation.mutate(deletingException.public_id);
          }
        }}
        title="Delete Exception"
        itemName={
          deletingException
            ? `exception for ${format(new Date(deletingException.date), 'MMM dd, yyyy')}`
            : ''
        }
        description="This will remove the exception and restore the standard working day policy for this date."
        isDeleting={deleteMutation.isPending}
        isSoftDelete={false}
      />
    </div>
  );
}
