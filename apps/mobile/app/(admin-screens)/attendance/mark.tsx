/**
 * Mark Student Attendance Screen
 * Admin/Teacher selects a class + date, then marks morning/afternoon for each student.
 * Mirrors the web's MarkAttendanceForm.
 */

import { Colors, getRoleGradient } from '@educard/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  Users,
  Check,
  X,
  Sun,
  Moon,
  UserCheck,
  UserX,
  AlertCircle,
} from 'lucide-react-native';
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Image,
} from 'react-native';

import { FormDropdown, FormDatePicker } from '@/components/forms';
import { getMediaUrl } from '@/constants/config';
import {
  useEligibleClasses,
  useValidateAttendanceDate,
  useComprehensiveAttendance,
  useBulkMarkAttendance,
} from '@/features/attendance';
import type { ComprehensiveStudentRecord } from '@/features/attendance';
import { headerStyles, layoutStyles, emptyStyles } from '@/styles';

const adminGradient = getRoleGradient('admin');

type Period = 'morning' | 'afternoon' | 'full_day';

interface StudentRow extends ComprehensiveStudentRecord {
  canEdit: boolean;
}

function fmtDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function fmtDisplay(d: string): string {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function MarkAttendanceScreen() {
  const router = useRouter();
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(fmtDate(new Date()));
  const [period, setPeriod] = useState<Period>('full_day');
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [isViewMode, setIsViewMode] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const dateStr = selectedDate;

  // Queries
  const { data: eligibleClasses, isLoading: loadingClasses } = useEligibleClasses();
  const { data: dateValidation } = useValidateAttendanceDate(selectedClassId || '', dateStr);
  const isWorkingDay = dateValidation?.is_working_day ?? true;

  const {
    data: comprehensiveData,
    isLoading: loadingStudents,
    refetch: refetchStudents,
  } = useComprehensiveAttendance(selectedClassId || '', dateStr, !!selectedClassId && isWorkingDay);

  const bulkMarkMutation = useBulkMarkAttendance();

  // Process students from comprehensive data
  useEffect(() => {
    if (!comprehensiveData) {
      setStudents([]);
      setIsViewMode(false);
      return;
    }
    const hasExisting = comprehensiveData.some((s) => s.attendance_public_id);
    const rows: StudentRow[] = comprehensiveData.map((s) => ({
      ...s,
      canEdit: s.leave_status !== 'approved',
      morning_present: s.morning_present ?? false,
      afternoon_present: s.afternoon_present ?? false,
    }));
    setStudents(rows);
    setIsViewMode(hasExisting);
  }, [comprehensiveData]);

  // Class options for dropdown
  const classOptions = useMemo(
    () => (eligibleClasses || []).map((c) => ({ label: c.display_name, value: c.public_id })),
    [eligibleClasses]
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchStudents();
    setRefreshing(false);
  }, [refetchStudents]);

  // Toggle individual student
  const toggleField = (publicId: string, field: 'morning_present' | 'afternoon_present') => {
    setStudents((prev) =>
      prev.map((s) => (s.public_id === publicId && s.canEdit ? { ...s, [field]: !s[field] } : s))
    );
  };

  // Mark all present/absent
  const markAll = (present: boolean) => {
    const showMorning = period === 'morning' || period === 'full_day';
    const showAfternoon = period === 'afternoon' || period === 'full_day';
    setStudents((prev) =>
      prev.map((s) =>
        s.canEdit
          ? {
              ...s,
              ...(showMorning && { morning_present: present }),
              ...(showAfternoon && { afternoon_present: present }),
            }
          : s
      )
    );
  };

  const handleSave = () => {
    if (!selectedClassId) return;
    const records = students
      .filter((s) => s.canEdit)
      .map((s) => ({
        user: s.public_id,
        morning_present: s.morning_present ?? false,
        afternoon_present: s.afternoon_present ?? false,
        remarks: s.attendance_remarks || '',
      }));

    bulkMarkMutation.mutate(
      { classId: selectedClassId, payload: { date: dateStr, period, attendance_records: records } },
      {
        onSuccess: () => {
          Alert.alert('Success', 'Attendance saved successfully.');
          setIsViewMode(true);
          refetchStudents();
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.message || err?.message || 'Failed to save attendance.';
          Alert.alert('Error', msg);
        },
      }
    );
  };

  const handleEdit = () => setIsViewMode(false);

  const showMorning = period === 'morning' || period === 'full_day';
  const showAfternoon = period === 'afternoon' || period === 'full_day';

  const presentCount = students.filter(
    (s) => s.canEdit && s.morning_present && s.afternoon_present
  ).length;
  const absentCount = students.filter(
    (s) => s.canEdit && !s.morning_present && !s.afternoon_present
  ).length;
  const leaveCount = students.filter((s) => !s.canEdit).length;
  const editableCount = students.filter((s) => s.canEdit).length;

  return (
    <View style={layoutStyles.container}>
      <LinearGradient colors={adminGradient} style={headerStyles.header}>
        <View style={headerStyles.content}>
          <View style={headerStyles.topRow}>
            <TouchableOpacity style={headerStyles.backBtn} onPress={() => router.back()}>
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
            <View style={headerStyles.titleContainer}>
              <Text style={headerStyles.title}>Mark Attendance</Text>
              <Text style={headerStyles.subtitle}>Student class attendance</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Selection Card */}
        <View style={st.selectionCard}>
          {/* Class dropdown */}
          <Text style={st.fieldLabel}>Class</Text>
          <FormDropdown
            label=""
            placeholder="Select Class"
            value={selectedClassId || ''}
            options={classOptions}
            onChange={(v) => {
              setSelectedClassId(v);
              setStudents([]);
              setIsViewMode(false);
            }}
          />

          {/* Date picker */}
          <Text style={[st.fieldLabel, { marginTop: 12 }]}>Date</Text>
          <FormDatePicker
            label=""
            value={selectedDate}
            onChange={(v) => {
              setSelectedDate(v);
              setStudents([]);
              setIsViewMode(false);
            }}
            maxYear={new Date().getFullYear()}
          />

          {/* Period selector */}
          <Text style={[st.fieldLabel, { marginTop: 12 }]}>Period</Text>
          <View style={st.periodRow}>
            {(
              [
                { key: 'morning' as Period, label: 'Morning' },
                { key: 'afternoon' as Period, label: 'Afternoon' },
                { key: 'full_day' as Period, label: 'Full Day' },
              ] as const
            ).map((p) => (
              <TouchableOpacity
                key={p.key}
                style={[st.periodChip, period === p.key && st.periodChipActive]}
                onPress={() => setPeriod(p.key)}
              >
                <Text style={[st.periodText, period === p.key && st.periodTextActive]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Non working day alert */}
        {selectedClassId && dateValidation && !dateValidation.is_working_day && (
          <View style={st.alertCard}>
            <AlertCircle size={20} color="#dc2626" />
            <View style={{ flex: 1 }}>
              <Text style={st.alertTitle}>Cannot Mark Attendance</Text>
              <Text style={st.alertText}>
                {dateValidation.reason || 'This is not a working day.'}
              </Text>
            </View>
          </View>
        )}

        {/* Loading */}
        {selectedClassId && isWorkingDay && loadingStudents && (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#10b981" />
            <Text style={{ marginTop: 8, color: '#94a3b8', fontSize: 13 }}>
              Loading students...
            </Text>
          </View>
        )}

        {/* Student list */}
        {selectedClassId && isWorkingDay && !loadingStudents && students.length > 0 && (
          <>
            {/* Stats bar */}
            <View style={st.statsBar}>
              <View style={st.statItem}>
                <Users size={14} color="#6366f1" />
                <Text style={st.statText}>{students.length} students</Text>
              </View>
              <View style={st.statItem}>
                <UserCheck size={14} color="#059669" />
                <Text style={[st.statText, { color: '#059669' }]}>{presentCount}</Text>
              </View>
              <View style={st.statItem}>
                <UserX size={14} color="#dc2626" />
                <Text style={[st.statText, { color: '#dc2626' }]}>{absentCount}</Text>
              </View>
              {leaveCount > 0 && (
                <View style={st.statItem}>
                  <Text style={[st.statText, { color: '#8b5cf6' }]}>{leaveCount} leave</Text>
                </View>
              )}
            </View>

            {/* Mark all buttons */}
            {!isViewMode && (
              <View style={st.bulkRow}>
                <TouchableOpacity
                  style={[st.bulkBtn, { backgroundColor: '#ecfdf5' }]}
                  onPress={() => markAll(true)}
                >
                  <Check size={16} color="#059669" />
                  <Text style={[st.bulkBtnText, { color: '#059669' }]}>All Present</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[st.bulkBtn, { backgroundColor: '#fef2f2' }]}
                  onPress={() => markAll(false)}
                >
                  <X size={16} color="#dc2626" />
                  <Text style={[st.bulkBtnText, { color: '#dc2626' }]}>All Absent</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Student cards */}
            {students.map((student, idx) => (
              <View
                key={student.public_id}
                style={[st.studentCard, !student.canEdit && st.studentCardLocked]}
              >
                <View style={st.studentLeft}>
                  {student.profile_photo_thumbnail ? (
                    <Image
                      source={{ uri: getMediaUrl(student.profile_photo_thumbnail) }}
                      style={st.avatarImg}
                    />
                  ) : (
                    <View style={st.avatar}>
                      <Text style={st.avatarText}>
                        {student.first_name?.[0]}
                        {student.last_name?.[0]}
                      </Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={st.studentName}>
                      {idx + 1}. {student.first_name} {student.last_name}
                    </Text>
                    {student.roll_number && (
                      <Text style={st.rollNo}>Roll: {student.roll_number}</Text>
                    )}
                    {!student.canEdit && (
                      <View style={st.leaveBadge}>
                        <Text style={st.leaveText}>
                          {student.leave_type || 'On Leave'} ({student.leave_status})
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {student.canEdit ? (
                  <View style={st.toggleRow}>
                    {showMorning && (
                      <TouchableOpacity
                        style={[st.toggleBtn, student.morning_present ? st.toggleOn : st.toggleOff]}
                        onPress={() =>
                          !isViewMode && toggleField(student.public_id, 'morning_present')
                        }
                        disabled={isViewMode}
                        activeOpacity={isViewMode ? 1 : 0.7}
                      >
                        <Sun size={13} color={student.morning_present ? '#fff' : '#f59e0b'} />
                        <Text
                          style={[st.toggleLabel, student.morning_present && { color: '#fff' }]}
                        >
                          AM
                        </Text>
                      </TouchableOpacity>
                    )}
                    {showAfternoon && (
                      <TouchableOpacity
                        style={[
                          st.toggleBtn,
                          student.afternoon_present ? st.toggleOn : st.toggleOff,
                        ]}
                        onPress={() =>
                          !isViewMode && toggleField(student.public_id, 'afternoon_present')
                        }
                        disabled={isViewMode}
                        activeOpacity={isViewMode ? 1 : 0.7}
                      >
                        <Moon size={13} color={student.afternoon_present ? '#fff' : '#6366f1'} />
                        <Text
                          style={[st.toggleLabel, student.afternoon_present && { color: '#fff' }]}
                        >
                          PM
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : (
                  <View style={st.lockedBadge}>
                    <Text style={st.lockedText}>Leave</Text>
                  </View>
                )}
              </View>
            ))}

            {/* Action buttons */}
            <View style={st.actionRow}>
              {isViewMode ? (
                <TouchableOpacity style={st.editBtn} onPress={handleEdit} activeOpacity={0.8}>
                  <Text style={st.editBtnText}>Edit Attendance</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[st.saveBtn, bulkMarkMutation.isPending && { opacity: 0.6 }]}
                  onPress={handleSave}
                  disabled={bulkMarkMutation.isPending}
                  activeOpacity={0.8}
                >
                  {bulkMarkMutation.isPending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Check size={20} color="#fff" />
                  )}
                  <Text style={st.saveBtnText}>Save Attendance ({editableCount} students)</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}

        {/* Empty: no students */}
        {selectedClassId &&
          isWorkingDay &&
          !loadingStudents &&
          students.length === 0 &&
          comprehensiveData && (
            <View style={emptyStyles.container}>
              <Users size={48} color="#94a3b8" />
              <Text style={emptyStyles.title}>No Students</Text>
              <Text style={emptyStyles.subtitle}>
                No students found in this class for the selected date.
              </Text>
            </View>
          )}

        {/* Prompt to select class */}
        {!selectedClassId && (
          <View style={[emptyStyles.container, { paddingVertical: 60 }]}>
            <Users size={48} color="#94a3b8" />
            <Text style={emptyStyles.title}>Select a Class</Text>
            <Text style={emptyStyles.subtitle}>Choose a class above to mark attendance.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const st = StyleSheet.create({
  selectionCard: {
    backgroundColor: '#ecfdf5',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 6,
  },
  periodRow: { flexDirection: 'row', gap: 8 },
  periodChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  periodChipActive: { backgroundColor: '#10b981', borderColor: '#10b981' },
  periodText: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  periodTextActive: { color: '#fff' },

  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  alertTitle: { fontSize: 14, fontWeight: '700', color: '#991b1b' },
  alertText: { fontSize: 12, color: '#b91c1c', marginTop: 2 },

  statsBar: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 1,
  },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 12, fontWeight: '700', color: '#6366f1' },

  bulkRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  bulkBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  bulkBtnText: { fontSize: 13, fontWeight: '700' },

  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 6,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 1,
  },
  studentCardLocked: { opacity: 0.6, borderLeftWidth: 3, borderLeftColor: '#8b5cf6' },
  studentLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e0e7ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarText: { fontSize: 13, fontWeight: '700', color: '#6366f1' },
  studentName: { fontSize: 13, fontWeight: '600', color: '#1e293b' },
  rollNo: { fontSize: 11, color: '#94a3b8', marginTop: 1 },
  leaveBadge: {
    marginTop: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#ede9fe',
    alignSelf: 'flex-start',
  },
  leaveText: { fontSize: 10, fontWeight: '600', color: '#7c3aed' },

  toggleRow: { flexDirection: 'row', gap: 6 },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  toggleOn: { backgroundColor: '#059669', borderColor: '#059669' },
  toggleOff: { backgroundColor: '#fff', borderColor: '#e2e8f0' },
  toggleLabel: { fontSize: 11, fontWeight: '700', color: '#64748b' },

  lockedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#ede9fe',
  },
  lockedText: { fontSize: 11, fontWeight: '700', color: '#7c3aed' },

  actionRow: { marginTop: 16 },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 14,
  },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  editBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  editBtnText: { color: '#6366f1', fontSize: 15, fontWeight: '700' },
});
