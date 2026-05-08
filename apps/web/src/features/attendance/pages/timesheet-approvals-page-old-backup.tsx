import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { CheckCircle2, FileText, Loader2, XCircle, Eye, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

import { PageHeader } from '@/components/common';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Combobox } from '@/components/ui/combobox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { getTimesheetSubmissions, reviewTimesheet, getEmployeeAttendance, type TimesheetSubmission } from '@/features/attendance/api/attendance-api';
import apiClient from '@/lib/api';
import { useAuthStore } from '@/lib/store/auth-store';

type ReviewAction = 'APPROVED' | 'REJECTED';

interface ManageableUser {
  public_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  full_name: string;
}

export default function TimesheetApprovalsPage() {
  const queryClient = useQueryClient();
  const [viewType, setViewType] = useState<'self' | 'staff'>('staff');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedSubmission, setSelectedSubmission] = useState<TimesheetSubmission | null>(null);
  const [reviewAction, setReviewAction] = useState<ReviewAction | null>(null);
  const [reviewComments, setReviewComments] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

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
    enabled: viewType === 'staff',
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
    queryKey: ['timesheet-submissions', viewType, selectedUser, 'SUBMITTED'],
    queryFn: () => {
      const params: {
        view_type?: 'self' | 'staff';
        submission_status: string;
        employee_public_id?: string;
      } = {
        view_type: viewType,
        submission_status: 'SUBMITTED',
      };
      
      // Only add employee_public_id if viewing staff and user is selected
      if (viewType === 'staff' && selectedUser) {
        params.employee_public_id = selectedUser;
      }
      
      return getTimesheetSubmissions(params);
    },
    // Always enabled - fetch all submissions for approval view
    enabled: true,
  });

  const submissions = useMemo(() => {
    // Handle both response formats: data array or results array
    if (submissionsData) {
      if (Array.isArray(submissionsData)) {
        return submissionsData;
      }
      // @ts-expect-error - API returns data array but typed as results
      if (Array.isArray(submissionsData.data)) {
        // @ts-expect-error - API returns data array but typed as results
        return submissionsData.data;
      }
      if (Array.isArray(submissionsData.results)) {
        return submissionsData.results;
      }
    }
    return [];
  }, [submissionsData]);

  // Review mutation
  const reviewMutation = useMutation({
    mutationFn: ({ publicId, data }: { publicId: string; data: { submission_status: ReviewAction; review_comments?: string } }) =>
      reviewTimesheet(publicId, data),
    onSuccess: () => {
      toast.success('Timesheet reviewed successfully');
      queryClient.invalidateQueries({ queryKey: ['timesheet-submissions'] });
      setDialogOpen(false);
      setSelectedSubmission(null);
      setReviewAction(null);
      setReviewComments('');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      const message = err?.response?.data?.message || 'Failed to review timesheet';
      toast.error(message);
    },
  });

  const openReviewDialog = (submission: TimesheetSubmission, action: ReviewAction) => {
    setSelectedSubmission(submission);
    setReviewAction(action);
    setReviewComments('');
    setDialogOpen(true);
  };

  const handleReview = () => {
    if (!selectedSubmission || !reviewAction) {
      return;
    }

    // Validate comments for RETURNED and REJECTED
    if ((reviewAction === 'RETURNED' || reviewAction === 'REJECTED') && !reviewComments.trim()) {
      toast.error('Comments are required when returning or rejecting a timesheet');
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">Pending Approval</Badge>;
      case 'APPROVED':
        return <Badge className="bg-green-600 hover:bg-green-700 text-white">Approved</Badge>;
      case 'RETURNED':
        return <Badge className="bg-orange-500 hover:bg-orange-600 text-white">Returned</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getEmployeeFullName = (employee: TimesheetSubmission['employee_info']) => {
    // API returns full_name directly
    if (employee.full_name) {
      return employee.full_name;
    }
    // Fallback to first_name + last_name
    return `${employee.first_name || ''} ${employee.last_name || ''}`.trim();
  };

  // Main list view
  return (
    <div className="space-y-6">
      <PageHeader
        title="Timesheet Approvals"
        description="Review and approve employee timesheet submissions"
        icon={FileText}
      />

      {/* View Type and Employee Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Timesheet View Options</CardTitle>
          <CardDescription>
            Select whether to view your own timesheets or review staff timesheets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* View Type Selection */}
            <div className="max-w-md">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                View Type
              </label>
              <Select value={viewType} onValueChange={(value) => {
                setViewType(value as 'self' | 'staff');
                setSelectedUser(''); // Reset employee selection when changing view type
              }}>
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="self">My Own Timesheets</SelectItem>
                  <SelectItem value="staff">Staff Timesheets (Review)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Employee Selection - Only show for staff view */}
            {viewType === 'staff' && (
              <div className="max-w-md">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to view all pending submissions
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pending Submissions List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {viewType === 'self' ? 'My Timesheet Submissions' : 'Pending Timesheet Submissions'}
          </CardTitle>
          <CardDescription>
            {submissions.length > 0 
              ? `${submissions.length} ${viewType === 'self' ? 'submission' : 'pending timesheet'}${submissions.length > 1 ? 's' : ''}${viewType === 'self' ? ' found' : ' requiring your approval'}`
              : `No ${viewType === 'self' ? 'submissions' : 'pending timesheets'} found`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
            {isLoadingSubmissions ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : submissions.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No timesheet submissions found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {submissions.map((submission: TimesheetSubmission) => (
                  <Card key={submission.public_id} className="border-2">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">
                            Week: {format(parseISO(submission.week_start_date), 'MMM dd')} - {format(parseISO(submission.week_end_date), 'MMM dd, yyyy')}
                          </CardTitle>
                          <CardDescription>
                            Submitted on {submission.submitted_at ? format(parseISO(submission.submitted_at), 'MMM dd, yyyy') : '-'}
                          </CardDescription>
                        </div>
                        <div>
                          {getStatusBadge(submission.submission_status)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Employee Info */}
                      <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                        <User className="w-10 h-10 text-gray-400" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-base">{getEmployeeFullName(submission.employee_info)}</h4>
                          <p className="text-sm text-gray-600">{submission.employee_info.email}</p>
                        </div>
                      </div>

                      {/* Stats Cards */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-sm font-medium text-gray-600">Working Days</p>
                          <p className="text-2xl font-bold text-blue-600">{submission.total_working_days}</p>
                        </div>
                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                          <p className="text-sm font-medium text-gray-600">Present</p>
                          <p className="text-2xl font-bold text-green-600">{submission.total_present_days}</p>
                        </div>
                        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                          <p className="text-sm font-medium text-gray-600">Absent</p>
                          <p className="text-2xl font-bold text-red-600">{submission.total_absent_days}</p>
                        </div>
                        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                          <p className="text-sm font-medium text-gray-600">Leave</p>
                          <p className="text-2xl font-bold text-yellow-600">{submission.total_leave_days}</p>
                        </div>
                        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                          <p className="text-sm font-medium text-gray-600">Attendance %</p>
                          <p className="text-2xl font-bold text-purple-600">{submission.attendance_percentage}%</p>
                        </div>
                      </div>

                      {/* Half Days Info */}
                      {submission.total_half_days > 0 && (
                        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                          <p className="text-sm text-amber-800">
                            <strong>Note:</strong> This timesheet includes {submission.total_half_days} half day{submission.total_half_days > 1 ? 's' : ''}
                          </p>
                        </div>
                      )}

                      {/* Action Buttons - Only show for staff view */}
                      {viewType === 'staff' && (
                        <div className="flex flex-wrap gap-3 pt-4 border-t">
                          <Button
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => openReviewDialog(submission, 'APPROVED')}
                            disabled={reviewMutation.isPending}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            className="border-orange-500 text-orange-600 hover:bg-orange-50"
                            onClick={() => openReviewDialog(submission, 'RETURNED')}
                            disabled={reviewMutation.isPending}
                          >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Return for Correction
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => openReviewDialog(submission, 'REJECTED')}
                            disabled={reviewMutation.isPending}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      {/* Review Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {reviewAction === 'APPROVED' && 'Approve Timesheet'}
              {reviewAction === 'RETURNED' && 'Return Timesheet'}
              {reviewAction === 'REJECTED' && 'Reject Timesheet'}
            </DialogTitle>
            <DialogDescription>
              {reviewAction === 'APPROVED' && 'Are you sure you want to approve this timesheet?'}
              {reviewAction === 'RETURNED' && 'Provide feedback for corrections needed'}
              {reviewAction === 'REJECTED' && 'Provide reason for rejection'}
            </DialogDescription>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Employee:</span>
                  <span className="font-semibold">{getEmployeeFullName(selectedSubmission.employee_info)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Week:</span>
                  <span className="font-semibold">
                    {format(parseISO(selectedSubmission.week_start_date), 'MMM dd')} - {format(parseISO(selectedSubmission.week_end_date), 'MMM dd, yyyy')}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Attendance:</span>
                  <span className="font-semibold">{selectedSubmission.attendance_percentage}%</span>
                </div>
              </div>

              {(reviewAction === 'RETURNED' || reviewAction === 'REJECTED') && (
                <div className="space-y-2">
                  <Label htmlFor="comments">
                    Comments <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="comments"
                    placeholder={reviewAction === 'RETURNED' ? 'Explain what needs to be corrected...' : 'Provide reason for rejection...'}
                    value={reviewComments}
                    onChange={(e) => setReviewComments(e.target.value)}
                    rows={4}
                  />
                </div>
              )}

              {reviewAction === 'APPROVED' && (
                <div className="space-y-2">
                  <Label htmlFor="comments">Comments (Optional)</Label>
                  <Textarea
                    id="comments"
                    placeholder="Add any approval notes..."
                    value={reviewComments}
                    onChange={(e) => setReviewComments(e.target.value)}
                    rows={3}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={reviewMutation.isPending}>
              Cancel
            </Button>
            <Button
              onClick={handleReview}
              disabled={reviewMutation.isPending}
              className={
                reviewAction === 'APPROVED'
                  ? 'bg-green-600 hover:bg-green-700'
                  : reviewAction === 'RETURNED'
                  ? 'bg-orange-500 hover:bg-orange-600'
                  : 'bg-red-600 hover:bg-red-700'
              }
            >
              {reviewMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {reviewAction === 'APPROVED' && 'Approve'}
              {reviewAction === 'RETURNED' && 'Return'}
              {reviewAction === 'REJECTED' && 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
