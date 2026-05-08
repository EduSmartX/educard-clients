import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isBefore,
  isSameDay,
  parseISO,
  startOfMonth,
  startOfWeek,
  endOfWeek,
  subMonths,
} from 'date-fns';
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  PlusCircle,
  X,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

import { PageHeader } from '@/components/common';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ROUTES } from '@/constants/app-config';
import { useAuth } from '@/hooks/use-auth';
import {
  getEmployeeAttendance,
  fetchOrganizationHolidays,
} from '@/features/attendance/api/attendance-api';
import { EmployeeInfoCard } from '@/features/attendance/components/employee-info-card';
import { SingleDayAttendanceDialog } from '@/features/attendance/components/single-day-attendance-dialog';

type AttendanceRecord = {
  public_id: string;
  date: string;
  morning_present: boolean;
  afternoon_present: boolean;
  approval_status: string;
  is_leave?: boolean;
  leave_public_id?: string | null;
  leave_type_name?: string | null;
  leave_status?: string | null;
  is_exception?: boolean;
  exception_type?: string | null;
  exception_reason?: string | null;
};

type LeaveRecord = {
  start_date: string;
  end_date: string;
  leave_name: string;
  status: 'approved' | 'pending' | 'rejected' | 'cancelled';
};

type DayState = 'present' | 'absent' | 'leave-approved' | 'leave-pending' | 'holiday' | 'none';

function toDateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

function getDayState(
  date: Date,
  attendanceByDate: Map<string, AttendanceRecord>,
  leaveByDate: Map<string, { status: LeaveRecord['status']; leave_name: string }>,
  holidaySet: Set<string>,
  workingDayPolicy: { sunday_off: boolean; saturday_off_pattern: string } | null,
  exceptions: Map<string, { type: string; reason: string }>
): DayState {
  const key = toDateKey(date);
  const leaveInfo = leaveByDate.get(key);
  const exception = exceptions.get(key);

  // Check for force working day exception (overrides holiday/weekend)
  if (exception?.type === 'force_working' || exception?.type === 'FORCE_WORKING') {
    const attendance = attendanceByDate.get(key);
    if (attendance) {
      return attendance.morning_present && attendance.afternoon_present ? 'present' : 'absent';
    }
    if (isBefore(date, new Date()) && !isSameDay(date, new Date())) {
      return 'absent';
    }
    return 'none';
  }

  // Check for force holiday exception
  if (exception?.type === 'force_holiday' || exception?.type === 'FORCE_HOLIDAY') {
    return 'holiday';
  }

  // Check official holidays
  if (holidaySet.has(key)) {
    return 'holiday';
  }

  // Check if it's a weekend based on working day policy
  if (workingDayPolicy) {
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday

    // Check Sunday
    if (dayOfWeek === 0 && workingDayPolicy.sunday_off) {
      return 'holiday';
    }

    // Check Saturday based on pattern
    if (dayOfWeek === 6) {
      const { saturday_off_pattern } = workingDayPolicy;
      if (saturday_off_pattern === 'ALL') {
        return 'holiday';
      } else if (
        saturday_off_pattern === 'SECOND_ONLY' ||
        saturday_off_pattern === 'SECOND_AND_FOURTH'
      ) {
        const weekOfMonth = Math.ceil(date.getDate() / 7);
        if (saturday_off_pattern === 'SECOND_ONLY' && weekOfMonth === 2) {
          return 'holiday';
        } else if (
          saturday_off_pattern === 'SECOND_AND_FOURTH' &&
          (weekOfMonth === 2 || weekOfMonth === 4)
        ) {
          return 'holiday';
        }
      }
    }
  }

  if (leaveInfo?.status === 'approved') {
    return 'leave-approved';
  }
  if (leaveInfo?.status === 'pending') {
    return 'leave-pending';
  }

  const attendance = attendanceByDate.get(key);
  if (attendance) {
    return attendance.morning_present && attendance.afternoon_present ? 'present' : 'absent';
  }

  if (isBefore(date, new Date()) && !isSameDay(date, new Date())) {
    return 'absent';
  }

  return 'none';
}

