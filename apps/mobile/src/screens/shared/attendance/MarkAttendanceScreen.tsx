/**
 * Mark Attendance Screen
 * Select class, date, and mark student attendance with toggle buttons
 */

import { LEAVE_STATUS } from '@educard/shared/constants';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
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
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import {
  useEligibleClasses,
  useValidateDate,
  useComprehensiveAttendance,
  useBulkMarkAttendance,
} from '@/features/attendance';
import { LinearGradient } from '@/lib/linear-gradient';
import type { SharedStackNavigation } from '@/navigation/types';

import { MarkStudentCard, type StudentRow } from './MarkStudentCard';
import { styles } from './mark-styles';

export default function MarkAttendanceScreen() {
  const navigation = useNavigation<SharedStackNavigation>();

  // Form state
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [period, setPeriod] = useState<'morning' | 'afternoon' | 'full_day'>(
    'full_day',
  );

  // Student state
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [isViewMode, setIsViewMode] = useState(false);
  const [initialStudents, setInitialStudents] = useState<StudentRow[] | null>(
    null,
  );
  const [refreshing, setRefreshing] = useState(false);

  const dateString = format(selectedDate, 'yyyy-MM-dd');

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) navigation.goBack();
  }, [navigation]);

  // Queries
  const { data: eligibleClasses, isLoading: loadingClasses } =
    useEligibleClasses();

  const { data: dateValidation } = useValidateDate(
    selectedClassId,
    dateString,
    !!selectedClassId && !!dateString,
  );

  const isWorkingDay = dateValidation?.is_working_day ?? true;

  const {
    data: comprehensiveData,
    isLoading: loadingStudents,
    refetch,
  } = useComprehensiveAttendance(
    selectedClassId,
    dateString,
    !!selectedClassId && !!dateString && isWorkingDay,
  );

  const bulkMarkMutation = useBulkMarkAttendance();

  // Selected class name
  const selectedClassName = useMemo(() => {
    if (!selectedClassId || !eligibleClasses) return 'Select Class';
    const cls = eligibleClasses.find(c => c.public_id === selectedClassId);
    return cls?.display_name ?? 'Select Class';
  }, [selectedClassId, eligibleClasses]);

  // Process comprehensive data
  useEffect(() => {
    if (comprehensiveData) {
      const hasExisting = comprehensiveData.some(s => s.attendance_public_id);

      const studentRows: StudentRow[] = comprehensiveData.map(student => ({
        ...student,
        canEdit: student.leave_status !== 'approved',
        morning_present: student.morning_present ?? false,
        afternoon_present: student.afternoon_present ?? false,
      }));

      setStudents(studentRows);
      setIsViewMode(hasExisting);
      setInitialStudents(studentRows.map(s => ({ ...s })));
    }
  }, [comprehensiveData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void refetch().finally(() => setRefreshing(false));
  }, [refetch]);

  const handleReset = () => {
    if (initialStudents) {
      setStudents(initialStudents.map(s => ({ ...s })));
      const hadExisting = initialStudents.some(s => !!s.attendance_public_id);
      setIsViewMode(hadExisting);
    }
  };

  const handleToggleAttendance = useCallback(
    (
      studentId: string,
      field: 'morning_present' | 'afternoon_present',
      value: boolean,
    ) => {
      setStudents(prev =>
        prev.map(student =>
          student.public_id === studentId
            ? { ...student, [field]: value }
            : student,
        ),
      );
    },
    [],
  );

  const handleMarkAllPresent = () => {
    setStudents(prev =>
      prev.map(student => ({
        ...student,
        morning_present: student.canEdit ? true : student.morning_present,
        afternoon_present: student.canEdit ? true : student.afternoon_present,
      })),
    );
  };

  const handleMarkAllAbsent = () => {
    setStudents(prev =>
      prev.map(student => ({
        ...student,
        morning_present: student.canEdit ? false : student.morning_present,
        afternoon_present: student.canEdit ? false : student.afternoon_present,
      })),
    );
  };

  const handleSubmit = async () => {
    if (!selectedClassId) {
      Alert.alert('Error', 'Please select a class');
      return;
    }

    const attendanceRecords = students
      .filter(s => s.canEdit)
      .map(student => ({
        user: student.public_id,
        morning_present: student.morning_present ?? false,
        afternoon_present: student.afternoon_present ?? false,
        remarks: student.attendance_remarks ?? '',
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
    } catch {
      // Error handled in mutation
    }
  };

  // Stats
  const stats = useMemo(() => {
    const total = students.length;
    const present = students.filter(
      s => (s.morning_present ?? false) && (s.afternoon_present ?? false),
    ).length;
    const absent = students.filter(
      s => !(s.morning_present ?? false) && !(s.afternoon_present ?? false),
    ).length;
    const onLeave = students.filter(
      s => s.leave_status === LEAVE_STATUS.APPROVED,
    ).length;
    return { total, present, absent, onLeave };
  }, [students]);

  const canSubmit = students.length > 0 && !isViewMode && isWorkingDay;
  const isSubmitting = bulkMarkMutation.isPending;

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#059669', '#10b981', '#34d399']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
            <ChevronLeft size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Mark Attendance</Text>
            <Text style={styles.headerSubtitle}>
              {format(selectedDate, 'EEEE, MMM d, yyyy')}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#059669']}
          />
        }
      >
        {/* Selection Card */}
        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          style={styles.selectionCard}
        >
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
                  {eligibleClasses.map(cls => (
                    <TouchableOpacity
                      key={cls.public_id}
                      style={[
                        styles.dropdownItem,
                        selectedClassId === cls.public_id &&
                          styles.dropdownItemSelected,
                      ]}
                      onPress={() => {
                        setSelectedClassId(cls.public_id);
                        setShowClassPicker(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          selectedClassId === cls.public_id &&
                            styles.dropdownItemTextSelected,
                        ]}
                      >
                        {cls.display_name}
                      </Text>
                      <Text style={styles.dropdownItemInfo}>
                        {cls.student_count} students
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Date Picker */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Date</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowDatePicker(true)}
            >
              <Calendar size={18} color="#64748b" />
              <Text style={styles.dropdownText}>
                {format(selectedDate, 'MMM d, yyyy')}
              </Text>
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
              {(['morning', 'afternoon', 'full_day'] as const).map(p => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.periodBtn,
                    period === p && styles.periodBtnActive,
                  ]}
                  onPress={() => setPeriod(p)}
                >
                  <Text
                    style={[
                      styles.periodBtnText,
                      period === p && styles.periodBtnTextActive,
                    ]}
                  >
                    {p === 'full_day'
                      ? 'Full Day'
                      : p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* Not Working Day Alert */}
        {dateValidation && !dateValidation.is_working_day && (
          <Animated.View
            entering={FadeInDown.delay(150).springify()}
            style={styles.alertCard}
          >
            <TriangleAlert size={24} color="#dc2626" />
            <View style={styles.alertTextContainer}>
              <Text style={styles.alertTitle}>Cannot Mark Attendance</Text>
              <Text style={styles.alertDesc}>
                {dateValidation.reason ?? 'This is not a working day'}
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Stats Row */}
        {students.length > 0 && isWorkingDay && (
          <Animated.View
            entering={FadeInDown.delay(200).springify()}
            style={styles.statsRow}
          >
            <View style={[styles.statCard, styles.statCardBlue]}>
              <Users size={16} color="#2563eb" />
              <Text style={[styles.statValue, styles.statValueBlue]}>
                {stats.total}
              </Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={[styles.statCard, styles.statCardGreen]}>
              <CircleCheck size={16} color="#16a34a" />
              <Text style={[styles.statValue, styles.statValueGreen]}>
                {stats.present}
              </Text>
              <Text style={styles.statLabel}>Present</Text>
            </View>
            <View style={[styles.statCard, styles.statCardRed]}>
              <CircleX size={16} color="#dc2626" />
              <Text style={[styles.statValue, styles.statValueRed]}>
                {stats.absent}
              </Text>
              <Text style={styles.statLabel}>Absent</Text>
            </View>
            <View style={[styles.statCard, styles.statCardAmber]}>
              <TriangleAlert size={16} color="#d97706" />
              <Text style={[styles.statValue, styles.statValueAmber]}>
                {stats.onLeave}
              </Text>
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
          <Animated.View
            entering={FadeInDown.delay(250).springify()}
            style={styles.quickActions}
          >
            <TouchableOpacity
              style={styles.quickActionBtn}
              onPress={handleMarkAllPresent}
            >
              <UserCheck size={18} color="#16a34a" />
              <Text
                style={[styles.quickActionText, styles.quickActionTextGreen]}
              >
                All Present
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionBtn}
              onPress={handleMarkAllAbsent}
            >
              <UserX size={18} color="#dc2626" />
              <Text style={[styles.quickActionText, styles.quickActionTextRed]}>
                All Absent
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Student List */}
        {students.length > 0 && isWorkingDay && (
          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <Text style={styles.sectionTitle}>Students</Text>
            {students.map(student => (
              <MarkStudentCard
                key={student.public_id}
                student={student}
                isViewMode={isViewMode}
                onToggle={handleToggleAttendance}
              />
            ))}
          </Animated.View>
        )}

        {/* No Students */}
        {selectedClassId &&
          !loadingStudents &&
          students.length === 0 &&
          isWorkingDay && (
            <View style={styles.emptyContainer}>
              <Users size={48} color="#94a3b8" />
              <Text style={styles.emptyTitle}>No Students Found</Text>
              <Text style={styles.emptyDesc}>
                There are no students in this class
              </Text>
            </View>
          )}

        {/* No Class Selected */}
        {!selectedClassId && !loadingClasses && (
          <View style={styles.emptyContainer}>
            <Users size={48} color="#94a3b8" />
            <Text style={styles.emptyTitle}>Select a Class</Text>
            <Text style={styles.emptyDesc}>
              Choose a class to mark attendance
            </Text>
          </View>
        )}

        <View style={styles.bottomSpacer} />
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
              <TouchableOpacity
                style={[styles.actionBtn, styles.resetBtn]}
                onPress={handleReset}
              >
                <RotateCcw size={18} color="#64748b" />
                <Text style={[styles.actionBtnText, styles.actionBtnTextGray]}>
                  Reset
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  styles.saveBtn,
                  !canSubmit && styles.saveBtnDisabled,
                ]}
                onPress={() => void handleSubmit()}
                disabled={!canSubmit || isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Save size={18} color="#fff" />
                    <Text
                      style={[styles.actionBtnText, styles.actionBtnTextWhite]}
                    >
                      Save
                    </Text>
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
