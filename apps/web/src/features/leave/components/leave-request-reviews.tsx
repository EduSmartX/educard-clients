/**
 * Leave Request Reviews Page
 * Modern implementation for reviewing and approving/rejecting leave requests
 */
import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Users, User, Info, Check, X, Eye, Paperclip } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import {
  USER_ROLES,
  ErrorMessages,
  FormPlaceholders,
  SuccessMessages,
  QUERY_KEYS,
} from '@/constants';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Combobox } from '@/components/ui/combobox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ResourceFilter, type FilterField } from '@/components/filters/resource-filter';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils/date-utils';
import {
  useApproveLeaveRequest,
  useRejectLeaveRequest,
  useTeacherManagementContext,
} from '../hooks';
import { parseClasses } from '../utils/leave-data-parsers';
import { LeaveRequestReviewDialog } from './leave-request-review-dialog';

type UserRole = 'staff' | 'student';

interface LeaveRequestReview {
  public_id: string;
  user_public_id: string;
  user_name: string;
  user_role: string;
  organization_role: string | { code: string; name: string };
  email: string;
  supervisor_name: string;
  supervisor_public_id: string;
  leave_balance_public_id: string;
  leave_type_code: string;
  leave_name: string;
  start_date: string;
  end_date: string;
  number_of_days: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  applied_at: string;
  attachment_url?: string | null;
  attachment_name?: string;
  reviewed_by_name: string | null;
  reviewed_at: string | null;
  review_comments: string;
  can_be_cancelled: boolean;
  created_at: string;
  updated_at: string;
}

interface LeaveType {
  id: number;
  name: string;
  code: string;
  description: string;
  display_order: number;
}

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

const STATUS_CONFIG = {
  pending: { label: 'Pending', className: 'bg-yellow-500 text-white hover:bg-yellow-600' },
  approved: { label: 'Approved', className: 'bg-green-500 text-white hover:bg-green-600' },
  rejected: { label: 'Rejected', className: 'bg-red-500 text-white hover:bg-red-600' },
  cancelled: { label: 'Cancelled', className: 'bg-gray-500 text-white hover:bg-gray-600' },
};

// Cell renderers extracted outside parent component
function EmployeeCell({
  row,
  onNavigate,
}: Readonly<{ row: LeaveRequestReview; onNavigate: (path: string) => void }>) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(`/leave/dashboard/${row.user_public_id}`);
          }}
          className="w-full text-left text-blue-600 hover:text-blue-700 focus:underline focus:outline-none"
          aria-label={`View ${row.user_name}'s leave dashboard`}
        >
          <div className="flex flex-col items-start gap-0.5">
            <div className="font-medium">{row.user_name}</div>
            <div className="text-muted-foreground text-xs">
              {typeof row.organization_role === 'object' && row.organization_role
                ? row.organization_role.name
                : row.organization_role}
            </div>
          </div>
        </button>
      </TooltipTrigger>
      <TooltipContent>View {row.user_name}&apos;s leave dashboard</TooltipContent>
    </Tooltip>
  );
}

function LeaveTypeCell({ row }: Readonly<{ row: LeaveRequestReview }>) {
  return (
    <div className="flex items-center gap-1.5">
      <div>
        <div className="font-medium">{row.leave_name}</div>
        <div className="text-muted-foreground text-xs">{row.leave_type_code}</div>
      </div>
      {!!row.attachment_url && (
        <span title="Has attachment">
          <Paperclip className="h-3.5 w-3.5 shrink-0 text-blue-500" />
        </span>
      )}
    </div>
  );
}

function LeaveDurationCell({ row }: Readonly<{ row: LeaveRequestReview }>) {
  return (
    <div className="text-sm">
      <div>
        {formatDate(row.start_date)} - {formatDate(row.end_date)}
      </div>
      <div className="text-muted-foreground text-xs">
        {row.number_of_days} day{Number(row.number_of_days) === 1 ? '' : 's'}
      </div>
    </div>
  );
}

function LeaveStatusCell({ row }: Readonly<{ row: LeaveRequestReview }>) {
  const config = STATUS_CONFIG[row.status];
  return <Badge className={config.className}>{config.label}</Badge>;
}

interface LeaveActionsCellProps {
  row: LeaveRequestReview;
  onApprove: (row: LeaveRequestReview) => void;
  onReject: (row: LeaveRequestReview) => void;
  onView: (row: LeaveRequestReview) => void;
}

