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
} from '@educard/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronLeft, Save } from 'lucide-react-native';
import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { DeletedDuplicateModal } from '@/components/common/DeletedDuplicateModal';
import { FormInput, FormSection, FormError, FormDropdown } from '@/components/forms';
import { useClasses } from '@/features/classes';
import { useCoreSubjects } from '@/features/core';
import { useCreateSubject, useRestoreSubject } from '@/features/subjects';
import { useTeachers } from '@/features/teachers';
import { useDeletedDuplicateHandler } from '@/hooks/useDeletedDuplicateHandler';
import { headerStyles, layoutStyles } from '@/styles';
import {
  isDeletedDuplicateError,
  getDeletedDuplicateMessage,
  getDeletedRecordId,
} from '@/utils/deleted-duplicate';

const adminGradient = getRoleGradient('admin');
type FieldErrors = Record<string, string>;

export default function CreateSubjectScreen() {
  const router = useRouter();
  const createMutation = useCreateSubject();
  const restoreMutation = useRestoreSubject();
  const { data: classesData } = useClasses({ page_size: 100 });
  const { data: coreSubjects, isLoading: subjectsLoading } = useCoreSubjects();
  const { data: teachersData } = useTeachers({ page_size: 100 });

  const duplicateHandler = useDeletedDuplicateHandler<{
    payload: any;
    deletedRecordId: string | null;
  }>();

  const classOpts = useMemo(() => {
    const items = classesData?.classes || [];
    return items.map((c: any) => ({
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
    return teachers.map((t: any) => ({ value: t.public_id, label: `${t.full_name} (${t.email})` }));
  }, [teachersData]);

  const [form, setForm] = useState({
    class_id: '',
    subject_id: '',
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

  const blurValidate = useCallback(
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

  const handleSubmit = useCallback(() => {
    setApiError(null);
    const fe = validateAllFields(subjectFormSchema, form);
    setErrors(fe);
    if (Object.keys(fe).length > 0) return;

    const payload = buildSubjectPayload(form);
    submitCreate(payload, false);
  }, [form, createMutation, router]);

  const submitCreate = useCallback(
    (payload: any, forceCreate: boolean) => {
      createMutation.mutate(
        { data: payload, forceCreate },
        {
          onSuccess: () => {
            duplicateHandler.closeDialog();
            Alert.alert('Success', 'Subject created successfully', [
              { text: 'OK', onPress: () => router.back() },
            ]);
          },
          onError: (err: any) => {
            if (isDeletedDuplicateError(err)) {
              const msg = getDeletedDuplicateMessage(err);
              const recordId = getDeletedRecordId(err);
              duplicateHandler.openDialog(msg, { payload, deletedRecordId: recordId });
              return;
            }
            const { fieldErrors: fe, generalError } = parseApiErrors(err?.response?.data);
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

  const handleReactivate = useCallback(() => {
    const recordId = duplicateHandler.pendingData?.deletedRecordId;
    if (!recordId) {
      Alert.alert('Error', 'Could not find deleted record ID.');
      return;
    }
    restoreMutation.mutate(recordId, {
      onSuccess: () => {
        duplicateHandler.closeDialog();
        Alert.alert('✅ Restored', 'The deleted subject has been reactivated.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      },
      onError: (error: unknown) => {
        Alert.alert('Error', getErrorMessage(error, 'Failed to reactivate. Please try again.'));
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

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={st.form}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <FormError message={apiError} onDismiss={() => setApiError(null)} />

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
        </ScrollView>
      </KeyboardAvoidingView>

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
