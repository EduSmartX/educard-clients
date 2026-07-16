/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-misused-promises, @typescript-eslint/no-floating-promises, @typescript-eslint/prefer-nullish-coalescing */ import {
  LEAVE_STATUS,
  TimesheetStatus,
} from '@educard/shared/constants';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  getDay,
  parseISO,
  isToday,
  isBefore,
  isSameDay,
} from 'date-fns';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, Check, X, CalendarDays } from 'lucide-react-native';
import { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { apiClient } from '@/api/client';
import { useAcademicYearBounds } from '@/features/core';
import { DayAttendanceModal } from '@/features/timesheets/components/DayAttendanceModal';
import { TimesheetWeekCard } from '@/features/timesheets/components/TimesheetWeekCard';
import { handleMutationError } from '@/lib/mutation-utils';
import { useToast } from '@/lib/toast-context';
const { width: screenWidth } = Dimensions.get('window');
const CELL_SIZE = Math.floor((screenWidth - 40) / 7);
const WEEKDAYS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

interface AttendanceRecord {
  date: string;
  morning_present: boolean | null;
  afternoon_present: boolean | null;
  is_leave?: boolean;
  leave_type_name?: string | null;
  leave_status?: string | null;
  approval_status?: string | null;
}

interface HolidayDescription {
  type: 'weekend' | 'official_holiday' | 'holiday' | 'force_holiday' | 'force_working';
  name: string;
  description?: string;
}

interface EmployeeAttendanceResponse {
  records: AttendanceRecord[];
  stats: {
    total_working_days?: number;
    total_present?: number;
    total_absent?: number;
    total_half_days?: number;
    total_leaves?: number;
    total_holidays?: number;
  };
  working_day_policy: { sunday_off: boolean; saturday_off_pattern: string } | null;
  holiday_descriptions?: Record<string, HolidayDescription>;
  calendar_exceptions?: { date: string; type: string; reason: string }[];
  submission_config?: { default_present?: boolean };
}

interface TimesheetStatusResponse {
  submission: {
    submission_status: string;
    review_comments?: string;
    reviewed_by_name?: string | null;
    reviewed_at?: string | null;
  } | null;
}

type DayState =
  | 'present'
  | 'absent'
  | 'half_day'
  | 'leave-approved'
  | 'leave-pending'
  | 'holiday'
  | 'none'
  | 'future';

type WeekRow = {
  date: string;
  dayName: string;
  morning_present: boolean;
  afternoon_present: boolean;
  locked_reason?: 'holiday' | 'leave' | 'non_working_day';
  holiday_name?: string;
  leave_name?: string;
  is_working_day: boolean;
};

type WeekBlock = {
  id: string;
  start: string;
  end: string;
  rows: WeekRow[];
  collapsed: boolean;
  submissionStatus?: string | null;
  reviewComments?: string | null;
  reviewedByName?: string | null;
  reviewedAt?: string | null;
};

const getEmployeeAttendance = async (
  fromDate: string,
  toDate: string
): Promise<EmployeeAttendanceResponse> => {
  const response = await apiClient.get<
    { data: EmployeeAttendanceResponse } | EmployeeAttendanceResponse
  >('/attendance/employee-attendance/', {
    params: { from_date: fromDate, to_date: toDate },
  });
  const result = response.data;
  if ('data' in result && result.data) {
    return result.data as EmployeeAttendanceResponse;
  }
  return result as EmployeeAttendanceResponse;
};

// Correct endpoint: /attendance/timesheet-submission/check_status/
const checkTimesheetStatus = async (
  weekStart: string,
  weekEnd: string
): Promise<TimesheetStatusResponse> => {
  const response = await apiClient.get<{ data: TimesheetStatusResponse } | TimesheetStatusResponse>(
    '/attendance/timesheet-submission/check_status/',
    {
      params: { week_start_date: weekStart, week_end_date: weekEnd },
    }
  );
  const result = response.data;
  if ('data' in result && result.data) {
    return result.data as TimesheetStatusResponse;
  }
  return result as TimesheetStatusResponse;
};

// Shared bulk submit endpoint
const bulkSubmitAttendance = async (
  payload: Record<string, unknown>
): Promise<{ message?: string }> => {
  const response = await apiClient.post<{ message?: string }>(
    '/attendance/employee-attendance/bulk_submit/',
    payload
  );
  return response.data;
};

// Correct endpoint: DELETE /attendance/timesheet-submission/return_to_draft/
const returnTimesheetToDraft = async (payload: {
  week_start_date: string;
  week_end_date: string;
}): Promise<{ message?: string }> => {
  const response = await apiClient.delete<{ message?: string }>(
    '/attendance/timesheet-submission/return_to_draft/',
    {
      params: payload,
    }
  );
  return response.data;
};

const toDateKey = (d: Date) => format(d, 'yyyy-MM-dd');

const isWorkingDay = (
  date: Date,
  workingDayPolicy: { sunday_off: boolean; saturday_off_pattern: string } | null,
  holidaySet: Set<string>,
  exceptionsMap: Map<string, { type: string }>
): boolean => {
  const dateKey = toDateKey(date);
  const exception = exceptionsMap.get(dateKey);
  if (exception) return exception.type === 'FORCE_WORKING' || exception.type === 'force_working';
  if (holidaySet.has(dateKey)) return false;

  const dayOfWeek = getDay(date);
  if (!workingDayPolicy) return dayOfWeek >= 1 && dayOfWeek <= 5;
  if (dayOfWeek === 0) return !workingDayPolicy.sunday_off;
  if (dayOfWeek === 6) return isSaturdayWorking(date, workingDayPolicy.saturday_off_pattern);
  return true;
};

/** Determine if a Saturday is a working day based on pattern */
function isSaturdayWorking(date: Date, pattern: string): boolean {
  if (pattern === 'NONE') return true;
  if (pattern === 'ALL') return false;
  const saturdayOfMonth = Math.ceil(date.getDate() / 7);
  if (pattern === 'FIRST_AND_THIRD') return saturdayOfMonth !== 1 && saturdayOfMonth !== 3;
  if (pattern === 'SECOND_AND_FOURTH') return saturdayOfMonth !== 2 && saturdayOfMonth !== 4;
  return true;
}

const getDayState = (
  date: Date,
  attendanceByDate: Map<string, AttendanceRecord>,
  holidaySet: Set<string>,
  workingDayPolicy: { sunday_off: boolean; saturday_off_pattern: string } | null,
  exceptionsMap: Map<string, { type: string }>
): DayState => {
  const dateKey = toDateKey(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);

  if (checkDate > today) return 'future';
  if (holidaySet.has(dateKey) || !isWorkingDay(date, workingDayPolicy, holidaySet, exceptionsMap))
    return 'holiday';

  const record = attendanceByDate.get(dateKey);
  if (record) return getStateFromRecord(record);

  return isBefore(checkDate, today) && !isSameDay(checkDate, today) ? 'absent' : 'none';
};

/** Derive day state from an attendance record */
function getStateFromRecord(record: AttendanceRecord): DayState {
  if (record.is_leave) {
    return record.leave_status === LEAVE_STATUS.PENDING ? 'leave-pending' : 'leave-approved';
  }
  if (record.morning_present && record.afternoon_present) return 'present';
  if (record.morning_present || record.afternoon_present) return 'half_day';
  if (record.morning_present === false && record.afternoon_present === false) return 'absent';
  return 'none';
}

const stateColors: Record<DayState, { bg: string; border: string; text: string }> = {
  present: { bg: '#dcfce7', border: '#86efac', text: '#166534' },
  absent: { bg: '#fee2e2', border: '#fca5a5', text: '#991b1b' },
  half_day: { bg: '#fef3c7', border: '#fcd34d', text: '#92400e' },
  'leave-approved': { bg: '#ffedd5', border: '#fdba74', text: '#9a3412' },
  'leave-pending': { bg: '#fef9c3', border: '#fde047', text: '#854d0e' },
  holiday: { bg: '#f3e8ff', border: '#d8b4fe', text: '#7c3aed' },
  none: { bg: '#ffffff', border: '#e5e7eb', text: '#374151' },
  future: { bg: '#fafafa', border: '#f3f4f6', text: '#d1d5db' },
};

/** Build week rows from attendance data for a given date range */
function buildWeekRows(params: {
  weekStart: Date;
  weekEnd: Date;
  attendanceByDate: Map<string, AttendanceRecord>;
  holidayDescriptions: Record<string, HolidayDescription>;
  holidaySet: Set<string>;
  workingDayPolicy: { sunday_off: boolean; saturday_off_pattern: string } | null;
  exceptionsMap: Map<string, { type: string; reason: string }>;
  defaultPresent: boolean;
  strictLeaveCheck: boolean;
}): WeekRow[] {
  const {
    weekStart,
    weekEnd,
    attendanceByDate,
    holidayDescriptions,
    holidaySet,
    workingDayPolicy,
    exceptionsMap,
    defaultPresent,
    strictLeaveCheck,
  } = params;
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
  return days.map((day) => {
    const dateKey = toDateKey(day);
    const record = attendanceByDate.get(dateKey);
    const holidayInfo = holidayDescriptions[dateKey];
    const isHoliday =
      holidaySet.has(dateKey) ||
      holidayInfo?.type === 'official_holiday' ||
      holidayInfo?.type === 'holiday' ||
      holidayInfo?.type === 'weekend';
    const isForceWorking = holidayInfo?.type === 'force_working';
    const isLeave = strictLeaveCheck
      ? record?.is_leave &&
        (record?.leave_status === TimesheetStatus.APPROVED ||
          record?.leave_status === LEAVE_STATUS.PENDING)
      : record?.is_leave;
    const dayIsWorkingDay = isWorkingDay(day, workingDayPolicy, holidaySet, exceptionsMap);

    let locked_reason: WeekRow['locked_reason'] = undefined;
    if (isHoliday && !isForceWorking) locked_reason = 'holiday';
    else if (isLeave) locked_reason = 'leave';
    else if (!dayIsWorkingDay && !isForceWorking) locked_reason = 'non_working_day';

    const morning_present = record?.morning_present ?? defaultPresent;
    const afternoon_present = record?.afternoon_present ?? defaultPresent;

    return {
      date: dateKey,
      dayName: format(day, 'EEE'),
      morning_present,
      afternoon_present,
      locked_reason,
      holiday_name: isHoliday && !isForceWorking ? holidayInfo?.name || 'Holiday' : undefined,
      leave_name: isLeave ? record?.leave_type_name || 'Leave' : undefined,
      is_working_day:
        (dayIsWorkingDay || isForceWorking) && !(isHoliday && !isForceWorking) && !isLeave,
    };
  });
}

/** Check if a day click should be blocked, returns alert info or null */
function getDayClickBlockReason(
  date: Date,
  state: DayState,
  attendanceByDate: Map<string, AttendanceRecord>
): { title: string; message: string } | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const clickedDate = new Date(date);
  clickedDate.setHours(0, 0, 0, 0);

  if (clickedDate > today)
    return { title: 'Cannot Edit', message: 'Cannot submit attendance for future dates.' };
  if (state === 'holiday')
    return { title: 'Holiday', message: 'This is a holiday. No attendance required.' };
  if (state === 'leave-approved' || state === 'leave-pending')
    return { title: 'On Leave', message: 'You are on leave for this date.' };

  const record = attendanceByDate.get(format(date, 'yyyy-MM-dd'));
  const status = record?.approval_status?.toLowerCase();
  if (status === TimesheetStatus.APPROVED)
    return { title: 'Cannot Edit', message: 'This date has been approved and cannot be modified.' };
  if (status === TimesheetStatus.SUBMITTED || status === LEAVE_STATUS.PENDING)
    return {
      title: 'Cannot Edit',
      message: 'This date has been submitted for approval. Wait for approval or return to draft.',
    };

  return null;
}

