import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import {
  ArrowLeft,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  FileText,
  Loader2,
  PlusCircle,
  RotateCcw,
  Trash2,
  XCircle,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

import { PageHeader, WarningConfirmationDialog } from '@/components/common';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ROUTES } from '@/constants/app-config';
import { TimesheetStatus } from '@/constants';
import { TimesheetStatusBadge } from '@/features/attendance/components';
import { useSubmitTimesheet, useReturnTimesheetToDraft } from '@/features/attendance/hooks';
import {
  getEmployeeAttendance,
  checkTimesheetStatus,
} from '@/features/attendance/api/attendance-api';
import { isSaturdayWorking as isSaturdayWorkingDay } from '@/features/attendance/utils';
import { fetchMyLeaveRequests } from '@/features/leave/api/leave-api';
import type { LeaveRequest } from '@/features/leave/types';
import { LeaveRequestDialog } from '@/features/attendance/components/leave-request-dialog';

type WeekRow = {
  date: string;
  morning_present: boolean;
  afternoon_present: boolean;
  remarks: string;
  locked_reason?:
    | 'holiday'
    | 'leave'
    | 'non_working_day'
    | 'exception_holiday'
    | 'exception_working';
  holiday_description?: string;
  is_working_day: boolean;
  leave_type_name?: string | null;
  leave_status?: string | null;
  exception_type?: string | null;
  exception_reason?: string | null;
};

function determineLockReason(
  isHoliday: boolean,
  isForceWorking: boolean,
  isLeave: boolean,
  exception: { type: string; reason: string } | undefined,
  workingDay: boolean
): { reason: WeekRow['locked_reason']; description?: string } {
  if (isHoliday && !isForceWorking) {
    return { reason: 'holiday' };
  }
  if (isLeave) {
    return { reason: 'leave' };
  }
  if (exception) {
    if (exception.type === 'force_holiday' || exception.type === 'FORCE_HOLIDAY') {
      return { reason: 'exception_holiday', description: `Exception: ${exception.reason}` };
    }
    if (exception.type === 'force_working' || exception.type === 'FORCE_WORKING') {
      return { reason: 'exception_working' };
    }
  }
  if (!workingDay) {
    return { reason: 'non_working_day', description: 'Non-working day' };
  }
  return { reason: undefined };
}

function updateWeekRow(
  weeks: WeekBlock[],
  weekId: string,
  date: string,
  field: 'morning_present' | 'afternoon_present',
  value: boolean
): WeekBlock[] {
  return weeks.map((week) => {
    if (week.id !== weekId) {
      return week;
    }
    const updatedRows = week.rows.map((row) =>
      row.date === date ? { ...row, [field]: value } : row
    );
    return { ...week, rows: updatedRows };
  });
}

function getSessionButtonClass(isPresent: boolean, disabled?: boolean): string {
  if (isPresent) {
    const hoverClass = disabled ? 'cursor-not-allowed opacity-75' : 'hover:bg-green-700';
    return `border-green-600 bg-green-600 text-white shadow-sm ${hoverClass}`;
  }
  const hoverClass = disabled
    ? 'cursor-not-allowed opacity-75'
    : 'hover:border-red-500 hover:bg-red-100';
  return `border-2 border-red-400 bg-red-50 text-red-700 ${hoverClass}`;
}

// Improved attendance indicator with side-by-side morning and afternoon buttons
const AttendanceIndicator = ({
  morningPresent,
  afternoonPresent,
  disabled,
  onMorningClick,
  onAfternoonClick,
}: Readonly<{
  morningPresent: boolean;
  afternoonPresent: boolean;
  disabled?: boolean;
  onMorningClick?: () => void;
  onAfternoonClick?: () => void;
}>) => {
  return (
    <div className="flex justify-center gap-1.5 sm:gap-2">
      {/* Morning Session */}
      <Button
        variant={morningPresent ? 'default' : 'outline'}
        size="sm"
        className={`h-8 min-w-[60px] px-2 sm:h-10 sm:min-w-[120px] sm:px-6 ${getSessionButtonClass(morningPresent, disabled)}`}
        onClick={disabled ? undefined : onMorningClick}
        disabled={disabled}
      >
        <span className="text-xs font-semibold sm:text-sm">
          <span className="sm:hidden">AM</span>
          <span className="hidden sm:inline">Morning</span>
        </span>
      </Button>

      {/* Afternoon Session */}
      <Button
        variant={afternoonPresent ? 'default' : 'outline'}
        size="sm"
        className={`h-8 min-w-[60px] px-2 sm:h-10 sm:min-w-[120px] sm:px-6 ${getSessionButtonClass(afternoonPresent, disabled)}`}
        onClick={disabled ? undefined : onAfternoonClick}
        disabled={disabled}
      >
        <span className="text-xs font-semibold sm:text-sm">
          <span className="sm:hidden">PM</span>
          <span className="hidden sm:inline">Afternoon</span>
        </span>
      </Button>
    </div>
  );
};

