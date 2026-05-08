/**
 * Classes Management Page
 * Main page for managing classes with table, filters, and CRUD operations
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { DeleteConfirmationDialog, ReactivateConfirmationDialog } from '@/components/common';
import { ErrorMessages, SuccessMessages } from '@/constants';
import { useClasses } from '../hooks/use-classes';
import { useDeleteClass, useReactivateClass } from '../hooks/mutations';
import { ClassesList } from './classes-list';
import { ROUTES } from '@/constants/app-config';
import { useDeletedView } from '@/hooks/use-deleted-view';
import type { Class } from '../types';

interface ClassesManagementProps {
  viewMode?: 'admin' | 'employee'; // Admin = full CRUD, Employee = read-only
}

export function ClassesManagement({ viewMode = 'admin' }: ClassesManagementProps) {
  const isEmployeeView = viewMode === 'employee';
  const navigate = useNavigate();

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});

  // Dialog states
  const [classToDelete, setClassToDelete] = useState<Class | undefined>();
  const [classToReactivate, setClassToReactivate] = useState<Class | undefined>();

  // Deleted view management
  const { showDeleted, toggleDeletedView } = useDeletedView({
    onPageChange: setPage,
  });

  // Fetch classes
  const { data, isLoading, error } = useClasses({
    page,
    page_size: pageSize,
    search: searchQuery,
    academic_year: filters.academic_year,
    is_deleted: showDeleted,
  });

  const classes = data?.data || [];
  const pagination = data?.pagination;

  // Delete mutation
  const deleteMutation = useDeleteClass({
    onSuccess: () => {
      toast.success(SuccessMessages.CLASS.DELETE_SUCCESS);
      setClassToDelete(undefined);
    },
    onError: (error: Error) => {
      toast.error(error.message || ErrorMessages.CLASS.DELETE_FAILED);
    },
  });

  // Reactivate mutation
  const reactivateMutation = useReactivateClass({
    onSuccess: () => {
      toast.success(SuccessMessages.CLASS.REACTIVATE_SUCCESS);
      setClassToReactivate(undefined);
    },
    onError: (error: Error) => {
      toast.error(error.message || ErrorMessages.CLASS.REACTIVATE_FAILED);
    },
  });

  // Navigation handlers
  const handleView = (classItem: Class) => {
    const path = ROUTES.CLASSES_VIEW.replace(':id', classItem.public_id);
    // Add query param if viewing deleted class
    navigate(showDeleted ? `${path}?deleted=true` : path);
  };

  const handleEdit = (classItem: Class) => {
    navigate(ROUTES.CLASSES_EDIT.replace(':id', classItem.public_id));
  };

  const handleDelete = (classItem: Class) => {
    if (showDeleted) {
      setClassToReactivate(classItem);
    } else {
      setClassToDelete(classItem);
    }
  };

  const handleConfirmDelete = () => {
    if (classToDelete) {
      deleteMutation.mutate(classToDelete.public_id);
    }
  };

  const handleConfirmReactivate = () => {
    if (classToReactivate) {
      reactivateMutation.mutate(classToReactivate.public_id);
    }
  };

  const handleCreateNew = () => {
    navigate(ROUTES.CLASSES_NEW);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1); // Reset to first page when page size changes
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(1); // Reset to first page on new search
  };

  const handleFilterChange = (newFilters: Record<string, string>) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page on filter change
  };

  return (
    <>
      <ClassesList
        classes={classes}
        isLoading={isLoading}
        error={error || undefined}
        pagination={pagination}
        showDeleted={showDeleted}
        onToggleDeleted={isEmployeeView ? undefined : toggleDeletedView} // No deleted toggle for employees
        onCreateNew={handleCreateNew}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
        viewMode={viewMode} // Pass viewMode to list
      />

      {!showDeleted && !isEmployeeView && (
        <DeleteConfirmationDialog
          open={!!classToDelete}
          onOpenChange={(open) => !open && setClassToDelete(undefined)}
          onConfirm={handleConfirmDelete}
          title="Delete Class"
          itemName={
            classToDelete
              ? `${classToDelete.class_master?.name || 'Class'} - ${classToDelete.name}`
              : undefined
          }
          isSoftDelete={true}
          isDeleting={deleteMutation.isPending}
        />
      )}

      {showDeleted && !isEmployeeView && (
        <ReactivateConfirmationDialog
          open={!!classToReactivate}
          onOpenChange={(open) => !open && setClassToReactivate(undefined)}
          onConfirm={handleConfirmReactivate}
          title="Reactivate Class"
          itemName={
            classToReactivate
              ? `${classToReactivate.class_master?.name || 'Class'} - ${classToReactivate.name}`
              : undefined
          }
          isReactivating={reactivateMutation.isPending}
        />
      )}
    </>
  );
}
