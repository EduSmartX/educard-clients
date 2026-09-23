/**
 * Subject Form Page - Add/Edit/View Subject
 */

import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Edit, X, Plus, Eye, RefreshCw, Info } from 'lucide-react';
import { toast } from 'sonner';
import {
  PageHeader,
  DeletedDuplicateDialog,
  DeleteConfirmationDialog,
  ReactivateConfirmationDialog,
} from '@/components/common';
import { FormActions } from '@/components/form/form-actions';
import {
  isDeletedDuplicateError,
  getDeletedDuplicateMessage,
  getDeletedRecordId,
  getErrorMessage,
} from '@/lib/utils/error-handler';
import { useDeletedDuplicateHandler } from '@/hooks/use-deleted-duplicate-handler';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import {
  ToastTitles,
  USER_ROLES,
  ROUTES,
  ErrorMessages,
  FormPlaceholders,
  SuccessMessages,
} from '@/constants';
import { SUBJECT_TYPE_OPTIONS } from '@educard/shared';
import {
  useCreateSubject,
  useUpdateSubject,
  useDeleteSubject,
  useReactivateSubject,
} from '../hooks/mutations';
import { useSubject } from '../hooks/use-subjects';
import { useClasses } from '@/features/classes/hooks/use-classes';
import { useSubjectMasters } from '@/features/core/hooks/use-subject-masters';
import { useTeachers } from '@/features/teachers/hooks/use-teachers';
import { useManagedClassesForSubjects } from '../hooks/use-managed-classes';
import { useAuth } from '@/hooks/use-auth';
import { STANDARD_FORM_VALIDATION_CONFIG } from '@/lib/utils/form-validation';

const subjectSchema = z.object({
  class_id: z.string().min(1, 'Class is required'),
  subject_id: z.number({ required_error: 'Subject is required' }),
  subject_type: z.enum(['core', 'elective', 'language']).optional().default('core'),
  teacher_id: z.string().optional(),
  description: z.string().optional(),
  display_order: z
    .string()
    .optional()
    .refine((val) => !val || /^\d+$/.test(val), 'Display order must be a valid number'),
});
type SubjectFormData = z.infer<typeof subjectSchema>;

