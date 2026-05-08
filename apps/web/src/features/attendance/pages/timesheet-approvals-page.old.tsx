import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import {
  FileText,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Filter,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

import { PageHeader } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Combobox } from '@/components/ui/combobox';
import { DataTable } from '@/components/ui/data-table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

// Feature imports
import {
  getTimesheetSubmissions,
  getEmployeeAttendance,
  type TimesheetSubmission,
} from '@/features/attendance/api/attendance-api';
import {
  AttendanceStatusBadge,
  TimesheetStatusBadge,
  getTimesheetTableColumns,
} from '@/features/attendance/components';
import { isAdminUser } from '@/features/attendance/utils/attendance-helpers';
import {
  type TimesheetReviewActionValue,
  TimesheetReviewAction,
  TimesheetStatus,
} from '@/constants';
import { ErrorMessages } from '@/constants';
import { useAuth } from '@/hooks/use-auth';
import { apiClient } from '@/lib/api-client';
import { useReviewTimesheet } from '@/features/attendance/hooks/mutations/use-review-timesheet';
import { cn } from '@/lib/utils';

type DialogType = 'detail' | 'review' | 'batch' | null;

interface ManageableUser {
  public_id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string;
  role: string;
  role_display: string;
  organization_role: string | { code: string; name: string };
  gender: string;
  employee_id?: string;
}

function getEmployeeFullName(employee: {
  first_name?: string;
  last_name?: string;
  full_name?: string;
}) {
  return employee.full_name || `${employee.first_name || ''} ${employee.last_name || ''}`.trim();
}

