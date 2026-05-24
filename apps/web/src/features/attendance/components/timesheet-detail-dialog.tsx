/**
 * Timesheet Detail Dialog
 * Shows day-wise attendance breakdown for a timesheet submission.
 */

import { useMemo } from 'react';
import { format, parseISO, eachDayOfInterval } from 'date-fns';
import { CheckCircle2, XCircle, Loader2, Minus } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import type { TimesheetSubmission } from '@/features/attendance/api/attendance-api';
import { TimesheetStatusBadge } from '@/features/attendance/components';
import { getDayStatus, type WorkingDayPolicy } from '@/features/attendance/utils/get-day-status';

interface AttendanceData {
  records?: Array<{
    date: string;
    is_leave?: boolean;
    leave_type_name?: string | null;
    morning_present?: boolean;
    afternoon_present?: boolean;
  }>;
  holiday_descriptions?: Record<string, { type?: string; description?: string }>;
  calendar_exceptions?: Array<{ date: string; type?: string; reason?: string }>;
  working_day_policy?: WorkingDayPolicy | null;
  stats?: {
    total_working_days?: number;
    total_present?: number;
    total_absent?: number;
    total_leaves?: number;
    total_holidays?: number;
    attendance_percentage?: number;
  };
}

interface TimesheetDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: TimesheetSubmission | null;
  attendanceData: AttendanceData | null | undefined;
  isLoadingAttendance: boolean;
  onApprove: (submission: TimesheetSubmission) => void;
  onReject: (submission: TimesheetSubmission) => void;
}

function SummaryStats({
  attendanceData,
  submission,
}: {
  attendanceData: AttendanceData | null | undefined;
  submission: TimesheetSubmission;
}) {
  const freshStats = attendanceData?.stats;
  const workingDays = freshStats?.total_working_days ?? submission.total_working_days;
  const present = freshStats?.total_present ?? submission.total_present_days;
  const absent = freshStats?.total_absent ?? submission.total_absent_days;
  const leave = freshStats?.total_leaves ?? submission.total_leave_days;
  const holidays = freshStats?.total_holidays ?? submission.total_holidays;
  const percentage = freshStats?.attendance_percentage ?? submission.attendance_percentage;

  const stats = [
    { label: 'Working', value: workingDays, color: 'blue' },
    { label: 'Present', value: present, color: 'green' },
    { label: 'Absent', value: absent, color: 'red' },
    { label: 'Leave', value: leave, color: 'yellow' },
    { label: 'Holidays', value: holidays, color: 'purple' },
    { label: 'Att. %', value: `${percentage}%`, color: 'indigo' },
  ] as const;

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3 md:grid-cols-6">
      {stats.map(({ label, value, color }) => (
        <div
          key={label}
          className={`rounded-lg border border-${color}-200 bg-${color}-50 p-2 sm:p-4`}
        >
          <p className="text-[10px] font-medium text-gray-600 sm:text-xs">{label}</p>
          <p className={`text-lg font-bold text-${color}-600 sm:text-2xl`}>{value}</p>
        </div>
      ))}
    </div>
  );
}

