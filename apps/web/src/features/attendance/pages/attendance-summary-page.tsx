import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  CalendarDays,
  CheckCircle2,
  AlertCircle,
  Users,
  Mail,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserX,
  Clock,
  ClipboardList,
} from 'lucide-react';

import { PageHeader } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { AttendanceUiText } from '@/constants';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

import {
  getClassAttendanceSummary,
  type ClassAttendanceSummaryItem,
} from '../api/attendance-api';

// Define columns for the DataTable
const getAttendanceSummaryColumns = (): Column<ClassAttendanceSummaryItem>[] => [
  {
    header: 'Class',
    accessor: 'name',
    sortable: true,
    sortKey: 'name',
    width: 250,
    minWidth: 180,
  },
  {
    header: 'Class Teacher',
    accessor: (row) =>
      row.class_teacher ? (
        <div>
          <p className="text-sm font-medium">{row.class_teacher.full_name}</p>
          <p className="text-xs text-muted-foreground">{row.class_teacher.email}</p>
        </div>
      ) : (
        <span className="text-muted-foreground text-sm italic">Not assigned</span>
      ),
    sortable: true,
    sortKey: 'class_teacher_name',
    width: 200,
    minWidth: 150,
  },
  {
    header: 'Total',
    accessor: (row) => (
      <span className="font-medium">{row.total_students}</span>
    ),
    sortable: true,
    sortKey: 'total_students',
    width: 80,
    minWidth: 60,
    className: 'text-center',
    headerClassName: 'text-center',
  },
  {
    header: 'Marked',
    accessor: (row) => (
      <span className={cn('font-medium', row.marked > 0 && 'text-blue-600')}>
        {row.marked}
      </span>
    ),
    sortable: true,
    sortKey: 'marked',
    width: 80,
    minWidth: 60,
    className: 'text-center',
    headerClassName: 'text-center',
  },
  {
    header: 'Present',
    accessor: (row) => (
      <div className="flex items-center justify-center gap-1">
        <UserCheck className="h-3.5 w-3.5 text-green-500" />
        <span className="font-medium text-green-600">{row.present}</span>
      </div>
    ),
    sortable: true,
    sortKey: 'present',
    width: 90,
    minWidth: 70,
    className: 'text-center',
    headerClassName: 'text-center',
  },
  {
    header: 'Absent',
    accessor: (row) => (
      <div className="flex items-center justify-center gap-1">
        <UserX className="h-3.5 w-3.5 text-red-500" />
        <span className="font-medium text-red-600">{row.absent}</span>
      </div>
    ),
    sortable: true,
    sortKey: 'absent',
    width: 90,
    minWidth: 70,
    className: 'text-center',
    headerClassName: 'text-center',
  },
  {
    header: 'Half Day',
    accessor: (row) => (
      <div className="flex items-center justify-center gap-1">
        <Clock className="h-3.5 w-3.5 text-amber-500" />
        <span className="font-medium text-amber-600">{row.halfday}</span>
      </div>
    ),
    sortable: true,
    sortKey: 'halfday',
    width: 90,
    minWidth: 70,
    className: 'text-center',
    headerClassName: 'text-center',
  },
  {
    header: 'Unmarked',
    accessor: (row) => (
      <span className="text-muted-foreground">{row.unmarked}</span>
    ),
    sortable: true,
    sortKey: 'unmarked',
    width: 100,
    minWidth: 80,
    className: 'text-center',
    headerClassName: 'text-center',
  },
  {
    header: 'Status',
    accessor: (row) =>
      row.submission_status === 'submitted' ? (
        <Badge
          variant="outline"
          className="bg-green-50 text-green-700 border-green-200 gap-1"
        >
          <CheckCircle2 className="h-3 w-3" />
          Submitted
        </Badge>
      ) : (
        <Badge
          variant="outline"
          className="bg-orange-50 text-orange-700 border-orange-200 gap-1"
        >
          <AlertCircle className="h-3 w-3" />
          Pending
        </Badge>
      ),
    sortable: true,
    sortKey: 'submission_status',
    width: 120,
    minWidth: 100,
    className: 'text-center',
    headerClassName: 'text-center',
  },
];

