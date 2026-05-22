/**
 * Create Class Screen
 * Form to add a new class/section with validation
 */

import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { ChevronLeft, Save } from 'lucide-react-native';
import {
  getRoleGradient,
  getRoleThemeColors,
  extractApiError,
  getFieldErrors,
} from '@educard/shared';
import { useCreateClass } from '@/hooks';
import { FormInput, FormSection, FormError } from '@/components/forms';
import {
  validateForm,
  hasErrors,
  required,
  numberRange,
  type FieldErrors,
} from '@/utils/validation';
import { useToast } from '@/lib/toast-context';
import { headerStyles, layoutStyles } from '@/styles';

const adminGradient = getRoleGradient('admin');

const RULES = {
  name: [required('Section name')],
  capacity: [numberRange('Capacity', 1, 500)],
};

export default function CreateClassScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const createMutation = useCreateClass();

  const [form, setForm] = useState({
    name: '',
    capacity: '',
    info: '',
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const updateField = useCallback(
    (field: string, value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors((prev) => {
          const n = { ...prev };
          delete n[field];
          return n;
        });
      }
    },
    [errors]
  );

  const handleSubmit = useCallback(() => {
    setApiError(null);
    const fieldErrors = validateForm(form, RULES);
    setErrors(fieldErrors);
    if (hasErrors(fieldErrors)) return;

    const payload: any = {
      name: form.name.trim(),
      capacity: form.capacity ? Number(form.capacity) : undefined,
      info: form.info.trim() || undefined,
    };

    createMutation.mutate(payload, {
      onSuccess: () => {
        showToast({ type: 'success', title: 'Success', message: 'Class created successfully' });
        router.back();
      },
      onError: (err: unknown) => {
        // Extract field-level validation errors from API response
        const fieldErrors = getFieldErrors(err);
        if (Object.keys(fieldErrors).length > 0) {
          setErrors((prev) => ({ ...prev, ...fieldErrors }));
          // Inline field errors are sufficient - no banner needed
          return;
        }
        // Show banner only for non-field errors (server errors, network issues, etc.)
        setApiError(extractApiError(err, 'Failed to create class.'));
      },
    });
  }, [form, createMutation, router]);

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
              <Text style={headerStyles.title}>Add Class</Text>
              <Text style={headerStyles.subtitle}>Create a new section</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
        </View>
      </LinearGradient>

      <KeyboardAwareScrollView
        contentContainerStyle={styles.formContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraScrollHeight={20}
        style={{ flex: 1 }}
      >
        <FormError message={apiError} onDismiss={() => setApiError(null)} />

        <Animated.View entering={FadeInDown.delay(100)}>
          <FormSection title="Class Details" icon="🏫">
            <FormInput
              label="Section Name"
              required
              value={form.name}
              onChangeText={(v) => updateField('name', v)}
              error={errors.name}
              placeholder="e.g. A, B, Nehru"
            />
            <FormInput
              label="Capacity"
              value={form.capacity}
              onChangeText={(v) => updateField('capacity', v)}
              error={errors.capacity}
              placeholder="e.g. 50"
              keyboardType="numeric"
            />
            <FormInput
              label="Description"
              value={form.info}
              onChangeText={(v) => updateField('info', v)}
              placeholder="Optional notes about this class"
              multiline
              numberOfLines={3}
            />
          </FormSection>
        </Animated.View>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={createMutation.isPending}
          style={styles.submitBtn}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#7c3aed', '#4f46e5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitGradient}
          >
            {createMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Save size={20} color="#fff" />
                <Text style={styles.submitText}>Create Class</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  formContainer: { padding: 16, paddingBottom: 40 },
  submitBtn: { marginTop: 8 },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
  },
  submitText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
