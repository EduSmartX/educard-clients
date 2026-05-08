/**
 * Teacher Form Page Component
 * Wrapper for create, edit, and view modes with navigation
 */

import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Edit, X, AlertCircle, UserPlus, Eye, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import {
  PageHeader,
  DeleteConfirmationDialog,
  ReactivateConfirmationDialog,
} from '@/components/common';
import { ROUTES } from '@/constants/app-config';
import { ErrorMessages, SuccessMessages, ToastTitles } from '@/constants';
import { useTeacher } from '../hooks/use-teachers';
import { useDeleteTeacher, useReactivateTeacher } from '../hooks/mutations';
import { TeacherForm } from '../components/teacher-form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getErrorMessage } from '@/lib/utils/error-handler';

export default function TeacherFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showReactivateDialog, setShowReactivateDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);
  const [reactivateError, setReactivateError] = useState<string | null>(null);

  // Check if viewing deleted teacher (from query param)
  const searchParams = new URLSearchParams(location.search);
  const isViewingDeleted = searchParams.get('deleted') === 'true';

  // Check if accessing from employee section
  const isEmployeeView = location.pathname.startsWith('/employee/');

  // Determine mode based on URL path
  const getMode = (): 'create' | 'edit' | 'view' => {
    if (!id) return 'create';
    if (location.pathname.endsWith('/edit')) return 'edit';
    return 'view';
  };

  const mode = getMode();

  // Fetch teacher data if editing or viewing (pass isDeleted flag)
  const { data: teacher, isLoading, error } = useTeacher(id, isViewingDeleted);

  useEffect(() => {
    if (error && mode !== 'create' && !isDeleting && !isReactivating) {
      const errorMessage = getErrorMessage(error, ErrorMessages.TEACHER.FETCH_FAILED);
      toast.error(ToastTitles.ERROR, {
        description: errorMessage,
        duration: 5000,
      });
    }
  }, [error, mode, isDeleting, isReactivating]);

  const handleBackToList = () => {
    navigate(isEmployeeView ? ROUTES.EMPLOYEE.TEACHERS : ROUTES.TEACHERS);
  };

  const handleFormSuccess = () => {
    navigate(isEmployeeView ? ROUTES.EMPLOYEE.TEACHERS : ROUTES.TEACHERS);
  };

  const handleSwitchToEdit = () => {
    if (id && !isEmployeeView) {
      navigate(ROUTES.TEACHERS_EDIT.replace(':id', id));
    }
  };

  // Delete mutation
  const deleteMutation = useDeleteTeacher({
    onSuccess: () => {
      toast.success(SuccessMessages.TEACHER.DELETE_SUCCESS);
      // Navigate immediately to avoid refetching deleted resource
      navigate(ROUTES.TEACHERS, { replace: true });
    },
    onError: (error: Error) => {
      toast.error(error.message || ErrorMessages.TEACHER.DELETE_FAILED);
    },
  });

  // Reactivate mutation
  const reactivateMutation = useReactivateTeacher({
    onSuccess: () => {
      toast.success(SuccessMessages.TEACHER.REACTIVATE_SUCCESS);
      navigate(ROUTES.TEACHERS, { replace: true });
    },
    onError: (error: Error) => {
      toast.error(error.message || ErrorMessages.TEACHER.REACTIVATE_FAILED);
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
    if (id) {
      // Set reactivating flag to prevent error toast from stale query
      setIsReactivating(true);
      setReactivateError(null);
      // Close dialog and navigate immediately to avoid refetching with stale is_deleted param
      setShowReactivateDialog(false);
      // Navigate away first
      navigate(ROUTES.TEACHERS, { replace: true });
      // Then execute reactivate mutation
      reactivateMutation.mutate(id);
    }
  };

  // Confirm and execute delete
  const handleDeleteConfirm = () => {
    if (id) {
      // Set deleting flag to prevent error toast
      setIsDeleting(true);
      // Close dialog and navigate immediately to avoid refetching deleted resource
      setShowDeleteDialog(false);
      // Navigate away first
      navigate(ROUTES.TEACHERS, { replace: true });
      // Then execute delete mutation
      deleteMutation.mutate(id);
    }
  };

  // Validate ID for edit/view modes
  if (mode !== 'create' && !id) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Teacher Not Found"
          description="Invalid teacher ID"
          actions={[
            {
              label: 'Back to List',
              onClick: handleBackToList,
              variant: 'outline',
            },
          ]}
        />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
            <div>
              <p className="text-red-600 font-medium">Invalid teacher ID</p>
              <p className="text-sm text-gray-500 mt-2">
                The teacher you're looking for doesn't exist or the ID is invalid.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && mode !== 'create') {
    const errorMessage = getErrorMessage(error, ErrorMessages.TEACHER.FETCH_FAILED);

    return (
      <div className="space-y-6">
        <PageHeader
          title="Error Loading Teacher"
          description="Failed to fetch teacher data"
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
        title: 'Add New Teacher',
        description: 'Add a new teacher to your organization',
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
      // If viewing deleted teacher, show Reactivate button instead of Edit/Delete
      if (isViewingDeleted) {
        return {
          title: 'View Deleted Teacher',
          description: 'View deleted teacher information',
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

      // Normal view mode (active teacher)
      return {
        title: 'View Teacher Details',
        description: 'View teacher information and details',
        icon: Eye,
        actions: [
          {
            label: 'Close',
            onClick: handleBackToList,
            variant: 'outline' as const,
            icon: X,
            className: 'border-2 border-gray-400 text-gray-700 hover:bg-gray-100',
          },
          // Hide Edit button for employee view
          ...(!isEmployeeView
            ? [
                {
                  label: 'Edit',
                  onClick: handleSwitchToEdit,
                  variant: 'default' as const,
                  icon: Edit,
                },
              ]
            : []),
        ],
      };
    }

    // Edit mode
    return {
      title: 'Edit Teacher',
      description: 'Update teacher information',
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
      <TeacherForm
        mode={mode}
        teacherId={id}
        initialData={teacher}
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
        title="Delete Teacher"
        itemName={
          teacher
            ? `${teacher.user.first_name} ${teacher.user.last_name} (${teacher.employee_id})`
            : undefined
        }
        isSoftDelete={true}
      />

      {/* Reactivate Confirmation Dialog */}
      <ReactivateConfirmationDialog
        open={showReactivateDialog}
        onOpenChange={setShowReactivateDialog}
        onConfirm={handleReactivateConfirm}
        title="Reactivate Teacher"
        itemName={
          teacher
            ? `${teacher.user.first_name} ${teacher.user.last_name} (${teacher.employee_id})`
            : undefined
        }
        description="Are you sure you want to reactivate this teacher? They will be restored to active status."
        isReactivating={isReactivating}
        error={reactivateError}
      />
    </div>
  );
}
