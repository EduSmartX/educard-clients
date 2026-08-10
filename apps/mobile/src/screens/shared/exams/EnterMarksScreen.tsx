/**
 * Enter Marks Screen
 * Honors the `viewOnly` param (only the assigned teacher can edit a subject; class
 * teachers can edit all subjects — that decision is made in the exam dashboard and
 * enforced by the backend). Supports publish / unpublish of marks.
 */

import { getRoleGradient, extractApiError } from '@educard/shared';
import type { Mark, BulkMarkEntry } from '@educard/shared';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import { ChevronLeft, Save } from 'lucide-react-native';
import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import {
  useBulkUpsertMarks,
  useExamMarks,
  useUnpublishExamMarks,
  useExam,
} from '@/features/exams';
import { useStudents } from '@/features/students';
import { LinearGradient } from '@/lib/linear-gradient';
import type {
  SharedStackNavigation,
  SharedStackParamList,
} from '@/navigation/types';
import { useToast } from '@/lib/toast-context';
import { headerStyles, layoutStyles } from '@/styles';

import { st } from './enter-marks-styles';

const adminGradient = getRoleGradient('admin');

interface StudentMark {
  studentId: string;
  studentName: string;
  admissionNumber: string;
  rollNumber: string;
  marksObtained: string;
  isAbsent: boolean;
}

// Natural sort for roll numbers (A1, A2, A10 instead of A1, A10, A2)
function naturalSortKey(rollNumber: string): (number | string)[] {
  if (!rollNumber) return [Infinity, '', 0];
  const parts = rollNumber.split(/(\d+)/);
  return parts.map(part => {
    const num = Number.parseInt(part, 10);
    return Number.isNaN(num) ? part.toLowerCase() : num;
  });
}

function compareRollNumbers(a: string, b: string): number {
  const aParts = naturalSortKey(a);
  const bParts = naturalSortKey(b);
  for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
    const aVal = aParts[i] ?? '';
    const bVal = bParts[i] ?? '';
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      if (aVal !== bVal) return aVal - bVal;
    } else {
      const cmp = String(aVal).localeCompare(String(bVal));
      if (cmp !== 0) return cmp;
    }
  }
  return 0;
}