/** Helper to toggle a single row's attendance field */
function toggleRowField(
  rows: WeekRow[],
  date: string,
  field: 'morning_present' | 'afternoon_present'
): WeekRow[] {
  return rows.map((row) => (row.date === date ? { ...row, [field]: !row[field] } : row));
}

export default function MyTimesheetScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const { minDate: academicStart, maxDate: academicEnd } = useAcademicYearBounds();
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
  const [weekTimesheetStatus, setWeekTimesheetStatus] = useState<string | null>(null);
  const [checkingWeekStatus, setCheckingWeekStatus] = useState(false);

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

  const defaultPresent = attendanceData?.submission_config?.default_present ?? true;

  const attendanceByDate = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    (attendanceData?.records || []).forEach((r) => map.set(r.date, r));
    return map;
  }, [attendanceData]);

  const holidaySet = useMemo(() => {
    const set = new Set<string>();
    Object.entries(attendanceData?.holiday_descriptions || {}).forEach(([k, v]) => {
      if (v?.type === 'official_holiday' || v?.type === 'holiday') set.add(k);
    });
    return set;
  }, [attendanceData]);

  const exceptionsMap = useMemo(() => {
    const map = new Map<string, { type: string; reason: string }>();
    (attendanceData?.calendar_exceptions || []).forEach((e) =>
      map.set(e.date, { type: e.type, reason: e.reason })
    );
    return map;
  }, [attendanceData]);

  const holidayDescriptions = useMemo(
    () => attendanceData?.holiday_descriptions || {},
    [attendanceData]
  );
  const workingDayPolicy = attendanceData?.working_day_policy || null;
  const monthDays = useMemo(
    () => eachDayOfInterval({ start: monthStart, end: monthEnd }),
    [monthStart, monthEnd]
  );
  const leadingEmptyDays = useMemo(() => Array.from({ length: monthStart.getDay() }), [monthStart]);

  const monthWeeks = useMemo(() => {
    const weeksArr: { start: Date; end: Date; id: string }[] = [];
    let current = startOfWeek(monthStart, { weekStartsOn: 0 });
    const lastDay = endOfWeek(monthEnd, { weekStartsOn: 0 });
    while (current <= lastDay) {
      const weekEnd = endOfWeek(current, { weekStartsOn: 0 });
      const daysInWeek = eachDayOfInterval({ start: current, end: weekEnd });
      if (daysInWeek.some((d) => isSameMonth(d, currentDate))) {
        weeksArr.push({ start: current, end: weekEnd, id: format(current, 'yyyy-MM-dd') });
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
    report.totalWorkingDays > 0 ? Math.round((report.present / report.totalWorkingDays) * 100) : 0;

  const loadWeek = async (weekStart: Date, weekEnd: Date) => {
    const weekId = format(weekStart, 'yyyy-MM-dd');
    if (weeks.some((w) => w.id === weekId)) {
      setWeeks((prev) =>
        prev.map((w) => (w.id === weekId ? { ...w, collapsed: !w.collapsed } : w))
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
    setWeeks((prev) =>
      [...prev.filter((w) => w.id !== weekId), newWeek].sort((a, b) => a.id.localeCompare(b.id))
    );
    setLoadingWeeks(false);
  };

  const toggleAttendance = (
    weekId: string,
    date: string,
    field: 'morning_present' | 'afternoon_present'
  ) => {
    setWeeks((prev) =>
      prev.map((week) => {
        if (week.id !== weekId) return week;
        return { ...week, rows: toggleRowField(week.rows, date, field) };
      })
    );
  };

  const submitMutation = useMutation({
    mutationFn: bulkSubmitAttendance,
    onSuccess: (response) => {
      showToast({
        type: 'success',
        title: 'Success',
        message: response?.message || 'Timesheet submitted for approval',
      });
      queryClient.invalidateQueries({ queryKey: ['timesheet'] });
      setWeeks([]);
    },
    onError: (error: unknown) => {
      handleMutationError(error, 'Failed to submit timesheet');
    },
  });

  const returnToDraftMutation = useMutation({
    mutationFn: returnTimesheetToDraft,
    onSuccess: (response, variables) => {
      showToast({
        type: 'success',
        title: 'Success',
        message: response?.message || 'Timesheet returned to draft',
      });
      queryClient.invalidateQueries({ queryKey: ['timesheet'] });
      setWeeks((prev) => prev.filter((w) => w.start !== variables.week_start_date));
    },
    onError: (error: unknown) => {
      handleMutationError(error, 'Failed to return to draft');
    },
  });

  // Daily attendance submission mutation
  const dailyAttendanceMutation = useMutation({
    mutationFn: bulkSubmitAttendance,
    onSuccess: (response) => {
      showToast({
        type: 'success',
        title: 'Success',
        message: response?.message || 'Attendance saved successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['timesheet'] });
      setDayModalVisible(false);
      setSelectedDay(null);
    },
    onError: (error: unknown) => {
      handleMutationError(error, 'Failed to save attendance');
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

      // Check if timesheet for this week is already submitted/approved
      setCheckingWeekStatus(true);
      const weekStart = startOfWeek(date, { weekStartsOn: 0 });
      const weekEnd = endOfWeek(date, { weekStartsOn: 0 });

      try {
        const statusResponse = await checkTimesheetStatus(
          format(weekStart, 'yyyy-MM-dd'),
          format(weekEnd, 'yyyy-MM-dd')
        );
        const timesheetStatus = statusResponse.submission?.submission_status || null;
        setWeekTimesheetStatus(timesheetStatus);

        if (timesheetStatus === 'APPROVED') {
          Alert.alert(
            'Cannot Edit',
            'The timesheet for this week has been approved. You cannot modify attendance.'
          );
          setCheckingWeekStatus(false);
          return;
        }
        if (timesheetStatus === 'SUBMITTED') {
          Alert.alert(
            'Cannot Edit',
            'The timesheet for this week is pending approval. Return to draft to modify.'
          );
          setCheckingWeekStatus(false);
          return;
        }
      } catch {
        setWeekTimesheetStatus(null);
      }
      setCheckingWeekStatus(false);

      // Set the selected day and pre-fill attendance values
      setSelectedDay(date);
      const record = attendanceByDate.get(format(date, 'yyyy-MM-dd'));
      setDayMorningPresent(record?.morning_present ?? defaultPresent);
      setDayAfternoonPresent(record?.afternoon_present ?? defaultPresent);
      setDayModalVisible(true);
    },
    [attendanceByDate, defaultPresent]
  );

  // Submit daily attendance
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
    const editableRows = week.rows.filter((r) => r.is_working_day && !r.locked_reason);
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
              attendance_records: editableRows.map((r) => ({
                date: r.date,
                morning_present: r.morning_present,
                afternoon_present: r.afternoon_present,
              })),
              submit_timesheet: true,
              week_start_date: week.start,
              week_end_date: week.end,
            }),
        },
      ]
    );
  };

  const handleReturnToDraft = (week: WeekBlock) => {
    Alert.alert('Return to Draft', 'This will delete the submission. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Return',
        style: 'destructive',
        onPress: () =>
          returnToDraftMutation.mutate({ week_start_date: week.start, week_end_date: week.end }),
      },
    ]);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setWeeks([]);
    await refetch();
    setRefreshing(false);
  };
  const handlePreviousMonth = () => {
    const prev = subMonths(currentDate, 1);
    // Don't navigate before academic year start
    if (academicStart && format(prev, 'yyyy-MM') < academicStart.slice(0, 7)) return;
    setWeeks([]);
    setCurrentDate(prev);
  };
  const handleNextMonth = () => {
    const n = addMonths(currentDate, 1);
    // Don't navigate past academic year end or future
    if (academicEnd && format(n, 'yyyy-MM') > academicEnd.slice(0, 7)) return;
    if (n <= new Date()) {
      setWeeks([]);
      setCurrentDate(n);
    }
  };

  // Calendar Day Cell Renderer
  const renderDayCell = useCallback(
    (date: Date) => {
      const dateKey = toDateKey(date);
      const state = getDayState(
        date,
        attendanceByDate,
        holidaySet,
        workingDayPolicy,
        exceptionsMap
      );
      const colors = stateColors[state];
      const record = attendanceByDate.get(dateKey);
      const holidayInfo = holidayDescriptions[dateKey];
      const isTodayDate = isToday(date);
      const dayNum = format(date, 'd');

      // Check if day is clickable (not future, not holiday unless editable)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const clickedDate = new Date(date);
      clickedDate.setHours(0, 0, 0, 0);
      const isClickable = clickedDate <= today && state !== 'future';

      // Label for holiday display - computed but used in potential future UI
      let _shortLabel = '';
      if (holidayInfo) {
        if (holidayInfo.type === 'weekend') {
          _shortLabel = 'Weekend';
        } else if (holidayInfo.name.length > 8) {
          _shortLabel = holidayInfo.name.substring(0, 6) + '..';
        } else {
          _shortLabel = holidayInfo.name;
        }
      }

      const renderIcon = () => {
        if (state === 'leave-approved' || state === 'leave-pending') {
          return (
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: state === 'leave-approved' ? '#f97316' : '#eab308',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={12} color="white" strokeWidth={3} />
            </View>
          );
        }
        if (state === 'half_day' && record) {
          return (
            <Svg width={20} height={20} viewBox="0 0 24 24">
              <Path
                d="M 2 12 A 10 10 0 0 0 22 12 Z"
                fill={record.afternoon_present ? '#22c55e' : '#ef4444'}
                stroke="white"
                strokeWidth={0.5}
              />
              <Path
                d="M 2 12 A 10 10 0 0 1 22 12 Z"
                fill={record.morning_present ? '#22c55e' : '#ef4444'}
                stroke="white"
                strokeWidth={0.5}
              />
            </Svg>
          );
        }
        if (state === 'present')
          return (
            <View
              style={{
                width: 18,
                height: 18,
                borderRadius: 9,
                backgroundColor: '#22c55e',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Check size={10} color="white" strokeWidth={3} />
            </View>
          );
        if (state === 'absent')
          return (
            <View
              style={{
                width: 18,
                height: 18,
                borderRadius: 9,
                backgroundColor: '#ef4444',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={10} color="white" strokeWidth={3} />
            </View>
          );
        if (state === 'holiday')
          return (
            <View
              style={{
                width: 18,
                height: 18,
                borderRadius: 9,
                backgroundColor: '#a855f7',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 9, fontWeight: 'bold', color: 'white' }}>H</Text>
            </View>
          );
        return null;
      };

      return (
        <TouchableOpacity
          key={dateKey}
          style={{ width: CELL_SIZE, height: CELL_SIZE + 4, padding: 1 }}
          onPress={() => isClickable && handleDayClick(date, state)}
          activeOpacity={isClickable ? 0.7 : 1}
          disabled={!isClickable}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: colors.bg,
              borderWidth: isTodayDate ? 2 : 1,
              borderColor: isTodayDate ? '#3b82f6' : colors.border,
              borderRadius: 6,
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 2,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '600', color: colors.text }}>{dayNum}</Text>
            <View style={{ minHeight: 20, justifyContent: 'center' }}>{renderIcon()}</View>
          </View>
        </TouchableOpacity>
      );
    },
    [
      attendanceByDate,
      holidaySet,
      workingDayPolicy,
      exceptionsMap,
      holidayDescriptions,
      handleDayClick,
    ]
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <View
        style={{
          backgroundColor: '#0d9488',
          paddingHorizontal: 16,
          paddingBottom: 16,
          paddingTop: 48,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12, padding: 4 }}>
            <ChevronLeft size={24} color="white" />
          </TouchableOpacity>
          <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', flex: 1 }}>
            Timesheet
          </Text>
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'rgba(255,255,255,0.15)',
            borderRadius: 10,
            paddingHorizontal: 4,
            paddingVertical: 2,
          }}
        >
          <TouchableOpacity onPress={handlePreviousMonth} style={{ padding: 8 }}>
            <ChevronLeft size={20} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setWeeks([]);
              setCurrentDate(new Date());
            }}
            style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 }}
          >
            <CalendarDays size={16} color="white" style={{ marginRight: 6 }} />
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
              {format(currentDate, 'MMMM yyyy')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleNextMonth}
            disabled={addMonths(currentDate, 1) > new Date()}
            style={{ padding: 8 }}
          >
            <ChevronRight
              size={20}
              color={addMonths(currentDate, 1) > new Date() ? 'rgba(255,255,255,0.4)' : 'white'}
            />
          </TouchableOpacity>
        </View>

        {/* Tab Switcher */}
        <View
          style={{
            flexDirection: 'row',
            marginTop: 12,
            backgroundColor: 'rgba(255,255,255,0.2)',
            borderRadius: 8,
            padding: 3,
          }}
        >
          <TouchableOpacity
            onPress={() => setActiveTab('calendar')}
            style={{
              flex: 1,
              paddingVertical: 8,
              borderRadius: 6,
              backgroundColor: activeTab === 'calendar' ? 'white' : 'transparent',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: activeTab === 'calendar' ? '#0d9488' : 'rgba(255,255,255,0.8)',
              }}
            >
              Calendar
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('weeks')}
            style={{
              flex: 1,
              paddingVertical: 8,
              borderRadius: 6,
              backgroundColor: activeTab === 'weeks' ? 'white' : 'transparent',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: activeTab === 'weeks' ? '#0d9488' : 'rgba(255,255,255,0.8)',
              }}
            >
              Submit Weekly
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 12, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {isLoading && (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 80 }}>
            <ActivityIndicator size="large" color="#0d9488" />
            <Text style={{ color: '#6b7280', marginTop: 12 }}>Loading timesheet...</Text>
          </View>
        )}
        {!isLoading && error && (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 80 }}>
            <Text style={{ color: '#dc2626', fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
              Failed to load data
            </Text>
            <TouchableOpacity
              onPress={handleRefresh}
              style={{
                backgroundColor: '#0d9488',
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: 'white', fontWeight: '600' }}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
        {!isLoading && !error && (
          <>
            {/* Summary Card */}
            <View
              style={{
                backgroundColor: 'white',
                borderRadius: 12,
                padding: 14,
                marginBottom: 12,
                shadowColor: '#000',
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
                Attendance Summary
              </Text>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginBottom: 8 }}>
                {attendancePercentage}% present
              </Text>
              <View
                style={{
                  height: 8,
                  backgroundColor: '#e5e7eb',
                  borderRadius: 4,
                  overflow: 'hidden',
                  flexDirection: 'row',
                }}
              >
                {report.present > 0 && (
                  <View style={{ flex: report.present, backgroundColor: '#22c55e' }} />
                )}
                {report.absent > 0 && (
                  <View style={{ flex: report.absent, backgroundColor: '#ef4444' }} />
                )}
                {report.leave > 0 && (
                  <View style={{ flex: report.leave, backgroundColor: '#f97316' }} />
                )}
                {report.holiday > 0 && (
                  <View style={{ flex: report.holiday, backgroundColor: '#a855f7' }} />
                )}
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10, gap: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 2,
                      backgroundColor: '#22c55e',
                      marginRight: 4,
                    }}
                  />
                  <Text style={{ fontSize: 11, color: '#6b7280' }}>Present {report.present}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 2,
                      backgroundColor: '#ef4444',
                      marginRight: 4,
                    }}
                  />
                  <Text style={{ fontSize: 11, color: '#6b7280' }}>Absent {report.absent}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 2,
                      backgroundColor: '#f97316',
                      marginRight: 4,
                    }}
                  />
                  <Text style={{ fontSize: 11, color: '#6b7280' }}>Leave {report.leave}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 2,
                      backgroundColor: '#a855f7',
                      marginRight: 4,
                    }}
                  />
                  <Text style={{ fontSize: 11, color: '#6b7280' }}>Holiday {report.holiday}</Text>
                </View>
              </View>
            </View>

            {activeTab === 'calendar' ? (
              /* Calendar View */
              <>
                <View
                  style={{
                    backgroundColor: '#f0fdf4',
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 12,
                    borderLeftWidth: 4,
                    borderLeftColor: '#22c55e',
                  }}
                >
                  <Text style={{ fontSize: 12, color: '#166534', fontWeight: '500' }}>
                    💡 Tap on a day to submit or edit your attendance. Submit weekly from the
                    "Submit Weekly" tab.
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: 'white',
                    borderRadius: 12,
                    padding: 8,
                    marginBottom: 12,
                    shadowColor: '#000',
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                    elevation: 3,
                  }}
                >
                  <View style={{ flexDirection: 'row', marginBottom: 4 }}>
                    {WEEKDAYS_SHORT.map((day, idx) => (
                      <View key={day + idx} style={{ width: CELL_SIZE, alignItems: 'center' }}>
                        <Text
                          style={{
                            fontSize: 10,
                            fontWeight: '600',
                            color: idx === 0 ? '#ef4444' : '#6b7280',
                          }}
                        >
                          {day}
                        </Text>
                      </View>
                    ))}
                  </View>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                    {leadingEmptyDays.map((_, i) => (
                      <View key={'e' + i} style={{ width: CELL_SIZE, height: CELL_SIZE + 4 }} />
                    ))}
                    {monthDays.map((d) => renderDayCell(d))}
                  </View>
                </View>
              </>
            ) : (
              /* Weekly Submit View */
              <>
                <View
                  style={{
                    backgroundColor: '#eff6ff',
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 12,
                    borderLeftWidth: 4,
                    borderLeftColor: '#3b82f6',
                  }}
                >
                  <Text style={{ fontSize: 12, color: '#1e40af', fontWeight: '500' }}>
                    💡 Tap on a week to view and submit your timesheet. Timesheets are submitted
                    weekly.
                  </Text>
                </View>
                <Text
                  style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 12 }}
                >
                  Weeks in {format(currentDate, 'MMMM yyyy')}
                </Text>
                {loadingWeeks && (
                  <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                    <ActivityIndicator size="small" color="#0d9488" />
                  </View>
                )}
                {monthWeeks.map((weekInfo) => (
                  <TimesheetWeekCard
                    key={weekInfo.id}
                    weekInfo={weekInfo}
                    week={weeks.find((w) => w.id === weekInfo.id)}
                    onExpandToggle={loadWeek}
                    onToggleAttendance={toggleAttendance}
                    onSubmit={submitWeek}
                    onReturnToDraft={handleReturnToDraft}
                    isSubmitting={submitMutation.isPending}
                    isReturningToDraft={returnToDraftMutation.isPending}
                  />
                ))}
              </>
            )}

            {/* Monthly Details */}
            <View
              style={{
                backgroundColor: 'white',
                borderRadius: 12,
                padding: 14,
                marginBottom: 12,
                shadowColor: '#000',
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 12 }}>
                Monthly Details
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', margin: -4 }}>
                {[
                  {
                    label: 'Working Days',
                    value: report.totalWorkingDays,
                    bg: '#f3f4f6',
                    text: '#1f2937',
                  },
                  { label: 'Present', value: report.present, bg: '#dcfce7', text: '#166534' },
                  { label: 'Absent', value: report.absent, bg: '#fee2e2', text: '#991b1b' },
                  { label: 'Half Days', value: report.halfDays, bg: '#fef3c7', text: '#92400e' },
                  { label: 'Leave', value: report.leave, bg: '#ffedd5', text: '#9a3412' },
                  { label: 'Holidays', value: report.holiday, bg: '#f3e8ff', text: '#7c3aed' },
                ].map((item) => (
                  <View key={item.label} style={{ width: '33.33%', padding: 4 }}>
                    <View
                      style={{
                        backgroundColor: item.bg,
                        borderRadius: 8,
                        padding: 10,
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 9, color: '#6b7280', marginBottom: 2 }}>
                        {item.label}
                      </Text>
                      <Text style={{ fontSize: 18, fontWeight: 'bold', color: item.text }}>
                        {item.value}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
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
