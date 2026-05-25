/**
 * Classes List Component
 * Displays the table with filtering, search, and pagination capabilities
 */

import type { PaginationInfo } from '@/components/ui/data-table';
import type { FilterField } from '@/components/filters/resource-filter';
import { ResourceListLayout } from '@/components/common/resource-list-layout';
import type { Class } from '../types';
import { createClassListColumns } from './class-table-columns';
import { BulkUploadDialog } from './bulk-upload-dialog';

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
  viewMode?: 'admin' | 'employee';
}

const filterFields: FilterField[] = [
  {
    name: 'search',
    label: 'Search',
    type: 'text',
    placeholder: 'Search by class, section, or teacher...',
  },
];

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

  const columns = createClassListColumns({
    onView,
    onEdit,
    onDelete,
    isDeletedView: showDeleted,
    viewMode,
  });

  return (
    <ResourceListLayout<Class>
      resourceName="Classes"
      resourceNameSingular="class"
      data={classes}
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
      headerExtra={!showDeleted && !isEmployeeView ? <BulkUploadDialog /> : undefined}
    />
  );
}
