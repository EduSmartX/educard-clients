/**
 * Teachers Management Component - Page Orchestrator
 * Main orchestrator component that handles routing and delegates to specialized components
 */

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ROUTES } from '@/constants/app-config';
import { ErrorMessages, SuccessMessages } from '@/constants';
import { useTeachers } from '../hooks/use-teachers';
import { useDeleteTeacher, useReactivateTeacher } from '../hooks/mutations';
import { TeachersList } from './teachers-list';
import TeacherFormPage from '../pages/teacher-form-page';
import type { Teacher } from '../types';
import { DeleteConfirmationDialog, ReactivateConfirmationDialog } from '@/components/common';
import { useDeletedView } from '@/hooks/use-deleted-view';

type PageMode = 'list' | 'create' | 'edit' | 'view';

interface TeachersManagementProps {
  viewMode?: 'admin' | 'employee'; // Admin = full CRUD, Employee = read-only
}

export function TeachersManagement({ viewMode = 'admin' }: TeachersManagementProps) {
  const isEmployeeView = viewMode === 'employee';
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [_filters, setFilters] = useState<Record<string, string>>({});

  // Dialog states
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);
  const [teacherToReactivate, setTeacherToReactivate] = useState<Teacher | null>(null);

  // Deleted view management
  const { showDeleted, toggleDeletedView } = useDeletedView({
    onPageChange: setCurrentPage,
  });

  // Determine page mode from URL
  const mode: PageMode = id
    ? window.location.pathname.endsWith('/edit')
      ? 'edit'
      : 'view'
    : window.location.pathname.endsWith('/create') || window.location.pathname.endsWith('/new')
      ? 'create'
      : 'list';

  // Fetch teachers (only for list mode)
  const { data, isLoading, error } = useTeachers({
    search: searchQuery,
    page: currentPage,
    page_size: pageSize,
    is_deleted: showDeleted,
  });

  // Delete mutation
  const deleteMutation = useDeleteTeacher({
    onSuccess: () => {
      toast.success(SuccessMessages.TEACHER.DELETE_SUCCESS);
      setTeacherToDelete(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || ErrorMessages.TEACHER.DELETE_FAILED);
    },
  });

  // Reactivate mutation
  const reactivateMutation = useReactivateTeacher({
    onSuccess: () => {
      toast.success(SuccessMessages.TEACHER.REACTIVATE_SUCCESS);
      setTeacherToReactivate(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || ErrorMessages.TEACHER.REACTIVATE_FAILED);
    },
  });

  // Navigation handlers
  const handleView = (teacher: Teacher) => {
    const path = isEmployeeView
      ? ROUTES.EMPLOYEE.TEACHERS_VIEW.replace(':id', teacher.public_id)
      : ROUTES.TEACHERS_VIEW.replace(':id', teacher.public_id);
    // Add query param if viewing deleted teacher
    navigate(showDeleted ? `${path}?deleted=true` : path);
  };

  const handleEdit = (teacher: Teacher) => {
    navigate(ROUTES.TEACHERS_EDIT.replace(':id', teacher.public_id));
  };

  const handleDelete = (teacher: Teacher) => {
    if (showDeleted) {
      setTeacherToReactivate(teacher);
    } else {
      setTeacherToDelete(teacher);
    }
  };

  const handleConfirmDelete = () => {
    if (teacherToDelete) {
      deleteMutation.mutate(teacherToDelete.public_id);
    }
  };

  const handleConfirmReactivate = () => {
    if (teacherToReactivate) {
      reactivateMutation.mutate(teacherToReactivate.public_id);
    }
  };

  const handleCreateNew = () => {
    navigate(ROUTES.TEACHERS_NEW);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when page size changes
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page on new search
  };

  const handleFilterChange = (newFilters: Record<string, string>) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page on filter change
  };

  // Render form modes (create, edit, view)
  if (mode !== 'list') {
    // Employee view cannot access create/edit/view forms
    if (isEmployeeView) {
      navigate(ROUTES.EMPLOYEE.TEACHERS); // Redirect back to list
      return null;
    }
    return <TeacherFormPage />;
  }

  // List mode below - Don't show full page loader, let the table handle it
  const teachers = data?.data || [];
  const pagination = data?.pagination;

  return (
    <>
      <TeachersList
        teachers={teachers}
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
          open={!!teacherToDelete}
          onOpenChange={(open) => !open && setTeacherToDelete(null)}
          onConfirm={handleConfirmDelete}
          title="Delete Teacher"
          itemName={teacherToDelete?.full_name}
          isSoftDelete={true}
          isDeleting={deleteMutation.isPending}
        />
      )}

      {showDeleted && !isEmployeeView && (
        <ReactivateConfirmationDialog
          open={!!teacherToReactivate}
          onOpenChange={(open) => !open && setTeacherToReactivate(null)}
          onConfirm={handleConfirmReactivate}
          title="Reactivate Teacher"
          itemName={teacherToReactivate?.full_name}
          isReactivating={reactivateMutation.isPending}
        />
      )}
    </>
  );
}
