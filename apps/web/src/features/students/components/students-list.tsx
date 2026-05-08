/**
 * Students List Component
 * Displays the table with filtering, search, and pagination capabilities
 * Following the pattern from teachers-list.tsx
 */

import { useState } from 'react';
import { Plus, Filter, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DataTable } from '@/components/ui/data-table';
import { ResourceFilter, type FilterField } from '@/components/filters/resource-filter';
import { PageHeader, DeletedViewToggle } from '@/components/common';
import type { StudentListItem } from '../types';
import type { PaginationInfo } from '@/components/ui/data-table';
import { getStudentColumns } from './student-table-columns';
import { BulkUploadStudentsDialog } from './bulk-upload-students-dialog';
import {
  getListTitle,
  getListDescription,
  getEmptyMessage,
} from '@/lib/utils/deleted-view-helpers';
import { useClasses } from '@/features/classes/hooks/use-classes';

interface StudentsListProps {
  students: StudentListItem[];
  isLoading: boolean;
  error?: Error | null;
  pagination?: PaginationInfo;
  showDeleted?: boolean;
  onToggleDeleted?: () => void;
  onCreateNew: () => void;
  onView: (student: StudentListItem) => void;
  onEdit: (student: StudentListItem) => void;
  onDelete?: (student: StudentListItem) => void;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onSearch?: (query: string) => void;
  onFilterChange?: (filters: Record<string, string>) => void;
  canCreateStudents?: boolean;  // NEW: Whether user can create students
  isClassTeacher?: boolean;      // NEW: Whether user is a class teacher
}

export function StudentsList({
  students,
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
  canCreateStudents = true,  // Default true for admins
  isClassTeacher = false,
}: StudentsListProps) {
  const [appliedSearchQuery, setAppliedSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);

  // Fetch classes for filter options
  const { data: classesData } = useClasses({ page_size: 100 });
  const classes = classesData?.data || [];

  const classOptions = classes.map((cls) => ({
    value: cls.public_id,
    label: `${cls.class_master.name} - ${cls.name}`,
  }));

  const filterFields: FilterField[] = [
    {
      name: 'search',
      label: 'Search',
      type: 'text',
      placeholder: 'Search by name, email, roll number, or admission number...',
    },
    {
      name: 'class_assigned__public_id',
      label: 'Class',
      type: 'select',
      placeholder: 'All classes',
      options: classOptions,
      searchable: true,
    },
    {
      name: 'user__gender',
      label: 'Gender',
      type: 'select',
      placeholder: 'All genders',
      options: [
        { value: 'M', label: 'Male' },
        { value: 'F', label: 'Female' },
        { value: 'O', label: 'Other' },
      ],
    },
    {
      name: 'admission_date_from',
      label: 'Admission Date From',
      type: 'date',
      placeholder: 'Start date',
    },
    {
      name: 'admission_date_to',
      label: 'Admission Date To',
      type: 'date',
      placeholder: 'End date',
    },
  ];

  const columns = getStudentColumns({
    onView,
    onEdit,
    onDelete: onDelete || (() => {}),
    isDeletedView: showDeleted,
    isClassTeacher,  // Pass to columns for conditional Edit/Delete
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={getListTitle('Students', showDeleted)}
        description={getListDescription('Students', showDeleted)}
        actions={[
          ...(!showDeleted && canCreateStudents
            ? [
                {
                  label: 'Add Student',
                  onClick: onCreateNew,
                  variant: 'brand' as const,
                  icon: Plus,
                },
              ]
            : []),
        ]}
      >
        <div className="flex gap-2 items-center">
          {onToggleDeleted && (
            <DeletedViewToggle
              showDeleted={showDeleted}
              onToggle={onToggleDeleted}
              resourceName="students"
            />
          )}
          {!showDeleted && canCreateStudents && <BulkUploadStudentsDialog />}
        </div>
      </PageHeader>

      {/* Search and Filter Bar */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                {students.length} {students.length === 1 ? 'student' : 'students'} found
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
                {Object.entries(filters).map(([key, value]) => {
                  // Get label for class filter
                  let displayValue = value;
                  if (key === 'class_assigned__public_id') {
                    const classOption = classOptions.find((opt) => opt.value === value);
                    displayValue = classOption?.label || value;
                  } else if (key === 'user__gender') {
                    // Display gender labels
                    const genderLabels: Record<string, string> = {
                      M: 'Male',
                      F: 'Female',
                      O: 'Other',
                    };
                    displayValue = genderLabels[value] || value;
                  } else if (key === 'admission_date_from' || key === 'admission_date_to') {
                    // Format dates for display
                    displayValue = new Date(value).toLocaleDateString();
                  }

                  return (
                    <Badge key={key} variant="secondary" className="gap-1">
                      <span className="capitalize">
                        {key.replace(/_/g, ' ').replace('__', ': ')}: {displayValue}
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
                  );
                })}
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
          {/* Error State */}
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
            data={students}
            isLoading={isLoading}
            pagination={pagination}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
            emptyMessage={getEmptyMessage(
              'Students',
              !!(appliedSearchQuery || Object.keys(filters).length > 0),
              showDeleted
            )}
            emptyAction={
              !error &&
              !showDeleted &&
              !appliedSearchQuery &&
              Object.keys(filters).length === 0 &&
              students.length === 0
                ? {
                    label: 'Add Your First Student',
                    onClick: onCreateNew,
                  }
                : undefined
            }
            getRowKey={(row: StudentListItem) => row.public_id}
          />
        </CardContent>
      </Card>
    </div>
  );
}