export default function SubjectFormPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();

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
  const firstErrorRef = useRef<HTMLDivElement>(null);

  // Duplicate handling
  const duplicateHandler = useDeletedDuplicateHandler<{
    formData: SubjectFormData;
    deletedRecordId?: string | null;
  }>();

  // Delete and reactivate dialog states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showReactivateDialog, setShowReactivateDialog] = useState(false);

  // Get current user to check role
  const { user } = useAuth();
  const isTeacher = user?.role === USER_ROLES.TEACHER;

  // Fetch subject data if editing/viewing (pass isDeleted flag)
  const { data: subject } = useSubject(id, isViewingDeleted);

  // Fetch dropdown data
  const { data: classesData } = useClasses({ page_size: 100 });
  const { data: managedClassesData, isLoading: isManagedClassesLoading } =
    useManagedClassesForSubjects();
  const { data: subjectMastersData } = useSubjectMasters({ page_size: 100 });
  const { data: teachersData } = useTeachers({ page_size: 100 });

  // Filter classes based on user role
  // Teachers can only create subjects in classes they manage (where they are class teacher)
  const availableClasses =
    isTeacher && managedClassesData && mode === 'create'
      ? managedClassesData
      : classesData?.data || [];
  const isTeacherWithoutManagedClasses =
    isTeacher &&
    mode === 'create' &&
    !isManagedClassesLoading &&
    (managedClassesData?.length ?? 0) === 0;

  const form = useForm<SubjectFormData>({
    resolver: zodResolver(subjectSchema),
    ...STANDARD_FORM_VALIDATION_CONFIG,
    defaultValues: {
      class_id: '',
      subject_id: 0,
      subject_type: 'core',
      teacher_id: '',
      description: '',
      display_order: '',
    },
  });

  // Populate form when editing/viewing
  useEffect(() => {
    if (mode !== 'create' && subject && id) {
      const teacherId = subject.teacher_info?.public_id || '';
      form.reset(
        {
          class_id: subject.class_info.public_id,
          subject_id: subject.subject_info.id,
          subject_type: (subject.subject_type as 'core' | 'elective' | 'language') || 'core',
          teacher_id: teacherId,
          description: subject.description || '',
          display_order: subject.display_order ? String(subject.display_order) : '',
        },
        {
          keepDefaultValues: false,
        }
      );
    }
  }, [subject, mode, id, form]);

  // Error handler
  const handleFormErrors = (error: Error, fieldErrors?: Record<string, string | undefined>) => {
    if (isDeletedDuplicateError(error)) {
      const message = getDeletedDuplicateMessage(error);
      const deletedRecordId = getDeletedRecordId(error);
      duplicateHandler.openDialog(message, {
        formData: form.getValues(),
        deletedRecordId,
      });
      return;
    }

    // Check if it's a permission error or other non-field error
    const errorMessage = getErrorMessage(error);
    const hasFieldErrors = fieldErrors && Object.keys(fieldErrors).length > 0;

    // Apply field errors to form
    if (hasFieldErrors) {
      Object.entries(fieldErrors).forEach(([field, message]) => {
        if (message) {
          form.setError(field as keyof SubjectFormData, {
            // NOSONAR
            type: 'manual',
            message: String(message),
          });
        }
      });

      // Auto-focus first error field
      setTimeout(() => {
        firstErrorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const focusable = firstErrorRef.current?.querySelector<HTMLElement>('input, button');
        focusable?.focus();
      }, 100);
    } else {
      // Show non-field errors (like permission errors) as toast
      toast.error(ToastTitles.ERROR, {
        description: errorMessage,
      });
    }
  };

  // Mutations
  const createMutation = useCreateSubject({
    onSuccess: () => {
      toast.success(SuccessMessages.SUBJECT.CREATE_SUCCESS);
      navigate(ROUTES.SUBJECTS);
    },
    onError: handleFormErrors,
  });

  const updateMutation = useUpdateSubject({
    onSuccess: () => {
      toast.success(SuccessMessages.SUBJECT.UPDATE_SUCCESS);
      navigate(ROUTES.SUBJECTS);
    },
    onError: handleFormErrors,
  });

  const deleteMutation = useDeleteSubject({
    onSuccess: () => {
      // Navigation happens before mutation is called
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, ErrorMessages.SUBJECT.DELETE_FAILED));
    },
  });

  const reactivateMutation = useReactivateSubject({
    onSuccess: () => {
      // Navigation already happened before mutation was called
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, ErrorMessages.SUBJECT.REACTIVATE_FAILED));
    },
  });

  const confirmDelete = () => {
    setShowDeleteDialog(false);
    if (subject) {
      // Navigate away first to avoid refetching deleted resource
      navigate(ROUTES.SUBJECTS, { replace: true });
      // Then execute delete mutation
      deleteMutation.mutate(subject.public_id);
    }
  };

  // Reactivate handlers
  const handleReactivateClick = () => {
    setShowReactivateDialog(true);
  };

  const confirmReactivate = () => {
    setShowReactivateDialog(false);
    if (subject && id) {
      // Navigate to list to avoid refetching with stale is_deleted param
      navigate(ROUTES.SUBJECTS, { replace: true });
      reactivateMutation.mutate(subject.public_id);
    }
  };

  // Handle reactivate from duplicate dialog
  const handleReactivate = () => {
    const deletedRecordId = duplicateHandler.pendingData?.deletedRecordId;

    if (!deletedRecordId) {
      toast.error(ErrorMessages.SUBJECT.NOT_FOUND);
      return;
    }

    reactivateMutation.mutate(deletedRecordId, {
      onSuccess: () => {
        duplicateHandler.closeDialog();
        navigate(ROUTES.SUBJECTS, { replace: true });
      },
    });
  };

  // Handle force create from duplicate dialog
  const handleForceCreate = () => {
    const pendingData = duplicateHandler.pendingData?.formData;
    if (pendingData) {
      createMutation.mutate({
        data: {
          class_id: pendingData.class_id,
          subject_id: pendingData.subject_id,
          subject_type: pendingData.subject_type || 'core',
          teacher_id: pendingData.teacher_id || undefined,
          description: pendingData.description || undefined,
          display_order: pendingData.display_order ? Number(pendingData.display_order) : undefined,
        },
        forceCreate: true,
      });
      duplicateHandler.closeDialog();
    }
  };

  // Form submission
  const onSubmit = (data: SubjectFormData) => {
    if (mode === 'edit' && subject) {
      updateMutation.mutate({
        id: subject.public_id,
        data: {
          subject_type: data.subject_type || 'core',
          teacher_id: data.teacher_id || undefined,
          description: data.description || undefined,
          display_order: data.display_order ? Number(data.display_order) : undefined,
        },
      });
    } else {
      createMutation.mutate({
        data: {
          class_id: data.class_id,
          subject_id: data.subject_id,
          subject_type: data.subject_type || 'core',
          teacher_id: data.teacher_id || undefined,
          description: data.description || undefined,
          display_order: data.display_order ? Number(data.display_order) : undefined,
        },
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  // Navigation handlers
  const handleBackToList = () => {
    navigate(ROUTES.SUBJECTS);
  };

  const handleSwitchToEdit = () => {
    if (id) {
      navigate(ROUTES.SUBJECTS_EDIT.replace(':id', id));
    }
  };

  // Get page configuration based on mode
  const getPageConfig = () => {
    if (mode === 'create') {
      return {
        title: 'Add New Subject',
        description: 'Fill in the details to create a new subject',
        icon: Plus,
        actions: [
          {
            label: 'Cancel',
            onClick: handleBackToList,
            variant: 'outline' as const,
            icon: X,
          },
        ],
      };
    }

    if (mode === 'view') {
      // Viewing deleted subject
      if (isViewingDeleted) {
        return {
          title: 'View Deleted Subject',
          description: 'This subject has been deleted',
          icon: Eye,
          actions: [
            {
              label: 'Close',
              onClick: handleBackToList,
              variant: 'outline' as const,
              icon: X,
            },
            {
              label: 'Reactivate',
              onClick: handleReactivateClick,
              variant: 'success' as const,
              icon: RefreshCw,
            },
          ],
        };
      }

      // Viewing active subject
      return {
        title: 'View Subject Details',
        description: 'View subject information and details',
        icon: Eye,
        actions: [
          {
            label: 'Close',
            onClick: handleBackToList,
            variant: 'outline' as const,
            icon: X,
          },
          {
            label: 'Edit',
            onClick: handleSwitchToEdit,
            variant: 'brand' as const,
            icon: Edit,
          },
        ],
      };
    }

    // Edit mode
    return {
      title: 'Edit Subject',
      description: 'Update subject information',
      icon: Edit,
      actions: [
        {
          label: 'Cancel',
          onClick: handleBackToList,
          variant: 'outline' as const,
          icon: X,
        },
      ],
    };
  };

  const pageConfig = getPageConfig();

  const classOptions =
    availableClasses?.map((c) => ({
      value: c.public_id,
      label: `${c.class_master?.name || 'Unknown'} - ${c.name}`,
    })) || [];
  const subjectOptions =
    subjectMastersData?.data?.map((s) => ({
      value: s.id,
      label: `${s.name} (${s.code})`,
    })) || [];
  const teacherOptions =
    teachersData?.data?.map((t) => ({
      value: t.public_id,
      label: `${t.full_name} (${t.employee_id})`,
    })) || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={pageConfig.title}
        description={pageConfig.description}
        icon={pageConfig.icon}
        actions={pageConfig.actions}
      />

      {isTeacherWithoutManagedClasses && (
        <Alert className="border-amber-200 bg-amber-50">
          <Info className="h-4 w-4 text-amber-700" />
          <AlertDescription className="text-amber-900">
            You are not eligible to add any subject because you are not assigned as class teacher
            for any class.
          </AlertDescription>
        </Alert>
      )}

      {!isTeacherWithoutManagedClasses && (
        <Card>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Teacher Information Alert */}
                {isTeacher && mode === 'create' && (
                  <Alert className="border-blue-200 bg-blue-50">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      You can add subjects only for classes where you are assigned as the class
                      teacher.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Subject Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Subject Information</h3>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {/* Class Dropdown */}
                    <FormField
                      control={form.control}
                      name="class_id"
                      render={({ field, fieldState }) => (
                        <FormItem
                          ref={fieldState.error && !firstErrorRef.current ? firstErrorRef : null}
                        >
                          <FormLabel>
                            Class <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <SearchableSelect
                              key={`class-${subject?.public_id || 'new'}-${field.value}`}
                              options={classOptions.map((opt) => ({
                                value: opt.value,
                                label: opt.label,
                              }))}
                              value={field.value}
                              onValueChange={field.onChange}
                              placeholder={FormPlaceholders.SELECT_CLASS}
                              searchPlaceholder="Search classes..."
                              disabled={isPending || mode === 'view' || mode === 'edit'}
                            />
                          </FormControl>
                          {mode === 'edit' && (
                            <p className="text-muted-foreground text-sm">
                              Class cannot be changed after creation
                            </p>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Subject Master Dropdown */}
                    <FormField
                      control={form.control}
                      name="subject_id"
                      render={({ field, fieldState }) => (
                        <FormItem
                          ref={fieldState.error && !firstErrorRef.current ? firstErrorRef : null}
                        >
                          <FormLabel>
                            Subject Master <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <SearchableSelect
                              key={`subject-${subject?.public_id || 'new'}-${field.value}`}
                              options={subjectOptions.map((opt) => ({
                                value: opt.value.toString(),
                                label: opt.label,
                              }))}
                              value={field.value?.toString() || ''}
                              onValueChange={(value) => field.onChange(Number(value))}
                              placeholder={FormPlaceholders.SELECT_SUBJECT}
                              searchPlaceholder="Search subjects..."
                              disabled={isPending || mode === 'view' || mode === 'edit'}
                            />
                          </FormControl>
                          {mode === 'edit' && (
                            <p className="text-muted-foreground text-sm">
                              Subject cannot be changed after creation
                            </p>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {/* Subject Type Dropdown */}
                    <FormField
                      control={form.control}
                      name="subject_type"
                      render={({ field, fieldState }) => (
                        <FormItem
                          ref={fieldState.error && !firstErrorRef.current ? firstErrorRef : null}
                        >
                          <FormLabel>Subject Type (Optional)</FormLabel>
                          <FormControl>
                            <SearchableSelect
                              options={SUBJECT_TYPE_OPTIONS.map((opt) => ({
                                value: opt.value,
                                label: opt.label,
                              }))}
                              value={field.value || 'core'}
                              onValueChange={field.onChange}
                              placeholder="Select subject type"
                              disabled={isPending || mode === 'view'}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Teacher Dropdown */}
                    <FormField
                      control={form.control}
                      name="teacher_id"
                      render={({ field, fieldState }) => (
                        <FormItem
                          ref={fieldState.error && !firstErrorRef.current ? firstErrorRef : null}
                        >
                          <FormLabel>Teacher (Optional)</FormLabel>
                          <FormControl>
                            <SearchableSelect
                              key={`teacher-${subject?.public_id || 'new'}-${field.value}`}
                              options={[
                                { value: 'none', label: 'None' },
                                ...teacherOptions.map((opt) => ({
                                  value: opt.value,
                                  label: opt.label,
                                })),
                              ]}
                              value={field.value || 'none'}
                              onValueChange={(value) => {
                                field.onChange(value === 'none' ? '' : value);
                              }}
                              placeholder={FormPlaceholders.SELECT_TEACHER}
                              searchPlaceholder="Search teachers..."
                              disabled={isPending || mode === 'view'}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Display Order */}
                  <FormField
                    control={form.control}
                    name="display_order"
                    render={({ field, fieldState }) => (
                      <FormItem
                        ref={fieldState.error && !firstErrorRef.current ? firstErrorRef : null}
                        className="md:w-1/2 md:pr-2"
                      >
                        <FormLabel>Display Order (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            placeholder="e.g. 1 (lower appears first)"
                            disabled={isPending || mode === 'view'}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Description */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field, fieldState }) => (
                      <FormItem
                        ref={fieldState.error && !firstErrorRef.current ? firstErrorRef : null}
                      >
                        <FormLabel>Additional Information (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={FormPlaceholders.SUBJECT_INFO}
                            disabled={isPending || mode === 'view'}
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Form Actions */}
                <FormActions
                  mode={mode}
                  isSubmitting={isPending}
                  onCancel={() => navigate(ROUTES.SUBJECTS)}
                  submitLabel={mode === 'edit' ? 'Update Subject' : 'Create Subject'}
                />
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Deleted Duplicate Dialog */}
      <DeletedDuplicateDialog
        open={duplicateHandler.isOpen}
        onOpenChange={(open) => !open && duplicateHandler.closeDialog()}
        message={duplicateHandler.message}
        onReactivate={handleReactivate}
        onCreateNew={handleForceCreate}
        onCancel={duplicateHandler.closeDialog}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={confirmDelete}
        title="Delete Subject"
        description="Are you sure you want to delete this subject? This action can be undone by reactivating it later."
        isDeleting={deleteMutation.isPending}
      />

      {/* Reactivate Confirmation Dialog */}
      <ReactivateConfirmationDialog
        open={showReactivateDialog}
        onOpenChange={setShowReactivateDialog}
        onConfirm={confirmReactivate}
        title="Reactivate Subject"
        description="Are you sure you want to reactivate this subject? It will be available for use again."
        isReactivating={reactivateMutation.isPending}
      />
    </div>
  );
}
