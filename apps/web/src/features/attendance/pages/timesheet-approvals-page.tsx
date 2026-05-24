import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { FileText, CheckCircle2, XCircle, Clock, Users, Eye } from 'lucide-react';

import { PageHeader } from '@/components/common';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MonthYearPicker } from '@/components/ui/month-year-picker';
import { Combobox } from '@/components/ui/combobox';

import {
  getTimesheetSubmissions,
  getEmployeeAttendance,
  type TimesheetSubmission,
} from '@/features/attendance/api/attendance-api';
import { useReviewTimesheet } from '@/features/attendance/hooks/mutations/use-review-timesheet';
import {
  TimesheetStatusBadge,
  AttendanceCountBadge,
  TimesheetDetailDialog,
  TimesheetApproveDialog,
  TimesheetRejectDialog,
} from '@/features/attendance/components';
import apiClient from '@/lib/api';

interface ManageableUser {
  public_id: string;
  full_name: string;
  email: string;
  role: string;
  organization_role?: { name: string; code: string };
}

export default function TimesheetApprovalsPage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('SUBMITTED');
  const [selectedSubmission, setSelectedSubmission] = useState<TimesheetSubmission | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  // Approve/Reject state
  const [approveTarget, setApproveTarget] = useState<TimesheetSubmission | null>(null);
  const [rejectTarget, setRejectTarget] = useState<TimesheetSubmission | null>(null);

  // Review mutation
  const reviewMutation = useReviewTimesheet(() => {
    setApproveTarget(null);
    setRejectTarget(null);
  });

  // Calculate month range
  const monthStart = useMemo(() => startOfMonth(selectedMonth), [selectedMonth]);
  const monthEnd = useMemo(() => endOfMonth(selectedMonth), [selectedMonth]);
  const fromDate = useMemo(() => format(monthStart, 'yyyy-MM-dd'), [monthStart]);
  const toDate = useMemo(() => format(monthEnd, 'yyyy-MM-dd'), [monthEnd]);

  // Fetch manageable users
  const { data: usersData } = useQuery({
    queryKey: ['manageable-users', 'staff'],
    queryFn: async () => {
      const response = await apiClient.get('/users/profile/manageable-users/', {
        params: { is_staff: true },
      });
      return response.data;
    },
  });

  const manageableUsers = useMemo(() => {
    const users = usersData?.data?.users || usersData?.data || [];
    return users as ManageableUser[];
  }, [usersData]);

  // Build filters for API
  const filters = useMemo(() => {
    const params: Record<string, string> = {
      view_type: 'staff',
      from_date: fromDate,
      to_date: toDate,
    };

    if (selectedStatus && selectedStatus !== 'ALL') {
      params.submission_status = selectedStatus;
    }

    if (selectedEmployee && selectedEmployee !== 'all') {
      params.employee = selectedEmployee;
    }

    return params;
  }, [fromDate, toDate, selectedStatus, selectedEmployee]);

  // Fetch timesheet submissions
  const { data: submissionsData, isLoading } = useQuery({
    queryKey: ['timesheet-submissions', filters],
    queryFn: () => getTimesheetSubmissions(filters),
  });

  // Fetch day-wise attendance for detailed view
  const { data: attendanceData, isLoading: isLoadingAttendance } = useQuery({
    queryKey: [
      'employee-attendance',
      selectedSubmission?.employee_info?.public_id,
      selectedSubmission?.week_start_date,
      selectedSubmission?.week_end_date,
    ],
    queryFn: () => {
      if (!selectedSubmission) {
        return null;
      }

      return getEmployeeAttendance({
        from_date: selectedSubmission.week_start_date,
        to_date: selectedSubmission.week_end_date,
        user_public_id: selectedSubmission.employee_info.public_id,
      });
    },
    enabled: isDetailDialogOpen && !!selectedSubmission,
  });

  // Group and sort data by employee, then by date
  const groupedData = useMemo(() => {
    const submissions = submissionsData?.results || [];

    // Sort by employee name (primary) then by week_start_date (secondary)
    return [...submissions].sort((a, b) => {
      // Primary sort: Employee name
      const nameA = a.employee_info?.full_name || '';
      const nameB = b.employee_info?.full_name || '';
      const nameCompare = nameA.localeCompare(nameB);

      if (nameCompare !== 0) {
        return nameCompare;
      }

      // Secondary sort: Week start date (descending - newest first)
      const dateA = new Date(a.week_start_date);
      const dateB = new Date(b.week_start_date);
      return dateB.getTime() - dateA.getTime();
    });
  }, [submissionsData]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const submissions = submissionsData?.results || [];
    const pending = submissions.filter(
      (s: TimesheetSubmission) => s.submission_status === 'SUBMITTED'
    ).length;
    const approved = submissions.filter(
      (s: TimesheetSubmission) => s.submission_status === 'APPROVED'
    ).length;
    const rejected = submissions.filter(
      (s: TimesheetSubmission) => s.submission_status === 'REJECTED'
    ).length;
    const uniqueEmployees = new Set(
      submissions.map((s: TimesheetSubmission) => s.employee_info?.public_id)
    ).size;

    return { pending, approved, rejected, uniqueEmployees, total: submissions.length };
  }, [submissionsData]);

  // Define table columns
  const columns: Column<TimesheetSubmission>[] = useMemo(
    () => [
      {
        header: 'Employee',
        accessor: (row) => (
          <div className="flex flex-col">
            <div className="text-base font-semibold text-gray-900">
              {row.employee_info?.full_name || 'N/A'}
            </div>
            <div className="text-xs text-gray-600">
              {row.employee_info?.username || row.employee_info?.email}
            </div>
            {row.employee_info?.organization_role &&
              typeof row.employee_info.organization_role === 'object' && (
                <div className="mt-0.5 text-xs font-medium text-blue-600">
                  {row.employee_info.organization_role.name}
                </div>
              )}
          </div>
        ),
        sortable: true,
        sortKey: 'employee_info.full_name',
        width: 220,
      },
      {
        header: 'Week Period',
        accessor: (row) => (
          <div className="flex flex-col">
            <div className="text-sm font-semibold text-gray-900">
              {format(new Date(row.week_start_date), 'MMM dd')} -{' '}
              {format(new Date(row.week_end_date), 'MMM dd, yyyy')}
            </div>
            <div className="mt-0.5 text-xs text-gray-500">
              (
              {Math.ceil(
                (new Date(row.week_end_date).getTime() - new Date(row.week_start_date).getTime()) /
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
      },
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
      },
      {
        header: 'Present',
        accessor: (row) => <AttendanceCountBadge count={row.total_present_days} type="present" />,
        headerClassName: 'text-center',
        className: 'text-center',
        sortable: true,
        sortKey: 'total_present_days',
        width: 100,
      },
      {
        header: 'Absent',
        accessor: (row) => <AttendanceCountBadge count={row.total_absent_days} type="absent" />,
        headerClassName: 'text-center',
        className: 'text-center',
        sortable: true,
        sortKey: 'total_absent_days',
        width: 100,
      },
      {
        header: 'Leave',
        accessor: (row) => <AttendanceCountBadge count={row.total_leave_days} type="leave" />,
        headerClassName: 'text-center',
        className: 'text-center',
        sortable: true,
        sortKey: 'total_leave_days',
        width: 100,
      },
      {
        header: 'Attendance %',
        accessor: (row) => {
          const percentage =
            typeof row.attendance_percentage === 'string'
              ? Number.parseFloat(row.attendance_percentage)
              : row.attendance_percentage;
          const getAttendanceColor = (pct: number) => {
            if (pct >= 75) {
              return 'text-green-600';
            }
            if (pct >= 50) {
              return 'text-yellow-600';
            }
            return 'text-red-600';
          };
          const colorClass = getAttendanceColor(percentage);
          return (
            <span className={`text-lg font-bold ${colorClass}`}>{row.attendance_percentage}%</span>
          );
        },
        headerClassName: 'text-center',
        className: 'text-center',
        sortable: true,
        sortKey: 'attendance_percentage',
        width: 140,
      },
      {
        header: 'Submitted On',
        accessor: (row) =>
          row.submitted_at ? (
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-900">
                {format(new Date(row.submitted_at), 'MMM dd, yyyy')}
              </span>
              <span className="text-xs text-gray-500">
                {format(new Date(row.submitted_at), 'h:mm a')}
              </span>
            </div>
          ) : (
            '-'
          ),
        sortable: true,
        sortKey: 'submitted_at',
        width: 150,
      },
      {
        header: 'Status',
        accessor: (row) => <TimesheetStatusBadge status={row.submission_status} />,
        headerClassName: 'text-center',
        className: 'text-center',
        sortable: true,
        sortKey: 'submission_status',
        width: 140,
      },
      {
        header: 'Actions',
        accessor: (row) => (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 border-blue-200 bg-blue-50 px-3 text-blue-700 shadow-sm transition-all duration-200 hover:border-blue-300 hover:bg-blue-100 hover:text-blue-800 hover:shadow"
              onClick={() => {
                setSelectedSubmission(row);
                setIsDetailDialogOpen(true);
              }}
            >
              <Eye className="mr-1 h-4 w-4" />
              <span className="text-xs font-medium">View</span>
            </Button>
            {row.submission_status === 'SUBMITTED' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 border-green-200 bg-green-50 px-3 text-green-700 shadow-sm transition-all duration-200 hover:border-green-300 hover:bg-green-100 hover:text-green-800 hover:shadow"
                  disabled={reviewMutation.isPending}
                  onClick={() => setApproveTarget(row)}
                >
                  <CheckCircle2 className="mr-1 h-4 w-4" />
                  <span className="text-xs font-medium">Approve</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 border-red-200 bg-red-50 px-3 text-red-700 shadow-sm transition-all duration-200 hover:border-red-300 hover:bg-red-100 hover:text-red-800 hover:shadow"
                  disabled={reviewMutation.isPending}
                  onClick={() => {
                    setRejectTarget(row);
                  }}
                >
                  <XCircle className="mr-1 h-4 w-4" />
                  <span className="text-xs font-medium">Reject</span>
                </Button>
              </>
            )}
          </div>
        ),
        headerClassName: 'text-center',
        className: 'text-center',
        width: 320,
      },
    ],
    [reviewMutation.isPending]
  );

  // Employee options for filter
  const employeeOptions = useMemo(
    () =>
      manageableUsers.map((user) => ({
        value: user.public_id,
        label: user.full_name,
      })),
    [manageableUsers]
  );

  // Status options for filter
  const statusOptions = [
    { value: 'ALL', label: 'All Status' },
    { value: 'SUBMITTED', label: 'Pending' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REJECTED', label: 'Rejected' },
  ];

  return (
    <div className="space-y-4 px-2 sm:space-y-6 sm:px-0">
      <PageHeader
        title="Timesheet Approvals"
        description="Review and approve staff timesheet submissions"
        icon={FileText}
      />

      {/* Metrics Dashboard */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100 shadow-sm transition-shadow hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 px-3 pt-3 pb-1 sm:px-6 sm:pt-6 sm:pb-3">
            <CardTitle className="text-xs font-semibold text-orange-900 sm:text-base">
              Pending
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-600 sm:h-5 sm:w-5" />
          </CardHeader>
          <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
            <div className="text-2xl font-bold text-orange-700 sm:text-4xl">{metrics.pending}</div>
            <p className="mt-1 text-xs font-medium text-orange-700 sm:mt-2 sm:text-sm">
              {metrics.uniqueEmployees} staff
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100 shadow-sm transition-shadow hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 px-3 pt-3 pb-1 sm:px-6 sm:pt-6 sm:pb-3">
            <CardTitle className="text-xs font-semibold text-green-900 sm:text-base">
              Approved
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600 sm:h-5 sm:w-5" />
          </CardHeader>
          <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
            <div className="text-2xl font-bold text-green-700 sm:text-4xl">{metrics.approved}</div>
            <p className="mt-1 hidden text-sm font-medium text-green-700 sm:mt-2 sm:block">
              Total approved
            </p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-gradient-to-br from-red-50 to-red-100 shadow-sm transition-shadow hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 px-3 pt-3 pb-1 sm:px-6 sm:pt-6 sm:pb-3">
            <CardTitle className="text-xs font-semibold text-red-900 sm:text-base">
              Rejected
            </CardTitle>
            <XCircle className="h-4 w-4 text-red-600 sm:h-5 sm:w-5" />
          </CardHeader>
          <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
            <div className="text-2xl font-bold text-red-700 sm:text-4xl">{metrics.rejected}</div>
            <p className="mt-1 hidden text-sm font-medium text-red-700 sm:mt-2 sm:block">
              Total rejected
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 shadow-sm transition-shadow hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 px-3 pt-3 pb-1 sm:px-6 sm:pt-6 sm:pb-3">
            <CardTitle className="text-xs font-semibold text-blue-900 sm:text-base">
              Staff
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600 sm:h-5 sm:w-5" />
          </CardHeader>
          <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
            <div className="text-2xl font-bold text-blue-700 sm:text-4xl">
              {manageableUsers.length}
            </div>
            <p className="mt-1 hidden text-sm font-medium text-blue-700 sm:mt-2 sm:block">
              Total manageable staff
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="px-3 py-2 sm:px-6 sm:py-4">
          <CardTitle className="text-sm font-semibold sm:text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
          <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
            {/* Month Picker */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Select Month</label>
              <MonthYearPicker
                value={selectedMonth}
                onChange={(date) => date && setSelectedMonth(date)}
              />
            </div>

            {/* Employee Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Filter by Employee</label>
              <Combobox
                options={[{ value: 'all', label: 'All Employees' }, ...employeeOptions]}
                value={selectedEmployee}
                onValueChange={setSelectedEmployee}
                placeholder="Select employee..."
              />
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Filter by Status</label>
              <Combobox
                options={statusOptions}
                value={selectedStatus}
                onValueChange={setSelectedStatus}
                placeholder="Select status..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader className="px-3 py-2 sm:px-6 sm:py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold sm:text-lg">
              Submissions ({groupedData.length})
            </CardTitle>
            <Badge variant="outline" className="text-xs sm:text-sm">
              {format(selectedMonth, 'MMM yyyy')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <DataTable
            columns={columns}
            data={groupedData}
            getRowKey={(row) => row.public_id}
            isLoading={isLoading}
            emptyMessage="No timesheet submissions found for the selected period."
          />
        </CardContent>
      </Card>

      {/* Detail View Dialog */}
      <TimesheetDetailDialog
        open={isDetailDialogOpen}
        onOpenChange={(open) => !open && setIsDetailDialogOpen(false)}
        submission={selectedSubmission}
        attendanceData={attendanceData}
        isLoadingAttendance={isLoadingAttendance}
        onApprove={(sub) => {
          setIsDetailDialogOpen(false);
          setApproveTarget(sub);
        }}
        onReject={(sub) => {
          setIsDetailDialogOpen(false);
          setRejectTarget(sub);
        }}
      />

      {/* Approve Confirmation Dialog */}
      <TimesheetApproveDialog
        target={approveTarget}
        onOpenChange={() => setApproveTarget(null)}
        onConfirm={(publicId) => {
          reviewMutation.mutate({
            publicId,
            data: { submission_status: 'APPROVED' },
          });
        }}
        isPending={reviewMutation.isPending}
      />

      {/* Reject Dialog with Comments */}
      <TimesheetRejectDialog
        target={rejectTarget}
        onOpenChange={() => setRejectTarget(null)}
        onConfirm={(publicId, comments) => {
          reviewMutation.mutate({
            publicId,
            data: {
              submission_status: 'REJECTED',
              review_comments: comments,
            },
          });
        }}
        isPending={reviewMutation.isPending}
      />
    </div>
  );
}