function DailyAttendanceTable({
  submission,
  attendanceData,
}: {
  submission: TimesheetSubmission;
  attendanceData: AttendanceData;
}) {
  const days = useMemo(() => {
    const start = parseISO(submission.week_start_date);
    const end = parseISO(submission.week_end_date);
    const allDays = eachDayOfInterval({ start, end });

    const recordsByDate = new Map((attendanceData.records || []).map((r) => [r.date, r]));
    const holidayDescs = attendanceData.holiday_descriptions || {};
    const exceptions = new Map((attendanceData.calendar_exceptions || []).map((e) => [e.date, e]));
    const policy = attendanceData.working_day_policy;

    return allDays.map((date) => {
      const dateKey = format(date, 'yyyy-MM-dd');
      const record = recordsByDate.get(dateKey);
      const holidayInfo = holidayDescs[dateKey];
      const exception = exceptions.get(dateKey);
      const dayStatus = getDayStatus(date, record, holidayInfo, exception, policy ?? undefined);
      return { date, dateKey, ...dayStatus };
    });
  }, [submission, attendanceData]);

  return (
    <div>
      <h4 className="mb-3 text-sm font-semibold">Daily Attendance</h4>
      <div className="overflow-hidden overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-28 text-xs sm:w-32 sm:text-sm">Date</TableHead>
              <TableHead className="hidden w-28 sm:table-cell">Day</TableHead>
              <TableHead className="text-xs sm:text-sm">Status</TableHead>
              <TableHead className="w-16 text-center text-xs sm:w-24 sm:text-sm">AM</TableHead>
              <TableHead className="w-16 text-center text-xs sm:w-24 sm:text-sm">PM</TableHead>
              <TableHead className="hidden sm:table-cell">Remarks</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {days.map((day) => (
              <TableRow key={day.dateKey} className={day.rowBg}>
                <TableCell className="px-2 py-1.5 text-xs font-medium sm:px-4 sm:py-2 sm:text-sm">
                  {format(day.date, 'dd MMM')}
                  <span className="ml-1 text-[10px] text-gray-400 sm:hidden">
                    {format(day.date, 'EEE')}
                  </span>
                </TableCell>
                <TableCell className="hidden text-sm text-gray-600 sm:table-cell">
                  {format(day.date, 'EEEE')}
                </TableCell>
                <TableCell className="px-2 py-1.5 sm:px-4 sm:py-2">
                  <Badge variant="outline" className={`text-[10px] sm:text-xs ${day.statusColor}`}>
                    {day.statusText}
                  </Badge>
                </TableCell>
                <TableCell className="px-1 py-1.5 text-center sm:px-4 sm:py-2">
                  <SessionIcon
                    isHoliday={day.isHoliday}
                    hasRecord={day.hasRecord}
                    isLeave={day.isLeave}
                    isPresent={day.morningPresent}
                  />
                </TableCell>
                <TableCell className="px-1 py-1.5 text-center sm:px-4 sm:py-2">
                  <SessionIcon
                    isHoliday={day.isHoliday}
                    hasRecord={day.hasRecord}
                    isLeave={day.isLeave}
                    isPresent={day.afternoonPresent}
                  />
                </TableCell>
                <TableCell className="hidden text-sm text-gray-600 sm:table-cell">
                  {day.remarks}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function SessionIcon({
  isHoliday,
  hasRecord,
  isLeave,
  isPresent,
}: {
  isHoliday: boolean;
  hasRecord: boolean;
  isLeave: boolean;
  isPresent: boolean;
}) {
  if (isHoliday || (!hasRecord && !isLeave)) {
    return <Minus className="mx-auto h-3 w-3 text-gray-300 sm:h-4 sm:w-4" />;
  }
  if (isPresent) {
    return <CheckCircle2 className="mx-auto h-4 w-4 text-green-600 sm:h-5 sm:w-5" />;
  }
  return <XCircle className="mx-auto h-4 w-4 text-red-400 sm:h-5 sm:w-5" />;
}

export function TimesheetDetailDialog({
  open,
  onOpenChange,
  submission,
  attendanceData,
  isLoadingAttendance,
  onApprove,
  onReject,
}: TimesheetDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onOpenChange(false)}>
      <DialogContent className="max-h-[90vh] w-[95vw] max-w-4xl overflow-y-auto bg-white sm:max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Timesheet Details</DialogTitle>
          <DialogDescription>Detailed weekly attendance report</DialogDescription>
        </DialogHeader>

        {submission && (
          <div className="space-y-6">
            {/* Header Info */}
            <div className="grid grid-cols-1 gap-3 rounded-lg bg-gray-50 p-3 sm:grid-cols-2 sm:gap-4 sm:p-4">
              <div>
                <p className="text-sm text-gray-600">Employee</p>
                <p className="font-semibold">{submission.employee_info.full_name}</p>
                <p className="text-sm text-gray-500">{submission.employee_info.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Week Period</p>
                <p className="font-semibold">
                  {format(parseISO(submission.week_start_date), 'MMM dd')} -{' '}
                  {format(parseISO(submission.week_end_date), 'MMM dd, yyyy')}
                </p>
                <div className="mt-2">
                  <TimesheetStatusBadge status={submission.submission_status} />
                </div>
              </div>
            </div>

            {/* Summary Stats */}
            <SummaryStats attendanceData={attendanceData} submission={submission} />

            {/* Day-wise Details */}
            {isLoadingAttendance && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            )}
            {!isLoadingAttendance && attendanceData && (
              <DailyAttendanceTable submission={submission} attendanceData={attendanceData} />
            )}
            {!isLoadingAttendance && !attendanceData && (
              <div className="py-8 text-center text-gray-500">No attendance data available</div>
            )}

            {/* Review Info (if reviewed) */}
            {!!submission.reviewed_at && (
              <div className="rounded-lg border bg-gray-50 p-4">
                <h4 className="mb-2 text-sm font-semibold">Review Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Reviewed By</p>
                    <p className="font-medium">{submission.reviewed_by_info?.full_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Reviewed At</p>
                    <p className="font-medium">
                      {format(parseISO(submission.reviewed_at), 'MMM dd, yyyy hh:mm a')}
                    </p>
                  </div>
                  {!!submission.review_comments && (
                    <div className="col-span-2">
                      <p className="text-gray-600">Comments</p>
                      <p className="font-medium">{submission.review_comments}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action buttons when viewing a pending submission */}
            {submission.submission_status === 'SUBMITTED' && (
              <div className="flex justify-end gap-3 border-t pt-4">
                <Button
                  variant="outline"
                  className="border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                  onClick={() => onReject(submission)}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
                <Button
                  className="bg-green-600 text-white hover:bg-green-700"
                  onClick={() => onApprove(submission)}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Approve
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
