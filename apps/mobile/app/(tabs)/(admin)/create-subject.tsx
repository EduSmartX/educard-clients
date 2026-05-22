/**
 * Create Subject Screen
 * Form to add a new subject with validation
 */

import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { ChevronLeft, Save } from 'lucide-react-native';
import { getRoleGradient, extractApiError, getFieldErrors } from '@educard/shared';
import { useCreateSubject } from '@/hooks';
import { FormInput, FormSection, FormError } from '@/components/forms';
import { validateForm, hasErrors, required, type FieldErrors } from '@/utils/validation';
import { useToast } from '@/lib/toast-context';
import { headerStyles, layoutStyles } from '@/styles';

const adminGradient = getRoleGradient('admin');

const RULES = {
  name: [required('Subject name')],
};

export default function CreateSubjectScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const createMutation = useCreateSubject();

  const [form, setForm] = useState({
    name: '',
    code: '',
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
      code: form.code.trim() || undefined,
    };

    createMutation.mutate(payload, {
      onSuccess: () => {
        showToast({ type: 'success', title: 'Success', message: 'Subject created successfully' });
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
        setApiError(extractApiError(err, 'Failed to create subject.'));
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
              <Text style={headerStyles.title}>Add Subject</Text>
              <Text style={headerStyles.subtitle}>Create a new subject</Text>
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
          <FormSection title="Subject Details" icon="📚">
            <FormInput
              label="Subject Name"
              required
              value={form.name}
              onChangeText={(v) => updateField('name', v)}
              error={errors.name}
              placeholder="e.g. Mathematics"
            />
            <FormInput
              label="Subject Code"
              value={form.code}
              onChangeText={(v) => updateField('code', v)}
              placeholder="e.g. MATH101"
              hint="Optional unique code"
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
                <Text style={styles.submitText}>Create Subject</Text>
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