type WeekBlock = {
  id: string;
  start: string;
  end: string;
  rows: WeekRow[];
  collapsed: boolean;
  submissionStatus?: keyof typeof TimesheetStatus | null;
  submissionStatusLabel?: string | null;
  reviewComments?: string | null; // Added to show rejection reason
};

function getSubmitButtonColor(status: WeekBlock['submissionStatus']): string {
  if (status === TimesheetStatus.SUBMITTED || status === TimesheetStatus.APPROVED) {
    return 'cursor-not-allowed bg-gray-400';
  }
  if (status === TimesheetStatus.RETURNED) {
    return 'bg-orange-600 text-white hover:bg-orange-700';
  }
  if (status === TimesheetStatus.REJECTED) {
    return 'bg-red-600 text-white hover:bg-red-700';
  }
  return 'bg-blue-600 text-white hover:bg-blue-700';
}

function SubmitButtonContent({
  isPending,
  status,
}: Readonly<{
  isPending: boolean;
  status: WeekBlock['submissionStatus'];
}>) {
  if (isPending) {
    return <Loader2 className="h-4 w-4 animate-spin" />;
  }
  if (status === TimesheetStatus.SUBMITTED) {
    return (
      <>
        <Check className="h-4 w-4 sm:mr-1.5" />
        <span className="hidden sm:inline">Submitted</span>
      </>
    );
  }
  if (status === TimesheetStatus.APPROVED) {
    return (
      <>
        <Check className="h-4 w-4 sm:mr-1.5" />
        <span className="hidden sm:inline">Approved</span>
      </>
    );
  }
  if (status === TimesheetStatus.RETURNED || status === TimesheetStatus.REJECTED) {
    return (
      <>
        <RotateCcw className="h-4 w-4 sm:mr-1.5" />
        <span className="hidden sm:inline">Resubmit</span>
      </>
    );
  }
  return (
    <>
      <FileText className="h-4 w-4 sm:mr-1.5" />
      <span className="hidden sm:inline">Submit</span>
    </>
  );
}

export function EmployeeTimesheetSubmitPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [weeks, setWeeks] = useState<WeekBlock[]>([]);
  const [addingWeek, setAddingWeek] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [selectedDateForLeave, setSelectedDateForLeave] = useState<Date | null>(null);
  const [weekPendingReturnToDraft, setWeekPendingReturnToDraft] = useState<WeekBlock | null>(null);

  // Detect if we're on the employee route to use the correct paths
  const isEmployeeRoute = location.pathname.startsWith('/employee');
  const timesheetRoute = isEmployeeRoute
    ? ROUTES.EMPLOYEE.ATTENDANCE.TIMESHEET
    : ROUTES.ATTENDANCE.TIMESHEET;

  // Fetch current month attendance to get submission config
  const currentMonthStart = useMemo(() => startOfMonth(new Date()), []);
  const currentMonthEnd = useMemo(() => endOfMonth(new Date()), []);
  const fromDate = useMemo(() => format(currentMonthStart, 'yyyy-MM-dd'), [currentMonthStart]);
  const toDate = useMemo(() => format(currentMonthEnd, 'yyyy-MM-dd'), [currentMonthEnd]);

  const { data: attendanceData } = useQuery({
    queryKey: ['timesheet', 'attendance', fromDate, toDate],
    queryFn: () => getEmployeeAttendance({ from_date: fromDate, to_date: toDate }),
  });

  const defaultPresent = attendanceData?.submission_config?.default_present ?? true;

  // Submit timesheet mutation - extracted to custom hook with enhanced error handling
  const submitMutation = useSubmitTimesheet({
    onSuccessCallback: () => {
      // Redirect to timesheet page after successful submission
      setTimeout(() => {
        navigate(timesheetRoute);
      }, 1000);
    },
  });

  // Return to draft mutation
  const returnToDraftMutation = useReturnTimesheetToDraft(() => {
    toast.success('Timesheet returned to draft. You can now edit and resubmit.');
    queryClient.invalidateQueries({ queryKey: ['timesheet'] });
    queryClient.invalidateQueries({ queryKey: ['attendance'] });
  });

  const addWeek = async () => {
    if (!selectedDate) {
      toast.error('Please select a date to add its week.');
      return;
    }

    // Week starts on Sunday (0) and ends on Saturday (6)
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 0 });
    const weekId = format(weekStart, 'yyyy-MM-dd');

    if (weeks.some((week) => week.id === weekId)) {
      toast.error('This week is already added.');
      return;
    }

    setAddingWeek(true);
    try {
      const fromDate = format(weekStart, 'yyyy-MM-dd');
      const toDate = format(weekEnd, 'yyyy-MM-dd');

      const [leaveResponse, attendanceResponse, submissionStatus] = await Promise.all([
        fetchMyLeaveRequests({
          start_date__lte: toDate,
          end_date__gte: fromDate,
          status__in: 'approved,pending',
          page_size: 100,
        }),
        getEmployeeAttendance({ from_date: fromDate, to_date: toDate }),
        checkTimesheetStatus({
          week_start_date: fromDate,
          week_end_date: toDate,
        }).catch(() => ({ submission: null })),
      ]);

      const leaveByDate = new Map<string, { leave_name: string; status: string }>();
      (leaveResponse?.data || []).forEach((leave: LeaveRequest) => {
        const start = new Date(`${leave.start_date}T00:00:00`);
        const end = new Date(`${leave.end_date}T00:00:00`);
        eachDayOfInterval({ start, end }).forEach((day) => {
          leaveByDate.set(format(day, 'yyyy-MM-dd'), {
            leave_name: leave.leave_type_name || leave.leave_name || 'Leave',
            status: leave.status,
          });
        });
      });

      const holidayDescriptions = attendanceResponse?.holiday_descriptions || {};
      const workingDayPolicy = attendanceResponse?.working_day_policy || null;
      const calendarExceptions = attendanceResponse?.calendar_exceptions || [];

      const exceptionByDate = new Map<string, { type: string; reason: string }>();
      calendarExceptions.forEach((exception: { date: string; type: string; reason: string }) => {
        exceptionByDate.set(exception.date, { type: exception.type, reason: exception.reason });
      });

      const isWorkingDay = (day: Date): boolean => {
        const dayKey = format(day, 'yyyy-MM-dd');
        const exception = exceptionByDate.get(dayKey);
        const holidayInfo = holidayDescriptions[dayKey];

        if (exception) {
          return exception.type === 'force_working' || exception.type === 'FORCE_WORKING';
        }

        if (holidayInfo?.type === 'official_holiday' || holidayInfo?.type === 'holiday') {
          return false;
        }

        const dayOfWeek = getDay(day);

        if (!workingDayPolicy) {
          return dayOfWeek >= 1 && dayOfWeek <= 5;
        }

        if (dayOfWeek === 0) {
          return !workingDayPolicy.sunday_off;
        }

        if (dayOfWeek === 6) {
          return isSaturdayWorkingDay(day, workingDayPolicy.saturday_off_pattern);
        }

        return true;
      };

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const submittedAttendanceMap = new Map<
        string,
        { morning_present: boolean; afternoon_present: boolean; remarks: string }
      >();
      (attendanceResponse?.records || []).forEach(
        (record: {
          date: string;
          morning_present: boolean;
          afternoon_present: boolean;
          remarks?: string;
        }) => {
          submittedAttendanceMap.set(record.date, {
            morning_present: record.morning_present,
            afternoon_present: record.afternoon_present,
            remarks: record.remarks || '',
          });
        }
      );

      const rows: WeekRow[] = eachDayOfInterval({ start: weekStart, end: weekEnd })
        .filter((day) => {
          return day <= today;
        })
        .map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const holidayInfo = holidayDescriptions[key];
          const isHoliday =
            holidayInfo?.type === 'official_holiday' ||
            holidayInfo?.type === 'holiday' ||
            holidayInfo?.type === 'weekend';
          const isForceWorking = holidayInfo?.type === 'force_working';
          const leaveInfo = leaveByDate.get(key);
          const isLeave = !!leaveInfo;
          const exception = exceptionByDate.get(key);
          const workingDay = isWorkingDay(day);

          let lockedReason: WeekRow['locked_reason'] = undefined;
          let description = holidayInfo?.name || holidayInfo?.description;

          const lockResult = determineLockReason(
            isHoliday,
            isForceWorking,
            isLeave,
            exception,
            workingDay
          );
          lockedReason = lockResult.reason;
          if (lockResult.description) {
            description = lockResult.description;
          }

          const isLocked = !!lockedReason && lockedReason !== 'exception_working';

          const submittedData = submittedAttendanceMap.get(key);

          const resolvePresence = (submitted: boolean | undefined): boolean => {
            if (submittedData && submitted !== undefined) {
              return submitted;
            }
            if (isLocked) {
              return false;
            }
            return defaultPresent;
          };

          return {
            date: key,
            morning_present: resolvePresence(submittedData?.morning_present),
            afternoon_present: resolvePresence(submittedData?.afternoon_present),
            remarks: submittedData ? submittedData.remarks : '',
            locked_reason: lockedReason,
            holiday_description: description,
            is_working_day: workingDay,
            leave_type_name: leaveInfo?.leave_name,
            leave_status: leaveInfo?.status,
            exception_type: exception?.type,
            exception_reason: exception?.reason,
          };
        });

      const submission = submissionStatus?.submission;

      setWeeks((prev) => [
        ...prev,
        {
          id: weekId,
          start: fromDate,
          end: toDate,
          rows,
          collapsed: false,
          submissionStatus: submission?.submission_status || null,
          submissionStatusLabel: submission?.status_display || null,
          reviewComments: submission?.review_comments || null, // Include rejection reason
        },
      ]);
    } catch {
      toast.error('Unable to load leave/holiday data for selected week.');
    } finally {
      setAddingWeek(false);
    }
  };

  const updateRow = (
    weekId: string,
    date: string,
    field: 'morning_present' | 'afternoon_present',
    value: boolean
  ) => {
    setWeeks((prev) => updateWeekRow(prev, weekId, date, field, value));
  };

  const editableRowsByWeek = (week: WeekBlock) => week.rows.filter((row) => !row.locked_reason);

  const submitWeek = async (week: WeekBlock) => {
    const rows = editableRowsByWeek(week);
    if (!rows.length) {
      toast.error('No editable attendance records found in this week.');
      return;
    }

    try {
      // Submit attendance records with timesheet submission in single transaction
      await submitMutation.mutateAsync({
        records: rows.map((row) => ({
          date: row.date,
          morning_present: row.morning_present,
          afternoon_present: row.afternoon_present,
          remarks: row.remarks,
        })),
        week_start_date: week.start,
        week_end_date: week.end,
      });
    } catch {
      // Error already handled by mutation
    }
  };

  const toggleWeekCollapse = (weekId: string) => {
    setWeeks((prev) =>
      prev.map((week) => (week.id === weekId ? { ...week, collapsed: !week.collapsed } : week))
    );
  };

  const removeWeek = (weekId: string) => {
    setWeeks((prev) => prev.filter((week) => week.id !== weekId));
    toast.success('Week removed successfully.');
  };

  const returnToDraft = async (week: WeekBlock) => {
    setWeekPendingReturnToDraft(week);
  };

  const confirmReturnToDraft = async () => {
    if (!weekPendingReturnToDraft) {
      return;
    }

    try {
      await returnToDraftMutation.mutateAsync({
        week_start_date: weekPendingReturnToDraft.start,
        week_end_date: weekPendingReturnToDraft.end,
      });

      // Remove week from view after successful return to draft
      removeWeek(weekPendingReturnToDraft.id);
    } catch {
      // Error already handled by mutation
    } finally {
      setWeekPendingReturnToDraft(null);
    }
  };

  const handleRequestLeave = (date: string) => {
    setSelectedDateForLeave(parseISO(date));
    setLeaveDialogOpen(true);
  };

  const handleLeaveSuccess = () => {
    // Reload weeks after leave request is successful
    toast.info('Please reload weeks to see updated leave information');
  };

  const renderRowAction = (row: WeekBlock['rows'][number]) => {
    if (row.locked_reason === 'leave' && row.leave_type_name && row.leave_status) {
      return (
        <div className="flex flex-col items-center gap-1">
          <Badge
            variant="outline"
            className={`font-medium ${
              row.leave_status === 'approved'
                ? 'border-green-300 bg-green-100 text-green-700'
                : 'border-orange-300 bg-orange-100 text-orange-700'
            }`}
          >
            {row.leave_type_name}
          </Badge>
          <Badge
            variant="outline"
            className={`text-xs font-medium ${
              row.leave_status === 'approved'
                ? 'border-green-200 bg-green-50 text-green-600'
                : 'border-orange-200 bg-orange-50 text-orange-600'
            }`}
          >
            {row.leave_status.charAt(0).toUpperCase() + row.leave_status.slice(1)}
          </Badge>
        </div>
      );
    }
    if (row.locked_reason === 'exception_working' && row.exception_reason) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className="cursor-help border-green-300 bg-green-100 font-medium text-green-700"
            >
              <Calendar className="mr-1 h-3 w-3" />
              Exceptional Day
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-semibold">{row.exception_type}</p>
            <p>{row.exception_reason}</p>
          </TooltipContent>
        </Tooltip>
      );
    }
    if (!row.locked_reason || row.locked_reason === 'exception_working') {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRequestLeave(row.date)}
              className="border-blue-400 bg-blue-50 font-medium text-blue-700 hover:bg-blue-100 hover:text-blue-800"
            >
              <Calendar className="mr-1.5 h-4 w-4" />
              <span className="text-sm">Apply Leave</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Apply for leave on this date</p>
          </TooltipContent>
        </Tooltip>
      );
    }
    return <span className="text-sm text-gray-400">—</span>;
  };

  return (
    <TooltipProvider>
      <div className="container mx-auto space-y-4 px-2 py-3 sm:space-y-6 sm:px-4 sm:py-6">
        <PageHeader
          title="Submit New Attendance"
          actions={[
            {
              label: 'Back to Timesheet',
              variant: 'outline',
              icon: ArrowLeft,
              onClick: () => navigate(timesheetRoute),
            },
          ]}
        />

        <Card className="border-2 border-slate-200">
          <CardHeader className="bg-slate-50 px-4 py-3 sm:px-6 sm:py-4">
            <CardTitle className="text-base font-semibold sm:text-lg">Select Week</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 px-4 pt-4 sm:gap-4 sm:px-6 sm:pt-6 md:flex-row md:items-center">
            <div className="w-full md:max-w-xs">
              <DatePicker
                value={selectedDate}
                onChange={setSelectedDate}
                maxDate={new Date()}
                minDate={new Date('2020-01-01')}
                placeholder="Select any day in week"
              />
            </div>
            <Button
              onClick={addWeek}
              disabled={addingWeek}
              size="sm"
              className="sm:size-default bg-green-600 hover:bg-green-700"
            >
              {addingWeek ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <PlusCircle className="mr-1.5 h-4 w-4" />
              )}
              Add Week
            </Button>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <div className="text-muted-foreground rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm">
                <span className="font-medium text-blue-700">Default:</span>{' '}
                {defaultPresent ? '✓ Present' : '✗ Absent'}
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-700 sm:px-4 sm:py-2 sm:text-sm">
                <span className="font-medium">Note:</span> Only dates up to today are shown
              </div>
            </div>
          </CardContent>
        </Card>

        {weeks.map((week) => (
          <Card key={week.id} className="border-2">
            <CardHeader className="flex-row items-center justify-between gap-2 bg-slate-50 px-3 py-2 sm:px-6 sm:py-4">
              <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleWeekCollapse(week.id)}
                  className="h-7 w-7 flex-shrink-0 p-0 sm:h-8 sm:w-8"
                >
                  {week.collapsed ? (
                    <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5" />
                  ) : (
                    <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5" />
                  )}
                </Button>
                <div className="min-w-0">
                  <CardTitle className="text-sm font-semibold sm:text-base">
                    <span className="hidden sm:inline">Week: </span>
                    {format(parseISO(week.start), 'dd MMM yyyy')} -{' '}
                    {format(parseISO(week.end), 'dd MMM yyyy')}
                    <span className="ml-2 text-xs font-normal text-gray-600 sm:ml-3 sm:text-sm">
                      ({week.rows.length}d)
                    </span>
                  </CardTitle>
                  {week.submissionStatus && week.submissionStatusLabel && (
                    <TimesheetStatusBadge status={week.submissionStatus} className="mt-1" />
                  )}
                </div>
                {/* Show rejection reason prominently */}
                {week.submissionStatus === TimesheetStatus.REJECTED && week.reviewComments && (
                  <div className="mt-3 hidden rounded-lg border border-red-200 bg-red-50 p-3 sm:block">
                    <p className="mb-1 flex items-center text-sm font-semibold text-red-800">
                      <XCircle className="mr-2 h-4 w-4" />
                      Rejection Reason:
                    </p>
                    <p className="text-sm text-red-700">{week.reviewComments}</p>
                    <p className="mt-2 text-xs text-red-600 italic">
                      Please review the reason, make necessary changes, and resubmit your timesheet.
                    </p>
                  </div>
                )}
              </div>
              <div className="flex flex-shrink-0 items-center gap-1.5 sm:gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeWeek(week.id)}
                      className="h-8 w-8 border-red-300 p-0 text-red-600 hover:bg-red-50 hover:text-red-700 sm:h-9 sm:w-auto sm:px-3"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Remove week</TooltipContent>
                </Tooltip>
                {week.submissionStatus === TimesheetStatus.SUBMITTED && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => returnToDraft(week)}
                        className="h-8 border-orange-300 px-2 font-semibold text-orange-600 hover:bg-orange-50 hover:text-orange-700 sm:h-9 sm:px-3"
                      >
                        <RotateCcw className="h-4 w-4 sm:mr-1.5" />
                        <span className="hidden sm:inline">Return to Draft</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Return to Draft</TooltipContent>
                  </Tooltip>
                )}
                <Button
                  size="sm"
                  onClick={() => submitWeek(week)}
                  disabled={
                    submitMutation.isPending ||
                    editableRowsByWeek(week).length === 0 ||
                    week.submissionStatus === TimesheetStatus.SUBMITTED ||
                    week.submissionStatus === TimesheetStatus.APPROVED
                  }
                  className={`h-8 px-2 text-xs font-semibold sm:h-9 sm:px-4 sm:text-sm ${getSubmitButtonColor(week.submissionStatus)}`}
                >
                  <SubmitButtonContent
                    isPending={submitMutation.isPending}
                    status={week.submissionStatus}
                  />
                </Button>
              </div>
            </CardHeader>
            {!week.collapsed && (
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-100">
                      <TableHead className="text-xs font-semibold sm:text-sm">Date</TableHead>
                      <TableHead className="text-center text-xs font-semibold sm:text-sm">
                        Attendance
                      </TableHead>
                      <TableHead className="hidden text-center text-xs font-semibold sm:table-cell sm:text-sm">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {week.rows.map((row) => {
                      const rowBgClass = row.locked_reason ? 'bg-gray-50' : '';

                      return (
                        <TableRow key={row.date} className={rowBgClass}>
                          <TableCell className="px-2 py-2 sm:px-4 sm:py-4">
                            <div className="flex flex-col gap-0.5 sm:gap-1">
                              <span className="text-xs font-semibold sm:text-base">
                                {format(parseISO(row.date), 'EEE, dd MMM')}
                              </span>
                              {row.locked_reason === 'holiday' && row.holiday_description && (
                                <Badge
                                  variant="outline"
                                  className="w-fit border-purple-300 bg-purple-100 text-[10px] font-medium text-purple-700 sm:text-xs"
                                >
                                  <Calendar className="mr-1 h-3 w-3" />
                                  <span className="hidden sm:inline">Organization Holiday: </span>
                                  {row.holiday_description}
                                </Badge>
                              )}
                              {row.locked_reason === 'exception_holiday' &&
                                row.holiday_description && (
                                  <Badge
                                    variant="outline"
                                    className="w-fit border-orange-300 bg-orange-100 text-[10px] font-medium text-orange-700 sm:text-xs"
                                  >
                                    <Calendar className="mr-1 h-3 w-3" />
                                    {row.holiday_description}
                                  </Badge>
                                )}
                              {row.locked_reason === 'exception_working' &&
                                row.exception_reason && (
                                  <Badge
                                    variant="outline"
                                    className="w-fit border-green-300 bg-green-100 text-[10px] font-medium text-green-700 sm:text-xs"
                                  >
                                    <Calendar className="mr-1 h-3 w-3" />
                                    <span className="hidden sm:inline">
                                      Exceptional Working Day:{' '}
                                    </span>
                                    <span className="sm:hidden">Exception</span>
                                    <span className="hidden sm:inline">{row.exception_reason}</span>
                                  </Badge>
                                )}
                              {row.locked_reason === 'leave' && (
                                <Badge
                                  variant="outline"
                                  className="w-fit border-blue-300 bg-blue-100 text-[10px] font-medium text-blue-700 sm:text-xs"
                                >
                                  <FileText className="mr-1 h-3 w-3" />
                                  On Leave
                                </Badge>
                              )}
                              {row.locked_reason === 'non_working_day' && (
                                <Badge
                                  variant="outline"
                                  className="w-fit border-gray-300 bg-gray-100 text-[10px] font-medium text-gray-700 sm:text-xs"
                                >
                                  <Calendar className="mr-1 h-3 w-3" />
                                  <span className="sm:hidden">Off</span>
                                  <span className="hidden sm:inline">Non-working Day</span>
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="px-1 py-2 text-center sm:px-4 sm:py-4">
                            <AttendanceIndicator
                              morningPresent={
                                row.locked_reason === 'leave' ? false : row.morning_present
                              }
                              afternoonPresent={
                                row.locked_reason === 'leave' ? false : row.afternoon_present
                              }
                              disabled={
                                // If status is SUBMITTED or APPROVED, lock everything
                                week.submissionStatus === TimesheetStatus.SUBMITTED ||
                                week.submissionStatus === TimesheetStatus.APPROVED
                                  ? true
                                  : // Otherwise (DRAFT, REJECTED, RETURNED), only lock holidays/leaves/non-working days
                                    !!row.locked_reason && row.locked_reason !== 'exception_working'
                              }
                              onMorningClick={() =>
                                updateRow(
                                  week.id,
                                  row.date,
                                  'morning_present',
                                  !row.morning_present
                                )
                              }
                              onAfternoonClick={() =>
                                updateRow(
                                  week.id,
                                  row.date,
                                  'afternoon_present',
                                  !row.afternoon_present
                                )
                              }
                            />
                          </TableCell>
                          <TableCell className="hidden px-2 py-2 text-center sm:table-cell sm:px-4 sm:py-4">
                            {renderRowAction(row)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            )}
          </Card>
        ))}

        {/* Leave Request Dialog */}
        <LeaveRequestDialog
          open={leaveDialogOpen}
          onOpenChange={setLeaveDialogOpen}
          selectedDate={selectedDateForLeave}
          onSuccess={handleLeaveSuccess}
        />

        <WarningConfirmationDialog
          open={!!weekPendingReturnToDraft}
          onOpenChange={(open) => !open && setWeekPendingReturnToDraft(null)}
          onConfirm={confirmReturnToDraft}
          title="Return Week to Draft"
          description="This will delete all attendance records and timesheet submission for this week."
          warningText="This action cannot be undone."
          confirmButtonText={
            returnToDraftMutation.isPending ? 'Processing...' : 'Yes, Return to Draft'
          }
          cancelButtonText="Cancel"
          isLoading={returnToDraftMutation.isPending}
        />
      </div>
    </TooltipProvider>
  );
}
