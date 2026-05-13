/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-misused-promises, @typescript-eslint/prefer-nullish-coalescing, react-hooks/exhaustive-deps */
/**
 * Create Exam Screen
 * Create an exam by selecting session + subject
 */

import { getRoleGradient, extractApiError } from '@educard/shared';
import { EXAM_STATUS_LABELS, type ExamStatus } from '@educard/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Check } from 'lucide-react-native';
import { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { FormInput, FormDropdown, FormDatePicker } from '@/components/forms';
import { useCreateExam, useExamSessions } from '@/features/exams';
import { useSubjects } from '@/features/subjects';
import { headerStyles, layoutStyles } from '@/styles';

const adminGradient = getRoleGradient('admin');

const STATUS_OPTIONS = Object.entries(EXAM_STATUS_LABELS).map(([value, label]) => ({
  label,
  value,
}));

export default function CreateExamScreen() {
  const router = useRouter();
  const { sessionId: preSelectedSessionId } = useLocalSearchParams<{ sessionId?: string }>();
  const createExam = useCreateExam();

  const { data: sessionsData } = useExamSessions({ page_size: 100 });
  const sessions = sessionsData?.data || [];

  const { data: subjectsData } = useSubjects({ page_size: 200 });
  const subjects = subjectsData?.subjects || [];

  const [sessionId, setSessionId] = useState(preSelectedSessionId || '');
  const [subjectId, setSubjectId] = useState('');
  const [status, setStatus] = useState<string>('draft');
  const [maxMarks, setMaxMarks] = useState('100');
  const [passingMarks, setPassingMarks] = useState('35');
  const [examDate, setExamDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [description, setDescription] = useState('');

  const sessionOptions = useMemo(
    () => sessions.map((s) => ({ label: s.name, value: s.public_id })),
    [sessions]
  );

  const subjectOptions = useMemo(
    () =>
      subjects.map((s: any) => ({
        label: `${s.name} (${s.class_name || s.class_info?.name || ''})`,
        value: s.public_id,
      })),
    [subjects]
  );

  const handleSubmit = async () => {
    if (!sessionId) {
      Alert.alert('Error', 'Please select an exam session');
      return;
    }
    if (!subjectId) {
      Alert.alert('Error', 'Please select a subject');
      return;
    }

    try {
      await createExam.mutateAsync({
        session_id: sessionId,
        subject_id: subjectId,
        status: (status || 'draft') as ExamStatus,
        max_marks: parseInt(maxMarks, 10) || 100,
        passing_marks: parseInt(passingMarks, 10) || 35,
        date: examDate || null,
        start_time: startTime || null,
        end_time: endTime || null,
        description: description.trim() || undefined,
      });
      router.back();
    } catch (err: any) {
      Alert.alert('Error', extractApiError(err));
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
            <TouchableOpacity style={headerStyles.backBtn} onPress={() => router.back()}>
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <View style={headerStyles.titleContainer}>
              <Text style={headerStyles.title}>New Exam</Text>
              <Text style={headerStyles.subtitle}>Create a new exam</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={st.body} contentContainerStyle={st.bodyContent}>
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <View style={st.card}>
              <FormDropdown
                label="Exam Session"
                value={sessionId}
                onChange={setSessionId}
                options={sessionOptions}
                placeholder="Select session"
                required
              />
              <FormDropdown
                label="Subject"
                value={subjectId}
                onChange={setSubjectId}
                options={subjectOptions}
                placeholder="Select subject"
                required
              />
              <FormDropdown
                label="Status"
                value={status}
                onChange={setStatus}
                options={STATUS_OPTIONS}
                placeholder="Select status"
              />
              <View style={st.row}>
                <View style={{ flex: 1 }}>
                  <FormInput
                    label="Max Marks"
                    value={maxMarks}
                    onChangeText={setMaxMarks}
                    keyboardType="numeric"
                    placeholder="100"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <FormInput
                    label="Passing Marks"
                    value={passingMarks}
                    onChangeText={setPassingMarks}
                    keyboardType="numeric"
                    placeholder="35"
                  />
                </View>
              </View>
              <FormDatePicker
                label="Exam Date"
                value={examDate}
                onChange={setExamDate}
                placeholder="Select exam date (optional)"
              />
              <View style={st.row}>
                <View style={{ flex: 1 }}>
                  <FormInput
                    label="Start Time"
                    value={startTime}
                    onChangeText={setStartTime}
                    placeholder="09:00 (optional)"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <FormInput
                    label="End Time"
                    value={endTime}
                    onChangeText={setEndTime}
                    placeholder="11:00 (optional)"
                  />
                </View>
              </View>
              <FormInput
                label="Description"
                value={description}
                onChangeText={setDescription}
                placeholder="Optional description"
                multiline
              />
            </View>
          </Animated.View>

          <TouchableOpacity
            style={[st.submitBtn, createExam.isPending && st.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={createExam.isPending}
          >
            {createExam.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Check size={18} color="#fff" />
                <Text style={st.submitText}>Create Exam</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
  row: { flexDirection: 'row', gap: 12 },
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
