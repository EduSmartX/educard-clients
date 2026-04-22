/**
 * Edit Class Screen
 * Fetches existing class data, pre-populates form, PATCHes on save.
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { ChevronLeft, Save } from 'lucide-react-native';
import { getRoleGradient, classFormSchema, validateField, validateAllFields, buildClassPayload, parseApiErrors } from '@educard/shared';
import { useClassDetail, useUpdateClass } from '@/features/classes';
import { useCoreClasses } from '@/features/core';
import { useTeachers } from '@/features/teachers';
import { FormInput, FormSection, FormError, FormDropdown } from '@/components/forms';
import { headerStyles, layoutStyles } from '@/styles';

const adminGradient = getRoleGradient('admin');
type FieldErrors = Record<string, string>;

export default function EditClassScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: classDetail, isLoading: detailLoading } = useClassDetail(id || '');
  const updateMutation = useUpdateClass();
  const { data: coreClasses, isLoading: coreLoading } = useCoreClasses();
  const { data: teachersData } = useTeachers({ page_size: 100 });

  const [formLoaded, setFormLoaded] = useState(false);

  const coreClassOpts = useMemo(
    () => (coreClasses || []).map((c) => ({ value: c.id.toString(), label: c.name })),
    [coreClasses]
  );
  const teacherOpts = useMemo(() => {
    const teachers = teachersData?.teachers || [];
    return teachers.map((t: any) => ({ value: t.public_id, label: `${t.full_name} (${t.email})` }));
  }, [teachersData]);

  const [form, setForm] = useState({
    class_master: '', name: '', capacity: '', class_teacher_id: '',
    room_number: '', info: '',
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (classDetail && !formLoaded) {
      setForm({
        class_master: classDetail.class_master?.id?.toString() || '',
        name: classDetail.name || classDetail.section || '',
        capacity: classDetail.capacity?.toString() || '',
        class_teacher_id: classDetail.class_teacher?.public_id || classDetail.class_teacher_id || '',
        room_number: classDetail.room_number || '',
        info: classDetail.info || classDetail.description || '',
      });
      setFormLoaded(true);
    }
  }, [classDetail, formLoaded]);

  const updateField = useCallback((field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  }, [errors]);

  const blurValidate = useCallback((field: string) => {
    const err = validateField(classFormSchema, field, form[field as keyof typeof form]);
    setErrors((prev) => {
      if (err) return { ...prev, [field]: err };
      const n = { ...prev }; delete n[field]; return n;
    });
  }, [form]);

  const handleSubmit = useCallback(() => {
    setApiError(null);
    const fe = validateAllFields(classFormSchema, form);
    setErrors(fe);
    if (Object.keys(fe).length > 0) return;

    const payload = buildClassPayload(form);
    updateMutation.mutate({ publicId: id!, data: payload }, {
      onSuccess: () => {
        Alert.alert('✅ Success', 'Class updated successfully!', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      },
      onError: (err: any) => {
        const { fieldErrors: fe, generalError } = parseApiErrors(err?.response?.data);
        if (Object.keys(fe).length > 0) { setErrors(fe); return; }
        setApiError(generalError || 'Failed to update class.');
      },
    });
  }, [form, id, updateMutation, router]);

  if (detailLoading || !formLoaded) {
    return (
      <View style={[layoutStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text style={{ marginTop: 12, color: '#64748b' }}>Loading class data...</Text>
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
              <Text style={headerStyles.title}>Edit Class</Text>
              <Text style={headerStyles.subtitle}>{form.name}</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={st.form} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <FormError message={apiError} onDismiss={() => setApiError(null)} />

          <Animated.View entering={FadeInDown.delay(100)}>
            <FormSection title="Class Information" icon="🏫">
              <FormDropdown label="Class (Master)" required options={coreClassOpts} value={form.class_master} onChange={(v) => updateField('class_master', v)} error={errors.class_master} placeholder="Select class" searchable loading={coreLoading} />
              <FormInput label="Section Name" required value={form.name} onChangeText={(v) => updateField('name', v)} onBlurValidate={() => blurValidate('name')} error={errors.name} placeholder="e.g. A, B, Nehru" />
              <FormInput label="Capacity" value={form.capacity} onChangeText={(v) => updateField('capacity', v)} onBlurValidate={() => blurValidate('capacity')} error={errors.capacity} placeholder="e.g. 50" keyboardType="numeric" maxLength={3} />
              <FormDropdown label="Class Teacher" options={teacherOpts} value={form.class_teacher_id} onChange={(v) => updateField('class_teacher_id', v)} placeholder="Select class teacher" searchable />
              <FormInput label="Room Number" value={form.room_number} onChangeText={(v) => updateField('room_number', v)} placeholder="e.g. Room 101" />
              <FormInput label="Description" value={form.info} onChangeText={(v) => updateField('info', v)} placeholder="Optional notes about this class" multiline numberOfLines={3} />
            </FormSection>
          </Animated.View>

          <TouchableOpacity onPress={handleSubmit} disabled={updateMutation.isPending} style={st.subBtn} activeOpacity={0.8}>
            <LinearGradient colors={['#7c3aed', '#4f46e5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={st.subGrad}>
              {updateMutation.isPending ? <ActivityIndicator color="#fff" /> : (
                <><Save size={20} color="#fff" /><Text style={st.subText}>Update Class</Text></>
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
  subGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 14 },
  subText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
