/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/prefer-nullish-coalescing */
/**
 * Create Class Screen — Uses shared ClassFormBase
 */

import {
  classFormSchema,
  validateField,
  validateAllFields,
  buildClassPayload,
  parseApiErrors,
  getErrorMessage,
} from '@educard/shared';
import { useRouter } from 'expo-router';
import { useState, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';

import { DeletedDuplicateModal } from '@/components/common/DeletedDuplicateModal';
import { ClassFormBase, ClassFormState, FieldErrors } from '@/components/screens/ClassFormBase';
import { useCreateClass, useRestoreClass } from '@/features/classes';
import { useCoreClasses } from '@/features/core';
import { useTeachers } from '@/features/teachers';
import { useDeletedDuplicateHandler } from '@/hooks/useDeletedDuplicateHandler';
import { useToast } from '@/lib/toast-context';
import {
  isDeletedDuplicateError,
  getDeletedDuplicateMessage,
  getDeletedRecordId,
} from '@/utils/deleted-duplicate';

export default function CreateClassScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const createMutation = useCreateClass();
  const restoreMutation = useRestoreClass();
  const { data: coreClasses, isLoading: coreLoading } = useCoreClasses();
  const { data: teachersData } = useTeachers({ page_size: 100 });

  const duplicateHandler = useDeletedDuplicateHandler<{
    payload: Record<string, unknown>;
    deletedRecordId: string | null;
  }>();

  const coreClassOpts = useMemo(
    () => (coreClasses || []).map((c) => ({ value: c.id.toString(), label: c.name })),
    [coreClasses]
  );
  const teacherOpts = useMemo(() => {
    const teachers = teachersData?.teachers || [];
    return teachers.map((t: { public_id: string; full_name: string; email: string }) => ({
      value: t.public_id,
      label: `${t.full_name} (${t.email})`,
    }));
  }, [teachersData]);

  const [form, setForm] = useState<ClassFormState>({
    class_master: '',
    name: '',
    capacity: '',
    class_teacher_id: '',
    room_number: '',
    info: '',
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const updateField = useCallback(
    (field: string, value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      if (errors[field])
        setErrors((prev) => {
          const n = { ...prev };
          delete n[field];
          return n;
        });
    },
    [errors]
  );

  const blurValidate = useCallback(
    (field: string) => {
      const err = validateField(classFormSchema, field, form[field as keyof ClassFormState]);
      setErrors((prev) => {
        if (err) return { ...prev, [field]: err };
        const n = { ...prev };
        delete n[field];
        return n;
      });
    },
    [form]
  );

  const submitCreate = useCallback(
    (payload: Record<string, unknown>, forceCreate: boolean) => {
      createMutation.mutate(
        { data: payload, forceCreate },
        {
          onSuccess: () => {
            duplicateHandler.closeDialog();
            router.back();
          },
          onError: (err: unknown) => {
            if (isDeletedDuplicateError(err)) {
              const msg = getDeletedDuplicateMessage(err);
              const recordId = getDeletedRecordId(err);
              duplicateHandler.openDialog(msg, { payload, deletedRecordId: recordId });
              return;
            }
            const apiErr = err as {
              response?: { data?: Record<string, unknown> };
              message?: string;
            };
            const { fieldErrors: fe, generalError } = parseApiErrors(apiErr?.response?.data);
            if (Object.keys(fe).length > 0) {
              setErrors(fe);
              return;
            }
            setApiError(generalError || 'Failed to create class.');
          },
        }
      );
    },
    [createMutation, router, duplicateHandler]
  );

  const handleSubmit = useCallback(() => {
    setApiError(null);
    const fe = validateAllFields(classFormSchema, form as unknown as Record<string, unknown>);
    setErrors(fe);
    if (Object.keys(fe).length > 0) return;

    const payload = buildClassPayload({ ...form });
    submitCreate(payload, false);
  }, [form, submitCreate]);

  const handleReactivate = useCallback(() => {
    const recordId = duplicateHandler.pendingData?.deletedRecordId;
    if (!recordId) {
      Alert.alert('Error', 'Could not find deleted record ID.');
      return;
    }
    restoreMutation.mutate(recordId, {
      onSuccess: () => {
        duplicateHandler.closeDialog();
        showToast({
          type: 'success',
          title: 'Restored',
          message: 'The deleted class has been reactivated.',
        });
        router.back();
      },
      onError: (error: unknown) => {
        showToast({
          type: 'error',
          title: 'Error',
          message: getErrorMessage(error, 'Failed to reactivate. Please try again.'),
        });
      },
    });
  }, [duplicateHandler, restoreMutation, router, showToast]);

  const handleForceCreate = useCallback(() => {
    const payload = duplicateHandler.pendingData?.payload;
    if (payload) {
      duplicateHandler.closeDialog();
      submitCreate(payload, true);
    }
  }, [duplicateHandler, submitCreate]);

  return (
    <ClassFormBase
      title="Add New Class"
      subtitle="Create a new section"
      submitLabel="Create Class"
      form={form}
      errors={errors}
      apiError={apiError}
      isSaving={createMutation.isPending}
      coreClassOpts={coreClassOpts}
      coreLoading={coreLoading}
      teacherOpts={teacherOpts}
      updateField={updateField}
      blurValidate={blurValidate}
      onSubmit={handleSubmit}
      onDismissError={() => setApiError(null)}
    >
      <DeletedDuplicateModal
        visible={duplicateHandler.isOpen}
        message={duplicateHandler.message}
        onReactivate={handleReactivate}
        onCreateNew={handleForceCreate}
        onCancel={duplicateHandler.closeDialog}
        isLoading={restoreMutation.isPending || createMutation.isPending}
      />
    </ClassFormBase>
  );
}
