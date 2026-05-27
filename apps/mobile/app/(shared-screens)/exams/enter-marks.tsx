/**
 * Enter Marks Screen
 */
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/no-misused-promises, react-hooks/exhaustive-deps */

import { getRoleGradient, extractApiError } from '@educard/shared';
import type { Mark, BulkMarkEntry } from '@educard/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Save } from 'lucide-react-native';
import { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { useBulkUpsertMarks, useExamMarks } from '@/features/exams';
import { useStudents } from '@/features/students';
import { useToast } from '@/lib/toast-context';
import { headerStyles, layoutStyles } from '@/styles';

const adminGradient = getRoleGradient('admin');

interface StudentMark {
  studentId: string;
  studentName: string;
  admissionNumber: string;
  rollNumber: string;
  marksObtained: string;
  isAbsent: boolean;
}

export default function EnterMarksScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const {
    examId,
    sessionId,
    classId,
    subjectName,
    className,
    maxMarks: maxMarksStr,
    viewOnly: viewOnlyParam,
  } = useLocalSearchParams<{
    examId: string;
    sessionId: string;
    classId: string;
    subjectName?: string;
    className?: string;
    maxMarks?: string;
    viewOnly?: string;
  }>();

  const maxMarks = Number.parseInt(maxMarksStr ?? '100', 10);
  const isViewOnly = viewOnlyParam === 'true';
  const bulkUpsert = useBulkUpsertMarks();

  // Fetch existing marks
  const { data: existingMarks, isLoading: marksLoading } = useExamMarks(examId);

  // Fetch students for the class
  const { data: studentsData, isLoading: studentsLoading } = useStudents({
    class_id: classId,
    page_size: 200,
  });
  const students = studentsData?.students ?? [];

  const [marksMap, setMarksMap] = useState<Record<string, StudentMark>>({});

  // Initialize marks from students + existing marks
  useEffect(() => {
    if (students.length === 0) return;
    const map: Record<string, StudentMark> = {};
    for (const s of students) {
      const existing = existingMarks?.find((m: Mark) => m.student_public_id === s.public_id);
      // Try to get student name from various sources
      const studentName =
        (existing?.student_name ??
          s.full_name ??
          (s as { user_info?: { full_name?: string; first_name?: string; last_name?: string } })
            .user_info?.full_name ??
          `${(s as { user_info?: { first_name?: string; last_name?: string } }).user_info?.first_name ?? ''} ${(s as { user_info?: { first_name?: string; last_name?: string } }).user_info?.last_name ?? ''}`.trim()) ||
        `Student ${s.roll_number ?? s.admission_number}`;
      map[s.public_id] = {
        studentId: s.public_id,
        studentName,
        admissionNumber: existing?.student_admission_number ?? s.admission_number ?? '',
        rollNumber: s.roll_number ?? '',
        marksObtained: existing ? String(existing.marks_obtained) : '',
        isAbsent: existing?.is_absent ?? false,
      };
    }
    setMarksMap(map);
  }, [students, existingMarks]);

  // Natural sort function for roll numbers (A1, A2, A10 instead of A1, A10, A2)
  const naturalSortKey = (rollNumber: string) => {
    if (!rollNumber) return [Infinity, '', 0];
    const parts = rollNumber.split(/(\d+)/);
    return parts.map((part) => {
      const num = Number.parseInt(part, 10);
      return Number.isNaN(num) ? part.toLowerCase() : num;
    });
  };

  const compareRollNumbers = (a: string, b: string) => {
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
  };

  const studentList = useMemo(
    () => Object.values(marksMap).sort((a, b) => compareRollNumbers(a.rollNumber, b.rollNumber)),
    [marksMap]
  );

  // Count entered marks
  const enteredCount = useMemo(
    () => studentList.filter((s) => s.marksObtained !== '' || s.isAbsent).length,
    [studentList]
  );

  const updateMark = (studentId: string, value: string) => {
    setMarksMap((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], marksObtained: value, isAbsent: false },
    }));
  };

  const toggleAbsent = (studentId: string) => {
    setMarksMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        isAbsent: !prev[studentId].isAbsent,
        marksObtained: !prev[studentId].isAbsent ? '0' : prev[studentId].marksObtained,
      },
    }));
  };

  const handleSave = async () => {
    const marks: BulkMarkEntry[] = [];
    for (const sm of Object.values(marksMap)) {
      if (sm.marksObtained !== '' || sm.isAbsent) {
        const obtained = Number.parseInt(sm.marksObtained, 10);
        if (!sm.isAbsent && (Number.isNaN(obtained) || obtained < 0 || obtained > maxMarks)) {
          Alert.alert('Error', `Invalid marks for ${sm.studentName}. Must be 0-${maxMarks}.`);
          return;
        }
        marks.push({
          student_id: sm.studentId,
          marks_obtained: sm.isAbsent ? 0 : obtained,
          is_absent: sm.isAbsent,
        });
      }
    }

    if (marks.length === 0) {
      Alert.alert('Error', "No marks to save. Enter at least one student's marks.");
      return;
    }

    try {
      await bulkUpsert.mutateAsync({
        session_id: sessionId,
        exam_id: examId,
        marks,
      });
      router.back();
    } catch (err: unknown) {
      showToast({ type: 'error', title: 'Error', message: extractApiError(err) });
    }
  };

  const isLoading = marksLoading || studentsLoading;

  const renderStudent = ({ item, index }: { item: StudentMark; index: number }) => (
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
            {item.rollNumber ? `Roll ${item.rollNumber} · ` : ''}Adm {item.admissionNumber}
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
            onChangeText={(v) => updateMark(item.studentId, v)}
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
            <Text style={[st.absentText, item.isAbsent && st.absentTextActive]}>AB</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
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
            <TouchableOpacity style={headerStyles.backBtn} onPress={() => router.back()}>
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <View style={headerStyles.titleContainer}>
              <Text style={headerStyles.title}>{isViewOnly ? 'View Marks' : 'Enter Marks'}</Text>
              <Text style={headerStyles.subtitle}>
                {decodeURIComponent(subjectName ?? '')} · {decodeURIComponent(className ?? '')}
              </Text>
            </View>
            {!isViewOnly ? (
              <TouchableOpacity
                style={st.saveHeaderBtn}
                onPress={handleSave}
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
            You are viewing marks. Only the assigned teacher can edit this subject.
          </Text>
        </View>
      )}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
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
            <Text style={st.emptySubtitle}>No students found for this class</Text>
          </View>
        )}
        {!isLoading && studentList.length > 0 && (
          <FlatList
            data={studentList}
            renderItem={renderStudent}
            keyExtractor={(item) => item.studentId}
            contentContainerStyle={st.list}
          />
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const st = StyleSheet.create({
  saveHeaderBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  columnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  colStudent: { fontSize: 12, fontWeight: '700', color: '#94a3b8' },
  colMarks: { fontSize: 12, fontWeight: '700', color: '#94a3b8' },

  list: { paddingBottom: 40 },

  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#fff',
  },
  studentInfo: { flex: 1, marginRight: 12 },
  studentName: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  studentAdm: { fontSize: 11, color: '#94a3b8', marginTop: 2 },

  marksInput: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  marksField: {
    width: 64,
    height: 38,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  marksFieldAbsent: {
    backgroundColor: '#fef3c7',
    borderColor: '#fcd34d',
    color: '#92400e',
  },
  marksFieldDisabled: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
    color: '#94a3b8',
  },
  absentBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  absentBtnActive: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
  },
  absentBtnDisabled: {
    opacity: 0.6,
  },
  absentText: { fontSize: 12, fontWeight: '700', color: '#94a3b8' },
  absentTextActive: { color: '#d97706' },

  viewOnlyBanner: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#93c5fd',
  },
  viewOnlyText: {
    fontSize: 12,
    color: '#1d4ed8',
    textAlign: 'center',
    fontWeight: '500',
  },

  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#334155' },
  emptySubtitle: { fontSize: 14, color: '#94a3b8' },
});
