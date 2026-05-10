/**
 * Class Form Page - Add/Edit/View Class
 */

import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Edit, X, Plus, Eye, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import {
  PageHeader,
  DeleteConfirmationDialog,
  ReactivateConfirmationDialog,
  DeletedDuplicateDialog,
} from '@/components/common';
import { FormActions } from '@/components/form/form-actions';
import { Card, CardContent } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  useCreateClass,
  useUpdateClass,
  useDeleteClass,
  useReactivateClass,
} from '../hooks/mutations';
import { useClass } from '../hooks/use-classes';
import { useTeachers } from '@/features/teachers/hooks/use-teachers';
import { useCoreClasses } from '@/features/core/hooks/use-core-classes';
import { ROUTES } from '@/constants/app-config';
import {
  isDeletedDuplicateError,
  getDeletedDuplicateMessage,
  getDeletedRecordId,
} from '@/lib/utils/error-handler';
import { useDeletedDuplicateHandler } from '@/hooks/use-deleted-duplicate-handler';
import { classFormSchema, type ClassFormData } from '../schemas/class-form-schema';
import { ErrorMessages, FormPlaceholders, SuccessMessages } from '@/constants';
import { STANDARD_FORM_VALIDATION_CONFIG } from '@/lib/utils/form-validation';

export default function ClassFormPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();

  // Check if viewing deleted class (from query param)
  const searchParams = new URLSearchParams(location.search);
  const isViewingDeleted = searchParams.get('deleted') === 'true';

  // Determine mode based on URL path
  const getMode = (): 'create' | 'edit' | 'view' => {
    if (!id) {return 'create';}
    if (location.pathname.endsWith('/edit')) {return 'edit';}
    return 'view';
  };

  const mode = getMode();
  const firstErrorRef = useRef<HTMLDivElement>(null);

  // Navigation handlers
  const handleBackToList = () => {
    navigate(ROUTES.CLASSES);
  };

  const handleSwitchToEdit = () => {
    if (id) {
      navigate(ROUTES.CLASSES_EDIT.replace(':id', id));
    }
  };

  // Duplicate handling
  const duplicateHandler = useDeletedDuplicateHandler<{
    formData: ClassFormData;
    deletedRecordId?: string | null;
  }>();

  // Delete dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showReactivateDialog, setShowReactivateDialog] = useState(false);

  // Fetch class data if editing/viewing (pass isDeleted flag)
  const { data: classItem, isLoading: _isLoading, error: _error } = useClass(id, isViewingDeleted);

  // Fetch core classes for dropdown
  const { data: coreClasses } = useCoreClasses();

  // Fetch teachers for dropdown
  const { data: teachersResponse } = useTeachers({ page_size: 1000 });
  const teachers = teachersResponse?.data || [];

  const form = useForm<ClassFormData>({
    resolver: zodResolver(classFormSchema),
    ...STANDARD_FORM_VALIDATION_CONFIG,
    defaultValues: {
      class_master: '',
      name: '',
      class_teacher: '',
      info: '',
      room_number: '',
      capacity: '',
    },
  });

  // Populate form when editing/viewing
  useEffect(() => {
    if (mode !== 'create' && classItem && id) {
      const formData = {
        class_master: classItem.class_master?.id?.toString() || '',
        name: classItem.name || '',
        class_teacher: classItem.class_teacher?.public_id || '',
        info: classItem.info || '',
        room_number: classItem.room_number || '',
        capacity: classItem.capacity?.toString() || '',
      };

      // Reset form with new data and trigger re-render
      form.reset(formData, {
        keepDefaultValues: false,
      });
    }
  }, [classItem, mode, id, form]);

  // Error handler
  const handleFormErrors = (error: Error, fieldErrors?: Record<string, string | undefined>) => {
    // Check for deleted duplicate error
    if (isDeletedDuplicateError(error)) {
      const message = getDeletedDuplicateMessage(error);
      const deletedRecordId = getDeletedRecordId(error);
      duplicateHandler.openDialog(message, {
        formData: form.getValues(),
        deletedRecordId,
      });
      return;
    }

    // Apply field errors to form (toast already shown by mutation)
    if (fieldErrors) {
      Object.entries(fieldErrors).forEach(([field, message]) => {
        if (message) {
          form.setError(field as keyof ClassFormData, {
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
    }
  };

  // Mutations
  const createMutation = useCreateClass({
    onSuccess: () => {
      toast.success(SuccessMessages.CLASS.CREATE_SUCCESS);
      navigate(ROUTES.CLASSES);
    },
    onError: handleFormErrors,
  });

  const updateMutation = useUpdateClass({
    onSuccess: () => {
      toast.success(SuccessMessages.CLASS.UPDATE_SUCCESS);
      navigate(ROUTES.CLASSES);
    },
    onError: handleFormErrors,
  });

  const deleteMutation = useDeleteClass({
    onSuccess: () => {
      toast.success(SuccessMessages.CLASS.DELETE_SUCCESS);
      // Navigation happens before mutation is called
    },
    onError: (error: Error) => {
      toast.error(error.message || ErrorMessages.CLASS.DELETE_FAILED);
    },
  });

  const reactivateMutation = useReactivateClass({
    onSuccess: () => {
      toast.success(SuccessMessages.CLASS.REACTIVATE_SUCCESS);
      // Navigation already happened before mutation was called
    },
    onError: (error: Error) => {
      toast.error(error.message || ErrorMessages.CLASS.REACTIVATE_FAILED);
    },
  });

  // Delete handlers
  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    setShowDeleteDialog(false);
    if (classItem) {
      // Navigate away first to avoid refetching deleted resource
      navigate(ROUTES.CLASSES, { replace: true });
      // Then execute delete mutation
      deleteMutation.mutate(classItem.public_id);
    }
  };

  // Reactivate handlers
  const handleReactivateClick = () => {
    setShowReactivateDialog(true);
  };

  const confirmReactivate = () => {
    setShowReactivateDialog(false);
    if (classItem && id) {
      // Navigate to list to avoid refetching with stale is_deleted param
      navigate(ROUTES.CLASSES, { replace: true });
      // Then execute reactivate mutation
      reactivateMutation.mutate(classItem.public_id);
    }
  };

  // Handle reactivate from duplicate dialog
  const handleReactivate = () => {
    const deletedRecordId = duplicateHandler.pendingData?.deletedRecordId;

    if (!deletedRecordId) {
      toast.error(ErrorMessages.CLASS.NOT_FOUND);
      return;
    }

    reactivateMutation.mutate(deletedRecordId, {
      onSuccess: () => {
        duplicateHandler.closeDialog();
        navigate(ROUTES.CLASSES, { replace: true });
      },
    });
  };

  // Handle force create from duplicate dialog
  const handleForceCreate = () => {
    const pendingData = duplicateHandler.pendingData?.formData;
    if (pendingData) {
      createMutation.mutate({
        payload: {
          class_master: Number(pendingData.class_master),
          name: pendingData.name,
          class_teacher: pendingData.class_teacher || undefined,
          info: pendingData.info || undefined,
          room_number: pendingData.room_number || undefined,
          capacity: pendingData.capacity ? Number(pendingData.capacity) : undefined,
        },
        forceCreate: true,
      });
      duplicateHandler.closeDialog();
    }
  };

  // Form submission
  const onSubmit = (data: ClassFormData) => {
    if (mode === 'edit' && classItem) {
      // Don't send class_master in edit mode - it can't be changed
      updateMutation.mutate({
        publicId: classItem.public_id,
        payload: {
          name: data.name,
          class_teacher: data.class_teacher || undefined,
          info: data.info || undefined,
          room_number: data.room_number || undefined,
          capacity: data.capacity ? Number(data.capacity) : undefined,
        },
      });
    } else {
      createMutation.mutate({
        payload: {
          class_master: Number(data.class_master),
          name: data.name,
          class_teacher: data.class_teacher || undefined,
          info: data.info || undefined,
          room_number: data.room_number || undefined,
          capacity: data.capacity ? Number(data.capacity) : undefined,
        },
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  // Get page configuration based on mode
  const getPageConfig = () => {
    if (mode === 'create') {
      return {
        title: 'Add New Class',
        description: 'Fill in the details to create a new class',
        icon: Plus,
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
      // If viewing deleted class, show Reactivate button instead of Edit
      if (isViewingDeleted) {
        return {
          title: 'View Deleted Class',
          description: 'View deleted class information',
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

      // Normal view mode (active class)
      return {
        title: 'View Class Details',
        description: 'View class information and details',
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
            label: 'Delete',
            onClick: handleDelete,
            variant: 'destructive' as const,
            icon: Trash2,
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
      title: 'Edit Class',
      description: 'Update class information',
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
      <PageHeader
        title={pageConfig.title}
        description={pageConfig.description}
        icon={pageConfig.icon}
        actions={pageConfig.actions}
      />

      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Class Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Class Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Class Master (from core) */}
                  <FormField
                    control={form.control}
                    name="class_master"
                    render={({ field, fieldState }) => (
                      <FormItem
                        ref={fieldState.error && !firstErrorRef.current ? firstErrorRef : null}
                      >
                        <FormLabel>
                          Class <span className="text-red-500">*</span>
                        </FormLabel>
                        <Select
                          key={`class-master-${classItem?.public_id || 'new'}-${field.value}`}
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={isPending || mode === 'view' || mode === 'edit'}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={FormPlaceholders.SELECT_CLASS} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {coreClasses?.map((coreClass) => (
                              <SelectItem key={coreClass.id} value={coreClass.id.toString()}>
                                {coreClass.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {mode === 'edit' && (
                          <p className="text-sm text-muted-foreground">
                            Class cannot be changed after creation
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Section Name */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field, fieldState }) => (
                      <FormItem
                        ref={fieldState.error && !firstErrorRef.current ? firstErrorRef : null}
                      >
                        <FormLabel>
                          Section Name <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={FormPlaceholders.CLASS_SECTION_EXAMPLE}
                            disabled={isPending || mode === 'view'}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Capacity */}
                  <FormField
                    control={form.control}
                    name="capacity"
                    render={({ field, fieldState }) => (
                      <FormItem
                        ref={fieldState.error && !firstErrorRef.current ? firstErrorRef : null}
                      >
                        <FormLabel>Capacity (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            placeholder={FormPlaceholders.ENTER_CLASS_CAPACITY}
                            disabled={isPending || mode === 'view'}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Class Teacher */}
                  <FormField
                    control={form.control}
                    name="class_teacher"
                    render={({ field, fieldState }) => (
                      <FormItem
                        ref={fieldState.error && !firstErrorRef.current ? firstErrorRef : null}
                      >
                        <FormLabel>Class Teacher (Optional)</FormLabel>
                        <Select
                          key={`class-teacher-${classItem?.public_id || 'new'}-${field.value}`}
                          onValueChange={(value) => {
                            // Allow clearing the selection
                            field.onChange(value === 'none' ? '' : value);
                          }}
                          value={field.value || 'none'}
                          disabled={isPending || mode === 'view'}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={FormPlaceholders.SELECT_CLASS_TEACHER} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {teachers.map((teacher) => (
                              <SelectItem key={teacher.public_id} value={teacher.public_id}>
                                {teacher.full_name} ({teacher.employee_id})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Room Number */}
                <FormField
                  control={form.control}
                  name="room_number"
                  render={({ field, fieldState }) => (
                    <FormItem
                      ref={fieldState.error && !firstErrorRef.current ? firstErrorRef : null}
                    >
                      <FormLabel>Room Number (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Room 101"
                          disabled={isPending || mode === 'view'}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Info/Description */}
                <FormField
                  control={form.control}
                  name="info"
                  render={({ field, fieldState }) => (
                    <FormItem
                      ref={fieldState.error && !firstErrorRef.current ? firstErrorRef : null}
                    >
                      <FormLabel>Additional Information (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={FormPlaceholders.CLASS_INFO}
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
                onCancel={() => navigate(ROUTES.CLASSES)}
                submitLabel={mode === 'edit' ? 'Update Class' : 'Create Class'}
              />
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={confirmDelete}
        title="Delete Class"
        itemName={
          classItem ? `${classItem.class_master?.name || 'Class'} - ${classItem.name}` : undefined
        }
        isSoftDelete={true}
        isDeleting={deleteMutation.isPending}
      />

      {/* Reactivate Confirmation Dialog */}
      <ReactivateConfirmationDialog
        open={showReactivateDialog}
        onOpenChange={setShowReactivateDialog}
        onConfirm={confirmReactivate}
        title="Reactivate Class"
        itemName={
          classItem ? `${classItem.class_master?.name || 'Class'} - ${classItem.name}` : undefined
        }
        isReactivating={reactivateMutation.isPending}
      />

      {/* Deleted Duplicate Dialog */}
      <DeletedDuplicateDialog
        open={duplicateHandler.isOpen}
        onOpenChange={(open) => !open && duplicateHandler.closeDialog()}
        message={duplicateHandler.message}
        onReactivate={handleReactivate}
        onCreateNew={handleForceCreate}
        onCancel={duplicateHandler.closeDialog}
      />
    </div>
  );
}
