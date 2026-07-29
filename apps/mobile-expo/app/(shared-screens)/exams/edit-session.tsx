/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-misused-promises */
/**
 * Edit Exam Session Screen
 */

import { getRoleGradient, extractApiError } from '@educard/shared';
import { EXAM_SESSION_TYPE_LABELS, type ExamSessionType } from '@educard/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Check } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { FormInput, FormDropdown, FormDatePicker, AcademicYearDropdown } from '@/components/forms';
import { useExamSession, useUpdateExamSession } from '@/features/exams';
import { useToast } from '@/lib/toast-context';
import { headerStyles, layoutStyles } from '@/styles';

const adminGradient = getRoleGradient('admin');

const SESSION_TYPE_OPTIONS = Object.entries(EXAM_SESSION_TYPE_LABELS).map(([value, label]) => ({
  label,
  value,
}));

export default function EditExamSessionScreen() {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { showToast } = useToast();
  const { data: session, isLoading: loadingSession } = useExamSession(sessionId);
  const updateSession = useUpdateExamSession({ onSuccess: () => router.back() });

  const [name, setName] = useState('');
  const [sessionType, setSessionType] = useState<string>('');
  const [academicYear, setAcademicYear] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [initialized, setInitialized] = useState(false);

  // Populate form with existing session data
  useEffect(() => {
    if (session && !initialized) {
      setName(session.name ?? '');
      setSessionType(session.session_type ?? '');
      setAcademicYear(session.academic_year_public_id ?? '');
      setDescription(session.description ?? '');
      setStartDate(session.start_date ?? '');
      setEndDate(session.end_date ?? '');
      setInitialized(true);
    }
  }, [session, initialized]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Session name is required');
      return;
    }
    if (!sessionType) {
      Alert.alert('Error', 'Session type is required');
      return;
    }
    if (!academicYear.trim()) {
      Alert.alert('Error', 'Academic year is required');
      return;
    }
    if (!sessionId) {
      Alert.alert('Error', 'Missing session id');
      return;
    }

    try {
      await updateSession.mutateAsync({
        id: sessionId,
        data: {
          name: name.trim(),
          session_type: sessionType as ExamSessionType,
          academic_year: academicYear.trim(),
          description: description.trim() || undefined,
          start_date: startDate || null,
          end_date: endDate || null,
        },
      });
    } catch (err: unknown) {
      showToast({ type: 'error', title: 'Error', message: extractApiError(err) });
    }
  };

  if (loadingSession) {
    return (
      <View style={[layoutStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#7c3aed" />
      </View>
    );
  }

  return (
    <View style={layoutStyles.container}>
      <LinearGradient colors={adminGradient} style={headerStyles.header}>
        <Animated.View
          entering={FadeIn.delay(100)}
          style={headerStyles.circle1}
          pointerEvents="none"
        />
        <Animated.View
          entering={FadeIn.delay(200)}
          style={headerStyles.circle2}
          pointerEvents="none"
        />
        <View style={headerStyles.content}>
          <View style={headerStyles.topRow}>
            <TouchableOpacity style={headerStyles.backBtn} onPress={() => router.back()}>
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <View style={headerStyles.titleContainer}>
              <Text style={headerStyles.title}>Edit Session</Text>
              <Text style={headerStyles.subtitle}>Update exam session details</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
        </View>
      </LinearGradient>

      <KeyboardAwareScrollView
        style={[st.body, { flex: 1 }]}
        contentContainerStyle={st.bodyContent}
        enableOnAndroid
        extraScrollHeight={20}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <View style={st.card}>
            <FormInput
              label="Session Name"
              value={name}
              onChangeText={setName}
              placeholder="e.g., Unit Test 1 - 2024"
              required
            />
            <FormDropdown
              label="Session Type"
              value={sessionType}
              onChange={setSessionType}
              options={SESSION_TYPE_OPTIONS}
              placeholder="Select type"
              required
            />
            <AcademicYearDropdown value={academicYear} onChange={setAcademicYear} required />
            <FormInput
              label="Description"
              value={description}
              onChangeText={setDescription}
              placeholder="Optional description"
              multiline
            />
            <FormDatePicker
              label="Start Date"
              value={startDate}
              onChange={setStartDate}
              placeholder="Select start date (optional)"
            />
            <FormDatePicker
              label="End Date"
              value={endDate}
              onChange={setEndDate}
              placeholder="Select end date (optional)"
            />
          </View>
        </Animated.View>

        <TouchableOpacity
          style={[st.submitBtn, updateSession.isPending && st.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={updateSession.isPending}
        >
          {updateSession.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Check size={18} color="#fff" />
              <Text style={st.submitText}>Update Session</Text>
            </>
          )}
        </TouchableOpacity>
      </KeyboardAwareScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  body: { flex: 1, backgroundColor: '#f8fafc' },
  bodyContent: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#7c3aed',
    paddingVertical: 14,
    borderRadius: 12,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
