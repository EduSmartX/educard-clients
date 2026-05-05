/**
 * Mark Attendance Screen
 * Select class, date, and mark student attendance with toggle buttons
 */

import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import {
  ChevronLeft,
  ChevronDown,
  Calendar,
  Users,
  CircleCheck,
  CircleX,
  UserCheck,
  UserX,
  Save,
  RotateCcw,
  TriangleAlert,
} from 'lucide-react-native';
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Image,
  Switch,
  Alert,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import {
  useEligibleClasses,
  useValidateDate,
  useComprehensiveAttendance,
  useBulkMarkAttendance,
} from '@/features/attendance';
import type { ComprehensiveAttendanceRecord } from '@/features/attendance';

interface StudentRow extends ComprehensiveAttendanceRecord {
  canEdit: boolean;
}

export default function MarkAttendanceScreen() {
  const router = useRouter();

  // Form state
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [period, setPeriod] = useState<'morning' | 'afternoon' | 'full_day'>('full_day');

  // Student state
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [isViewMode, setIsViewMode] = useState(false);
  const [initialStudents, setInitialStudents] = useState<StudentRow[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const dateString = format(selectedDate, 'yyyy-MM-dd');

  // Queries
  const { data: eligibleClasses, isLoading: loadingClasses } = useEligibleClasses();

  const { data: dateValidation } = useValidateDate(
    selectedClassId,
    dateString,
    !!selectedClassId && !!dateString
  );

  const isWorkingDay = dateValidation?.is_working_day ?? true;

  const {
    data: comprehensiveData,
    isLoading: loadingStudents,
    refetch,
  } = useComprehensiveAttendance(
    selectedClassId,
    dateString,
    !!selectedClassId && !!dateString && isWorkingDay
  );

  const bulkMarkMutation = useBulkMarkAttendance();

  // Selected class name
  const selectedClassName = useMemo(() => {
    if (!selectedClassId || !eligibleClasses) return 'Select Class';
    const cls = eligibleClasses.find((c) => c.public_id === selectedClassId);
    return cls?.display_name || 'Select Class';
  }, [selectedClassId, eligibleClasses]);

  // Process comprehensive data
  useEffect(() => {
    if (comprehensiveData) {
      const hasExisting = comprehensiveData.some((s) => s.attendance_public_id);

      const studentRows: StudentRow[] = comprehensiveData.map((student) => ({
        ...student,
        canEdit: student.leave_status !== 'approved',
        morning_present: student.morning_present ?? false,
        afternoon_present: student.afternoon_present ?? false,
      }));

      setStudents(studentRows);
      setIsViewMode(hasExisting);
      setInitialStudents(studentRows.map((s) => ({ ...s })));
    }
  }, [comprehensiveData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleReset = () => {
    if (initialStudents) {
      setStudents(initialStudents.map((s) => ({ ...s })));
      const hadExisting = initialStudents.some((s) => !!s.attendance_public_id);
      setIsViewMode(hadExisting);
    }
  };

  const handleToggleAttendance = (
    studentId: string,
    field: 'morning_present' | 'afternoon_present',
    value: boolean
  ) => {
    setStudents((prev) =>
      prev.map((student) =>
        student.public_id === studentId ? { ...student, [field]: value } : student
      )
    );
  };

  const handleMarkAllPresent = () => {
    setStudents((prev) =>
      prev.map((student) => ({
        ...student,
        morning_present: student.canEdit ? true : student.morning_present,
        afternoon_present: student.canEdit ? true : student.afternoon_present,
      }))
    );
  };

  const handleMarkAllAbsent = () => {
    setStudents((prev) =>
      prev.map((student) => ({
        ...student,
        morning_present: student.canEdit ? false : student.morning_present,
        afternoon_present: student.canEdit ? false : student.afternoon_present,
      }))
    );
  };

  const handleSubmit = async () => {
    if (!selectedClassId) {
      Alert.alert('Error', 'Please select a class');
      return;
    }

    const attendanceRecords = students
      .filter((s) => s.canEdit)
      .map((student) => ({
        user: student.public_id,
        morning_present: student.morning_present ?? false,
        afternoon_present: student.afternoon_present ?? false,
        remarks: student.attendance_remarks || '',
      }));

    if (attendanceRecords.length === 0) {
      Alert.alert('Error', 'No students to mark attendance for');
      return;
    }

    try {
      await bulkMarkMutation.mutateAsync({
        classId: selectedClassId,
        payload: {
          date: dateString,
          period,
          attendance_records: attendanceRecords,
        },
      });
      setIsViewMode(true);
    } catch (error) {
      // Error handled in mutation
    }
  };

  // Stats
  const stats = useMemo(() => {
    const total = students.length;
    const present = students.filter(
      (s) => (s.morning_present || false) && (s.afternoon_present || false)
    ).length;
    const absent = students.filter(
      (s) => !(s.morning_present || false) && !(s.afternoon_present || false)
    ).length;
    const onLeave = students.filter((s) => s.leave_status === 'approved').length;
    return { total, present, absent, onLeave };
  }, [students]);

  const canSubmit = students.length > 0 && !isViewMode && isWorkingDay;
  const isSubmitting = bulkMarkMutation.isPending;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <LinearGradient
        colors={['#059669', '#10b981', '#34d399']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Mark Attendance</Text>
            <Text style={styles.headerSubtitle}>{format(selectedDate, 'EEEE, MMM d, yyyy')}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#059669']} />
        }
      >
        {/* Selection Card */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.selectionCard}>
          {/* Class Dropdown */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Class</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowClassPicker(!showClassPicker)}
              disabled={loadingClasses}
            >
              <Users size={18} color="#64748b" />
              <Text style={styles.dropdownText} numberOfLines={1}>
                {loadingClasses ? 'Loading...' : selectedClassName}
              </Text>
              <ChevronDown size={18} color="#64748b" />
            </TouchableOpacity>

            {showClassPicker && eligibleClasses && (
              <View style={styles.dropdownList}>
                <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                  {eligibleClasses.map((cls) => (
                    <TouchableOpacity
                      key={cls.public_id}
                      style={[
                        styles.dropdownItem,
                        selectedClassId === cls.public_id && styles.dropdownItemSelected,
                      ]}
                      onPress={() => {
                        setSelectedClassId(cls.public_id);
                        setShowClassPicker(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          selectedClassId === cls.public_id && styles.dropdownItemTextSelected,
                        ]}
                      >
                        {cls.display_name}
                      </Text>
                      <Text style={styles.dropdownItemInfo}>{cls.student_count} students</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Date Picker */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Date</Text>
            <TouchableOpacity style={styles.dropdown} onPress={() => setShowDatePicker(true)}>
              <Calendar size={18} color="#64748b" />
              <Text style={styles.dropdownText}>{format(selectedDate, 'MMM d, yyyy')}</Text>
              <ChevronDown size={18} color="#64748b" />
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="default"
              maximumDate={new Date()}
              onChange={(event, date) => {
                setShowDatePicker(false);
                if (date) setSelectedDate(date);
              }}
            />
          )}

          {/* Period Selection */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Period</Text>
            <View style={styles.periodRow}>
              {(['morning', 'afternoon', 'full_day'] as const).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.periodBtn, period === p && styles.periodBtnActive]}
                  onPress={() => setPeriod(p)}
                >
                  <Text style={[styles.periodBtnText, period === p && styles.periodBtnTextActive]}>
                    {p === 'full_day' ? 'Full Day' : p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* Not Working Day Alert */}
        {dateValidation && !dateValidation.is_working_day && (
          <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.alertCard}>
            <TriangleAlert size={24} color="#dc2626" />
            <View style={styles.alertTextContainer}>
              <Text style={styles.alertTitle}>Cannot Mark Attendance</Text>
              <Text style={styles.alertDesc}>
                {dateValidation.reason || 'This is not a working day'}
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Stats Row */}
        {students.length > 0 && isWorkingDay && (
          <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: '#eff6ff' }]}>
              <Users size={16} color="#2563eb" />
              <Text style={[styles.statValue, { color: '#2563eb' }]}>{stats.total}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#dcfce7' }]}>
              <CircleCheck size={16} color="#16a34a" />
              <Text style={[styles.statValue, { color: '#16a34a' }]}>{stats.present}</Text>
              <Text style={styles.statLabel}>Present</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#fee2e2' }]}>
              <CircleX size={16} color="#dc2626" />
              <Text style={[styles.statValue, { color: '#dc2626' }]}>{stats.absent}</Text>
              <Text style={styles.statLabel}>Absent</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#fef3c7' }]}>
              <TriangleAlert size={16} color="#d97706" />
              <Text style={[styles.statValue, { color: '#d97706' }]}>{stats.onLeave}</Text>
              <Text style={styles.statLabel}>Leave</Text>
            </View>
          </Animated.View>
        )}

        {/* Loading State */}
        {loadingStudents && selectedClassId && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#059669" />
            <Text style={styles.loadingText}>Loading students...</Text>
          </View>
        )}

        {/* Quick Actions */}
        {students.length > 0 && isWorkingDay && !isViewMode && (
          <Animated.View entering={FadeInDown.delay(250).springify()} style={styles.quickActions}>
            <TouchableOpacity style={styles.quickActionBtn} onPress={handleMarkAllPresent}>
              <UserCheck size={18} color="#16a34a" />
              <Text style={[styles.quickActionText, { color: '#16a34a' }]}>All Present</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionBtn} onPress={handleMarkAllAbsent}>
              <UserX size={18} color="#dc2626" />
              <Text style={[styles.quickActionText, { color: '#dc2626' }]}>All Absent</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Student List */}
        {students.length > 0 && isWorkingDay && (
          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <Text style={styles.sectionTitle}>Students</Text>
            {students.map((student, index) => (
              <View
                key={student.public_id}
                style={[styles.studentCard, !student.canEdit && styles.studentCardDisabled]}
              >
                <View style={styles.studentInfo}>
                  {student.profile_photo_thumbnail ? (
                    <Image
                      source={{ uri: student.profile_photo_thumbnail }}
                      style={styles.studentAvatar}
                    />
                  ) : (
                    <View style={styles.studentAvatarPlaceholder}>
                      <Text style={styles.studentAvatarText}>
                        {student.first_name.charAt(0)}
                        {student.last_name.charAt(0)}
                      </Text>
                    </View>
                  )}
                  <View style={styles.studentDetails}>
                    <Text style={styles.studentName}>
                      {student.first_name} {student.last_name}
                    </Text>
                    <Text style={styles.studentMeta}>
                      {student.roll_number
                        ? `Roll: ${student.roll_number}`
                        : student.admission_number}
                    </Text>
                    {student.leave_status === 'approved' && (
                      <View style={styles.leaveTag}>
                        <Text style={styles.leaveTagText}>On Leave - {student.leave_type}</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Attendance Toggles */}
                <View style={styles.toggleContainer}>
                  <View style={styles.toggleItem}>
                    <Text style={styles.toggleLabel}>AM</Text>
                    <Switch
                      value={student.morning_present || false}
                      onValueChange={(val) =>
                        handleToggleAttendance(student.public_id, 'morning_present', val)
                      }
                      disabled={!student.canEdit || isViewMode}
                      trackColor={{ false: '#fee2e2', true: '#bbf7d0' }}
                      thumbColor={student.morning_present ? '#16a34a' : '#ef4444'}
                    />
                  </View>
                  <View style={styles.toggleItem}>
                    <Text style={styles.toggleLabel}>PM</Text>
                    <Switch
                      value={student.afternoon_present || false}
                      onValueChange={(val) =>
                        handleToggleAttendance(student.public_id, 'afternoon_present', val)
                      }
                      disabled={!student.canEdit || isViewMode}
                      trackColor={{ false: '#fee2e2', true: '#bbf7d0' }}
                      thumbColor={student.afternoon_present ? '#16a34a' : '#ef4444'}
                    />
                  </View>
                </View>
              </View>
            ))}
          </Animated.View>
        )}

        {/* No Students */}
        {selectedClassId && !loadingStudents && students.length === 0 && isWorkingDay && (
          <View style={styles.emptyContainer}>
            <Users size={48} color="#94a3b8" />
            <Text style={styles.emptyTitle}>No Students Found</Text>
            <Text style={styles.emptyDesc}>There are no students in this class</Text>
          </View>
        )}

        {/* No Class Selected */}
        {!selectedClassId && !loadingClasses && (
          <View style={styles.emptyContainer}>
            <Users size={48} color="#94a3b8" />
            <Text style={styles.emptyTitle}>Select a Class</Text>
            <Text style={styles.emptyDesc}>Choose a class to mark attendance</Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Action Bar */}
      {students.length > 0 && isWorkingDay && (
        <View style={styles.bottomBar}>
          {isViewMode ? (
            <TouchableOpacity
              style={[styles.actionBtn, styles.editBtn]}
              onPress={() => setIsViewMode(false)}
            >
              <Text style={styles.actionBtnText}>Edit Attendance</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity style={[styles.actionBtn, styles.resetBtn]} onPress={handleReset}>
                <RotateCcw size={18} color="#64748b" />
                <Text style={[styles.actionBtnText, { color: '#64748b' }]}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.saveBtn, !canSubmit && styles.saveBtnDisabled]}
                onPress={handleSubmit}
                disabled={!canSubmit || isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Save size={18} color="#fff" />
                    <Text style={[styles.actionBtnText, { color: '#fff' }]}>Save</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  selectionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  dropdownText: {
    flex: 1,
    fontSize: 15,
    color: '#1e293b',
    fontWeight: '500',
  },
  dropdownList: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 1000,
    maxHeight: 200,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dropdownItemSelected: {
    backgroundColor: '#f0fdf4',
  },
  dropdownItemText: {
    fontSize: 15,
    color: '#1e293b',
    fontWeight: '500',
  },
  dropdownItemTextSelected: {
    color: '#059669',
  },
  dropdownItemInfo: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  periodRow: {
    flexDirection: 'row',
    gap: 8,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  periodBtnActive: {
    backgroundColor: '#059669',
  },
  periodBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  periodBtnTextActive: {
    color: '#fff',
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  alertTextContainer: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#dc2626',
  },
  alertDesc: {
    fontSize: 13,
    color: '#ef4444',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748b',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  studentCardDisabled: {
    opacity: 0.6,
    backgroundColor: '#fef3c7',
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  studentAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  studentAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentAvatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  studentMeta: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  leaveTag: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  leaveTagText: {
    fontSize: 10,
    color: '#d97706',
    fontWeight: '600',
  },
  toggleContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  toggleItem: {
    alignItems: 'center',
    gap: 4,
  },
  toggleLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
  },
  emptyDesc: {
    fontSize: 14,
    color: '#94a3b8',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  resetBtn: {
    backgroundColor: '#f1f5f9',
  },
  saveBtn: {
    backgroundColor: '#059669',
    flex: 2,
  },
  saveBtnDisabled: {
    backgroundColor: '#94a3b8',
  },
  editBtn: {
    backgroundColor: '#059669',
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
