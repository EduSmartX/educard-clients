/**
 * Student Form Page Component
 * Wrapper for create, edit, and view modes with navigation
 * Following CRITICAL PATTERNS from teacher-form-page.tsx
 */

import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Edit, X, AlertCircle, UserPlus, Eye, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import {
  PageHeader,
  DeleteConfirmationDialog,
  ReactivateConfirmationDialog,
} from '@/components/common';
import { ROUTES } from '@/constants/app-config';
import { ErrorMessages, SuccessMessages, ToastTitles } from '@/constants';
import { useStudent } from '../hooks/use-students';
import { useDeleteStudent, useReactivateStudent } from '../hooks/mutations';
import { StudentForm } from '../components/student-form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getErrorMessage } from '@/lib/utils/error-handler';

export default function StudentFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showReactivateDialog, setShowReactivateDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);
  const [reactivateError, setReactivateError] = useState<string | null>(null);

  // Check if viewing deleted student (from query param)
  const searchParams = new URLSearchParams(location.search);
  const isViewingDeleted = searchParams.get('deleted') === 'true';

  // Determine mode based on URL path
  const getMode = (): 'create' | 'edit' | 'view' => {
    if (!id) {
      return 'create';
    }
    if (location.pathname.endsWith('/edit')) {
      return 'edit';
    }
    return 'view';
  };

  const mode = getMode();

  // Fetch student data if editing or viewing (pass isDeleted flag)
  const { data: student, isLoading, error } = useStudent(id, isViewingDeleted);

  useEffect(() => {
    if (error && mode !== 'create' && !isDeleting && !isReactivating) {
      const errorMessage = getErrorMessage(error, ErrorMessages.STUDENT.FETCH_FAILED);
      toast.error(ToastTitles.ERROR, {
        description: errorMessage,
        duration: 5000,
      });
    }
  }, [error, mode, isDeleting, isReactivating]);

  const handleBackToList = () => {
    navigate(ROUTES.STUDENTS);
  };

  const handleFormSuccess = () => {
    navigate(ROUTES.STUDENTS);
  };

  const handleSwitchToEdit = () => {
    if (id) {
      navigate(ROUTES.STUDENTS_EDIT.replace(':id', id));
    }
  };

  // Delete mutation
  const deleteMutation = useDeleteStudent();

  // Reactivate mutation
  const reactivateMutation = useReactivateStudent({
    onSuccess: () => {
      toast.success(SuccessMessages.STUDENT.REACTIVATE_SUCCESS);
    },
  });

  // Open delete confirmation dialog
  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  // Open reactivate confirmation dialog
  const handleReactivateClick = () => {
    setReactivateError(null);
    setShowReactivateDialog(true);
  };

  // Confirm and execute reactivate
  const handleReactivateConfirm = () => {
    if (id && student) {
      // Set reactivating flag to prevent error toast from stale query
      setIsReactivating(true);
      setReactivateError(null);
      // Close dialog and navigate immediately to avoid refetching with stale is_deleted param
      setShowReactivateDialog(false);
      // Navigate away first
      navigate(ROUTES.STUDENTS, { replace: true });
      // Then execute reactivate mutation
      reactivateMutation.mutate({
        classId: student.class_info.public_id,
        publicId: id,
      });
    }
  };

  // Confirm and execute delete
  const handleDeleteConfirm = () => {
    if (id && student) {
      // Set deleting flag to prevent error toast
      setIsDeleting(true);
      // Close dialog and navigate immediately to avoid refetching deleted resource
      setShowDeleteDialog(false);
      // Navigate away first
      navigate(ROUTES.STUDENTS, { replace: true });
      // Then execute delete mutation
      deleteMutation.mutate(
        {
          classId: student.class_info.public_id,
          publicId: id,
        },
        {
          onSuccess: () => {
            toast.success(SuccessMessages.STUDENT.DELETE_SUCCESS);
            setIsDeleting(false);
          },
          onError: (error: Error) => {
            toast.error(error.message || ErrorMessages.STUDENT.DELETE_FAILED);
            setIsDeleting(false);
          },
        }
      );
    }
  };

  // Validate ID for edit/view modes
  if (mode !== 'create' && !id) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Student Not Found"
          description="Invalid student ID"
          actions={[
            {
              label: 'Back to List',
              onClick: handleBackToList,
              variant: 'outline',
            },
          ]}
        />
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="space-y-4 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
            <div>
              <p className="font-medium text-red-600">Invalid student ID</p>
              <p className="mt-2 text-sm text-gray-500">
                The student you're looking for doesn't exist or the ID is invalid.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && mode !== 'create') {
    const errorMessage = getErrorMessage(error, ErrorMessages.STUDENT.FETCH_FAILED);

    return (
      <div className="space-y-6">
        <PageHeader
          title="Error Loading Student"
          description="Failed to fetch student data"
          actions={[
            {
              label: 'Back to List',
              onClick: handleBackToList,
              variant: 'outline',
            },
          ]}
        />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Get page configuration based on mode
  const getPageConfig = () => {
    if (mode === 'create') {
      return {
        title: 'Add New Student',
        description: 'Add a new student to your organization',
        icon: UserPlus,
        actions: [
          {
            label: 'Cancel',
            onClick: handleBackToList,
            variant: 'outline' as const,
            icon: X,
            className: 'border-2 border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700',
          },
        ],
      };
    }

    if (mode === 'view') {
      // If viewing deleted student, show Reactivate button instead of Edit/Delete
      if (isViewingDeleted) {
        return {
          title: 'View Deleted Student',
          description: 'View deleted student information',
          icon: Eye,
          actions: [
            {
              label: 'Close',
              onClick: handleBackToList,
              variant: 'outline' as const,
              icon: X,
              className: 'border-2 border-gray-400 text-gray-700 hover:bg-gray-100',
            },
            {
              label: 'Reactivate',
              onClick: handleReactivateClick,
              variant: 'default' as const,
              icon: RefreshCw,
              className: 'bg-green-600 hover:bg-green-700',
            },
          ],
        };
      }

      // Normal view mode (active student)
      return {
        title: 'View Student Details',
        description: 'View student information and details',
        icon: Eye,
        actions: [
          {
            label: 'Close',
            onClick: handleBackToList,
            variant: 'outline' as const,
            icon: X,
            className: 'border-2 border-gray-400 text-gray-700 hover:bg-gray-100',
          },
          {
            label: 'Edit',
            onClick: handleSwitchToEdit,
            variant: 'default' as const,
            icon: Edit,
          },
        ],
      };
    }

    // Edit mode
    return {
      title: 'Edit Student',
      description: 'Update student information',
      icon: Edit,
      actions: [
        {
          label: 'Cancel',
          onClick: handleBackToList,
          variant: 'outline' as const,
          icon: X,
          className: 'border-2 border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700',
        },
      ],
    };
  };

  const pageConfig = getPageConfig();

  return (
    <div className="space-y-6">
      {/* Page Header with dynamic title, description, and actions */}
      <PageHeader
        title={pageConfig.title}
        description={pageConfig.description}
        icon={pageConfig.icon}
        actions={pageConfig.actions}
      />

      {/* Form Component */}
      <StudentForm
        mode={mode}
        studentId={id}
        initialData={student}
        isLoading={isLoading}
        onSuccess={handleFormSuccess}
        onCancel={handleBackToList}
        onDelete={mode === 'edit' ? handleDeleteClick : undefined}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDeleteConfirm}
        title="Delete Student"
        itemName={student ? `${student.user_info.full_name} (${student.roll_number})` : undefined}
        isSoftDelete={true}
      />

      {/* Reactivate Confirmation Dialog */}
      <ReactivateConfirmationDialog
        open={showReactivateDialog}
        onOpenChange={setShowReactivateDialog}
        onConfirm={handleReactivateConfirm}
        title="Reactivate Student"
        itemName={student ? `${student.user_info.full_name} (${student.roll_number})` : undefined}
        description="Are you sure you want to reactivate this student? They will be restored to active status."
        isReactivating={isReactivating}
        error={reactivateError}
      />
    </div>
  );
}
