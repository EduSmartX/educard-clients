/**
 * Teacher Form Component
 * Handles create, edit, and view modes with data prefilling and error handling
 */

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { TextInputField, DateInputField, GenderField, BloodGroupField } from '@/components/form';
import { AddressForm } from '@/components/form/address-form';
import { OrganizationRoleField } from '@/components/form/organization-role-field';
import { SupervisorField } from '@/components/form/supervisor-field';
import {
  ADDRESS_TYPE,
  ErrorMessages,
  FormPlaceholders,
  SuccessMessages,
  ToastTitles,
} from '@/constants';
import { useCreateTeacher, useUpdateTeacher, useReactivateTeacher } from '../hooks/mutations';
import {
  teacherFormSchema,
  minimalTeacherSchema,
  type TeacherFormValues,
} from '../schemas/teacher-form-schema';
import {
  applyFieldErrors,
  isDeletedDuplicateError,
  getDeletedDuplicateMessage,
  getDeletedRecordId,
} from '@/lib/utils/error-handler';
import type { TeacherDetail, CreateTeacherPayload } from '../types';
import {
  transformFormToCreatePayload,
  transformFormToUpdatePayload,
  transformTeacherToForm,
} from '../utils/form-utils';
import { SubjectsMultiSelectField } from '@/components/form/subjects-multi-select-field';
import { FormActions } from '@/components/form/form-actions';
import { FormProfilePhoto } from '@/components/form/form-profile-photo';
import { uploadProfilePhotoForUser } from '@/lib/utils/upload-profile-photo';
import { STANDARD_FORM_VALIDATION_CONFIG } from '@/lib/utils/form-validation';
import { FormMetadata } from '@/components/form/form-metadata';
import { DeletedDuplicateDialog } from '@/components/common';
import { useDeletedDuplicateHandler } from '@/hooks/use-deleted-duplicate-handler';

/**
 * Scroll to the first field with an error
 * Helps users quickly identify validation issues
 * @param setIsAddressExpanded - Function to expand address section if error is in an address field
 * @param formErrors - Form errors object to check which fields have errors
 */
function scrollToFirstError(
  setIsAddressExpanded?: (value: boolean) => void,
  formErrors?: Record<string, unknown>
) {
  // Small delay to ensure DOM is updated with error messages
  setTimeout(() => {
    // Address field names that require expanding the address section
    const addressFields = [
      'street_address',
      'address_line_2',
      'city',
      'state',
      'postal_code',
      'country',
      'address_type',
    ];

    // Check if any address field has an error and expand the section
    if (setIsAddressExpanded && formErrors) {
      const hasAddressError = addressFields.some((field) => formErrors[field]);
      if (hasAddressError) {
        setIsAddressExpanded(true);
      }
    }

    // Find the first element with an error message
    const firstError = document.querySelector('[data-error="true"], [aria-invalid="true"]');

    if (firstError) {
      firstError.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });

      // Focus on the input if it's focusable
      const input = firstError.querySelector('input, textarea, select');
      if (input instanceof HTMLElement) {
        input.focus();
      }
    }
  }, 100);
}

