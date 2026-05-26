/**
 * Subjects List Component
 * Displays the table with filtering, search, and pagination capabilities
 */

import { useMemo } from 'react';
import type { PaginationInfo } from '@/components/ui/data-table';
import type { FilterField } from '@/components/filters/resource-filter';
import { ResourceListLayout } from '@/components/common/resource-list-layout';
import type { Subject } from '../types';
import { createSubjectListColumns } from './subject-table-columns';
import { BulkUploadSubjectsDialog } from './bulk-upload-dialog';
import { useClasses } from '@/features/classes/hooks/use-classes';
import { useSubjectMasters } from '@/features/core/hooks/use-subject-masters';
import { useTeachers } from '@/features/teachers';

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
    <ResourceListLayout<Subject>
      resourceName="Subjects"
      resourceNameSingular="subject"
      data={subjects}
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
      headerExtra={showDeleted ? undefined : <BulkUploadSubjectsDialog />}
    />
  );
}