function LeaveActionsCell({ row, onApprove, onReject, onView }: Readonly<LeaveActionsCellProps>) {
  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onApprove(row)}
        className="h-8 w-8 p-0 text-green-600 hover:bg-green-50 hover:text-green-700"
        disabled={row.status !== 'pending'}
        title="Approve"
      >
        <Check className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onReject(row)}
        className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
        disabled={row.status !== 'pending'}
        title="Reject"
      >
        <X className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onView(row)}
        className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
        title="View Details"
      >
        <Eye className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function LeaveRequestReviews() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Check if user is admin
  const isAdmin = user?.role === USER_ROLES.ADMIN;

  // Fetch teacher's management context (only for non-admins)
  const { data: teacherContext, isLoading: isLoadingContext } = useTeacherManagementContext();

  const [userRole, setUserRole] = useState<UserRole>('staff');
  const [selectedClass, setSelectedClass] = useState('');

  // Filter state — single source of truth
  const [showFilters, setShowFilters] = useState(true);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string>>({
    status: 'pending',
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [reviewDialog, setReviewDialog] = useState<{
    open: boolean;
    request: LeaveRequestReview | null;
    action: 'approve' | 'reject' | null;
  }>({
    open: false,
    request: null,
    action: null,
  });

  useEffect(() => {
    setSelectedClass('');
    setAppliedFilters({ status: 'pending' });
    setCurrentPage(1);
  }, [userRole]);

  // Fetch leave types
  const { data: leaveTypesData } = useQuery({
    queryKey: QUERY_KEYS.leave.types,
    queryFn: async () => {
      const response = await api.get('/core/leave-types/');
      return response.data;
    },
  });

  const leaveTypes = useMemo(() => (leaveTypesData?.data || []) as LeaveType[], [leaveTypesData]);

  // Fetch classes for student mode
  const { data: classesData, isLoading: isLoadingClasses } = useQuery({
    queryKey: QUERY_KEYS.classesForLeave.forReviews(userRole, isAdmin, teacherContext),
    queryFn: async () => {
      // For admins, fetch all active classes
      if (isAdmin) {
        const response = await api.get('/classes/admin/?page=1&page_size=100&is_deleted=false');
        return response.data;
      }

      // For teachers, get classes where they are class teacher from management context
      if (teacherContext?.class_teacher_for) {
        return { data: teacherContext.class_teacher_for };
      }
      return { data: [] };
    },
    enabled: userRole === USER_ROLES.STUDENT,
  });

  const classes = useMemo(() => parseClasses(classesData?.data), [classesData]);

  // Fetch manageable users
  const { data: usersData } = useQuery({
    queryKey: QUERY_KEYS.users.manageable(userRole),
    queryFn: async () => {
      const response = await api.get(`/users/profile/manageable-users/?role=${userRole}`);
      return response.data;
    },
    enabled: userRole === USER_ROLES.STAFF,
  });

  const users = useMemo(() => {
    if (!usersData?.data?.users) {
      return [];
    }
    return usersData.data.users as ManageableUser[];
  }, [usersData]);

  // Filter fields for ResourceFilter
  const filterFields: FilterField[] = useMemo(() => {
    const fields: FilterField[] = [
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { value: 'pending', label: 'Pending' },
          { value: 'approved', label: 'Approved' },
          { value: 'rejected', label: 'Rejected' },
        ],
        placeholder: 'Select status',
      },
      {
        name: 'leave_type',
        label: 'Leave Type',
        type: 'select',
        options: [
          { value: '', label: 'All' },
          ...leaveTypes.map((type) => ({
            value: type.name,
            label: `${type.name} (${type.code})`,
          })),
        ],
        placeholder: 'All leave types',
      },
    ];

    if (userRole === USER_ROLES.STAFF) {
      fields.push({
        name: 'user',
        label: 'Search User',
        type: 'combobox',
        options: users.map((user) => ({
          value: user.public_id,
          label: `${user.full_name} [${user.email}]`,
        })),
        placeholder: FormPlaceholders.SELECT_USER,
      });
    }

    fields.push(
      {
        name: 'from_date',
        label: 'From Date',
        type: 'date',
        placeholder: 'From date',
      },
      {
        name: 'to_date',
        label: 'To Date',
        type: 'date',
        placeholder: 'To date',
      }
    );

    return fields;
  }, [leaveTypes, users, userRole]);

  // Build query params - use appliedFilters
  const queryParams = useMemo(() => {
    const params: Record<string, string> = {
      role: userRole,
      page: currentPage.toString(),
      page_size: pageSize.toString(),
    };

    if (userRole === USER_ROLES.STUDENT && selectedClass) {
      params.class_id = selectedClass;
    }

    if (appliedFilters.status) {
      params.status = appliedFilters.status;
    }

    if (appliedFilters.leave_type) {
      params.leave_type = appliedFilters.leave_type;
    }

    if (appliedFilters.user) {
      params.user = appliedFilters.user;
    }

    if (appliedFilters.from_date) {
      params.start_date__gte = appliedFilters.from_date;
    }

    if (appliedFilters.to_date) {
      params.end_date__lte = appliedFilters.to_date;
    }

    return params;
  }, [userRole, selectedClass, appliedFilters, currentPage, pageSize]);

  // Fetch leave requests for review
  const {
    data: requestsData,
    isLoading: isLoadingRequests,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEYS.leave.reviews(queryParams),
    queryFn: async () => {
      const queryString = new URLSearchParams(queryParams).toString();
      const response = await api.get(`/leave/employee/reviews/?${queryString}`);
      return response.data;
    },
    enabled: userRole === USER_ROLES.STAFF || (userRole === USER_ROLES.STUDENT && !!selectedClass),
    refetchOnMount: 'always',
  });

  const requests = (requestsData?.data || []) as LeaveRequestReview[];
  const pagination = requestsData?.pagination;

  // Use centralized mutation hooks
  const approveMutation = useApproveLeaveRequest();
  const rejectMutation = useRejectLeaveRequest();

  const handleApprove = (request: LeaveRequestReview) => {
    setReviewDialog({ open: true, request, action: 'approve' });
  };

  const handleReject = (request: LeaveRequestReview) => {
    setReviewDialog({ open: true, request, action: 'reject' });
  };

  const handleSubmitReview = (comments: string) => {
    if (!reviewDialog.request || !reviewDialog.action) {
      return;
    }

    const publicId = reviewDialog.request.public_id;

    if (reviewDialog.action === 'approve') {
      approveMutation.mutate(
        { publicId, comments },
        {
          onSuccess: () => {
            toast.success(SuccessMessages.LEAVE.REQUEST_APPROVED, {
              description: 'The leave request has been approved successfully.',
            });
            refetch();
            setReviewDialog({ open: false, request: null, action: null });
          },
          onError: (error: Error) => {
            const apiError = error as unknown as { response?: { data?: { message?: string } } };
            toast.error(ErrorMessages.LEAVE.APPROVE_REQUEST_FAILED, {
              description: apiError.response?.data?.message || ErrorMessages.GENERIC_RETRY,
            });
          },
        }
      );
    } else {
      rejectMutation.mutate(
        { publicId, comments },
        {
          onSuccess: () => {
            toast.success(SuccessMessages.LEAVE.REQUEST_REJECTED, {
              description: 'The leave request has been rejected successfully.',
            });
            refetch();
            setReviewDialog({ open: false, request: null, action: null });
          },
          onError: (error: Error) => {
            const apiError = error as unknown as { response?: { data?: { message?: string } } };
            toast.error(ErrorMessages.LEAVE.REJECT_REQUEST_FAILED, {
              description: apiError.response?.data?.message || ErrorMessages.GENERIC_RETRY,
            });
          },
        }
      );
    }
  };

  const handleResetFilters = () => {
    setAppliedFilters({ status: 'pending' });
    setCurrentPage(1);
  };

  const handleFilterApply = (filters: Record<string, string>) => {
    setAppliedFilters(filters.status ? filters : { ...filters, status: 'pending' });
    setCurrentPage(1);
  };

  const columns: Column<LeaveRequestReview>[] = [
    {
      header: 'Employee',
      accessor: (row) => <EmployeeCell row={row} onNavigate={(path) => navigate(path)} />,
    },
    {
      header: 'Leave Type',
      accessor: (row) => <LeaveTypeCell row={row} />,
    },
    {
      header: 'Leave Duration',
      accessor: (row) => <LeaveDurationCell row={row} />,
    },
    {
      header: 'Status',
      accessor: (row) => <LeaveStatusCell row={row} />,
    },
    {
      header: 'Reason',
      accessor: (row) => (
        <div className="max-w-xs truncate text-sm" title={row.reason}>
          {row.reason}
        </div>
      ),
    },
    {
      header: 'Actions',
      accessor: (row) => (
        <LeaveActionsCell
          row={row}
          onApprove={handleApprove}
          onReject={handleReject}
          onView={(r) => setReviewDialog({ open: true, request: r, action: null })}
        />
      ),
      width: 120,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave Request Reviews"
        description="Review and approve/reject leave requests from your team"
      >
        <div className="flex gap-2">
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            className="gap-2 border-indigo-300 text-indigo-700 hover:bg-indigo-50"
          >
            <RefreshCw className="h-4 w-4" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
          <Button
            onClick={() => refetch()}
            variant="outline"
            className="gap-2 border-blue-300 text-blue-700 hover:bg-blue-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </PageHeader>

      {/* Show info message if teacher has no permissions (not for admins) */}
      {!isAdmin && !isLoadingContext && teacherContext && !teacherContext.can_review_requests && (
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            <div className="space-y-2">
              <p className="font-medium">No leave requests to review</p>
              <p className="text-sm">You can review leave requests when you:</p>
              <ul className="ml-2 list-inside list-disc space-y-1 text-sm">
                <li>Are assigned as a supervisor for staff members, or</li>
                <li>Are designated as a class teacher for one or more classes</li>
              </ul>
              <p className="mt-2 text-sm">
                Please contact your administrator if you believe you should have access to this
                feature.
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Show context info if teacher has permissions (not for admins) */}
      {!isAdmin && !isLoadingContext && teacherContext?.can_review_requests && (
        <Alert className="border-green-200 bg-green-50">
          <Info className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-900">
            <div className="space-y-1">
              <p className="font-medium">Your Review Permissions:</p>
              <ul className="space-y-0.5 text-sm">
                {!!teacherContext.is_supervisor && (
                  <li>
                    ✓ You can review leave requests from {teacherContext.subordinate_count} staff
                    member(s)
                  </li>
                )}
                {!!teacherContext.is_class_teacher && (
                  <li>
                    ✓ You can review leave requests from {teacherContext.student_count} student(s)
                    across {teacherContext.class_teacher_for.length} class(es)
                  </li>
                )}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Only show content if admin OR teacher has review permissions */}
      {(isAdmin || !teacherContext || teacherContext.can_review_requests) && (
        <>
          {/* Staff/Student Toggle */}
          <div className="flex gap-2">
            <Button
              variant={userRole === USER_ROLES.STAFF ? 'default' : 'outline'}
              onClick={() => setUserRole('staff')}
              className={cn(
                'flex-1',
                userRole === USER_ROLES.STAFF &&
                  'bg-blue-600 text-white shadow-md hover:bg-blue-700'
              )}
              disabled={!isAdmin && teacherContext && !teacherContext.is_supervisor}
            >
              <Users className="mr-2 h-4 w-4" />
              Staff
            </Button>
            <Button
              variant={userRole === USER_ROLES.STUDENT ? 'default' : 'outline'}
              onClick={() => setUserRole('student')}
              className={cn(
                'flex-1',
                userRole === USER_ROLES.STUDENT &&
                  'bg-green-600 text-white shadow-md hover:bg-green-700'
              )}
              disabled={!isAdmin && teacherContext && !teacherContext.is_class_teacher}
            >
              <User className="mr-2 h-4 w-4" />
              Students
            </Button>
          </div>

          {/* Class Selection for Students */}
          {userRole === USER_ROLES.STUDENT && (
            <Card>
              <CardHeader>
                <CardTitle>Select Class</CardTitle>
                <CardDescription>Choose a class to view student leave requests</CardDescription>
              </CardHeader>
              <CardContent>
                <Combobox
                  value={selectedClass}
                  onValueChange={(value) => {
                    setSelectedClass(value);
                    setCurrentPage(1);
                  }}
                  options={classes.map((cls) => ({
                    label: `${cls.class_master.name} (${cls.name})`,
                    value: cls.public_id,
                  }))}
                  placeholder={FormPlaceholders.SELECT_CLASS}
                  emptyText="No classes found"
                  searchPlaceholder={FormPlaceholders.SEARCH_CLASSES}
                  disabled={isLoadingClasses}
                />
              </CardContent>
            </Card>
          )}

          {/* Filters */}
          {showFilters && (
            <ResourceFilter
              fields={filterFields}
              onFilter={handleFilterApply}
              onReset={handleResetFilters}
              defaultValues={appliedFilters}
              onFieldChange={(_name, _value, allFilters) => setAppliedFilters(allFilters)}
            />
          )}

          {/* Leave Requests Table */}
          <Card>
            <CardHeader>
              <CardTitle>Leave Requests</CardTitle>
              <CardDescription>
                {userRole === USER_ROLES.STAFF ? 'Staff' : 'Student'} leave requests awaiting your
                review
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={columns}
                data={requests}
                isLoading={isLoadingRequests}
                getRowKey={(row) => row.public_id}
                pagination={pagination}
                onPageChange={setCurrentPage}
              />
            </CardContent>
          </Card>
        </>
      )}

      {/* Review Dialog */}
      <LeaveRequestReviewDialog
        open={reviewDialog.open}
        request={reviewDialog.request}
        action={reviewDialog.action}
        onClose={() => setReviewDialog({ open: false, request: null, action: null })}
        onSubmit={handleSubmitReview}
        isPending={approveMutation.isPending || rejectMutation.isPending}
      />
    </div>
  );
}