interface TeacherFormProps {
  mode: 'create' | 'edit' | 'view';
  teacherId?: string;
  initialData?: TeacherDetail;
  isLoading?: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

export function TeacherForm({
  mode,
  teacherId,
  initialData,
  isLoading: isLoadingData,
  onSuccess,
  onCancel,
}: TeacherFormProps) {
  const [useQuickAdd, setUseQuickAdd] = useState(false);
  const [isAddressExpanded, setIsAddressExpanded] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  // Duplicate handler for deleted duplicate detection
  const duplicateHandler = useDeletedDuplicateHandler<{
    payload: CreateTeacherPayload;
    deletedRecordId?: string | null;
  }>();

  const form = useForm<TeacherFormValues>({
    resolver: zodResolver(useQuickAdd ? minimalTeacherSchema : teacherFormSchema),
    ...STANDARD_FORM_VALIDATION_CONFIG,
    defaultValues: {
      employee_id: '',
      email: '',
      first_name: '',
      last_name: '',
      phone: '',
      gender: undefined,
      organization_role: '',
      blood_group: undefined,
      designation: '',
      highest_qualification: '',
      specialization: '',
      experience_years: undefined,
      supervisor_email: '',
      date_of_birth: '',
      joining_date: '',
      subjects: [],
      address_type: ADDRESS_TYPE.USER_CURRENT,
      street_address: '',
      city: '',
      state: '',
      postal_code: '',
      country: '',
    },
  });

  // Prefill form with teacher data in edit or view mode
  useEffect(() => {
    if (initialData) {
      const formData = transformTeacherToForm(initialData);
      form.reset(formData);
    }
  }, [initialData, form]);

  const createMutation = useCreateTeacher({
    onSuccess: async (createdTeacher) => {
      // Upload photo before navigating away (runs even after unmount)
      if (photoFile && createdTeacher?.data?.user?.public_id) {
        try {
          await uploadProfilePhotoForUser(createdTeacher.data.user.public_id, photoFile);
        } catch {
          toast.error('Teacher created but photo upload failed. You can upload it later.');
        }
      }
      toast.success(SuccessMessages.TEACHER.CREATE_SUCCESS);
      duplicateHandler.closeDialog();
      onSuccess();
    },
    onError: (error) => {
      // Check if it's a deleted duplicate error - show dialog instead of toast
      if (isDeletedDuplicateError(error)) {
        const message = getDeletedDuplicateMessage(error);
        const deletedRecordId = getDeletedRecordId(error);

        const payload = transformFormToCreatePayload(form.getValues());
        duplicateHandler.openDialog(message, { payload, deletedRecordId });
        return;
      }

      // Map nested user fields to form fields
      const fieldMap = {
        'user.email': 'email',
        'user.first_name': 'first_name',
        'user.last_name': 'last_name',
        'user.phone': 'phone',
        'user.gender': 'gender',
        'user.date_of_birth': 'date_of_birth',
        'user.blood_group': 'blood_group',
        'user.organization_role': 'organization_role',
        'user.supervisor_email': 'supervisor_email',
        'user.address.street_address': 'street_address',
        'user.address.address_line_2': 'address_line_2',
        'user.address.city': 'city',
        'user.address.state': 'state',
        'user.address.address_type': 'address_type',
        'user.address.zip_code': 'postal_code',
        'user.address.postal_code': 'postal_code',
        'user.address.country': 'country',
      } as const;

      const result = applyFieldErrors(error, form.setError, fieldMap);

      // Scroll to first error field if there are field errors
      if (result.hasFieldErrors) {
        scrollToFirstError(setIsAddressExpanded, form.formState.errors);
        // Don't show toast - inline field errors are enough
        return;
      }

      // Only show toast for non-field errors (when no field errors were set)
      toast.error(ErrorMessages.TEACHER.CREATE_FAILED, {
        description: result.toastMessage,
      });
    },
  });

  const updateMutation = useUpdateTeacher({
    onSuccess: () => {
      toast.success(SuccessMessages.TEACHER.UPDATE_SUCCESS);
      onSuccess();
    },
    onError: (error) => {
      // Map nested user fields to form fields (same as create)
      const fieldMap = {
        'user.email': 'email',
        'user.first_name': 'first_name',
        'user.last_name': 'last_name',
        'user.phone': 'phone',
        'user.gender': 'gender',
        'user.date_of_birth': 'date_of_birth',
        'user.blood_group': 'blood_group',
        'user.organization_role': 'organization_role',
        'user.supervisor_email': 'supervisor_email',
        'user.address.street_address': 'street_address',
        'user.address.address_line_2': 'address_line_2',
        'user.address.city': 'city',
        'user.address.state': 'state',
        'user.address.address_type': 'address_type',
        'user.address.zip_code': 'postal_code',
        'user.address.postal_code': 'postal_code',
        'user.address.country': 'country',
      } as const;

      const result = applyFieldErrors(error, form.setError, fieldMap);

      // Scroll to first error field if there are field errors
      if (result.hasFieldErrors) {
        scrollToFirstError(setIsAddressExpanded, form.formState.errors);
        // Don't show toast - inline field errors are enough
        return;
      }

      // Only show toast for non-field errors (when no field errors were set)
      toast.error(ErrorMessages.TEACHER.UPDATE_FAILED, {
        description: result.toastMessage,
      });
    },
  });

  const reactivateMutation = useReactivateTeacher({
    onSuccess: () => {
      duplicateHandler.closeDialog();
      onSuccess(); // Refresh the list or close the form
    },
    onError: () => {
      toast.error(ToastTitles.ERROR, {
        description: ErrorMessages.TEACHER.REACTIVATE_FAILED,
      });
    },
  });

  const handleReactivate = () => {
    const deletedRecordId = duplicateHandler.pendingData?.deletedRecordId;

    if (!deletedRecordId) {
      toast.error(ErrorMessages.TEACHER.NOT_FOUND);
      return;
    }

    // Reactivate the deleted teacher
    reactivateMutation.mutate(deletedRecordId);
  };

  const handleForceCreate = () => {
    if (duplicateHandler.pendingData) {
      createMutation.mutate({
        payload: duplicateHandler.pendingData.payload,
        forceCreate: true,
      });
    }
  };

  const onSubmit = (data: TeacherFormValues) => {
    if (mode === 'create') {
      const payload = transformFormToCreatePayload(data);
      createMutation.mutate({ payload });
    } else if (mode === 'edit' && teacherId) {
      const payload = transformFormToUpdatePayload(data);
      updateMutation.mutate({ publicId: teacherId, payload });
    }
  };

  const onInvalid = () => {
    scrollToFirstError(setIsAddressExpanded, form.formState.errors);
  };

  const isViewMode = mode === 'view';
  const isEditMode = mode === 'edit';
  const isLoading = isLoadingData || createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-6">
          {/* Quick Add Toggle - Only for create mode */}
          {mode === 'create' && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <Label htmlFor="quick-add" className="text-sm font-medium">
                    Quick Add (Only Required Fields)
                  </Label>
                  <Switch
                    id="quick-add"
                    checked={useQuickAdd}
                    onCheckedChange={setUseQuickAdd}
                    disabled={isViewMode}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Photo */}
              <FormProfilePhoto
                mode={mode}
                userPublicId={initialData?.user?.public_id}
                currentThumbnailUrl={initialData?.profile_photo_thumbnail}
                name={
                  initialData
                    ? `${initialData.user?.first_name || ''} ${initialData.user?.last_name || ''}`.trim()
                    : undefined
                }
                gender={initialData?.user?.gender}
                onFileSelected={setPhotoFile}
                disabled={isLoading}
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <TextInputField
                  control={form.control}
                  name="employee_id"
                  label="Employee ID"
                  placeholder={FormPlaceholders.ENTER_EMPLOYEE_ID}
                  disabled={isViewMode}
                  required
                  validationType="employeeId"
                />
                <TextInputField
                  control={form.control}
                  name="email"
                  label="Email"
                  type="email"
                  placeholder={FormPlaceholders.ENTER_EMAIL}
                  disabled={isViewMode}
                  required
                  validationType="email"
                />
                <TextInputField
                  control={form.control}
                  name="first_name"
                  label="First Name"
                  placeholder={FormPlaceholders.ENTER_FIRST_NAME}
                  disabled={isViewMode}
                  required
                  validationType="name"
                  validationOptions={{ fieldName: 'First name' }}
                />
                <TextInputField
                  control={form.control}
                  name="last_name"
                  label="Last Name"
                  placeholder={FormPlaceholders.ENTER_LAST_NAME}
                  disabled={isViewMode}
                  required
                  validationType="name"
                  validationOptions={{ fieldName: 'Last name' }}
                />
                <GenderField control={form.control} name="gender" disabled={isViewMode} required />
                {/* Backend returns username only to admins, the user themselves and their supervisor. */}
                {isViewMode && !!initialData?.user?.username && (
                  <div className="space-y-2">
                    <Label htmlFor="teacher-username">Username</Label>
                    <Input
                      id="teacher-username"
                      value={initialData.user.username}
                      readOnly
                      disabled
                    />
                  </div>
                )}
                <OrganizationRoleField
                  control={form.control}
                  name="organization_role"
                  disabled={isViewMode}
                  required
                  viewValue={initialData?.user?.organization_role?.name}
                  excludeRoleCodes={['STUDENT', 'PARENT']}
                />
                {!useQuickAdd && (
                  <>
                    <TextInputField
                      control={form.control}
                      name="phone"
                      label="Phone"
                      placeholder={FormPlaceholders.ENTER_PHONE_NUMBER}
                      disabled={isViewMode}
                      required
                      validationType="phone"
                    />
                    <BloodGroupField
                      control={form.control}
                      name="blood_group"
                      disabled={isViewMode}
                    />
                    <DateInputField
                      control={form.control}
                      name="date_of_birth"
                      label="Date of Birth"
                      disabled={isViewMode}
                    />
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Professional Details */}
          {!useQuickAdd && (
            <Card>
              <CardHeader>
                <CardTitle>Professional Details</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <TextInputField
                  control={form.control}
                  name="designation"
                  label="Designation"
                  placeholder={FormPlaceholders.DESIGNATION_EXAMPLE}
                  disabled={isViewMode}
                  validationType="text"
                  validationOptions={{ fieldName: 'Designation', maxLength: 100 }}
                />
                <TextInputField
                  control={form.control}
                  name="highest_qualification"
                  label="Qualification"
                  placeholder={FormPlaceholders.QUALIFICATION_EXAMPLE}
                  disabled={isViewMode}
                  validationType="text"
                  validationOptions={{ fieldName: 'Qualification', maxLength: 200 }}
                />
                <TextInputField
                  control={form.control}
                  name="specialization"
                  label="Specialization"
                  placeholder={FormPlaceholders.SPECIALIZATION_EXAMPLE}
                  disabled={isViewMode}
                  validationType="text"
                  validationOptions={{ fieldName: 'Specialization', maxLength: 200 }}
                />
                <TextInputField
                  control={form.control}
                  name="experience_years"
                  label="Experience (Years)"
                  type="number"
                  placeholder={FormPlaceholders.ENTER_YEARS_OF_EXPERIENCE}
                  disabled={isViewMode}
                  validationType="numeric"
                  validationOptions={{
                    fieldName: 'Experience',
                    min: 0,
                    max: 70,
                    allowDecimal: false,
                  }}
                />
                <SupervisorField
                  control={form.control}
                  name="supervisor_email"
                  disabled={isViewMode}
                  excludeEmail={initialData?.user?.email}
                  viewValue={
                    initialData?.user?.supervisor
                      ? `${initialData.user.supervisor.full_name} (${initialData.user.supervisor.email})`
                      : undefined
                  }
                />
                <SubjectsMultiSelectField
                  control={form.control}
                  name="subjects"
                  disabled={isViewMode}
                />
                <DateInputField
                  control={form.control}
                  name="joining_date"
                  label="Date of Joining"
                  disabled={isViewMode}
                />
              </CardContent>
            </Card>
          )}

          {/* Address */}
          {!useQuickAdd && (
            <Card className="mt-6">
              <CardHeader
                className="cursor-pointer"
                onClick={() => setIsAddressExpanded(!isAddressExpanded)}
              >
                <CardTitle className="flex items-center justify-between">
                  <span>
                    Address{' '}
                    <span className="text-muted-foreground text-sm font-normal">(Optional)</span>
                  </span>
                  {isAddressExpanded ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </CardTitle>
              </CardHeader>
              {isAddressExpanded && (
                <CardContent>
                  <AddressForm
                    form={form}
                    disabled={isViewMode}
                    fieldNames={{
                      addressType: 'address_type',
                      streetAddress: 'street_address',
                      addressLine2: 'address_line_2',
                      city: 'city',
                      state: 'state',
                      zipCode: 'postal_code',
                      country: 'country',
                    }}
                  />
                </CardContent>
              )}
            </Card>
          )}

          {/* Metadata (Created/Updated info) - Only show in edit/view mode */}
          {(isEditMode || isViewMode) && initialData && (
            <FormMetadata createdAt={initialData.created_at} updatedAt={initialData.updated_at} />
          )}

          {/* Form Actions */}
          <FormActions
            mode={mode}
            onCancel={onCancel}
            isSubmitting={isLoading}
            submitLabel={mode === 'create' ? 'Create Teacher' : 'Update Teacher'}
          />
        </form>
      </Form>

      {/* Deleted Duplicate Dialog */}
      <DeletedDuplicateDialog
        open={duplicateHandler.isOpen}
        onOpenChange={duplicateHandler.closeDialog}
        message={duplicateHandler.message}
        onReactivate={handleReactivate}
        onCreateNew={handleForceCreate}
      />
    </>
  );
}
