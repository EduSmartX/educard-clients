/**
 * Create Student Screen
 * Form to add a new student with validation
 */

import { useState, useCallback } from 'react';
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
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { ChevronLeft, Save } from 'lucide-react-native';
import { Colors, getRoleGradient, getRoleThemeColors } from '@educard/shared';
import { useCreateStudent } from '@/hooks';
import { FormInput, FormSelect, FormSection, FormError } from '@/components/forms';
import {
  validateForm,
  hasErrors,
  required,
  minLength,
  email,
  phone,
  type FieldErrors,
} from '@/utils/validation';
import { headerStyles, layoutStyles } from '@/styles';

const adminTheme = getRoleThemeColors('admin');
const adminGradient = getRoleGradient('admin');

const GENDER_CHIPS = [
  { value: 'M', label: '👨 Male' },
  { value: 'F', label: '👩 Female' },
  { value: 'O', label: 'Other' },
];

const RULES = {
  first_name: [required('First name'), minLength('First name', 2)],
  last_name: [required('Last name')],
  email: [required('Email'), email()],
  roll_number: [required('Roll number')],
  phone: [phone('Phone')],
  guardian_phone: [phone('Guardian phone')],
};

export default function CreateStudentScreen() {
  const router = useRouter();
  const createMutation = useCreateStudent();

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    gender: '',
    roll_number: '',
    admission_number: '',
    admission_date: '',
    guardian_name: '',
    guardian_phone: '',
    guardian_email: '',
    guardian_relationship: '',
    medical_conditions: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const updateField = useCallback(
    (field: string, value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[field];
          return next;
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

    const payload = {
      user: {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        gender: form.gender || undefined,
        role: 'student',
      },
      roll_number: form.roll_number.trim(),
      admission_number: form.admission_number.trim() || undefined,
      admission_date: form.admission_date.trim() || undefined,
      guardian_name: form.guardian_name.trim() || undefined,
      guardian_phone: form.guardian_phone.trim() || undefined,
      guardian_email: form.guardian_email.trim() || undefined,
      guardian_relationship: form.guardian_relationship.trim() || undefined,
      medical_conditions: form.medical_conditions.trim() || undefined,
      emergency_contact_name: form.emergency_contact_name.trim() || undefined,
      emergency_contact_phone: form.emergency_contact_phone.trim() || undefined,
    };

    createMutation.mutate(payload, {
      onSuccess: () => {
        Alert.alert('Success', 'Student created successfully', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      },
      onError: (err: any) => {
        const msg =
          err?.response?.data?.message ||
          err?.response?.data?.detail ||
          'Failed to create student. Please check your input.';
        setApiError(msg);
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
              <Text style={headerStyles.title}>Add Student</Text>
              <Text style={headerStyles.subtitle}>Fill in the details below</Text>
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
          contentContainerStyle={styles.formContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <FormError message={apiError} onDismiss={() => setApiError(null)} />

          <Animated.View entering={FadeInDown.delay(100)}>
            <FormSection title="Personal Information" icon="👤">
              <FormInput
                label="First Name"
                required
                value={form.first_name}
                onChangeText={(v) => updateField('first_name', v)}
                error={errors.first_name}
                placeholder="e.g. Rahul"
                autoCapitalize="words"
              />
              <FormInput
                label="Last Name"
                required
                value={form.last_name}
                onChangeText={(v) => updateField('last_name', v)}
                error={errors.last_name}
                placeholder="e.g. Kumar"
                autoCapitalize="words"
              />
              <FormInput
                label="Email"
                required
                value={form.email}
                onChangeText={(v) => updateField('email', v)}
                error={errors.email}
                placeholder="e.g. rahul@school.com"
                keyboardType="email-address"
              />
              <FormInput
                label="Phone"
                value={form.phone}
                onChangeText={(v) => updateField('phone', v)}
                error={errors.phone}
                placeholder="e.g. 9876543210"
                keyboardType="phone-pad"
              />
              <FormSelect
                label="Gender"
                options={GENDER_CHIPS}
                value={form.gender}
                onChange={(v) => updateField('gender', v)}
                error={errors.gender}
              />
            </FormSection>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200)}>
            <FormSection title="Admission Details" icon="🎓">
              <FormInput
                label="Roll Number"
                required
                value={form.roll_number}
                onChangeText={(v) => updateField('roll_number', v)}
                error={errors.roll_number}
                placeholder="e.g. A01"
              />
              <FormInput
                label="Admission Number"
                value={form.admission_number}
                onChangeText={(v) => updateField('admission_number', v)}
                placeholder="e.g. ADM001"
              />
              <FormInput
                label="Admission Date"
                value={form.admission_date}
                onChangeText={(v) => updateField('admission_date', v)}
                placeholder="YYYY-MM-DD"
              />
            </FormSection>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300)}>
            <FormSection title="Guardian Details" icon="👨‍👩‍👦">
              <FormInput
                label="Guardian Name"
                value={form.guardian_name}
                onChangeText={(v) => updateField('guardian_name', v)}
                placeholder="e.g. Mr. Kumar"
                autoCapitalize="words"
              />
              <FormInput
                label="Guardian Phone"
                value={form.guardian_phone}
                onChangeText={(v) => updateField('guardian_phone', v)}
                error={errors.guardian_phone}
                placeholder="e.g. 9876543210"
                keyboardType="phone-pad"
              />
              <FormInput
                label="Guardian Email"
                value={form.guardian_email}
                onChangeText={(v) => updateField('guardian_email', v)}
                placeholder="e.g. parent@email.com"
                keyboardType="email-address"
              />
              <FormInput
                label="Relationship"
                value={form.guardian_relationship}
                onChangeText={(v) => updateField('guardian_relationship', v)}
                placeholder="e.g. Father"
                autoCapitalize="words"
              />
            </FormSection>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400)}>
            <FormSection title="Emergency & Medical" icon="🚨">
              <FormInput
                label="Emergency Contact Name"
                value={form.emergency_contact_name}
                onChangeText={(v) => updateField('emergency_contact_name', v)}
                placeholder="e.g. Jane Kumar"
                autoCapitalize="words"
              />
              <FormInput
                label="Emergency Contact Phone"
                value={form.emergency_contact_phone}
                onChangeText={(v) => updateField('emergency_contact_phone', v)}
                placeholder="e.g. 9876543210"
                keyboardType="phone-pad"
              />
              <FormInput
                label="Medical Conditions"
                value={form.medical_conditions}
                onChangeText={(v) => updateField('medical_conditions', v)}
                placeholder="e.g. Asthma, allergies..."
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
                  <Text style={styles.submitText}>Create Student</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