export default function EnterMarksScreen() {
  const navigation = useNavigation<SharedStackNavigation>();
  const route = useRoute<RouteProp<SharedStackParamList, 'ExamEnterMarks'>>();
  const { showToast } = useToast();
  const {
    examId,
    sessionId,
    classId,
    subjectName,
    className,
    maxMarks: maxMarksStr,
    viewOnly: viewOnlyParam,
  } = route.params;

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) navigation.goBack();
  }, [navigation]);

  const maxMarks = Number.parseInt(maxMarksStr ?? '100', 10);
  const isViewOnly = viewOnlyParam === 'true';
  const bulkUpsert = useBulkUpsertMarks();
  const unpublishMarksMutation = useUnpublishExamMarks();

  // Fetch exam detail (for is_marks_published)
  const { data: examDetail } = useExam(examId);
  const isMarksPublished = examDetail?.is_marks_published ?? false;

  // Fetch existing marks
  const { data: existingMarks, isLoading: marksLoading } = useExamMarks(examId);

  // Fetch students for the class
  const { data: studentsData, isLoading: studentsLoading } = useStudents({
    class_id: classId,
    page_size: 200,
  });
  const students = useMemo(() => studentsData?.students ?? [], [studentsData]);

  const [marksMap, setMarksMap] = useState<Record<string, StudentMark>>({});

  // Initialize marks from students + existing marks
  useEffect(() => {
    if (students.length === 0) return;
    const map: Record<string, StudentMark> = {};
    for (const s of students) {
      const existing = existingMarks?.find(
        (m: Mark) => m.student_public_id === s.public_id,
      );
      const userInfo = (
        s as {
          user_info?: {
            full_name?: string;
            first_name?: string;
            last_name?: string;
          };
        }
      ).user_info;
      const studentName =
        (existing?.student_name ??
          s.full_name ??
          userInfo?.full_name ??
          `${userInfo?.first_name ?? ''} ${userInfo?.last_name ?? ''}`.trim()) ||
        `Student ${s.roll_number ?? s.admission_number}`;
      map[s.public_id] = {
        studentId: s.public_id,
        studentName,
        admissionNumber:
          existing?.student_admission_number ?? s.admission_number ?? '',
        rollNumber: s.roll_number ?? '',
        marksObtained: existing ? String(existing.marks_obtained) : '',
        isAbsent: existing?.is_absent ?? false,
      };
    }
    setMarksMap(map);
  }, [students, existingMarks]);

  const studentList = useMemo(
    () =>
      Object.values(marksMap).sort((a, b) =>
        compareRollNumbers(a.rollNumber, b.rollNumber),
      ),
    [marksMap],
  );

  // Count entered marks
  const enteredCount = useMemo(
    () => studentList.filter(s => s.marksObtained !== '' || s.isAbsent).length,
    [studentList],
  );

  const updateMark = useCallback((studentId: string, value: string) => {
    setMarksMap(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        marksObtained: value,
        isAbsent: false,
      },
    }));
  }, []);

  const toggleAbsent = useCallback((studentId: string) => {
    setMarksMap(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        isAbsent: !prev[studentId].isAbsent,
        marksObtained: !prev[studentId].isAbsent
          ? '0'
          : prev[studentId].marksObtained,
      },
    }));
  }, []);

  const buildMarksPayload = (): BulkMarkEntry[] | null => {
    const marks: BulkMarkEntry[] = [];
    for (const sm of Object.values(marksMap)) {
      if (sm.marksObtained !== '' || sm.isAbsent) {
        const obtained = Number.parseInt(sm.marksObtained, 10);
        if (
          !sm.isAbsent &&
          (Number.isNaN(obtained) || obtained < 0 || obtained > maxMarks)
        ) {
          Alert.alert(
            'Error',
            `Invalid marks for ${sm.studentName}. Must be 0-${maxMarks}.`,
          );
          return null;
        }
        if (sm.isAbsent) {
          marks.push({ student_id: sm.studentId, is_absent: true });
        } else {
          marks.push({ student_id: sm.studentId, marks_obtained: obtained });
        }
      }
    }
    return marks;
  };

  const handleSave = async () => {
    const marks = buildMarksPayload();
    if (marks === null) return;

    if (marks.length === 0) {
      Alert.alert(
        'Error',
        "No marks to save. Enter at least one student's marks.",
      );
      return;
    }

    try {
      await bulkUpsert.mutateAsync({
        session_id: sessionId,
        exam_id: examId,
        marks,
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

  // Publish = save all marks and publish in one atomic call (mirrors the web).
  const handlePublish = () => {
    if (enteredCount < studentList.length) {
      Alert.alert(
        'Incomplete Marks',
        `Enter marks for all ${studentList.length} students before publishing.`,
      );
      return;
    }

    Alert.alert(
      'Save & Publish',
      'Save and publish marks for this exam? You can unpublish later if needed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Publish',
          onPress: () => {
            void (async () => {
              const marks = buildMarksPayload();
              if (marks === null) return;
              try {
                await bulkUpsert.mutateAsync({
                  session_id: sessionId,
                  exam_id: examId,
                  marks,
                  publish_after_save: true,
                });
                handleBack();
              } catch (err: unknown) {
                showToast({
                  type: 'error',
                  title: 'Error',
                  message: extractApiError(err),
                });
              }
            })();
          },
        },
      ],
    );
  };

  const handleUnpublish = () => {
    Alert.alert(
      'Unpublish Marks',
      'Unpublish marks for this exam? This will allow editing again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unpublish',
          onPress: () => unpublishMarksMutation.mutate(examId),
        },
      ],
    );
  };

  const isLoading = marksLoading || studentsLoading;

  const renderStudent = useCallback(
    ({ item, index }: { item: StudentMark; index: number }) => (
      <Animated.View
        entering={FadeInDown.delay(index * 30)
          .springify()
          .damping(18)}
      >
        <View style={st.studentRow}>
          <View style={st.studentInfo}>
            <Text style={st.studentName} numberOfLines={1}>
              {item.studentName}
            </Text>
            <Text style={st.studentAdm}>
              {item.rollNumber ? `Roll ${item.rollNumber} · ` : ''}Adm{' '}
              {item.admissionNumber}
            </Text>
          </View>
          <View style={st.marksInput}>
            <TextInput
              style={[
                st.marksField,
                item.isAbsent && st.marksFieldAbsent,
                isViewOnly && st.marksFieldDisabled,
              ]}
              value={item.isAbsent ? 'AB' : item.marksObtained}
              onChangeText={v => updateMark(item.studentId, v)}
              keyboardType="numeric"
              placeholder={`/${maxMarks}`}
              placeholderTextColor="#cbd5e1"
              editable={!item.isAbsent && !isViewOnly}
              maxLength={4}
            />
            <TouchableOpacity
              style={[
                st.absentBtn,
                item.isAbsent && st.absentBtnActive,
                isViewOnly && st.absentBtnDisabled,
              ]}
              onPress={() => !isViewOnly && toggleAbsent(item.studentId)}
              disabled={isViewOnly}
            >
              <Text
                style={[st.absentText, item.isAbsent && st.absentTextActive]}
              >
                AB
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    ),
    [isViewOnly, maxMarks, updateMark, toggleAbsent],
  );

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
              <Text style={headerStyles.title}>
                {isViewOnly ? 'View Marks' : 'Enter Marks'}
              </Text>
              <Text style={headerStyles.subtitle}>
                {decodeURIComponent(subjectName ?? '')} ·{' '}
                {decodeURIComponent(className ?? '')}
              </Text>
            </View>
            {!isViewOnly ? (
              <TouchableOpacity
                style={st.saveHeaderBtn}
                onPress={() => void handleSave()}
                disabled={bulkUpsert.isPending}
              >
                {bulkUpsert.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Save size={20} color="#fff" />
                )}
              </TouchableOpacity>
            ) : (
              <View style={st.saveHeaderBtn} />
            )}
          </View>
        </View>
      </LinearGradient>

      {/* View-only banner */}
      {isViewOnly && (
        <View style={st.viewOnlyBanner}>
          <Text style={st.viewOnlyText}>
            You are viewing marks. Only the assigned teacher can edit this
            subject.
          </Text>
        </View>
      )}

      {/* Publish/Unpublish Marks */}
      {!isViewOnly && (
        <View style={st.publishRow}>
          {isMarksPublished ? (
            <TouchableOpacity
              style={st.unpublishBtn}
              onPress={handleUnpublish}
              disabled={unpublishMarksMutation.isPending}
            >
              <Text style={st.unpublishBtnText}>
                {unpublishMarksMutation.isPending
                  ? 'Unpublishing...'
                  : '🔓 Unpublish Marks'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                st.publishBtn,
                enteredCount < studentList.length && st.publishBtnDisabled,
              ]}
              onPress={handlePublish}
              disabled={
                bulkUpsert.isPending || enteredCount < studentList.length
              }
            >
              <Text style={st.publishBtnText}>
                {bulkUpsert.isPending ? 'Publishing...' : '✅ Save & Publish'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <KeyboardAvoidingView
        style={st.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Column Header */}
        <View style={st.columnHeader}>
          <Text style={st.colStudent}>
            Student ({enteredCount}/{studentList.length} entered)
          </Text>
          <Text style={st.colMarks}>Marks (/{maxMarks})</Text>
        </View>

        {isLoading && (
          <View style={st.loading}>
            <ActivityIndicator size="large" color="#7c3aed" />
          </View>
        )}
        {!isLoading && studentList.length === 0 && (
          <View style={st.empty}>
            <Text style={st.emptyIcon}>📝</Text>
            <Text style={st.emptyTitle}>No Students</Text>
            <Text style={st.emptySubtitle}>
              No students found for this class
            </Text>
          </View>
        )}
        {!isLoading && studentList.length > 0 && (
          <FlatList
            data={studentList}
            renderItem={renderStudent}
            keyExtractor={item => item.studentId}
            contentContainerStyle={st.list}
          />
        )}
      </KeyboardAvoidingView>
    </View>
  );
}