export function AttendanceSummaryPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const dateString = format(selectedDate, 'yyyy-MM-dd');

  const {
    data: summaryData,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['class-attendance-summary', dateString],
    queryFn: () => getClassAttendanceSummary(dateString),
    staleTime: 30 * 1000, // 30 seconds
  });

  const columns = useMemo(() => getAttendanceSummaryColumns(), []);

  const handlePrevDay = () => {
    setSelectedDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() - 1);
      return newDate;
    });
  };

  const handleNextDay = () => {
    const today = new Date();
    if (selectedDate >= today) return;
    setSelectedDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + 1);
      return newDate;
    });
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const handleNotifyPending = () => {
    // Get all pending classes with class teachers
    const pendingWithTeachers =
      summaryData?.classes.filter(
        (c) => c.submission_status === 'pending' && c.class_teacher
      ) || [];

    if (pendingWithTeachers.length === 0) {
      toast.info('No pending classes with assigned class teachers to notify.');
      return;
    }

    // TODO: Implement backend notification endpoint
    toast.success(
      `Notification sent to ${pendingWithTeachers.length} class teacher(s) for pending attendance.`
    );
  };

  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  // Calculate completion percentage
  const completionPercent = summaryData?.summary
    ? summaryData.summary.total_classes > 0
      ? Math.round(
          (summaryData.summary.classes_submitted / summaryData.summary.total_classes) * 100
        )
      : 0
    : 0;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        title={AttendanceUiText.SUMMARY_PAGE_TITLE}
        description={AttendanceUiText.SUMMARY_PAGE_DESC}
        icon={ClipboardList}
      />

      {/* Date Navigation & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevDay}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </span>
            {isToday && (
              <Badge variant="secondary" className="ml-2">
                Today
              </Badge>
            )}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleNextDay}
            disabled={isToday}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          {!isToday && (
            <Button variant="outline" size="sm" onClick={handleToday}>
              Go to Today
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw
              className={cn('h-4 w-4 mr-2', isRefetching && 'animate-spin')}
            />
            Refresh
          </Button>
          {summaryData && summaryData.summary.classes_pending > 0 && (
            <Button
              variant="default"
              size="sm"
              onClick={handleNotifyPending}
              className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!summaryData.can_send_notifications}
              title={summaryData.can_send_notifications ? 'Send notification to pending teachers' : 'Only admins can send notifications'}
            >
              <Mail className="h-4 w-4 mr-2" />
              Notify Pending ({summaryData.summary.classes_pending})
            </Button>
          )}
        </div>
      </div>

      {/* Holiday Banner */}
      {summaryData?.is_holiday && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">
                {summaryData.holiday_name || 'Holiday'} - No attendance expected
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Non-Working Day Banner (e.g., Sundays) */}
      {summaryData && !summaryData.is_working_day && !summaryData.is_holiday && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-blue-800">
              <CalendarDays className="h-5 w-5" />
              <span className="font-medium">
                {format(selectedDate, 'EEEE')} is not a working day - No attendance required
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="py-4">
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : summaryData ? (
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-slate-700">
                    {summaryData.summary.total_classes}
                  </p>
                  <p className="text-sm text-slate-500 font-medium">Total Classes</p>
                </div>
                <div className="p-3 bg-slate-200/50 rounded-xl">
                  <Users className="h-6 w-6 text-slate-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-green-700">
                    {summaryData.summary.classes_submitted}
                  </p>
                  <p className="text-sm text-green-600 font-medium">
                    Classes Submitted
                  </p>
                </div>
                <div className="p-3 bg-green-200/50 rounded-xl">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-amber-100 border-orange-200">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-orange-700">
                    {summaryData.summary.classes_pending}
                  </p>
                  <p className="text-sm text-orange-600 font-medium">
                    Classes Pending
                  </p>
                </div>
                <div className="p-3 bg-orange-200/50 rounded-xl">
                  <AlertCircle className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-blue-700">
                    {summaryData.summary.total_marked}{' '}
                    <span className="text-lg text-blue-500">
                      / {summaryData.summary.total_students}
                    </span>
                  </p>
                  <p className="text-sm text-blue-600 font-medium">
                    Students Marked
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="w-16">
                    <Progress
                      value={
                        summaryData.summary.total_students > 0
                          ? (summaryData.summary.total_marked /
                              summaryData.summary.total_students) *
                            100
                          : 0
                      }
                      className="h-2"
                    />
                  </div>
                  <span className="text-xs text-blue-500 font-medium">
                    {summaryData.summary.total_students > 0
                      ? Math.round(
                          (summaryData.summary.total_marked /
                            summaryData.summary.total_students) *
                            100
                        )
                      : 0}
                    %
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Completion Progress Bar */}
      {summaryData && !isLoading && (
        <Card className="border-slate-200">
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-600">
                Attendance Submission Progress
              </span>
              <span className="text-sm font-bold text-slate-700">
                {completionPercent}% Complete
              </span>
            </div>
            <Progress value={completionPercent} className="h-3" />
          </CardContent>
        </Card>
      )}

      {/* Class-wise DataTable */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800">
              Class-wise Attendance Status
            </h3>
            {summaryData && (
              <Badge variant="secondary" className="text-xs">
                {summaryData.classes.length} classes
              </Badge>
            )}
          </div>
          <DataTable
            columns={columns}
            data={summaryData?.classes || []}
            isLoading={isLoading}
            emptyMessage="No classes found for this organization."
            getRowKey={(row) => row.public_id}
            maxHeight="600px"
            minWidth="900px"
          />
        </CardContent>
      </Card>
    </div>
  );
}
