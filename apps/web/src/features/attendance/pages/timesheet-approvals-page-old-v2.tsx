import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { FileText, Loader2, CheckCircle2, XCircle } from 'lucide-react';
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
import {
  isAdminUser,
  canReviewTimesheet,
  isLeaveDay,
  isHolidayDay,
  isNonWorkingDay,
  isFullDayPresent,
  isHalfDay,
  isAbsent,
  getAttendanceRemarks,
  getEmployeeFullName,
} from '@/features/attendance/utils';
import { useReviewTimesheet } from '@/features/attendance/hooks';
import { useAuth } from '@/hooks/use-auth';

// Constants
import {
  TimesheetReviewAction,
  type TimesheetReviewActionValue,
  TimesheetStatus,
} from '@/constants';
import { ErrorMessages } from '@/constants';

// API imports
import apiClient from '@/lib/api';

type DialogType = 'review' | 'detail' | null;

interface ManageableUser {
  public_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  full_name: string;
}

export default function TimesheetApprovalsPage() {
  const [activeTab, setActiveTab] = useState<'staff' | 'self'>('staff');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedSubmission, setSelectedSubmission] = useState<TimesheetSubmission | null>(null);
  const [reviewAction, setReviewAction] = useState<TimesheetReviewActionValue | null>(null);
  const [reviewComments, setReviewComments] = useState('');
  const [dialogType, setDialogType] = useState<DialogType>(null);

  // Get current user from auth context
  const { user: currentUser } = useAuth();

  const isAdmin = isAdminUser(currentUser?.role);

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

  // Fetch manageable users (staff members) - only when viewing staff timesheets
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
    enabled: activeTab === 'staff',
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

  // Fetch timesheet submissions
  const { data: submissionsData, isLoading: isLoadingSubmissions } = useQuery({
    queryKey: ['timesheet-submissions', activeTab, selectedUser, TimesheetStatus.SUBMITTED],
    queryFn: () => {
      const params: {
        view_type?: 'self' | 'staff';
        submission_status: string;
        employee_public_id?: string;
      } = {
        view_type: activeTab,
        submission_status: TimesheetStatus.SUBMITTED,
      };

      // Only add employee_public_id if viewing staff and user is selected
      if (activeTab === 'staff' && selectedUser) {
        params.employee_public_id = selectedUser;
      }

      return getTimesheetSubmissions(params);
    },
    enabled: true,
  });

  const submissions = useMemo(() => {
    let data: TimesheetSubmission[] = [];

    if (submissionsData) {
      if (Array.isArray(submissionsData)) {
        data = submissionsData;
      }
      // @ts-expect-error - API returns data array but typed as results
      else if (Array.isArray(submissionsData.data)) {
        // @ts-expect-error - API returns data array but typed as results
        data = submissionsData.data;
      } else if (Array.isArray(submissionsData.results)) {
        data = submissionsData.results;
      }
    }

    // Sort by week_start_date (oldest first: Feb 01 before Mar 01)
    return data.sort((a, b) => {
      const dateA = new Date(a.week_start_date).getTime();
      const dateB = new Date(b.week_start_date).getTime();
      return dateA - dateB;
    });
  }, [submissionsData]);

  const closeDialog = () => {
    setDialogType(null);
    setSelectedSubmission(null);
    setReviewAction(null);
    setReviewComments('');
  };

  // Review mutation - extracted to custom hook
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Timesheet Approvals"
        description="Review and approve employee timesheet submissions"
        icon={FileText}
      />

      {/* Tabs for Staff and Self */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          setActiveTab(value as 'staff' | 'self');
          setSelectedUser('');
        }}
      >
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="staff">Staff Timesheets</TabsTrigger>
          <TabsTrigger value="self">My Timesheets</TabsTrigger>
        </TabsList>

        <TabsContent value="staff" className="space-y-4">
          {/* Employee Filter */}
          <Card>
            <CardHeader>
              <CardTitle>Filter Options</CardTitle>
              <CardDescription>
                Select an employee to view their submissions or leave empty to view all
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-w-md">
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Select Employee (Optional)
                </label>
                <Combobox
                  options={manageableUsers.map((staff) => ({
                    value: staff.public_id,
                    label: staff.full_name || `${staff.first_name} ${staff.last_name}`,
                  }))}
                  value={selectedUser}
                  onValueChange={setSelectedUser}
                  placeholder="All employees"
                  searchPlaceholder="Search employees..."
                  emptyText="No employees found"
                  disabled={isLoadingUsers}
                  className="bg-white"
                />
              </div>
            </CardContent>
          </Card>

          {/* Staff Submissions Table */}
          <Card>
            <CardHeader>
              <CardTitle>Pending Staff Timesheets</CardTitle>
              <CardDescription>
                {submissions.length > 0
                  ? `${submissions.length} pending timesheet${submissions.length > 1 ? 's' : ''} requiring your approval`
                  : 'No pending timesheets found'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={getTimesheetTableColumns({
                  isAdmin,
                  isReviewPending: reviewMutation.isPending,
                  onViewDetails: openDetailDialog,
                  onReview: openReviewDialog,
                  showEmployeeColumn: true, // Show employee column in Staff tab
                })}
                data={submissions}
                isLoading={isLoadingSubmissions}
                emptyMessage="No pending timesheet submissions"
                getRowKey={(row) => row.public_id}
                maxHeight="600px"
                minWidth="1400px"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="self" className="space-y-4">
          {/* Admin indicator */}
          {isAdmin && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-600 hover:bg-blue-700">Admin Mode</Badge>
                  <span className="text-sm text-blue-800">
                    You can approve or reject your own timesheet submissions
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Self Submissions Table */}
          <Card>
            <CardHeader>
              <CardTitle>My Timesheet Submissions</CardTitle>
              <CardDescription>
                {submissions.length > 0
                  ? `${submissions.length} submission${submissions.length > 1 ? 's' : ''} found`
                  : 'No submissions found'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={getTimesheetTableColumns({
                  isAdmin,
                  isReviewPending: reviewMutation.isPending,
                  onViewDetails: openDetailDialog,
                  onReview: openReviewDialog,
                  showEmployeeColumn: false, // Don't show employee column in Self tab
                })}
                data={submissions}
                isLoading={isLoadingSubmissions}
                emptyMessage="No timesheet submissions found"
                getRowKey={(row) => row.public_id}
                maxHeight="600px"
                minWidth="1200px"
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

              {/* Day-wise Attendance */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">Day-wise Attendance</h3>
                {isLoadingAttendance ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="text-primary h-6 w-6 animate-spin" />
                  </div>
                ) : attendanceData?.records && attendanceData.records.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Day</TableHead>
                          <TableHead className="text-center">Morning</TableHead>
                          <TableHead className="text-center">Afternoon</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                          <TableHead>Remarks</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {attendanceData.records.map((record) => {
                          const date = parseISO(record.date);
                          // Use utility functions for attendance checks
                          const recordIsLeave = isLeaveDay(record);
                          const recordIsHoliday = isHolidayDay(record);
                          const recordIsNonWorkingDay = isNonWorkingDay(record);
                          const recordIsPresent = isFullDayPresent(record);
                          const recordIsHalfDay = isHalfDay(record);
                          const recordIsAbsent = isAbsent(record);

                          return (
                            <TableRow
                              key={record.date}
                              className={
                                recordIsHoliday || recordIsNonWorkingDay ? 'bg-gray-50' : ''
                              }
                            >
                              <TableCell className="font-medium">
                                {format(date, 'MMM dd, yyyy')}
                              </TableCell>
                              <TableCell>{format(date, 'EEEE')}</TableCell>
                              <TableCell className="text-center">
                                {recordIsHoliday || recordIsNonWorkingDay ? (
                                  <span className="text-gray-400">-</span>
                                ) : recordIsLeave ? (
                                  <AttendanceStatusBadge status="leave" />
                                ) : record.morning_present ? (
                                  <AttendanceStatusBadge status="present" />
                                ) : (
                                  <AttendanceStatusBadge status="absent" />
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                {recordIsHoliday || recordIsNonWorkingDay ? (
                                  <span className="text-gray-400">-</span>
                                ) : recordIsLeave ? (
                                  <AttendanceStatusBadge status="leave" />
                                ) : record.afternoon_present ? (
                                  <AttendanceStatusBadge status="present" />
                                ) : (
                                  <AttendanceStatusBadge status="absent" />
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                {recordIsHoliday ? (
                                  <AttendanceStatusBadge status="holiday" />
                                ) : recordIsNonWorkingDay ? (
                                  <Badge variant="outline" className="bg-gray-100 text-gray-600">
                                    Off Day
                                  </Badge>
                                ) : recordIsLeave ? (
                                  <Badge
                                    variant="outline"
                                    className="border-yellow-300 bg-yellow-50 text-yellow-800"
                                  >
                                    {record.leave_type_name
                                      ? `Leave (${record.leave_type_name})`
                                      : 'On Leave'}
                                  </Badge>
                                ) : recordIsPresent ? (
                                  <AttendanceStatusBadge status="present" label="Full Day" />
                                ) : recordIsHalfDay ? (
                                  <AttendanceStatusBadge status="half_day" />
                                ) : recordIsAbsent ? (
                                  <AttendanceStatusBadge status="absent" />
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <span className="text-sm text-gray-600">
                                  {getAttendanceRemarks(record)}
                                </span>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="py-8 text-center text-gray-500">
                    No attendance records found for this week
                  </div>
                )}
              </div>

              {/* Half Days Info */}
              {selectedSubmission.total_half_days > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="text-sm text-amber-800">
                    <strong>Note:</strong> This timesheet includes{' '}
                    {selectedSubmission.total_half_days} half day
                    {selectedSubmission.total_half_days > 1 ? 's' : ''}
                  </p>
                </div>
              )}

              {/* Review Comments if any */}
              {selectedSubmission.review_comments && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <p className="mb-1 text-sm font-semibold text-gray-700">Review Comments:</p>
                  <p className="text-sm text-gray-600">{selectedSubmission.review_comments}</p>
                </div>
              )}

              {/* Status Info */}
              <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <div className="mt-1">
                    <TimesheetStatusBadge status={selectedSubmission.submission_status} />
                  </div>
                </div>
                {selectedSubmission.reviewed_at && selectedSubmission.reviewed_by_info && (
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Reviewed By</p>
                    <p className="font-semibold">
                      {getEmployeeFullName(selectedSubmission.reviewed_by_info)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(parseISO(selectedSubmission.reviewed_at), 'MMM dd, yyyy')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Close
            </Button>
            {/* Show approve/reject buttons for staff tab OR for admin in self tab */}
            {(activeTab === 'staff' || (activeTab === 'self' && isAdmin)) &&
              selectedSubmission &&
              canReviewTimesheet(selectedSubmission.submission_status) && (
                <>
                  <Button
                    className="bg-green-600 text-white hover:bg-green-700"
                    onClick={() => {
                      closeDialog();
                      if (selectedSubmission) {
                        openReviewDialog(selectedSubmission, TimesheetReviewAction.APPROVED);
                      }
                    }}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      closeDialog();
                      if (selectedSubmission) {
                        openReviewDialog(selectedSubmission, TimesheetReviewAction.REJECTED);
                      }
                    }}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                </>
              )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={dialogType === 'review'} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle>
              {reviewAction === 'APPROVED' ? 'Approve Timesheet' : 'Reject Timesheet'}
            </DialogTitle>
            <DialogDescription>
              {reviewAction === 'APPROVED'
                ? 'Add optional comments and approve this timesheet'
                : 'Provide reason for rejection so the employee can resubmit'}
            </DialogDescription>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-4">
              <div className="space-y-2 rounded-lg bg-gray-50 p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Employee:</span>
                  <span className="font-semibold">
                    {getEmployeeFullName(selectedSubmission.employee_info)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Week:</span>
                  <span className="font-semibold">
                    {format(parseISO(selectedSubmission.week_start_date), 'MMM dd')} -{' '}
                    {format(parseISO(selectedSubmission.week_end_date), 'MMM dd, yyyy')}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Attendance:</span>
                  <span className="font-semibold">{selectedSubmission.attendance_percentage}%</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="comments">
                  Comments {reviewAction === 'REJECTED' && <span className="text-red-500">*</span>}
                  {reviewAction === 'APPROVED' && <span className="text-gray-500">(Optional)</span>}
                </Label>
                <Textarea
                  id="comments"
                  placeholder={
                    reviewAction === 'REJECTED'
                      ? 'Provide detailed reason for rejection so employee can correct and resubmit...'
                      : 'Add any approval notes...'
                  }
                  value={reviewComments}
                  onChange={(e) => setReviewComments(e.target.value)}
                  rows={4}
                />
                {reviewAction === 'REJECTED' && (
                  <p className="text-xs text-gray-500">
                    The employee will be able to see these comments and resubmit the timesheet after
                    making corrections.
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={reviewMutation.isPending}>
              Cancel
            </Button>
            <Button
              onClick={handleReview}
              disabled={reviewMutation.isPending}
              className={
                reviewAction === 'APPROVED'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }
            >
              {reviewMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {reviewAction === 'APPROVED' ? 'Approve Timesheet' : 'Reject Timesheet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
