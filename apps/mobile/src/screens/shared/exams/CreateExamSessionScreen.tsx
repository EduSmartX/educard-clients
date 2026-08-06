/**
 * Create Exam Session Screen
 */

import { getRoleGradient, extractApiError } from '@educard/shared';
import {
  EXAM_SESSION_TYPE_LABELS,
  type ExamSessionType,
} from '@educard/shared';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, Check } from 'lucide-react-native';
import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { KeyboardAwareScrollView } from '@/lib/keyboard-aware-scroll-view';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import {
  FormInput,
  FormDropdown,
  FormDatePicker,
  AcademicYearDropdown,
} from '@/components/forms';
import { useCurrentAcademicYear } from '@/features/core';
import { useCreateExamSession } from '@/features/exams';
import { LinearGradient } from '@/lib/linear-gradient';
import type { SharedStackNavigation } from '@/navigation/types';
import { useToast } from '@/lib/toast-context';
import { headerStyles, layoutStyles } from '@/styles';

const adminGradient = getRoleGradient('admin');

const SESSION_TYPE_OPTIONS = Object.entries(EXAM_SESSION_TYPE_LABELS).map(
  ([value, label]) => ({
    label,
    value,
  }),
);

export default function CreateExamSessionScreen() {
  const navigation = useNavigation<SharedStackNavigation>();
  const { showToast } = useToast();
  const createSession = useCreateExamSession();
  const { data: currentAcademicYear } = useCurrentAcademicYear();

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) navigation.goBack();
  }, [navigation]);

  const [name, setName] = useState('');
  const [sessionType, setSessionType] = useState<string>('unit_test');
  const [academicYear, setAcademicYear] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pre-fill academic year and dates from DB when loaded
  useEffect(() => {
    if (currentAcademicYear) {
      if (currentAcademicYear.public_id && !academicYear) {
        setAcademicYear(currentAcademicYear.public_id);
      }
      if (currentAcademicYear.start_date && !startDate) {
        setStartDate(currentAcademicYear.start_date);
      }
      if (currentAcademicYear.end_date && !endDate) {
        setEndDate(currentAcademicYear.end_date);
      }
    }
  }, [currentAcademicYear, academicYear, startDate, endDate]);

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
      Alert.alert('Error', 'Academic year is required (e.g., 2024-2025)');
      return;
    }

    try {
      await createSession.mutateAsync({
        name: name.trim(),
        session_type: sessionType as ExamSessionType,
        academic_year: academicYear.trim(),
        description: description.trim() || undefined,
        start_date: startDate || null,
        end_date: endDate || null,
      });
      handleBack();
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Error',
        message: extractApiError(err),
      });
    }
  };

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
            <TouchableOpacity style={headerStyles.backBtn} onPress={handleBack}>
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <View style={headerStyles.titleContainer}>
              <Text style={headerStyles.title}>New Exam Session</Text>
              <Text style={headerStyles.subtitle}>
                Create a new exam session
              </Text>
            </View>
            <View style={st.spacer} />
          </View>
        </View>
      </LinearGradient>

      <KeyboardAwareScrollView
        style={st.body}
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
            <AcademicYearDropdown
              value={academicYear}
              onChange={setAcademicYear}
              required
            />
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
          style={[
            st.submitBtn,
            createSession.isPending && st.submitBtnDisabled,
          ]}
          onPress={() => void handleSubmit()}
          disabled={createSession.isPending}
        >
          {createSession.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Check size={18} color="#fff" />
              <Text style={st.submitText}>Create Session</Text>
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
  spacer: { width: 40 },
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
