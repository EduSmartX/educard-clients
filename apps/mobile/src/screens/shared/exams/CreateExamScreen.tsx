/**
 * Create Exam Screen
 * Create an exam by selecting session, class, and subject.
 */

import { getRoleGradient, extractApiError } from '@educard/shared';
import { EXAM_STATUS_LABELS, type ExamStatus } from '@educard/shared';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import { ChevronLeft, Check } from 'lucide-react-native';
import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import {
  FormInput,
  FormDropdown,
  FormDatePicker,
  FormTimePicker,
} from '@/components/forms';
import { useClasses } from '@/features/classes';
import { useCreateExam, useExamSessions } from '@/features/exams';
import { useSubjectsByClass } from '@/features/subjects';
import { LinearGradient } from '@/lib/linear-gradient';
import type {
  SharedStackNavigation,
  SharedStackParamList,
} from '@/navigation/types';
import { useToast } from '@/lib/toast-context';
import { headerStyles, layoutStyles } from '@/styles';

const adminGradient = getRoleGradient('admin');

const STATUS_OPTIONS = Object.entries(EXAM_STATUS_LABELS).map(
  ([value, label]) => ({
    label,
    value,
  }),
);

export default function CreateExamScreen() {
  const navigation = useNavigation<SharedStackNavigation>();
  const route = useRoute<RouteProp<SharedStackParamList, 'ExamCreate'>>();
  const preSelectedSessionId = route.params?.sessionId;
  const createExam = useCreateExam();
  const { showToast } = useToast();

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) navigation.goBack();
  }, [navigation]);

  // Fetch data
  const { data: sessionsData } = useExamSessions({ page_size: 100 });
  const sessions = useMemo(() => sessionsData?.data ?? [], [sessionsData]);

  const { data: classesData } = useClasses({ page_size: 100 });
  const classes = useMemo(() => classesData?.classes ?? [], [classesData]);

  // Form state
  const [sessionId, setSessionId] = useState(preSelectedSessionId || '');
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [status, setStatus] = useState<string>('draft');
  const [maxMarks, setMaxMarks] = useState('100');
  const [passingMarks, setPassingMarks] = useState('35');
  const [examDate, setExamDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [description, setDescription] = useState('');

  // Fetch subjects filtered by class (backend filtering using class_assigned)
  const { data: subjectsData, isLoading: subjectsLoading } = useSubjectsByClass(
    classId || '',
  );
  const subjects = useMemo(() => subjectsData?.data ?? [], [subjectsData]);

  // Reset subject when class changes
  useEffect(() => {
    setSubjectId('');
  }, [classId]);

  const sessionOptions = useMemo(
    () => sessions.map(s => ({ label: s.name, value: s.public_id })),
    [sessions],
  );

  const classOptions = useMemo(
    () =>
      classes.map(c => ({
        label: `${c.class_master?.name || ''} - ${c.name}`.trim(),
        value: c.public_id,
      })),
    [classes],
  );

  const subjectOptions = useMemo(
    () =>
      subjects.map(
        (s: {
          public_id: string;
          name?: string;
          subject_info?: { name?: string };
        }) => ({
          label: s.subject_info?.name || s.name || 'Unknown Subject',
          value: s.public_id,
        }),
      ),
    [subjects],
  );

  const handleSubmit = async () => {
    if (!sessionId) {
      Alert.alert('Error', 'Please select an exam session');
      return;
    }
    if (!classId) {
      Alert.alert('Error', 'Please select a class');
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
        max_marks: Number.parseInt(maxMarks, 10) || 100,
        passing_marks: Number.parseInt(passingMarks, 10) || 35,
        date: examDate || null,
        start_time: startTime || null,
        end_time: endTime || null,
        description: description.trim() || undefined,
      });
      handleBack();
    } catch (err: unknown) {
      showToast({
        type: 'error',
        title: 'Error',
        message: extractApiError(err),
      });
    }
  };

  const getSubjectPlaceholder = () => {
    if (!classId) return 'Select class first';
    if (subjectsLoading) return 'Loading subjects...';
    return 'Select subject';
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
              <Text style={headerStyles.title}>New Exam</Text>
              <Text style={headerStyles.subtitle}>Create a new exam</Text>
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
            <FormDropdown
              label="Exam Session"
              value={sessionId}
              onChange={setSessionId}
              options={sessionOptions}
              placeholder="Select session"
              required
            />
            <FormDropdown
              label="Class"
              value={classId}
              onChange={setClassId}
              options={classOptions}
              placeholder="Select class first"
              required
              searchable
            />
            <FormDropdown
              label="Subject"
              value={subjectId}
              onChange={setSubjectId}
              options={subjectOptions}
              placeholder={getSubjectPlaceholder()}
              required
              disabled={!classId}
              searchable
            />
            <FormDropdown
              label="Status"
              value={status}
              onChange={setStatus}
              options={STATUS_OPTIONS}
              placeholder="Select status"
            />
            <View style={st.row}>
              <View style={st.flex1}>
                <FormInput
                  label="Max Marks"
                  value={maxMarks}
                  onChangeText={setMaxMarks}
                  keyboardType="numeric"
                  placeholder="100"
                />
              </View>
              <View style={st.flex1}>
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
              <View style={st.flex1}>
                <FormTimePicker
                  label="Start Time"
                  value={startTime}
                  onChange={setStartTime}
                  placeholder="Select start time"
                />
              </View>
              <View style={st.flex1}>
                <FormTimePicker
                  label="End Time"
                  value={endTime}
                  onChange={setEndTime}
                  placeholder="Select end time"
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
          onPress={() => void handleSubmit()}
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
      </KeyboardAwareScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  body: { flex: 1, backgroundColor: '#f8fafc' },
  bodyContent: { padding: 16, paddingBottom: 40 },
  spacer: { width: 40 },
  flex1: { flex: 1 },
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
