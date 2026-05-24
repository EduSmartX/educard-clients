/**
 * Students Management Component - Page Orchestrator
 * Main orchestrator component following teachers-management.tsx pattern
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ROUTES } from '@/constants/app-config';
import { ErrorMessages, SuccessMessages, USER_ROLES } from '@/constants';
import { useStudents } from '../hooks/use-students';
import { useManagedClasses } from '../hooks/use-managed-classes';
import { useDeleteStudent, useReactivateStudent } from '../hooks/mutations';
import { StudentsList } from './students-list';
import StudentFormPage from '../pages/student-form-page';
import type { StudentListItem } from '../types';
import { DeleteConfirmationDialog, ReactivateConfirmationDialog } from '@/components/common';
import { useDeletedView } from '@/hooks/use-deleted-view';
import { useAuth } from '@/hooks/use-auth';

type PageMode = 'list' | 'create' | 'edit' | 'view';

export function StudentsManagement() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});

  // Dialog states
  const [studentToDelete, setStudentToDelete] = useState<StudentListItem | null>(null);
  const [studentToReactivate, setStudentToReactivate] = useState<StudentListItem | null>(null);
  const [reactivateError, setReactivateError] = useState<string | null>(null);

  // Deleted view management
  const { showDeleted, toggleDeletedView } = useDeletedView({
    onPageChange: setCurrentPage,
  });

  // Fetch managed classes for class teacher permissions
  const { data: managedClasses = [] } = useManagedClasses();

  // Determine if user can create students
  const isClassTeacher = user?.role === USER_ROLES.TEACHER && managedClasses.length > 0;
  const canCreateStudents = user?.role === USER_ROLES.ADMIN || isClassTeacher;

  // Sync filters with URL query params
  useEffect(() => {
    const params = Object.fromEntries(searchParams.entries());
    const newFilters: Record<string, string> = {};

    if (params.class_assigned__public_id) {
      newFilters.class_assigned__public_id = params.class_assigned__public_id;
    }
    if (params.user__gender) {
      newFilters.user__gender = params.user__gender;
    }
    if (params.admission_date_from) {
      newFilters.admission_date_from = params.admission_date_from;
    }
    if (params.admission_date_to) {
      newFilters.admission_date_to = params.admission_date_to;
    }
    if (params.search) {
      setSearchQuery(params.search);
    }

    setFilters(newFilters);
  }, [searchParams]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();

    if (searchQuery) {
      params.set('search', searchQuery);
    }

    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });

    const newSearch = params.toString();
    if (newSearch !== searchParams.toString()) {
      setSearchParams(params, { replace: true });
    }
  }, [searchQuery, filters, setSearchParams, searchParams]);

  // Determine page mode from URL
  const getPageMode = (): PageMode => {
    if (id) {
      return globalThis.location.pathname.endsWith('/edit') ? 'edit' : 'view';
    }
    if (window.location.pathname.endsWith('/create') || window.location.pathname.endsWith('/new')) {
      return 'create';
    }
    return 'list';
  };
  const mode: PageMode = getPageMode();

  // Fetch students (only for list mode)
  const { data, isLoading, error } = useStudents({
    search: searchQuery,
    page: currentPage,
    page_size: pageSize,
    class_assigned__public_id: filters.class_assigned__public_id || undefined,
    user__gender: filters.user__gender || undefined,
    admission_date_from: filters.admission_date_from || undefined,
    admission_date_to: filters.admission_date_to || undefined,
    is_deleted: showDeleted,
  });

  // Delete mutation
  const deleteMutation = useDeleteStudent();

  // Reactivate mutation
  const reactivateMutation = useReactivateStudent();

  // Navigation handlers
  const handleView = (student: StudentListItem) => {
    const path = ROUTES.STUDENTS_VIEW.replace(':id', student.public_id);
    // Add query param if viewing deleted student
    navigate(showDeleted ? `${path}?deleted=true` : path);
  };

  const handleEdit = (student: StudentListItem) => {
    navigate(ROUTES.STUDENTS_EDIT.replace(':id', student.public_id));
  };

  const handleDelete = (student: StudentListItem) => {
    if (showDeleted) {
      setReactivateError(null);
      setStudentToReactivate(student);
    } else {
      setStudentToDelete(student);
    }
  };

  const handleConfirmDelete = () => {
    if (studentToDelete) {
      deleteMutation.mutate(
        {
          classId: studentToDelete.class_id,
          publicId: studentToDelete.public_id,
        },
        {
          onSuccess: () => {
            toast.success(SuccessMessages.STUDENT.DELETE_SUCCESS);
            setStudentToDelete(null);
          },
          onError: (error: Error) => {
            toast.error(error.message || ErrorMessages.STUDENT.DELETE_FAILED);
          },
        }
      );
    }
  };

  const handleConfirmReactivate = () => {
    if (studentToReactivate) {
      setReactivateError(null);
      reactivateMutation.mutate(
        {
          classId: studentToReactivate.class_id,
          publicId: studentToReactivate.public_id,
        },
        {
          onSuccess: () => {
            toast.success(SuccessMessages.STUDENT.REACTIVATE_SUCCESS);
            setStudentToReactivate(null);
            setReactivateError(null);
          },
          onError: (error: Error) => {
            const errorMessage = error.message || ErrorMessages.STUDENT.REACTIVATE_FAILED;
            setReactivateError(errorMessage);
          },
        }
      );
    }
  };

  const handleCreateNew = () => {
    navigate(ROUTES.STUDENTS_NEW);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleFilterChange = (newFilters: Record<string, string>) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  // Render form modes (create, edit, view)
  if (mode !== 'list') {
    return <StudentFormPage />;
  }

  // List mode below
  const students = data?.data || [];
  const pagination = data?.pagination;

  return (
    <>
      <StudentsList
        students={students}
        isLoading={isLoading}
        error={error || undefined}
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
        canCreateStudents={canCreateStudents}
        isClassTeacher={isClassTeacher}
      />

      {!showDeleted && (
        <DeleteConfirmationDialog
          open={!!studentToDelete}
          onOpenChange={(open) => !open && setStudentToDelete(null)}
          onConfirm={handleConfirmDelete}
          title="Delete Student"
          itemName={studentToDelete?.full_name}
          isSoftDelete={true}
          isDeleting={deleteMutation.isPending}
        />
      )}

      {showDeleted && (
        <ReactivateConfirmationDialog
          open={!!studentToReactivate}
          onOpenChange={(open) => {
            if (!open) {
              setStudentToReactivate(null);
              setReactivateError(null);
            }
          }}
          onConfirm={handleConfirmReactivate}
          title="Reactivate Student"
          itemName={studentToReactivate?.full_name}
          isReactivating={reactivateMutation.isPending}
          error={reactivateError}
        />
      )}
    </>
  );
}
