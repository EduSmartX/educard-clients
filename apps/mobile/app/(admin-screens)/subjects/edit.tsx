/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-misused-promises, @typescript-eslint/no-floating-promises, @typescript-eslint/prefer-nullish-coalescing *//**
 * Edit Subject Screen
 * Fetches existing subject data, pre-populates form, PATCHes on save.
 */

import {
  getRoleGradient,
  subjectFormSchema,
  validateField,
  validateAllFields,
  buildSubjectPayload,
  parseApiErrors,
} from '@educard/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Save } from 'lucide-react-native';
import { useState, useCallback, useMemo, useEffect } from 'react';
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

import { FormInput, FormSection, FormError, FormDropdown } from '@/components/forms';
import { useManagedClasses } from '@/features/classes';
import { useCoreSubjects } from '@/features/core';
import { useSubjectDetail, useUpdateSubject } from '@/features/subjects';
import { useTeachers } from '@/features/teachers';
import { headerStyles, layoutStyles } from '@/styles';

const adminGradient = getRoleGradient('admin');
type FieldErrors = Record<string, string>;

export default function EditSubjectScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: subject, isLoading: detailLoading } = useSubjectDetail(id || '');
  const updateMutation = useUpdateSubject();
  // Fetch managed classes - for teachers, only classes where they are class teacher
  const { data: classesData } = useManagedClasses('subject');
  const { data: coreSubjects, isLoading: subjectsLoading } = useCoreSubjects();
  const { data: teachersData } = useTeachers({ page_size: 100 });

  const [formLoaded, setFormLoaded] = useState(false);

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

  useEffect(() => {
    if (subject && !formLoaded) {
      setForm({
        class_id:
          subject.class_info?.public_id ||
          subject.class_assigned?.public_id ||
          subject.class_id ||
          '',
        subject_id:
          subject.subject_info?.id?.toString() ||
          subject.subject_master?.id?.toString() ||
          subject.subject_id ||
          '',
        teacher_id:
          subject.teacher_info?.public_id || subject.teacher?.public_id || subject.teacher_id || '',
        description: subject.description || '',
      });
      setFormLoaded(true);
    }
  }, [subject, formLoaded]);

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
    updateMutation.mutate(
      { publicId: id, data: payload },
      {
        onSuccess: () => {
          Alert.alert('✅ Success', 'Subject updated successfully!', [
            { text: 'OK', onPress: () => router.back() },
          ]);
        },
        onError: (err: any) => {
          const { fieldErrors: fe, generalError } = parseApiErrors(err?.response?.data);
          if (Object.keys(fe).length > 0) {
            setErrors(fe);
            return;
          }
          setApiError(generalError || 'Failed to update subject.');
        },
      }
    );
  }, [form, id, updateMutation, router]);

  if (detailLoading || !formLoaded) {
    return (
      <View style={[layoutStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text style={{ marginTop: 12, color: '#64748b' }}>Loading subject data...</Text>
      </View>
    );
  }

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
              <Text style={headerStyles.title}>Edit Subject</Text>
              <Text style={headerStyles.subtitle}>Update subject assignment</Text>
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
            disabled={updateMutation.isPending}
            style={st.subBtn}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#7c3aed', '#4f46e5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={st.subGrad}
            >
              {updateMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Save size={20} color="#fff" />
                  <Text style={st.subText}>Update Subject</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
