/**
 * Students List Component
 * Displays the table with filtering, search, and pagination capabilities
 * Following the pattern from teachers-list.tsx
 */

import { useState } from 'react';
import { Plus, X, AlertCircle } from 'lucide-react';
import { GENDER_OPTIONS, API_CONFIG } from '@educard/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DataTable, type PaginationInfo } from '@/components/ui/data-table';
import { ResourceFilter, type FilterField } from '@/components/filters/resource-filter';
import { describeFilter } from '@/components/filters/filter-labels';
import { withClearedKeys } from '@/components/filters/filter-utils';
import { PageHeader, DeletedViewToggle, HeaderActionRows } from '@/components/common';
import type { StudentListItem } from '../types';
import { getStudentColumns } from './student-table-columns';
import { BulkUploadStudentsDialog } from './bulk-upload-students-dialog';
import { ExportStudentsDialog } from './export-students-dialog';
import { ResetClassPasswordsDialog } from './reset-class-passwords-dialog';
import { SetTemporaryPasswordDialog } from './set-temporary-password-dialog';
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
  canCreateStudents?: boolean; // NEW: Whether user can create students
  isClassTeacher?: boolean; // NEW: Whether user is a class teacher
  isTeacherWithoutManagedClasses?: boolean;
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
  canCreateStudents = true, // Default true for admins
  isClassTeacher = false,
  isTeacherWithoutManagedClasses = false,
}: Readonly<StudentsListProps>) {
  const [appliedSearchQuery, setAppliedSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [tempPasswordStudent, setTempPasswordStudent] = useState<StudentListItem | null>(null);

  // Fetch classes for filter options
  const { data: classesData } = useClasses({ page_size: API_CONFIG.DROPDOWN_PAGE_SIZE });
  const classes = classesData?.data || [];

  const classOptions = classes.map((cls) => ({
    value: cls.public_id,
    label: `${cls.class_master?.name ?? ''} - ${cls.name}`,
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
      options: [...GENDER_OPTIONS],
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
    onSetTemporaryPassword: canCreateStudents ? setTempPasswordStudent : undefined,
    isDeletedView: showDeleted,
    isClassTeacher, // Pass to columns for conditional Edit/Delete
  });

  const showCreateActions = !showDeleted && canCreateStudents;
  const showExportAction = !showDeleted;
  const showTopToggle = !!onToggleDeleted;

  return (
    <div className="space-y-6">
      <SetTemporaryPasswordDialog
        student={tempPasswordStudent}
        onOpenChange={(next) => !next && setTempPasswordStudent(null)}
      />
      {/* Header */}
      <PageHeader
        title={getListTitle('Students', showDeleted)}
        description={getListDescription('Students', showDeleted)}
        actions={[]}
      >
        <HeaderActionRows
          primaryAction={
            showCreateActions ? (
              <Button onClick={onCreateNew} variant="brand" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Student
              </Button>
            ) : undefined
          }
          topRightAction={
            showTopToggle ? (
              <DeletedViewToggle
                showDeleted={showDeleted}
                onToggle={onToggleDeleted}
                resourceName="students"
              />
            ) : undefined
          }
          secondaryActions={
            showExportAction ? (
              <>
                <ExportStudentsDialog />
                {showCreateActions && <BulkUploadStudentsDialog />}
                {showCreateActions && <ResetClassPasswordsDialog />}
              </>
            ) : undefined
          }
        />
      </PageHeader>

      {!showDeleted && isTeacherWithoutManagedClasses && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-700" />
          <AlertDescription className="text-amber-900">
            You are not eligible to add any student because you are not assigned as class teacher
            for any class.
          </AlertDescription>
        </Alert>
      )}

      {/* Search and Filter Bar */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <div className="text-muted-foreground text-sm">
                {students.length} {students.length === 1 ? 'student' : 'students'} found
              </div>
            </div>

            {/* Active filters display */}
            {Object.keys(filters).length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground text-sm">Active filters:</span>
                {Object.keys(filters).map((key) => {
                  const value = filters[key];

                  return (
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
                  );
                })}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const cleared = withClearedKeys(filters, {});
                    setFilters({});
                    setAppliedSearchQuery('');

                    // Update parent state
                    if (onSearch) {
                      onSearch('');
                    }
                    if (onFilterChange) {
                      onFilterChange(cleared);
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
            }}
            onReset={() => {
              // Reset local state
              setAppliedSearchQuery('');
              setFilters({});

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
              canCreateStudents &&
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
