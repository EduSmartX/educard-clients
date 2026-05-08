/**
 * Subjects List Component
 * Displays the table with filtering, search, and pagination capabilities
 */

import { useState, useMemo } from 'react';
import { Plus, Filter, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DataTable } from '@/components/ui/data-table';
import { ResourceFilter, type FilterField } from '@/components/filters/resource-filter';
import { PageHeader, DeletedViewToggle } from '@/components/common';
import type { Subject } from '../types';
import type { PaginationInfo } from '@/components/ui/data-table';
import { createSubjectListColumns } from './subject-table-columns';
import { BulkUploadSubjectsDialog } from './bulk-upload-dialog';
import { useClasses } from '@/features/classes/hooks/use-classes';
import { useSubjectMasters } from '@/features/core/hooks/use-subject-masters';
import { useTeachers } from '@/features/teachers';
import {
  getListTitle,
  getListDescription,
  getEmptyMessage,
} from '@/lib/utils/deleted-view-helpers';

interface SubjectsListProps {
  subjects: Subject[];
  isLoading: boolean;
  error?: Error | null;
  pagination?: PaginationInfo;
  showDeleted?: boolean;
  onToggleDeleted?: () => void;
  onCreateNew: () => void;
  onView: (subject: Subject) => void;
  onEdit: (subject: Subject) => void;
  onDelete?: (subject: Subject) => void;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onSearch?: (query: string) => void;
  onFilterChange?: (filters: Record<string, string>) => void;
}

export function SubjectsList({
  subjects,
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
}: SubjectsListProps) {
  const [appliedSearchQuery, setAppliedSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);

  // Fetch data for filter dropdowns
  const { data: classesData } = useClasses({ page: 1, page_size: 100 });
  const { data: subjectMastersData } = useSubjectMasters();
  const { data: teachersData } = useTeachers({ page: 1, page_size: 100 });

  const filterFields: FilterField[] = useMemo(() => {
    const classes = classesData?.data || [];
    const subjectMasters = subjectMastersData?.data || [];
    const teachers = teachersData?.data || [];

    return [
      {
        name: 'search',
        label: 'Search',
        type: 'text',
        placeholder: 'Search by subject name, code, class, or teacher...',
      },
      {
        name: 'class_assigned',
        label: 'Class',
        type: 'combobox',
        placeholder: 'Select class...',
        searchPlaceholder: 'Search classes...',
        emptyText: 'No classes found',
        options: classes.map((classItem) => ({
          value: classItem.public_id,
          label: `${classItem.class_master.name} - ${classItem.name}`,
        })),
      },
      {
        name: 'subject_master',
        label: 'Subject Master',
        type: 'combobox',
        placeholder: 'Select subject...',
        searchPlaceholder: 'Search subjects...',
        emptyText: 'No subjects found',
        options: subjectMasters.map((subject) => ({
          value: subject.id.toString(),
          label: `${subject.name} (${subject.code})`,
        })),
      },
      {
        name: 'teacher',
        label: 'Teacher',
        type: 'combobox',
        placeholder: 'Select teacher...',
        searchPlaceholder: 'Search teachers...',
        emptyText: 'No teachers found',
        options: teachers.map((teacher) => ({
          value: teacher.public_id,
          label: `${teacher.full_name} (${teacher.employee_id})`,
        })),
      },
    ];
  }, [classesData, subjectMastersData, teachersData]);

  const columns = createSubjectListColumns({
    onView,
    onEdit,
    onDelete,
    isDeletedView: showDeleted,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={getListTitle('Subjects', showDeleted)}
        description={getListDescription('Subjects', showDeleted)}
        actions={[
          ...(!showDeleted
            ? [
                {
                  label: 'Add Subject',
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
              resourceName="subjects"
            />
          )}
          {!showDeleted && <BulkUploadSubjectsDialog />}
        </div>
      </PageHeader>

      {/* Search and Filter Bar */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                {subjects.length} {subjects.length === 1 ? 'subject' : 'subjects'} found
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
            data={subjects}
            isLoading={isLoading}
            pagination={pagination}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
            emptyMessage={getEmptyMessage(
              'Subjects',
              !!(appliedSearchQuery || Object.keys(filters).length > 0),
              showDeleted
            )}
            emptyAction={
              !error &&
              !showDeleted &&
              !appliedSearchQuery &&
              Object.keys(filters).length === 0 &&
              subjects.length === 0
                ? {
                    label: 'Add Your First Subject',
                    onClick: onCreateNew,
                  }
                : undefined
            }
            getRowKey={(row: Subject) => row.public_id}
          />
        </CardContent>
      </Card>
    </div>
  );
}
