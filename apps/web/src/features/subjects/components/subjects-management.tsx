/**
 * Subjects Management Page
 * Main page for managing subjects with table, filters, and CRUD operations
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { DeleteConfirmationDialog, ReactivateConfirmationDialog } from '@/components/common';
import { ErrorMessages, SuccessMessages } from '@/constants';
import { useSubjects } from '../hooks/use-subjects';
import { useDeleteSubject, useReactivateSubject } from '../hooks/mutations';
import { SubjectsList } from './index';
import { ROUTES } from '@/constants/app-config';
import { useDeletedView } from '@/hooks/use-deleted-view';
import type { Subject } from '../types';

export function SubjectsManagement() {
  const navigate = useNavigate();

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});

  // Dialog states
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | undefined>();
  const [subjectToReactivate, setSubjectToReactivate] = useState<Subject | undefined>();

  // Deleted view management
  const { showDeleted, toggleDeletedView } = useDeletedView({
    onPageChange: setPage,
  });

  // Fetch subjects
  const { data, isLoading, error } = useSubjects({
    page,
    page_size: pageSize,
    search: searchQuery,
    class_assigned: filters.class_assigned,
    subject_master: filters.subject_master ? Number(filters.subject_master) : undefined,
    teacher: filters.teacher,
    is_deleted: showDeleted,
  });

  const subjects = data?.data || [];
  const pagination = data?.pagination;

  // Delete mutation
  const deleteMutation = useDeleteSubject({
    onSuccess: () => {
      toast.success(SuccessMessages.SUBJECT.DELETE_SUCCESS);
      setSubjectToDelete(undefined);
    },
    onError: () => {
      toast.error(ErrorMessages.SUBJECT.DELETE_FAILED);
    },
  });

  // Reactivate mutation
  const reactivateMutation = useReactivateSubject({
    onSuccess: () => {
      toast.success(SuccessMessages.SUBJECT.REACTIVATE_SUCCESS);
      setSubjectToReactivate(undefined);
    },
    onError: () => {
      toast.error(ErrorMessages.SUBJECT.REACTIVATE_FAILED);
    },
  });

  // Handlers
  const handleCreateNew = () => {
    navigate(ROUTES.SUBJECTS_NEW);
  };

  const handleView = (subject: Subject) => {
    const route = showDeleted
      ? `${ROUTES.SUBJECTS_VIEW.replace(':id', subject.public_id)}?deleted=true`
      : ROUTES.SUBJECTS_VIEW.replace(':id', subject.public_id);
    navigate(route);
  };

  const handleEdit = (subject: Subject) => {
    navigate(ROUTES.SUBJECTS_EDIT.replace(':id', subject.public_id));
  };

  const handleDelete = (subject: Subject) => {
    if (showDeleted) {
      // In deleted view, clicking "delete" means reactivate
      setSubjectToReactivate(subject);
    } else {
      setSubjectToDelete(subject);
    }
  };

  const handleDeleteConfirm = () => {
    if (subjectToDelete) {
      deleteMutation.mutate(subjectToDelete.public_id);
    }
  };

  const handleReactivateConfirm = () => {
    if (subjectToReactivate) {
      reactivateMutation.mutate(subjectToReactivate.public_id);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(1);
  };

  const handleFilterChange = (newFilters: Record<string, string>) => {
    setFilters(newFilters);
    setPage(1);
  };

  return (
    <>
      <SubjectsList
        subjects={subjects}
        isLoading={isLoading}
        error={error}
        pagination={pagination}
        showDeleted={showDeleted}
        onToggleDeleted={toggleDeletedView}
        onCreateNew={handleCreateNew}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
      />

      {/* Delete Confirmation Dialog */}
      {!showDeleted && (
        <DeleteConfirmationDialog
          open={!!subjectToDelete}
          onOpenChange={(open) => !open && setSubjectToDelete(undefined)}
          onConfirm={handleDeleteConfirm}
          title="Delete Subject"
          itemName={
            subjectToDelete
              ? `${subjectToDelete.subject_info.name} for ${subjectToDelete.class_info.class_master_name}-${subjectToDelete.class_info.name}`
              : undefined
          }
          isSoftDelete={true}
          isDeleting={deleteMutation.isPending}
        />
      )}

      {/* Reactivate Confirmation Dialog */}
      {showDeleted && (
        <ReactivateConfirmationDialog
          open={!!subjectToReactivate}
          onOpenChange={(open) => !open && setSubjectToReactivate(undefined)}
          onConfirm={handleReactivateConfirm}
          title="Restore Subject"
          itemName={
            subjectToReactivate
              ? `${subjectToReactivate.subject_info.name} for ${subjectToReactivate.class_info.class_master_name}-${subjectToReactivate.class_info.name}`
              : undefined
          }
          isReactivating={reactivateMutation.isPending}
        />
      )}
    </>
  );
}
