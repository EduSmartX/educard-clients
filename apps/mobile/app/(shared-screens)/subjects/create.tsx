/**
 * Create Subject Screen — Uses shared Zod validation schemas
 * Validates on blur (per-field) and on submit (full form)
 */

import {
  getRoleGradient,
  subjectFormSchema,
  validateField,
  validateAllFields,
  buildSubjectPayload,
  parseApiErrors,
  getErrorMessage,
  SUBJECT_TYPE_OPTIONS,
  type Class,
  type Teacher,
  type ApiErrorData,
} from '@educard/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronLeft, Save } from 'lucide-react-native';
import { useState, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { DeletedDuplicateModal } from '@/components/common/DeletedDuplicateModal';
import { FormInput, FormSection, FormError, FormDropdown } from '@/components/forms';
import { useManagedClasses } from '@/features/classes';
import { useCoreSubjects } from '@/features/core';
import { useCreateSubject, useRestoreSubject } from '@/features/subjects';
import { useTeachers } from '@/features/teachers';
import { useDeletedDuplicateHandler } from '@/hooks/useDeletedDuplicateHandler';
import { useAuthStore } from '@/lib/auth-store';
import { useToast } from '@/lib/toast-context';
import { headerStyles, layoutStyles } from '@/styles';
import {
  isDeletedDuplicateError,
  getDeletedDuplicateMessage,
  getDeletedRecordId,
} from '@/utils/deleted-duplicate';
import { isTeacherRole } from '@/utils/role-utils';

const adminGradient = getRoleGradient('admin');
type FieldErrors = Record<string, string>;

export default function CreateSubjectScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { user } = useAuthStore();
  const createMutation = useCreateSubject();
  const restoreMutation = useRestoreSubject();

  // Check if user is a teacher (not admin)
  const isTeacher = isTeacherRole(user?.role);

  // Fetch managed classes - for teachers, only classes where they are class teacher
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

  const [form, setForm] = useState({
    class_id: '',
    subject_id: '',
    subject_type: 'core' as 'core' | 'elective' | 'language',
    teacher_id: '',
    description: '',
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

  const _blurValidate = useCallback(
    (field: string) => {
      const err = validateField(subjectFormSchema, field, form[field as keyof typeof form]);
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
            showToast({
              type: 'success',
              title: 'Success',
              message: 'Subject created successfully',
            });
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
    const fe = validateAllFields(subjectFormSchema, form);
    setErrors(fe);
    if (Object.keys(fe).length > 0) return;

    const payload = buildSubjectPayload(form);
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
  }, [duplicateHandler, restoreMutation, router]);

  const handleForceCreate = useCallback(() => {
    const payload = duplicateHandler.pendingData?.payload;
    if (payload) {
      duplicateHandler.closeDialog();
      submitCreate(payload, true);
    }
  }, [duplicateHandler, submitCreate]);

  return (
    <View style={layoutStyles.container}>
      <LinearGradient colors={adminGradient} style={headerStyles.header}>
        <Animated.View entering={FadeIn.delay(100)} style={headerStyles.circle1} />
        <Animated.View entering={FadeIn.delay(200)} style={headerStyles.circle2} />
        <View style={headerStyles.content}>
          <View style={headerStyles.topRow}>
            <TouchableOpacity style={headerStyles.backBtn} onPress={() => router.back()}>
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <View style={headerStyles.titleContainer}>
              <Text style={headerStyles.title}>Add Subject</Text>
              <Text style={headerStyles.subtitle}>Assign a subject to a class</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
        </View>
      </LinearGradient>

      <KeyboardAwareScrollView
        contentContainerStyle={st.form}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraScrollHeight={20}
        style={{ flex: 1 }}
      >
        <FormError message={apiError} onDismiss={() => setApiError(null)} />

        {/* Info banner for teachers */}
        {isTeacher && (
          <Animated.View entering={FadeInDown.delay(50)}>
            <View style={st.infoBanner}>
              <Text style={st.infoBannerText}>
                ℹ️ You can add subjects only for classes where you are assigned as the class
                teacher.
              </Text>
            </View>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(100)}>
          <FormSection title="Subject Assignment" icon="📚">
            <FormDropdown
              label="Class"
              required
              options={classOpts}
              value={form.class_id}
              onChange={(v) => updateField('class_id', v)}
              error={errors.class_id}
              placeholder="Select a class"
              searchable
            />
            <FormDropdown
              label="Subject"
              required
              options={subjectOpts}
              value={form.subject_id}
              onChange={(v) => updateField('subject_id', v)}
              error={errors.subject_id}
              placeholder="Select a subject"
              searchable
              loading={subjectsLoading}
            />
            <FormDropdown
              label="Subject Type (Optional)"
              options={SUBJECT_TYPE_OPTIONS.map((opt) => ({
                value: opt.value,
                label: opt.label,
              }))}
              value={form.subject_type}
              onChange={(v) => updateField('subject_type', v)}
              error={errors.subject_type}
              placeholder="Select subject type"
            />
            <FormDropdown
              label="Teacher"
              options={teacherOpts}
              value={form.teacher_id}
              onChange={(v) => updateField('teacher_id', v)}
              placeholder="Select a teacher (optional)"
              searchable
            />
            <FormInput
              label="Description"
              value={form.description}
              onChangeText={(v) => updateField('description', v)}
              placeholder="Optional description"
              multiline
              numberOfLines={3}
            />
          </FormSection>
        </Animated.View>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={createMutation.isPending}
          style={st.subBtn}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#7c3aed', '#4f46e5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={st.subGrad}
          >
            {createMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Save size={20} color="#fff" />
                <Text style={st.subText}>Create Subject</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </KeyboardAwareScrollView>

      <DeletedDuplicateModal
        visible={duplicateHandler.isOpen}
        message={duplicateHandler.message}
        onReactivate={handleReactivate}
        onCreateNew={handleForceCreate}
        onCancel={duplicateHandler.closeDialog}
        isLoading={restoreMutation.isPending || createMutation.isPending}
      />
    </View>
  );
}

const st = StyleSheet.create({
  form: { padding: 16, paddingBottom: 40 },
  infoBanner: {
    backgroundColor: '#dbeafe',
    padding: 14,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#93c5fd',
  },
  infoBannerText: { fontSize: 13, color: '#1e40af', lineHeight: 18 },
  subBtn: { marginTop: 8 },
  subGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
  },
  subText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
