/**
 * Create Subject Screen — Uses shared SubjectFormBase
 */

import {
  subjectFormSchema,
  validateAllFields,
  buildSubjectPayload,
  parseApiErrors,
  getErrorMessage,
  type Class,
  type Teacher,
  type ApiErrorData,
} from '@educard/shared';
import { useRouter } from 'expo-router';
import { useState, useCallback, useMemo } from 'react';
import { View, Text } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { DeletedDuplicateModal } from '@/components/common/DeletedDuplicateModal';
import {
  SubjectFormBase,
  SubjectFormState,
  FieldErrors,
  subjectFormStyles as st,
} from '@/components/screens/SubjectFormBase';
import { useManagedClasses } from '@/features/classes';
import { useCoreSubjects } from '@/features/core';
import { useCreateSubject, useRestoreSubject } from '@/features/subjects';
import { useTeachers } from '@/features/teachers';
import { useDeletedDuplicateHandler } from '@/hooks/useDeletedDuplicateHandler';
import { useAuthStore } from '@/lib/auth-store';
import { useToast } from '@/lib/toast-context';
import {
  isDeletedDuplicateError,
  getDeletedDuplicateMessage,
  getDeletedRecordId,
} from '@/utils/deleted-duplicate';
import { isTeacherRole } from '@/utils/role-utils';

export default function CreateSubjectScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { user } = useAuthStore();
  const createMutation = useCreateSubject();
  const restoreMutation = useRestoreSubject();

  const isTeacher = isTeacherRole(user?.role);

  const { data: classesData } = useManagedClasses('subject');
  const { data: coreSubjects, isLoading: subjectsLoading } = useCoreSubjects();
  const { data: teachersData } = useTeachers({ page_size: 100 });

  const duplicateHandler = useDeletedDuplicateHandler<{
    payload: Record<string, unknown>;
    deletedRecordId: string | null;
  }>();

  const classOpts = useMemo(() => {
    const items = classesData?.classes || [];
    return items.map((c: Class) => ({
      value: c.public_id,
      label: `${c.class_master?.name || ''} - ${c.name}`.trim(),
    }));
  }, [classesData]);

  const subjectOpts = useMemo(
    () => (coreSubjects || []).map((s) => ({ value: s.id.toString(), label: s.name })),
    [coreSubjects]
  );

  const teacherOpts = useMemo(() => {
    const teachers = teachersData?.teachers || [];
    return teachers.map((t: Teacher) => ({
      value: t.public_id,
      label: `${t.full_name} (${t.email})`,
    }));
  }, [teachersData]);

  const [form, setForm] = useState<SubjectFormState>({
    class_id: '',
    subject_id: '',
    subject_type: 'core',
    teacher_id: '',
    description: '',
    display_order: '',
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
            const axiosError = err as { response?: { data?: ApiErrorData } };
            const { fieldErrors: fe, generalError } = parseApiErrors(axiosError?.response?.data);
            if (Object.keys(fe).length > 0) {
              setErrors(fe);
              return;
            }
            setApiError(generalError || 'Failed to create subject.');
          },
        }
      );
    },
    [createMutation, router, duplicateHandler]
  );

  const handleSubmit = useCallback(() => {
    setApiError(null);
    const fe = validateAllFields(subjectFormSchema, { ...form });
    setErrors(fe);
    if (Object.keys(fe).length > 0) return;

    const payload = buildSubjectPayload({ ...form });
    submitCreate(payload, false);
  }, [form, submitCreate]);

  const handleReactivate = useCallback(() => {
    const recordId = duplicateHandler.pendingData?.deletedRecordId;
    if (!recordId) {
      showToast({ type: 'error', title: 'Error', message: 'Could not find deleted record ID.' });
      return;
    }
    restoreMutation.mutate(recordId, {
      onSuccess: () => {
        duplicateHandler.closeDialog();
        showToast({
          type: 'success',
          title: 'Restored',
          message: 'The deleted subject has been reactivated.',
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

  const infoBanner = isTeacher ? (
    <Animated.View entering={FadeInDown.delay(50)}>
      <View style={st.infoBanner}>
        <Text style={st.infoBannerText}>
          ℹ️ You can add subjects only for classes where you are assigned as the class teacher.
        </Text>
      </View>
    </Animated.View>
  ) : undefined;

  return (
    <SubjectFormBase
      title="Add Subject"
      subtitle="Assign a subject to a class"
      submitLabel="Create Subject"
      form={form}
      errors={errors}
      apiError={apiError}
      isSaving={createMutation.isPending}
      classOpts={classOpts}
      subjectOpts={subjectOpts}
      subjectsLoading={subjectsLoading}
      teacherOpts={teacherOpts}
      updateField={updateField}
      onSubmit={handleSubmit}
      onDismissError={() => setApiError(null)}
      infoBanner={infoBanner}
    >
      <DeletedDuplicateModal
        visible={duplicateHandler.isOpen}
        message={duplicateHandler.message}
        onReactivate={handleReactivate}
        onCreateNew={handleForceCreate}
        onCancel={duplicateHandler.closeDialog}
        isLoading={restoreMutation.isPending || createMutation.isPending}
      />
    </SubjectFormBase>
  );
}