function stateStyles(state: DayState) {
  switch (state) {
    case 'present':
      return 'bg-green-50 border-green-200 text-green-800';
    case 'absent':
      return 'bg-red-50 border-red-200 text-red-800';
    case 'leave-approved':
      return 'bg-orange-50 border-orange-200 text-orange-800';
    case 'leave-pending':
      return 'bg-orange-50 border-orange-200 text-orange-800';
    case 'holiday':
      return 'bg-purple-50 border-purple-200 text-purple-800';
    default:
      return 'bg-white border-gray-200 text-gray-700';
  }
}

export function EmployeeTimesheetPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, organization } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Detect if we're on the employee route to use the correct submit path
  const isEmployeeRoute = location.pathname.startsWith('/employee');
  const submitTimesheetRoute = isEmployeeRoute
    ? ROUTES.EMPLOYEE.ATTENDANCE.SUBMIT
    : ROUTES.ATTENDANCE.TIMESHEET_SUBMIT;

  const monthStart = useMemo(() => startOfMonth(currentDate), [currentDate]);
  const monthEnd = useMemo(() => endOfMonth(currentDate), [currentDate]);

  // Calculate date range to include full weeks (Sunday to Saturday)
  const calendarStart = useMemo(() => startOfWeek(monthStart, { weekStartsOn: 0 }), [monthStart]);
  const calendarEnd = useMemo(() => endOfWeek(monthEnd, { weekStartsOn: 0 }), [monthEnd]);

  const fromDate = useMemo(() => format(calendarStart, 'yyyy-MM-dd'), [calendarStart]);
  const toDate = useMemo(() => format(calendarEnd, 'yyyy-MM-dd'), [calendarEnd]);

  const { data: attendanceData, isLoading: loadingAttendance } = useQuery({
    queryKey: ['timesheet', 'attendance', fromDate, toDate],
    queryFn: () => getEmployeeAttendance({ from_date: fromDate, to_date: toDate }),
  });

  const { data: holidaysData, isLoading: loadingHolidays } = useQuery({
    queryKey: ['timesheet', 'holidays', fromDate, toDate],
    queryFn: async () => {
      const response = await fetchOrganizationHolidays({
        from_date: fromDate,
        to_date: toDate,
      });

      return response?.holidays || [];
    },
  });

  const attendanceByDate = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    (attendanceData?.records || []).forEach((record: AttendanceRecord) => {
      map.set(record.date, record);
    });
    return map;
  }, [attendanceData]);

  const leaveByDate = useMemo(() => {
    const map = new Map<
      string,
      { status: 'approved' | 'pending' | 'rejected' | 'cancelled'; leave_name: string }
    >();

    // Use leave data from attendance records
    (attendanceData?.records || []).forEach((record: AttendanceRecord) => {
      if (record.is_leave && record.leave_type_name) {
        const status = (record.leave_status || 'approved') as
          | 'approved'
          | 'pending'
          | 'rejected'
          | 'cancelled';
        map.set(record.date, {
          status,
          leave_name: record.leave_type_name,
        });
      }
    });

    return map;
  }, [attendanceData]);

  const holidaySet = useMemo(() => {
    const set = new Set<string>();
    // From dedicated holiday calendar API
    (holidaysData || []).forEach((holiday: { start_date: string; end_date: string }) => {
      const start = parseISO(holiday.start_date);
      const end = parseISO(holiday.end_date);
      eachDayOfInterval({ start, end }).forEach((date: Date) => {
        set.add(toDateKey(date));
      });
    });
    // Also include official holidays from attendance API's holiday_descriptions
    // This catches holidays that may be missing from the holiday calendar API (e.g. pagination)
    const descriptions = attendanceData?.holiday_descriptions || {};
    Object.entries(descriptions).forEach(([dateKey, info]: [string, { type?: string }]) => {
      if (info?.type === 'official_holiday') {
        set.add(dateKey);
      }
    });
    return set;
  }, [holidaysData, attendanceData]);

  const exceptionsMap = useMemo(() => {
    const map = new Map<string, { type: string; reason: string }>();
    (attendanceData?.calendar_exceptions || []).forEach(
      (exception: { date: string; type: string; reason: string }) => {
        map.set(exception.date, { type: exception.type, reason: exception.reason });
      }
    );
    return map;
  }, [attendanceData]);

  const monthDays = useMemo(
    () => eachDayOfInterval({ start: monthStart, end: monthEnd }),
    [monthStart, monthEnd]
  );
  const leadingEmptyDays = useMemo(() => Array.from({ length: monthStart.getDay() }), [monthStart]);

  // Use stats from backend
  const report = useMemo(() => {
    const stats = attendanceData?.stats || {};
    return {
      submitted: attendanceData?.records?.length || 0,
      present: stats.total_present || 0,
      absent: stats.total_absent || 0,
      halfDays: stats.total_half_days || 0,
      leave: stats.total_leaves || 0,
      holiday: stats.total_holidays || 0,
      totalWorkingDays: stats.total_working_days || 0,
    };
  }, [attendanceData]);

  const loading = loadingAttendance || loadingHolidays;

  const handleDateClick = (date: Date, state: DayState) => {
    const dateKey = toDateKey(date);
    const attendanceRecord = attendanceByDate.get(dateKey);

    // Check if attendance is already submitted or approved - don't allow editing
    if (attendanceRecord) {
      const status = attendanceRecord.approval_status?.toLowerCase();

      if (status === 'approved') {
        toast.info('Cannot Edit Approved Attendance', {
          description: 'This date has already been approved and cannot be modified.',
        });
        return;
      }

      if (status === 'submitted' || status === 'pending') {
        toast.info('Cannot Edit Submitted Attendance', {
          description:
            'This date has been submitted for approval. Wait for approval or return to draft.',
        });
        return;
      }
    }

    // Only allow clicking on past dates and non-holiday dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const clickedDate = new Date(date);
    clickedDate.setHours(0, 0, 0, 0);

    // Don't allow clicking future dates or holidays/weekends
    if (clickedDate > today || state === 'holiday') {
      return;
    }

    setSelectedDate(date);
    setIsDialogOpen(true);
  };

  return (
    <div className="container mx-auto space-y-6 py-6">
      <PageHeader
        title="Timesheet"
        description="Submit your monthly employee attendance with leave and calendar context"
      />

      <Card className="border border-[#bfd591] shadow-sm" style={{ backgroundColor: '#C5D89D' }}>
        <CardContent className="grid grid-cols-1 gap-4 pt-6 lg:grid-cols-2">
          <EmployeeInfoCard
            user={user || {}}
            organization={organization || undefined}
            organizationRole={user?.role}
            employeeId={attendanceData?.employee_id || undefined}
            showProfileImage={true}
          />

          <Card className="border-0 bg-white shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-xl font-bold">
                  <CalendarDays className="h-6 w-6 text-blue-600" />
                  Monthly Report
                </CardTitle>
                <Badge variant="outline" className="text-sm">
                  {format(currentDate, 'MMMM yyyy')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="mb-1 text-sm text-gray-600">Attendance Summary</div>
                <div className="mb-2 text-base font-semibold">
                  {report.totalWorkingDays > 0
                    ? `${Math.round((report.present / report.totalWorkingDays) * 100)}% present`
                    : '0% present'}
                </div>
                <div className="flex h-2 overflow-hidden rounded-full bg-gray-200">
                  {report.present > 0 && (
                    <div
                      className="bg-green-500"
                      style={{ width: `${(report.present / report.totalWorkingDays) * 100}%` }}
                    />
                  )}
                  {report.absent > 0 && (
                    <div
                      className="bg-red-500"
                      style={{ width: `${(report.absent / report.totalWorkingDays) * 100}%` }}
                    />
                  )}
                  {report.leave > 0 && (
                    <div
                      className="bg-orange-500"
                      style={{ width: `${(report.leave / report.totalWorkingDays) * 100}%` }}
                    />
                  )}
                  {report.holiday > 0 && (
                    <div
                      className="bg-purple-500"
                      style={{ width: `${(report.holiday / report.totalWorkingDays) * 100}%` }}
                    />
                  )}
                </div>
                <div className="mt-2 flex items-center gap-4 text-xs text-gray-600">
                  <span className="flex items-center gap-1">
                    <span className="h-3 w-3 rounded-sm bg-green-500"></span>
                    Present {report.present}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-3 w-3 rounded-sm bg-red-500"></span>
                    Absent {report.absent}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-3 w-3 rounded-sm bg-orange-500"></span>
                    Leave {report.leave}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-3 w-3 rounded-sm bg-purple-500"></span>
                    Holiday {report.holiday}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Calendar Section - Takes 2/3 width */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentDate((d) => subMonths(d, 1))}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <div className="text-base font-semibold">
                  <span className="sm:hidden">{format(currentDate, 'MM-yyyy')}</span>
                  <span className="hidden sm:inline">{format(currentDate, 'MMMM yyyy')}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentDate((d) => addMonths(d, 1))}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentDate(new Date())}
                  className="hidden sm:inline-flex"
                >
                  Today
                </Button>
              </div>
              <Button
                size="sm"
                onClick={() => navigate(submitTimesheetRoute)}
                className="bg-indigo-600 font-semibold text-white shadow-lg transition-all duration-200 hover:bg-indigo-700 hover:shadow-xl"
              >
                <PlusCircle className="mr-1.5 h-4 w-4" />
                <span className="sm:hidden">Submit</span>
                <span className="hidden sm:inline">Submit Timesheet</span>
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-2">
            {loading ? (
              <div className="flex items-center justify-center py-10 text-gray-500">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading timesheet...
              </div>
            ) : (
              <>
                <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-semibold text-gray-500">
                  <div>S</div>
                  <div>M</div>
                  <div>T</div>
                  <div>W</div>
                  <div>T</div>
                  <div>F</div>
                  <div>S</div>
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {leadingEmptyDays.map((_, index) => (
                    <div
                      key={`empty-${index}`}
                      className="aspect-square rounded border border-transparent"
                    />
                  ))}

                  {monthDays.map((date) => {
                    const dateKey = toDateKey(date);
                    const state = getDayState(
                      date,
                      attendanceByDate,
                      leaveByDate,
                      holidaySet,
                      attendanceData?.working_day_policy || null,
                      exceptionsMap
                    );
                    const leaveInfo = leaveByDate.get(dateKey);
                    const holidayInfo = attendanceData?.holiday_descriptions?.[dateKey];

                    const renderIcon = () => {
                      const dateKey = toDateKey(date);
                      const record = attendanceByDate.get(dateKey);

                      // IMPORTANT: Check for leaves FIRST before rendering attendance
                      // Leave days have attendance records with is_leave=true but should show as leave icons
                      if (state === 'leave-approved' || state === 'leave-pending') {
                        const leaveName = leaveInfo?.leave_name || 'Leave';
                        const leaveStatus = state === 'leave-approved' ? 'Approved' : 'Pending';
                        const truncatedName =
                          leaveName.length > 12 ? `${leaveName.substring(0, 10)}..` : leaveName;

                        return (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex w-full cursor-help flex-col items-center gap-0.5">
                                <div
                                  className={`h-6 w-6 rounded-full ${state === 'leave-approved' ? 'bg-orange-500' : 'bg-yellow-500'} flex items-center justify-center shadow-sm`}
                                >
                                  <X className="h-4 w-4 stroke-[3] text-white" />
                                </div>
                                <span
                                  className={`text-[10px] ${state === 'leave-approved' ? 'text-orange-900' : 'text-yellow-900'} w-full px-0.5 text-center leading-tight font-extrabold break-words`}
                                >
                                  {truncatedName}
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="rounded-md bg-gray-900 px-3 py-2 text-white shadow-lg">
                              <div className="flex flex-col gap-1">
                                <p className="text-sm font-semibold">{leaveName}</p>
                                <p className="text-xs text-gray-300">Status: {leaveStatus}</p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        );
                      }

                      // Check if we have an attendance record with half-day data
                      if (
                        record &&
                        !record.is_leave &&
                        record.morning_present !== undefined &&
                        record.afternoon_present !== undefined
                      ) {
                        const morningPresent = record.morning_present;
                        const afternoonPresent = record.afternoon_present;

                        // Full day present
                        if (morningPresent && afternoonPresent) {
                          return (
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500">
                              <Check className="h-3 w-3 stroke-[2.5] text-white" />
                            </div>
                          );
                        }

                        // Full day absent
                        if (!morningPresent && !afternoonPresent) {
                          return (
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500">
                              <X className="h-3 w-3 stroke-[2.5] text-white" />
                            </div>
                          );
                        }

                        // Half day - split circle (2 parts: top and bottom)
                        return (
                          <div className="relative h-6 w-6">
                            <svg
                              viewBox="0 0 24 24"
                              className="h-full w-full"
                              style={{ transform: 'rotate(0deg)' }}
                            >
                              {/* Bottom half (afternoon) - draw first so it's behind */}
                              <path
                                d="M 2 12 A 10 10 0 0 0 22 12 Z"
                                fill={afternoonPresent ? '#22c55e' : '#ef4444'}
                                stroke="white"
                                strokeWidth="0.5"
                              />
                              {/* Top half (morning) */}
                              <path
                                d="M 2 12 A 10 10 0 0 1 22 12 Z"
                                fill={morningPresent ? '#22c55e' : '#ef4444'}
                                stroke="white"
                                strokeWidth="0.5"
                              />
                            </svg>
                          </div>
                        );
                      }

                      // Fallback to state-based rendering for non-attendance days
                      if (state === 'present') {
                        return (
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500">
                            <Check className="h-3 w-3 stroke-[2.5] text-white" />
                          </div>
                        );
                      }
                      if (state === 'absent') {
                        return (
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500">
                            <X className="h-3 w-3 stroke-[2.5] text-white" />
                          </div>
                        );
                      }
                      if (state === 'holiday') {
                        // Create a short label for display
                        let shortLabel = 'Holiday';
                        let fullDescription = 'Holiday';

                        if (holidayInfo) {
                          if (holidayInfo.type === 'weekend') {
                            shortLabel = 'Weekend';
                            fullDescription = holidayInfo.description || 'Weekend';
                          } else if (holidayInfo.type === 'official_holiday') {
                            // Use the holiday name, truncated if needed
                            shortLabel =
                              holidayInfo.name.length > 12
                                ? `${holidayInfo.name.substring(0, 10)}..`
                                : holidayInfo.name;
                            fullDescription = holidayInfo.description || holidayInfo.name;
                          } else if (holidayInfo.type === 'force_holiday') {
                            shortLabel = 'Special';
                            fullDescription = holidayInfo.description || 'Special Holiday';
                          }
                        }

                        return (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex w-full cursor-help flex-col items-center gap-0.5">
                                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-500 text-[10px] font-bold text-white">
                                  H
                                </div>
                                <span className="w-full px-0.5 text-center text-[7px] leading-tight font-semibold break-words text-purple-700">
                                  {shortLabel}
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="rounded-md bg-gray-900 px-3 py-2 text-white shadow-lg">
                              <p className="text-sm font-semibold">{fullDescription}</p>
                            </TooltipContent>
                          </Tooltip>
                        );
                      }
                      return null;
                    };

                    const attendanceRecord = attendanceByDate.get(dateKey);
                    const approvalStatus = attendanceRecord?.approval_status?.toLowerCase();
                    const isSubmittedOrApproved =
                      approvalStatus === 'approved' ||
                      approvalStatus === 'submitted' ||
                      approvalStatus === 'pending';

                    const isClickable = (() => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const checkDate = new Date(date);
                      checkDate.setHours(0, 0, 0, 0);
                      // Don't allow clicking if: future date, holiday, or already submitted/approved
                      return checkDate <= today && state !== 'holiday' && !isSubmittedOrApproved;
                    })();

                    const dayContent = (
                      <button
                        type="button"
                        key={dateKey}
                        onClick={() => isClickable && handleDateClick(date, state)}
                        disabled={!isClickable}
                        className={`flex aspect-square flex-col items-center justify-between rounded border p-1 transition ${stateStyles(state)} ${
                          isClickable
                            ? 'cursor-pointer hover:border-blue-400 hover:ring-2 hover:ring-blue-400'
                            : 'cursor-default'
                        }`}
                      >
                        {/* Desktop view: month label + day number + icon */}
                        <div className="hidden w-full text-center sm:block">
                          <div className="text-[7px] font-medium text-gray-500">
                            {format(date, 'MMM')}
                          </div>
                          <div className="text-xs font-bold">{format(date, 'd')}</div>
                        </div>
                        <div className="hidden w-full flex-1 flex-col items-center justify-center sm:flex">
                          {renderIcon()}
                        </div>

                        {/* Mobile view: day number inside color-coded circle */}
                        <div className="flex h-full w-full items-center justify-center sm:hidden">
                          {(() => {
                            const mobileState = state;
                            const bgColor =
                              mobileState === 'present'
                                ? 'bg-green-500 text-white'
                                : mobileState === 'absent'
                                  ? 'bg-red-500 text-white'
                                  : mobileState === 'leave-approved'
                                    ? 'bg-orange-500 text-white'
                                    : mobileState === 'leave-pending'
                                      ? 'bg-yellow-500 text-white'
                                      : mobileState === 'holiday'
                                        ? 'bg-purple-500 text-white'
                                        : 'bg-gray-100 text-gray-700';

                            if (mobileState === 'holiday') {
                              return (
                                <div
                                  className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold ${bgColor}`}
                                >
                                  H
                                </div>
                              );
                            }

                            // For half-day: show split circle with day number overlay
                            const record = attendanceByDate.get(dateKey);
                            if (
                              record &&
                              !record.is_leave &&
                              record.morning_present !== undefined &&
                              record.afternoon_present !== undefined &&
                              record.morning_present !== record.afternoon_present
                            ) {
                              return (
                                <div className="relative flex h-7 w-7 items-center justify-center">
                                  <svg
                                    viewBox="0 0 28 28"
                                    className="absolute inset-0 h-full w-full"
                                  >
                                    <path
                                      d="M 0 14 A 14 14 0 0 1 28 14 Z"
                                      fill={record.morning_present ? '#22c55e' : '#ef4444'}
                                    />
                                    <path
                                      d="M 0 14 A 14 14 0 0 0 28 14 Z"
                                      fill={record.afternoon_present ? '#22c55e' : '#ef4444'}
                                    />
                                  </svg>
                                  <span className="relative text-[10px] font-bold text-white">
                                    {format(date, 'd')}
                                  </span>
                                </div>
                              );
                            }

                            return (
                              <div
                                className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold ${bgColor}`}
                              >
                                {format(date, 'd')}
                              </div>
                            );
                          })()}
                        </div>
                      </button>
                    );

                    // Wrap holiday days with tooltip
                    if (state === 'holiday' && holidayInfo) {
                      return (
                        <TooltipProvider key={dateKey}>
                          <Tooltip>
                            <TooltipTrigger asChild>{dayContent}</TooltipTrigger>
                            <TooltipContent>
                              <div className="text-sm">
                                <p className="font-semibold">{holidayInfo.name}</p>
                                <p className="text-xs text-gray-600">{holidayInfo.description}</p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      );
                    }

                    return dayContent;
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Insights Panel - Takes 1/3 width */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Attendance Rate</span>
                  <span className="font-bold text-green-700">
                    {report.totalWorkingDays > 0
                      ? `${Math.round((report.present / report.totalWorkingDays) * 100)}%`
                      : '0%'}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full bg-green-500 transition-all"
                    style={{
                      width: `${report.totalWorkingDays > 0 ? (report.present / report.totalWorkingDays) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                  <div className="mb-1 flex items-center gap-2">
                    <div className="flex h-4 w-4 items-center justify-center rounded-full bg-green-500">
                      <Check className="h-2.5 w-2.5 text-white" />
                    </div>
                    <span className="text-[10px] font-medium text-green-700">Present</span>
                  </div>
                  <div className="text-xl font-bold text-green-900">{report.present}</div>
                </div>

                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <div className="mb-1 flex items-center gap-2">
                    <div className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500">
                      <X className="h-2.5 w-2.5 text-white" />
                    </div>
                    <span className="text-[10px] font-medium text-red-700">Absent</span>
                  </div>
                  <div className="text-xl font-bold text-red-900">{report.absent}</div>
                </div>

                {report.halfDays > 0 && (
                  <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                    <div className="mb-1 flex items-center gap-2">
                      <div className="relative h-4 w-4">
                        <svg viewBox="0 0 16 16" className="h-full w-full">
                          {/* Top half - green */}
                          <path
                            d="M 0 8 A 8 8 0 0 1 16 8 Z"
                            fill="#22c55e"
                            stroke="white"
                            strokeWidth="0.5"
                          />
                          {/* Bottom half - red */}
                          <path
                            d="M 0 8 A 8 8 0 0 0 16 8 Z"
                            fill="#ef4444"
                            stroke="white"
                            strokeWidth="0.5"
                          />
                        </svg>
                      </div>
                      <span className="text-[10px] font-medium text-yellow-700">Half Days</span>
                    </div>
                    <div className="text-xl font-bold text-yellow-900">{report.halfDays}</div>
                  </div>
                )}

                <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
                  <div className="mb-1 flex items-center gap-2">
                    <div className="flex h-4 w-4 items-center justify-center rounded-full bg-orange-500">
                      <X className="h-2.5 w-2.5 text-white" />
                    </div>
                    <span className="text-[10px] font-medium text-orange-700">Leaves</span>
                  </div>
                  <div className="text-xl font-bold text-orange-900">{report.leave}</div>
                </div>

                <div className="rounded-lg border border-purple-200 bg-purple-50 p-3">
                  <div className="mb-1 flex items-center gap-2">
                    <div className="flex h-4 w-4 items-center justify-center rounded-full bg-purple-500">
                      <X className="h-2.5 w-2.5 text-white" />
                    </div>
                    <span className="text-[10px] font-medium text-purple-700">Holidays</span>
                  </div>
                  <div className="text-xl font-bold text-purple-900">{report.holiday}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Legend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-green-500">
                  <Check className="h-2.5 w-2.5 text-white" />
                </div>
                <span className="text-gray-700">Present</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500">
                  <X className="h-2.5 w-2.5 text-white" />
                </div>
                <span className="text-gray-700">Absent</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-orange-500">
                  <X className="h-2.5 w-2.5 text-white" />
                </div>
                <span className="text-gray-700">Leave (Approved)</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-orange-500">
                  <X className="h-2.5 w-2.5 text-white" />
                </div>
                <span className="text-gray-700">Leave (Pending)</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="h-4 w-4 rounded border border-purple-300 bg-purple-100"></div>
                <span className="text-gray-700">Holiday</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Single Day Attendance Dialog */}
      {selectedDate && (
        <SingleDayAttendanceDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          date={selectedDate}
          workingDayPolicy={attendanceData?.working_day_policy || null}
          holidaySet={holidaySet}
          exceptionsMap={exceptionsMap}
          attendanceByDate={attendanceByDate}
        />
      )}
    </div>
  );
}
