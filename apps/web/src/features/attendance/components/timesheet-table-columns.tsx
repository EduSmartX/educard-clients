import { format, parseISO } from 'date-fns';
import { CheckCircle2, XCircle, Eye } from 'lucide-react';
import type { Column } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { TimesheetSubmission } from '@/features/attendance/api/attendance-api';
import { TimesheetStatusBadge } from './timesheet-status-badge';
import { AttendanceCountBadge } from './attendance-count-badge';
import { canReviewTimesheet } from '@/features/attendance/utils';
import { TimesheetReviewAction, type TimesheetReviewActionValue } from '@/constants';

interface TimesheetTableColumnsProps {
  isAdmin: boolean;
  isReviewPending: boolean;
  onViewDetails: (submission: TimesheetSubmission) => void;
  onReview?: (submission: TimesheetSubmission, action: TimesheetReviewActionValue) => void;
  showEmployeeColumn?: boolean; // Only show in Staff tab
}

function getPercentageColorClass(percentage: number): string {
  if (percentage >= 75) {
    return 'text-green-600';
  }
  if (percentage >= 50) {
    return 'text-yellow-600';
  }
  return 'text-red-600';
}

export function getTimesheetTableColumns({
  isAdmin,
  isReviewPending,
  onViewDetails,
  onReview,
  showEmployeeColumn = false,
}: TimesheetTableColumnsProps): Column<TimesheetSubmission>[] {
  const columns: Column<TimesheetSubmission>[] = [];

  // Employee column - only for Staff tab
  if (showEmployeeColumn) {
    columns.push({
      header: 'Employee',
      accessor: (row) => (
        <div className="flex flex-col">
          <div className="text-base font-semibold text-gray-900">{row.employee_info.full_name}</div>
          <div className="text-xs text-gray-600">{row.employee_info.username}</div>
          {row.employee_info.organization_role && (
            <div className="mt-0.5 text-xs font-medium text-blue-600">
              {row.employee_info.organization_role.name}
            </div>
          )}
        </div>
      ),
      sortable: true,
      sortKey: 'employee_info.full_name',
      width: 220,
      minWidth: 200,
      maxWidth: 280,
    });
  }

  // All remaining columns added in a single push
  columns.push(
    // Week Period
    {
      header: 'Week Period',
      accessor: (row) => (
        <div className="flex flex-col">
          <div className="text-sm font-semibold text-gray-900">
            {format(parseISO(row.week_start_date), 'MMM dd')} -{' '}
            {format(parseISO(row.week_end_date), 'MMM dd, yyyy')}
          </div>
          <div className="mt-0.5 text-xs text-gray-500">
            (
            {Math.ceil(
              (parseISO(row.week_end_date).getTime() - parseISO(row.week_start_date).getTime()) /
                (1000 * 60 * 60 * 24) +
                1
            )}{' '}
            days)
          </div>
        </div>
      ),
      sortable: true,
      sortKey: 'week_start_date',
      width: 220,
      minWidth: 200,
      maxWidth: 280,
    },
    // Working Days
    {
      header: 'Working Days',
      accessor: (row) => (
        <span className="text-base font-bold text-gray-900">{row.total_working_days}</span>
      ),
      headerClassName: 'text-center',
      className: 'text-center',
      sortable: true,
      sortKey: 'total_working_days',
      width: 130,
      minWidth: 110,
      maxWidth: 160,
    },
    // Present
    {
      header: 'Present',
      accessor: (row) => <AttendanceCountBadge count={row.total_present_days} type="present" />,
      headerClassName: 'text-center',
      className: 'text-center',
      sortable: true,
      sortKey: 'total_present_days',
      width: 100,
      minWidth: 80,
      maxWidth: 120,
    },
    // Absent
    {
      header: 'Absent',
      accessor: (row) => <AttendanceCountBadge count={row.total_absent_days} type="absent" />,
      headerClassName: 'text-center',
      className: 'text-center',
      sortable: true,
      sortKey: 'total_absent_days',
      width: 100,
      minWidth: 80,
      maxWidth: 120,
    },
    // Leave
    {
      header: 'Leave',
      accessor: (row) => <AttendanceCountBadge count={row.total_leave_days} type="leave" />,
      headerClassName: 'text-center',
      className: 'text-center',
      sortable: true,
      sortKey: 'total_leave_days',
      width: 100,
      minWidth: 80,
      maxWidth: 120,
    },
    // Attendance %
    {
      header: 'Attendance %',
      accessor: (row) => {
        const percentage =
          typeof row.attendance_percentage === 'string'
            ? Number.parseFloat(row.attendance_percentage)
            : row.attendance_percentage;
        const colorClass = getPercentageColorClass(percentage);
        return (
          <div className="flex flex-col items-center">
            <span className={`text-lg font-bold ${colorClass}`}>{row.attendance_percentage}%</span>
          </div>
        );
      },
      headerClassName: 'text-center',
      className: 'text-center',
      sortable: true,
      sortKey: 'attendance_percentage',
      width: 140,
      minWidth: 120,
      maxWidth: 170,
    },
    // Submitted On
    {
      header: 'Submitted On',
      accessor: (row) =>
        row.submitted_at ? (
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900">
              {format(parseISO(row.submitted_at), 'MMM dd, yyyy')}
            </span>
            <span className="text-xs text-gray-500">
              {format(parseISO(row.submitted_at), 'h:mm a')}
            </span>
          </div>
        ) : (
          '-'
        ),
      sortable: true,
      sortKey: 'submitted_at',
      width: 150,
      minWidth: 130,
      maxWidth: 190,
    },
    // Status
    {
      header: 'Status',
      accessor: (row) => <TimesheetStatusBadge status={row.submission_status} />,
      headerClassName: 'text-center',
      className: 'text-center',
      sortable: true,
      sortKey: 'submission_status',
      width: 140,
      minWidth: 120,
      maxWidth: 180,
    },
    // Actions
    {
      header: 'Actions',
      accessor: (row) => (
        <TooltipProvider>
          <div className="flex items-center justify-end gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onViewDetails(row)}
                  className="h-8 w-8"
                >
                  <Eye className="h-4 w-4" />
                  <span className="sr-only">View Details</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View Details</p>
              </TooltipContent>
            </Tooltip>

            {/* Show Approve/Reject buttons for Admin when status allows review */}
            {isAdmin && canReviewTimesheet(row.submission_status) && onReview && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      className="h-8 w-8 bg-green-600 text-white hover:bg-green-700"
                      onClick={() => onReview(row, TimesheetReviewAction.APPROVED)}
                      disabled={isReviewPending}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="sr-only">Approve</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Approve</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="destructive"
                      className="h-8 w-8"
                      onClick={() => onReview(row, TimesheetReviewAction.REJECTED)}
                      disabled={isReviewPending}
                    >
                      <XCircle className="h-4 w-4" />
                      <span className="sr-only">Reject</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Reject</p>
                  </TooltipContent>
                </Tooltip>
              </>
            )}
          </div>
        </TooltipProvider>
      ),
      headerClassName: 'text-right',
      className: 'text-right',
      width: 180,
      minWidth: 140,
      maxWidth: 220,
    }
  );

  return columns;
}
