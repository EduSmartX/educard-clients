/**
 * My Timesheet Screen - monthly calendar + weekly submission for the logged-in employee.
 */

import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import {
  format,
  startOfMonth,
  endOfMonth,
  subMonths,
  addMonths,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  parseISO,
} from 'date-fns';
import { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';

import { useAcademicYearBounds } from '@/features/core';
import { DayAttendanceModal } from '@/features/timesheets/components/DayAttendanceModal';
import type {
  AttendanceRecord,
  DayState,
  WeekBlock,
} from '@/features/timesheets/types';
import type { SharedStackNavigation } from '@/navigation/types';

import { styles } from './my-timesheet-styles';
import { TimesheetMonthHeader } from './TimesheetMonthHeader';
import { TimesheetSummary, MonthlyDetails } from './TimesheetSummary';
import { TimesheetTabContent } from './TimesheetTabContent';
import {
  buildWeekRows,
  checkTimesheetStatus,
  getDayClickBlockReason,
  getEmployeeAttendance,
  toggleRowField,
} from './timesheet-utils';
import { useTimesheetMutations } from './use-timesheet-mutations';

export default function MyTimesheetScreen() {
  const navigation = useNavigation<SharedStackNavigation>();
  const { minDate: academicStart, maxDate: academicEnd } =
    useAcademicYearBounds();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [weeks, setWeeks] = useState<WeekBlock[]>([]);
  const [loadingWeeks, setLoadingWeeks] = useState(false);
  const [activeTab, setActiveTab] = useState<'calendar' | 'weeks'>('calendar');

  // Day attendance modal state
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [dayModalVisible, setDayModalVisible] = useState(false);
  const [dayMorningPresent, setDayMorningPresent] = useState(true);
  const [dayAfternoonPresent, setDayAfternoonPresent] = useState(true);
  const [weekTimesheetStatus, setWeekTimesheetStatus] = useState<string | null>(
    null,
  );
  const [checkingWeekStatus, setCheckingWeekStatus] = useState(false);

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const monthStart = useMemo(() => startOfMonth(currentDate), [currentDate]);
  const monthEnd = useMemo(() => endOfMonth(currentDate), [currentDate]);
  const fromDate = format(monthStart, 'yyyy-MM-dd');
  const toDate = format(monthEnd, 'yyyy-MM-dd');

  const {
    data: attendanceData,
    isLoading,
    refetch,
    error,
  } = useQuery({
    queryKey: ['timesheet', 'attendance', fromDate, toDate],
    queryFn: () => getEmployeeAttendance(fromDate, toDate),
    staleTime: 30 * 1000,
  });

  const defaultPresent =
    attendanceData?.submission_config?.default_present ?? true;

  const attendanceByDate = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    (attendanceData?.records || []).forEach(r => map.set(r.date, r));
    return map;
  }, [attendanceData]);

  const holidaySet = useMemo(() => {
    const set = new Set<string>();
    Object.entries(attendanceData?.holiday_descriptions || {}).forEach(
      ([k, v]) => {
        if (v?.type === 'official_holiday' || v?.type === 'holiday') set.add(k);
      },
    );
    return set;
  }, [attendanceData]);

  const exceptionsMap = useMemo(() => {
    const map = new Map<string, { type: string; reason: string }>();
    (attendanceData?.calendar_exceptions || []).forEach(e =>
      map.set(e.date, { type: e.type, reason: e.reason }),
    );
    return map;
  }, [attendanceData]);

  const holidayDescriptions = useMemo(
    () => attendanceData?.holiday_descriptions || {},
    [attendanceData],
  );
  const workingDayPolicy = attendanceData?.working_day_policy || null;
  const monthDays = useMemo(
    () => eachDayOfInterval({ start: monthStart, end: monthEnd }),
    [monthStart, monthEnd],
  );
  const leadingEmptyDays = useMemo(
    () => Array.from({ length: monthStart.getDay() }),
    [monthStart],
  );

  const monthWeeks = useMemo(() => {
    const weeksArr: { start: Date; end: Date; id: string }[] = [];
    let current = startOfWeek(monthStart, { weekStartsOn: 0 });
    const lastDay = endOfWeek(monthEnd, { weekStartsOn: 0 });
    while (current <= lastDay) {
      const weekEnd = endOfWeek(current, { weekStartsOn: 0 });
      const daysInWeek = eachDayOfInterval({ start: current, end: weekEnd });
      if (daysInWeek.some(d => isSameMonth(d, currentDate))) {
        weeksArr.push({
          start: current,
          end: weekEnd,
          id: format(current, 'yyyy-MM-dd'),
        });
      }
      current = new Date(weekEnd);
      current.setDate(current.getDate() + 1);
    }
    return weeksArr;
  }, [monthStart, monthEnd, currentDate]);

  const report = useMemo(() => {
    const s = attendanceData?.stats || {};
    return {
      totalWorkingDays: s.total_working_days || 0,
      present: s.total_present || 0,
      absent: s.total_absent || 0,
      halfDays: s.total_half_days || 0,
      leave: s.total_leaves || 0,
      holiday: s.total_holidays || 0,
    };
  }, [attendanceData]);

  const attendancePercentage =
    report.totalWorkingDays > 0
      ? Math.round((report.present / report.totalWorkingDays) * 100)
      : 0;

  const loadWeek = async (weekStart: Date, weekEnd: Date) => {
    const weekId = format(weekStart, 'yyyy-MM-dd');
    if (weeks.some(w => w.id === weekId)) {
      setWeeks(prev =>
        prev.map(w =>
          w.id === weekId ? { ...w, collapsed: !w.collapsed } : w,
        ),
      );
      return;
    }

    setLoadingWeeks(true);
    const fromDateStr = format(weekStart, 'yyyy-MM-dd');
    const toDateStr = format(weekEnd, 'yyyy-MM-dd');

    let submissionStatus: string | null = null;
    let reviewComments: string | null = null;
    let reviewedByName: string | null = null;
    let reviewedAt: string | null = null;
    let hasStatus = false;

    try {
      const statusResponse = await checkTimesheetStatus(fromDateStr, toDateStr);
      submissionStatus = statusResponse.submission?.submission_status || null;
      reviewComments = statusResponse.submission?.review_comments || null;
      reviewedByName = statusResponse.submission?.reviewed_by_name || null;
      reviewedAt = statusResponse.submission?.reviewed_at || null;
      hasStatus = true;
    } catch {
      // Status check failed, continue without it
    }

    const rows = buildWeekRows({
      weekStart,
      weekEnd,
      attendanceByDate,
      holidayDescriptions,
      holidaySet,
      workingDayPolicy,
      exceptionsMap,
      defaultPresent,
      strictLeaveCheck: hasStatus,
    });

    const newWeek: WeekBlock = {
      id: weekId,
      start: fromDateStr,
      end: toDateStr,
      rows,
      collapsed: false,
      submissionStatus,
      reviewComments,
      reviewedByName,
      reviewedAt,
    };
    setWeeks(prev =>
      [...prev.filter(w => w.id !== weekId), newWeek].sort((a, b) =>
        a.id.localeCompare(b.id),
      ),
    );
    setLoadingWeeks(false);
  };

  const toggleAttendance = (
    weekId: string,
    date: string,
    field: 'morning_present' | 'afternoon_present',
  ) => {
    setWeeks(prev =>
      prev.map(week => {
        if (week.id !== weekId) return week;
        return { ...week, rows: toggleRowField(week.rows, date, field) };
      }),
    );
  };

  const { submitMutation, returnToDraftMutation, dailyAttendanceMutation } =
    useTimesheetMutations({
      onSubmitted: () => setWeeks([]),
      onReturnedToDraft: weekStart =>
        setWeeks(prev => prev.filter(w => w.start !== weekStart)),
      onDailySaved: () => {
        setDayModalVisible(false);
        setSelectedDay(null);
      },
    });

  // Handle clicking on a calendar day
  const handleDayClick = useCallback(
    async (date: Date, state: DayState) => {
      const blockReason = getDayClickBlockReason(date, state, attendanceByDate);
      if (blockReason) {
        Alert.alert(blockReason.title, blockReason.message);
        return;
      }

      setCheckingWeekStatus(true);
      const weekStart = startOfWeek(date, { weekStartsOn: 0 });
      const weekEnd = endOfWeek(date, { weekStartsOn: 0 });

      try {
        const statusResponse = await checkTimesheetStatus(
          format(weekStart, 'yyyy-MM-dd'),
          format(weekEnd, 'yyyy-MM-dd'),
        );
        const timesheetStatus =
          statusResponse.submission?.submission_status || null;
        setWeekTimesheetStatus(timesheetStatus);

        if (timesheetStatus === 'APPROVED') {
          Alert.alert(
            'Cannot Edit',
            'The timesheet for this week has been approved. You cannot modify attendance.',
          );
          setCheckingWeekStatus(false);
          return;
        }
        if (timesheetStatus === 'SUBMITTED') {
          Alert.alert(
            'Cannot Edit',
            'The timesheet for this week is pending approval. Return to draft to modify.',
          );
          setCheckingWeekStatus(false);
          return;
        }
      } catch {
        setWeekTimesheetStatus(null);
      }
      setCheckingWeekStatus(false);

      setSelectedDay(date);
      const record = attendanceByDate.get(format(date, 'yyyy-MM-dd'));
      setDayMorningPresent(record?.morning_present ?? defaultPresent);
      setDayAfternoonPresent(record?.afternoon_present ?? defaultPresent);
      setDayModalVisible(true);
    },
    [attendanceByDate, defaultPresent],
  );

  const handleSubmitDayAttendance = () => {
    if (!selectedDay) return;

    const dateStr = format(selectedDay, 'yyyy-MM-dd');
    let status: 'P' | 'HP' | 'A';

    if (dayMorningPresent && dayAfternoonPresent) {
      status = 'P';
    } else if (dayMorningPresent || dayAfternoonPresent) {
      status = 'HP';
    } else {
      status = 'A';
    }

    dailyAttendanceMutation.mutate({
      attendance_records: [
        {
          date: dateStr,
          morning_present: dayMorningPresent,
          afternoon_present: dayAfternoonPresent,
          attendance_status: status,
        },
      ],
    });
  };

  const submitWeek = (week: WeekBlock) => {
    const editableRows = week.rows.filter(
      r => r.is_working_day && !r.locked_reason,
    );
    if (!editableRows.length) {
      Alert.alert('Error', 'No editable records in this week.');
      return;
    }
    Alert.alert(
      'Submit Timesheet',
      `Submit for week ${format(parseISO(week.start), 'MMM d')} - ${format(parseISO(week.end), 'MMM d')}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: () =>
            submitMutation.mutate({
              attendance_records: editableRows.map(r => ({
                date: r.date,
                morning_present: r.morning_present,
                afternoon_present: r.afternoon_present,
              })),
              submit_timesheet: true,
              week_start_date: week.start,
              week_end_date: week.end,
            }),
        },
      ],
    );
  };

  const handleReturnToDraft = (week: WeekBlock) => {
    Alert.alert(
      'Return to Draft',
      'This will delete the submission. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Return',
          style: 'destructive',
          onPress: () =>
            returnToDraftMutation.mutate({
              week_start_date: week.start,
              week_end_date: week.end,
            }),
        },
      ],
    );
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setWeeks([]);
    await refetch();
    setRefreshing(false);
  };

  const handlePreviousMonth = () => {
    const prev = subMonths(currentDate, 1);
    if (academicStart && format(prev, 'yyyy-MM') < academicStart.slice(0, 7))
      return;
    setWeeks([]);
    setCurrentDate(prev);
  };

  const handleNextMonth = () => {
    const n = addMonths(currentDate, 1);
    if (academicEnd && format(n, 'yyyy-MM') > academicEnd.slice(0, 7)) return;
    if (n <= new Date()) {
      setWeeks([]);
      setCurrentDate(n);
    }
  };

  const handleToday = () => {
    setWeeks([]);
    setCurrentDate(new Date());
  };

  return (
    <View style={styles.root}>
      <TimesheetMonthHeader
        currentDate={currentDate}
        activeTab={activeTab}
        onBack={handleBack}
        onPrevMonth={handlePreviousMonth}
        onNextMonth={handleNextMonth}
        onToday={handleToday}
        onSelectTab={setActiveTab}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {isLoading && (
          <View style={styles.centerPad}>
            <ActivityIndicator size="large" color="#0d9488" />
            <Text style={styles.loadingText}>Loading timesheet...</Text>
          </View>
        )}
        {!isLoading && error && (
          <View style={styles.centerPad}>
            <Text style={styles.errorText}>Failed to load data</Text>
            <TouchableOpacity onPress={handleRefresh} style={styles.retryBtn}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
        {!isLoading && !error && (
          <>
            <TimesheetSummary
              report={report}
              attendancePercentage={attendancePercentage}
            />

            <TimesheetTabContent
              activeTab={activeTab}
              currentDate={currentDate}
              monthDays={monthDays}
              leadingEmptyDays={leadingEmptyDays}
              attendanceByDate={attendanceByDate}
              holidaySet={holidaySet}
              workingDayPolicy={workingDayPolicy}
              exceptionsMap={exceptionsMap}
              onDayClick={handleDayClick}
              monthWeeks={monthWeeks}
              weeks={weeks}
              loadingWeeks={loadingWeeks}
              onExpandToggle={loadWeek}
              onToggleAttendance={toggleAttendance}
              onSubmitWeek={submitWeek}
              onReturnToDraft={handleReturnToDraft}
              isSubmitting={submitMutation.isPending}
              isReturningToDraft={returnToDraftMutation.isPending}
            />

            <MonthlyDetails report={report} />
          </>
        )}
      </ScrollView>

      {/* Day Attendance Modal */}
      <DayAttendanceModal
        visible={dayModalVisible}
        onClose={() => setDayModalVisible(false)}
        selectedDay={selectedDay}
        weekTimesheetStatus={weekTimesheetStatus}
        checkingWeekStatus={checkingWeekStatus}
        dayMorningPresent={dayMorningPresent}
        dayAfternoonPresent={dayAfternoonPresent}
        onToggleMorning={() => setDayMorningPresent(!dayMorningPresent)}
        onToggleAfternoon={() => setDayAfternoonPresent(!dayAfternoonPresent)}
        onMarkAbsent={() => {
          setDayMorningPresent(false);
          setDayAfternoonPresent(false);
        }}
        onSubmit={handleSubmitDayAttendance}
        isSubmitting={dailyAttendanceMutation.isPending}
      />
    </View>
  );
}