export default function TimesheetApprovalsPage() {
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedSubmission, setSelectedSubmission] = useState<TimesheetSubmission | null>(null);
  const [reviewAction, setReviewAction] = useState<TimesheetReviewActionValue | null>(null);
  const [reviewComments, setReviewComments] = useState('');
  const [dialogType, setDialogType] = useState<DialogType>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>(
    'pending'
  );

  // Get current user from auth context
  const { user: currentUser } = useAuth();

  const isAdmin = isAdminUser(currentUser?.role);

  // Fetch manageable users (staff members)
  const { data: manageableUsersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['manageable-users', 'staff-only'],
    queryFn: async () => {
      const response = await apiClient.get('/users/profile/manageable-users/', {
        params: {
          is_staff: true,
        },
      });
      return response.data;
    },
  });

  const manageableUsers = useMemo(() => {
    if (!manageableUsersData?.data) {
      return [];
    }

    if (Array.isArray(manageableUsersData.data.users)) {
      return manageableUsersData.data.users as ManageableUser[];
    }

    if (Array.isArray(manageableUsersData.data)) {
      return manageableUsersData.data as ManageableUser[];
    }

    return [];
  }, [manageableUsersData]);

  // Fetch pending timesheet submissions
  const { data: pendingSubmissionsData, isLoading: isLoadingPending } = useQuery({
    queryKey: ['timesheet-submissions', 'staff', TimesheetStatus.SUBMITTED],
    queryFn: () => {
      return getTimesheetSubmissions({
        view_type: 'staff',
        submission_status: TimesheetStatus.SUBMITTED,
      });
    },
  });

  // Fetch all submissions for history tab
  const { data: historySubmissionsData, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['timesheet-submissions', 'staff', 'all-statuses'],
    queryFn: () => {
      return getTimesheetSubmissions({
        view_type: 'staff',
      });
    },
    enabled: activeTab === 'history',
  });

  // Parse submissions data
  const parsedPendingSubmissions = useMemo(() => {
    let data: TimesheetSubmission[] = [];

    if (pendingSubmissionsData) {
      if (Array.isArray(pendingSubmissionsData)) {
        data = pendingSubmissionsData;
      }
      // @ts-expect-error - API returns data array but typed as results
      else if (Array.isArray(pendingSubmissionsData.data)) {
        // @ts-expect-error - API returns data array but typed as results
        data = pendingSubmissionsData.data;
      } else if (Array.isArray(pendingSubmissionsData.results)) {
        data = pendingSubmissionsData.results;
      }
    }

    return data.sort((a, b) => {
      const dateA = new Date(a.submitted_at || a.week_start_date).getTime();
      const dateB = new Date(b.submitted_at || b.week_start_date).getTime();
      return dateB - dateA; // Newest first
    });
  }, [pendingSubmissionsData]);

  const parsedHistorySubmissions = useMemo(() => {
    let data: TimesheetSubmission[] = [];

    if (historySubmissionsData) {
      if (Array.isArray(historySubmissionsData)) {
        data = historySubmissionsData;
      }
      // @ts-expect-error - API returns data array but typed as results
      else if (Array.isArray(historySubmissionsData.data)) {
        // @ts-expect-error - API returns data array but typed as results
        data = historySubmissionsData.data;
      } else if (Array.isArray(historySubmissionsData.results)) {
        data = historySubmissionsData.results;
      }
    }

    return data.sort((a, b) => {
      const dateA = new Date(a.submitted_at || a.week_start_date).getTime();
      const dateB = new Date(b.submitted_at || b.week_start_date).getTime();
      return dateB - dateA; // Newest first
    });
  }, [historySubmissionsData]);

  // Apply filters
  const filteredSubmissions = useMemo(() => {
    const submissions =
      activeTab === 'pending' ? parsedPendingSubmissions : parsedHistorySubmissions;

    let filtered = submissions;

    // Filter by selected user
    if (selectedUser) {
      filtered = filtered.filter((s) => s.employee_info.public_id === selectedUser);
    }

    // Filter by status (only in history tab)
    if (activeTab === 'history' && statusFilter !== 'all') {
      if (statusFilter === 'pending') {
        filtered = filtered.filter((s) => s.submission_status === TimesheetStatus.SUBMITTED);
      } else if (statusFilter === 'approved') {
        filtered = filtered.filter((s) => s.submission_status === TimesheetStatus.APPROVED);
      } else if (statusFilter === 'rejected') {
        filtered = filtered.filter((s) => s.submission_status === TimesheetStatus.REJECTED);
      }
    }

    return filtered;
  }, [activeTab, parsedPendingSubmissions, parsedHistorySubmissions, selectedUser, statusFilter]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const pending = parsedPendingSubmissions.length;
    const allSubmissions = parsedHistorySubmissions;
    const approved = allSubmissions.filter(
      (s) => s.submission_status === TimesheetStatus.APPROVED
    ).length;
    const rejected = allSubmissions.filter(
      (s) => s.submission_status === TimesheetStatus.REJECTED
    ).length;
    const uniqueEmployees = new Set(parsedPendingSubmissions.map((s) => s.employee_info.public_id))
      .size;

    return { pending, approved, rejected, uniqueEmployees };
  }, [parsedPendingSubmissions, parsedHistorySubmissions]);

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
    enabled: dialogType === 'detail' && !!selectedSubmission,
  });

  const closeDialog = () => {
    setDialogType(null);
    setSelectedSubmission(null);
    setReviewAction(null);
    setReviewComments('');
  };

  // Review mutation
  const reviewMutation = useReviewTimesheet(closeDialog);

  const openDetailDialog = (submission: TimesheetSubmission) => {
    setSelectedSubmission(submission);
    setDialogType('detail');
  };

  const openReviewDialog = (
    submission: TimesheetSubmission,
    action: TimesheetReviewActionValue
  ) => {
    setSelectedSubmission(submission);
    setReviewAction(action);
    setReviewComments('');
    setDialogType('review');
  };

  const handleReview = () => {
    if (!selectedSubmission || !reviewAction) {
      return;
    }

    // Validate comments for REJECTED
    if (reviewAction === TimesheetReviewAction.REJECTED && !reviewComments.trim()) {
      toast.error(ErrorMessages.ATTENDANCE.REJECTION_COMMENT_REQUIRED);
      return;
    }

    reviewMutation.mutate({
      publicId: selectedSubmission.public_id,
      data: {
        submission_status: reviewAction,
        review_comments: reviewComments.trim() || undefined,
      },
    });
  };

  const clearFilters = () => {
    setSelectedUser('');
    setStatusFilter('pending');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Timesheet Approvals"
        description="Review and approve staff timesheet submissions"
        icon={FileText}
      />

      {/* Metrics Dashboard */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100 shadow-sm transition-shadow hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-semibold text-orange-900">
              Pending Approvals
            </CardTitle>
            <Clock className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-orange-700">{metrics.pending}</div>
            <p className="mt-2 text-sm font-medium text-orange-700">
              {metrics.uniqueEmployees} employee{metrics.uniqueEmployees !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100 shadow-sm transition-shadow hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-semibold text-green-900">Approved</CardTitle>
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-700">{metrics.approved}</div>
            <p className="mt-2 text-sm font-medium text-green-700">Total approved timesheets</p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-gradient-to-br from-red-50 to-red-100 shadow-sm transition-shadow hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-semibold text-red-900">Rejected</CardTitle>
            <XCircle className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-red-700">{metrics.rejected}</div>
            <p className="mt-2 text-sm font-medium text-red-700">Total rejected timesheets</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 shadow-sm transition-shadow hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-semibold text-blue-900">Staff Members</CardTitle>
            <Users className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-blue-700">{manageableUsers.length}</div>
            <p className="mt-2 text-sm font-medium text-blue-700">Total manageable staff</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <h3 className="text-sm font-semibold">Filters</h3>
                {(selectedUser || (activeTab === 'history' && statusFilter !== 'pending')) && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs">
                    Clear all
                  </Button>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="h-8"
              >
                {showFilters ? 'Hide' : 'Show'} Filters
              </Button>
            </div>

            {showFilters && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Employee Filter */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Filter by Employee</Label>
                  <Combobox
                    options={[
                      { value: '', label: 'All Employees' },
                      ...manageableUsers.map((staff) => ({
                        value: staff.public_id,
                        label: staff.full_name || `${staff.first_name} ${staff.last_name}`,
                      })),
                    ]}
                    value={selectedUser}
                    onValueChange={setSelectedUser}
                    placeholder="Select employee..."
                    searchPlaceholder="Search employees..."
                    emptyText="No employees found"
                    disabled={isLoadingUsers}
                    className="bg-white"
                  />
                  {selectedUser && (
                    <p className="text-muted-foreground text-xs">
                      Showing timesheets for{' '}
                      {manageableUsers.find((u) => u.public_id === selectedUser)?.full_name}
                    </p>
                  )}
                </div>

                {/* Status Filter (only in history tab) */}
                {activeTab === 'history' && (
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Filter by Status</Label>
                    <div className="flex gap-2">
                      <Badge
                        variant={statusFilter === 'all' ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => setStatusFilter('all')}
                      >
                        All
                      </Badge>
                      <Badge
                        variant={statusFilter === 'pending' ? 'default' : 'outline'}
                        className="cursor-pointer bg-orange-100 text-orange-700 hover:bg-orange-200"
                        onClick={() => setStatusFilter('pending')}
                      >
                        Pending
                      </Badge>
                      <Badge
                        variant={statusFilter === 'approved' ? 'default' : 'outline'}
                        className="cursor-pointer bg-green-100 text-green-700 hover:bg-green-200"
                        onClick={() => setStatusFilter('approved')}
                      >
                        Approved
                      </Badge>
                      <Badge
                        variant={statusFilter === 'rejected' ? 'default' : 'outline'}
                        className="cursor-pointer bg-red-100 text-red-700 hover:bg-red-200"
                        onClick={() => setStatusFilter('rejected')}
                      >
                        Rejected
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Active Filters Display */}
            {!showFilters &&
              (selectedUser || (activeTab === 'history' && statusFilter !== 'pending')) && (
                <div className="flex flex-wrap gap-2">
                  {selectedUser && (
                    <Badge variant="secondary" className="gap-1">
                      Employee:{' '}
                      {manageableUsers.find((u) => u.public_id === selectedUser)?.full_name}
                      <button
                        onClick={() => setSelectedUser('')}
                        className="ml-1 rounded-full p-0.5 hover:bg-gray-300"
                      >
                        <XCircle className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {activeTab === 'history' && statusFilter !== 'pending' && (
                    <Badge variant="secondary" className="gap-1">
                      Status: {statusFilter}
                      <button
                        onClick={() => setStatusFilter('pending')}
                        className="ml-1 rounded-full p-0.5 hover:bg-gray-300"
                      >
                        <XCircle className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                </div>
              )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Pending and History */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as 'pending' | 'history')}
      >
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="pending" className="relative">
            Pending Approvals
            {metrics.pending > 0 && (
              <Badge className="ml-2 h-5 w-5 rounded-full bg-orange-500 p-0 text-xs">
                {metrics.pending}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Pending Approvals Tab */}
        <TabsContent value="pending" className="space-y-4">
          {metrics.pending === 0 ? (
            <Card>
              <CardContent className="pt-12 pb-12">
                <div className="flex flex-col items-center justify-center text-center">
                  <CheckCircle2 className="mb-4 h-16 w-16 text-green-500" />
                  <h3 className="mb-2 text-lg font-semibold">All caught up!</h3>
                  <p className="text-muted-foreground max-w-md">
                    There are no pending timesheet submissions requiring your approval at this time.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Pending Timesheets</CardTitle>
                    <CardDescription>
                      {filteredSubmissions.length} timesheet
                      {filteredSubmissions.length !== 1 ? 's' : ''} awaiting your review
                    </CardDescription>
                  </div>
                  {filteredSubmissions.length > 1 && (
                    <Button variant="outline" size="sm" disabled>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Batch Approve (Coming Soon)
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={getTimesheetTableColumns({
                    isAdmin,
                    isReviewPending: reviewMutation.isPending,
                    onViewDetails: openDetailDialog,
                    onReview: openReviewDialog,
                    showEmployeeColumn: true,
                  })}
                  data={filteredSubmissions}
                  isLoading={isLoadingPending}
                  emptyMessage="No pending submissions found"
                  getRowKey={(row) => row.public_id}
                  maxHeight="600px"
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Approval History</CardTitle>
              <CardDescription>
                {filteredSubmissions.length} timesheet{filteredSubmissions.length !== 1 ? 's' : ''}{' '}
                found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={getTimesheetTableColumns({
                  isAdmin,
                  isReviewPending: reviewMutation.isPending,
                  onViewDetails: openDetailDialog,
                  onReview: openReviewDialog,
                  showEmployeeColumn: true,
                })}
                data={filteredSubmissions}
                isLoading={isLoadingHistory}
                emptyMessage="No submissions found"
                getRowKey={(row) => row.public_id}
                maxHeight="600px"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detail View Dialog */}
      <Dialog open={dialogType === 'detail'} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-h-[80vh] max-w-4xl overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle>Timesheet Details</DialogTitle>
            <DialogDescription>Detailed weekly attendance report</DialogDescription>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-4">
                <div>
                  <p className="text-sm text-gray-600">Employee</p>
                  <p className="font-semibold">
                    {getEmployeeFullName(selectedSubmission.employee_info)}
                  </p>
                  <p className="text-sm text-gray-500">{selectedSubmission.employee_info.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Week Period</p>
                  <p className="font-semibold">
                    {format(parseISO(selectedSubmission.week_start_date), 'MMM dd')} -{' '}
                    {format(parseISO(selectedSubmission.week_end_date), 'MMM dd, yyyy')}
                  </p>
                  <div className="mt-2">
                    <TimesheetStatusBadge status={selectedSubmission.submission_status} />
                  </div>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <p className="text-xs font-medium text-gray-600">Working Days</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {selectedSubmission.total_working_days}
                  </p>
                </div>
                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                  <p className="text-xs font-medium text-gray-600">Present</p>
                  <p className="text-2xl font-bold text-green-600">
                    {selectedSubmission.total_present_days}
                  </p>
                </div>
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <p className="text-xs font-medium text-gray-600">Absent</p>
                  <p className="text-2xl font-bold text-red-600">
                    {selectedSubmission.total_absent_days}
                  </p>
                </div>
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                  <p className="text-xs font-medium text-gray-600">Leave</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {selectedSubmission.total_leave_days}
                  </p>
                </div>
                <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
                  <p className="text-xs font-medium text-gray-600">Attendance %</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {selectedSubmission.attendance_percentage}%
                  </p>
                </div>
              </div>

              {/* Day-wise Details */}
              {isLoadingAttendance ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : attendanceData && Array.isArray(attendanceData) && attendanceData.length > 0 ? (
                <div>
                  <h4 className="mb-3 text-sm font-semibold">Daily Attendance</h4>
                  <div className="overflow-hidden rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-32">Date</TableHead>
                          <TableHead className="w-28">Day</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="w-24 text-center">Present</TableHead>
                          <TableHead className="w-24 text-center">Absent</TableHead>
                          <TableHead className="w-24 text-center">Leave</TableHead>
                          <TableHead>Remarks</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {attendanceData.map((day: Record<string, unknown>) => {
                          const date = parseISO(day.date as string);
                          const dayOfWeek = date.getDay();
                          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                          const hasHoliday = day.holiday_name;
                          const hasLeave = (day.leave_full as number) > 0;
                          const hasPresent = (day.present_full as number) > 0;

                          let statusBadge;
                          if (hasHoliday) {
                            statusBadge = <AttendanceStatusBadge status="holiday" />;
                          } else if (hasLeave) {
                            statusBadge = <AttendanceStatusBadge status="leave" />;
                          } else if (isWeekend) {
                            statusBadge = (
                              <AttendanceStatusBadge status="holiday" label="Weekend" />
                            );
                          } else if (hasPresent) {
                            if ((day.present_half as number) > 0) {
                              statusBadge = <AttendanceStatusBadge status="half_day" />;
                            } else {
                              statusBadge = <AttendanceStatusBadge status="present" />;
                            }
                          } else {
                            statusBadge = <AttendanceStatusBadge status="absent" />;
                          }

                          return (
                            <TableRow
                              key={day.date as string}
                              className={isWeekend ? 'bg-gray-50' : ''}
                            >
                              <TableCell className="font-medium">
                                {format(date, 'MMM dd, yyyy')}
                              </TableCell>
                              <TableCell className="text-sm text-gray-600">
                                {format(date, 'EEEE')}
                              </TableCell>
                              <TableCell>{statusBadge}</TableCell>
                              <TableCell className="text-center">
                                <span
                                  className={cn(
                                    'font-medium',
                                    (day.present_full as number) > 0 && 'text-green-600'
                                  )}
                                >
                                  {(day.present_full as number) || 0}
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                <span
                                  className={cn(
                                    'font-medium',
                                    (day.absent_full as number) > 0 && 'text-red-600'
                                  )}
                                >
                                  {(day.absent_full as number) || 0}
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                <span
                                  className={cn(
                                    'font-medium',
                                    (day.leave_full as number) > 0 && 'text-yellow-600'
                                  )}
                                >
                                  {(day.leave_full as number) || 0}
                                </span>
                              </TableCell>
                              <TableCell className="text-sm text-gray-600">
                                {hasHoliday
                                  ? (day.holiday_name as string)
                                  : isWeekend
                                    ? 'Weekend'
                                    : hasLeave
                                      ? 'On Leave'
                                      : (day.remarks as string) || '-'}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-gray-500">No attendance data available</div>
              )}

              {/* Review Info */}
              {selectedSubmission.reviewed_at && (
                <div className="rounded-lg border bg-gray-50 p-4">
                  <h4 className="mb-2 text-sm font-semibold">Review Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Reviewed By</p>
                      <p className="font-medium">
                        {selectedSubmission.reviewed_by_info
                          ? getEmployeeFullName(selectedSubmission.reviewed_by_info)
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Reviewed At</p>
                      <p className="font-medium">
                        {format(parseISO(selectedSubmission.reviewed_at), 'MMM dd, yyyy hh:mm a')}
                      </p>
                    </div>
                    {selectedSubmission.review_comments && (
                      <div className="col-span-2">
                        <p className="mb-1 text-gray-600">Comments</p>
                        <p className="rounded border bg-white p-3 text-gray-800">
                          {selectedSubmission.review_comments}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {selectedSubmission &&
              selectedSubmission.submission_status === TimesheetStatus.SUBMITTED && (
                <div className="flex w-full gap-2">
                  <Button
                    variant="destructive"
                    onClick={() => {
                      closeDialog();
                      openReviewDialog(selectedSubmission, TimesheetReviewAction.REJECTED);
                    }}
                    className="flex-1"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => {
                      closeDialog();
                      openReviewDialog(selectedSubmission, TimesheetReviewAction.APPROVED);
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                </div>
              )}
            <Button variant="outline" onClick={closeDialog}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Action Dialog */}
      <Dialog open={dialogType === 'review'} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>
              {reviewAction === TimesheetReviewAction.APPROVED ? 'Approve' : 'Reject'} Timesheet
            </DialogTitle>
            <DialogDescription>
              {selectedSubmission && (
                <>
                  Employee: {getEmployeeFullName(selectedSubmission.employee_info)} | Week:{' '}
                  {format(parseISO(selectedSubmission.week_start_date), 'MMM dd')} -{' '}
                  {format(parseISO(selectedSubmission.week_end_date), 'MMM dd, yyyy')}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {reviewAction === TimesheetReviewAction.REJECTED && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />
                  <div>
                    <p className="text-sm font-medium text-red-900">Rejection Reason Required</p>
                    <p className="mt-1 text-sm text-red-700">
                      Please provide a clear reason for rejection to help the employee understand
                      and correct their timesheet.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="review-comments">
                Comments{' '}
                {reviewAction === TimesheetReviewAction.REJECTED && (
                  <span className="text-red-600">*</span>
                )}
              </Label>
              <Textarea
                id="review-comments"
                placeholder={
                  reviewAction === TimesheetReviewAction.APPROVED
                    ? 'Optional: Add any comments about this approval...'
                    : 'Explain why this timesheet is being rejected...'
                }
                value={reviewComments}
                onChange={(e) => setReviewComments(e.target.value)}
                rows={4}
                className={
                  reviewAction === TimesheetReviewAction.REJECTED && !reviewComments.trim()
                    ? 'border-red-300'
                    : ''
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={reviewMutation.isPending}>
              Cancel
            </Button>
            <Button
              onClick={handleReview}
              disabled={
                reviewMutation.isPending ||
                (reviewAction === TimesheetReviewAction.REJECTED && !reviewComments.trim())
              }
              className={
                reviewAction === TimesheetReviewAction.APPROVED
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }
            >
              {reviewMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {reviewAction === TimesheetReviewAction.APPROVED ? (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Confirm Approval
                    </>
                  ) : (
                    <>
                      <XCircle className="mr-2 h-4 w-4" />
                      Confirm Rejection
                    </>
                  )}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
