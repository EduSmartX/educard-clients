/**
 * Teachers List Component
 * Displays the table with filtering, search, and pagination capabilities
 */

import { useMemo } from 'react';
import type { PaginationInfo } from '@/components/ui/data-table';
import type { FilterField } from '@/components/filters/resource-filter';
import { ResourceListLayout } from '@/components/common/resource-list-layout';
import type { Teacher } from '../types';
import { createTeacherListColumns } from './teacher-list-columns';
import { BulkUploadTeachersDialog } from './bulk-upload-dialog';

interface TeachersListProps {
  teachers: Teacher[];
  isLoading: boolean;
  error?: Error | null;
  pagination?: PaginationInfo;
  showDeleted?: boolean;
  onToggleDeleted?: () => void;
  onCreateNew: () => void;
  onView: (teacher: Teacher) => void;
  onEdit: (teacher: Teacher) => void;
  onDelete?: (teacher: Teacher) => void;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onSearch?: (query: string) => void;
  onFilterChange?: (filters: Record<string, string>) => void;
  viewMode?: 'admin' | 'employee';
}

export function TeachersList({
  teachers,
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
}: Readonly<TeachersListProps>) {
  const isEmployeeView = viewMode === 'employee';

  const filterFields: FilterField[] = useMemo(() => {
    const designations = Array.from(
      new Set(teachers.map((teacher) => teacher.designation).filter(Boolean))
    ).map((designation) => ({
      value: designation,
      label: designation,
    }));

    return [
      {
        name: 'search',
        label: 'Search',
        type: 'text',
        placeholder: 'Search by name, email, phone, or employee ID...',
      },
      {
        name: 'designation',
        label: 'Designation',
        type: 'select',
        placeholder: 'All designations',
        options: designations,
        searchable: true,
      },
      {
        name: 'gender',
        label: 'Gender',
        type: 'select',
        placeholder: 'All genders',
        options: [
          { value: 'M', label: 'Male' },
          { value: 'F', label: 'Female' },
          { value: 'O', label: 'Other' },
        ],
      },
    ];
  }, [teachers]);

  const columns = createTeacherListColumns({
    onView,
    onEdit,
    onDelete,
    isDeletedView: showDeleted,
    viewMode,
  });

  return (
    <ResourceListLayout<Teacher>
      resourceName="Teachers"
      resourceNameSingular="teacher"
      data={teachers}
      isLoading={isLoading}
      error={error}
      pagination={pagination}
      columns={columns}
      filterFields={filterFields}
      showDeleted={showDeleted}
      onToggleDeleted={onToggleDeleted}
      onCreateNew={onCreateNew}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      onSearch={onSearch}
      onFilterChange={onFilterChange}
      getRowKey={(row) => row.public_id}
      viewMode={viewMode}
      headerExtra={!showDeleted && !isEmployeeView ? <BulkUploadTeachersDialog /> : undefined}
    />
  );
}
