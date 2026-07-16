/**
 * Manage Leave Balances Page
 * Comprehensive leave balance management for Staff and Students
 */
import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Briefcase } from 'lucide-react';
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
import { DeleteConfirmationDialog } from '@/components/common/delete-confirmation-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/ui/data-table';
import { type LeaveBalance } from '@/lib/api/leave-api';
import api from '@/lib/api';
import { LeaveBalanceDialog } from './leave-balance-dialog';
import { getLeaveTypeName } from '../utils/leave-name-helper';
import { parseClasses, parseStudents, type StudentData } from '../utils/leave-data-parsers';
import { useDeleteLeaveBalance, useTeacherManagementContext } from '../hooks';
import { getLeaveBalanceColumns } from './leave-balance-columns';
import { LeaveDistributionChart } from './leave-distribution-chart';
import { LeavePermissionAlerts } from './leave-permission-alerts';
import { LeaveUserSelection } from './leave-user-selection';

type UserRole = 'staff' | 'student';

interface ManageableUser {
  public_id: string;
  full_name: string;
  email: string;
  employee_id?: string;
  role?: string;
  phone?: string;
  gender?: string;
  organization_role?: string | { code: string; name: string };
}

interface LeaveAllocationForUser {
  public_id: string;
  leave_type_name: string;
  total_days: string;
  max_carry_forward_days: string;
  is_applicable_to_all: boolean;
  roles: string;
  academic_year: string;
  created_at: string;
  updated_at: string;
  created_by_public_id: string;
  created_by_name: string;
  updated_by_public_id: string;
  updated_by_name: string;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

/** Normalize different API user shapes into a consistent format */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeUserDetails(rawUser: Record<string, any> | undefined) {
  if (!rawUser) {
    return undefined;
  }

  const userInfo = rawUser.user_info || rawUser;
  const fullName =
    userInfo.full_name ||
    userInfo.name ||
    `${userInfo.first_name || ''} ${userInfo.last_name || ''}`.trim() ||
    undefined;

  const organizationRole =
    rawUser.organization_role ||
    userInfo.organization_role ||
    rawUser.role_display ||
    userInfo.role_display ||
    undefined;

  return {
    public_id: userInfo.public_id,
    full_name: fullName,
    email: userInfo.email,
    role: rawUser.role || userInfo.role,
    organization_role: organizationRole,
    phone: userInfo.phone,
    gender: userInfo.gender,
  };
}

function parseManageableUsers(data: unknown): ManageableUser[] {
  if (!data) {
    return [];
  }
  const obj = data as Record<string, unknown>;
  if (Array.isArray(obj.users)) {
    return obj.users as ManageableUser[];
  }
  if (Array.isArray(data)) {
    return data as ManageableUser[];
  }
  return [];
}

function resolveRawUserDetails(ctx: {
  manageOwnBalance: boolean;
  currentUser: unknown;
  apiUser: unknown;
  userRole: string;
  manageableUsers: ManageableUser[];
  selectedUser: string;
  students: StudentData[];
}) {
  if (ctx.manageOwnBalance) {
    return ctx.currentUser;
  }
  if (ctx.apiUser) {
    return ctx.apiUser;
  }
  if (ctx.userRole === USER_ROLES.STAFF) {
    return ctx.manageableUsers.find((u) => u.public_id === ctx.selectedUser);
  }
  return ctx.students.find((s) => s.user_info.public_id === ctx.selectedUser);
}

function buildUserOptions(
  userRole: string,
  manageableUsers: ManageableUser[],
  students: StudentData[]
) {
  if (userRole === USER_ROLES.STAFF) {
    return manageableUsers.map((u) => ({
      label: `${u.full_name} [${u.email}]`,
      value: u.public_id,
      description: u.employee_id ? `Employee ID: ${u.employee_id}` : undefined,
    }));
  }
  return students.map((student) => ({
    label: `${student.user_info.full_name} (${student.roll_number})`,
    value: student.user_info.public_id,
    description: student.user_info.email || student.admission_number,
  }));
}

async function fetchClassesData(
  isAdmin: boolean,
  teacherContext:
    | { class_teacher_for?: Array<{ public_id: string; name: string }> }
    | null
    | undefined
) {
  if (isAdmin) {
    const response = await api.get('/classes/admin/?page=1&page_size=100&is_deleted=false');
    return response.data;
  }
  if (teacherContext?.class_teacher_for) {
    return { data: teacherContext.class_teacher_for };
  }
  return { data: [] };
}

export default function ManageLeaveBalances() {
  const { user: currentUser } = useAuth();

  // Check if user is admin
  const isAdmin = currentUser?.role === USER_ROLES.ADMIN;

  // Fetch teacher's management context (only for non-admins)
  const { data: teacherContext, isLoading: isLoadingContext } = useTeacherManagementContext();

  const [userRole, setUserRole] = useState<UserRole>('staff');
  const [manageOwnBalance, setManageOwnBalance] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [dialog, setDialog] = useState<{
    open: boolean;
    mode: 'add' | 'edit';
    balance?: LeaveBalance | null;
  }>({
    open: false,
    mode: 'add',
    balance: null,
  });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; balance: LeaveBalance | null }>(
    {
      open: false,
      balance: null,
    }
  );

  useEffect(() => {
    setSelectedUser('');
    setSelectedClass('');
  }, [userRole]);

  useEffect(() => {
    if (manageOwnBalance) {
      setSelectedUser('');
      setSelectedClass('');
    }
  }, [manageOwnBalance]);

  const { data: manageableUsersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: QUERY_KEYS.users.manageable(userRole),
    queryFn: async () => {
      const response = await api.get(`/users/profile/manageable-users/?role=${userRole}`);
      return Array.isArray(response.data) ? { data: response.data } : response.data;
    },
    enabled: !manageOwnBalance && userRole === USER_ROLES.STAFF,
  });

  const { data: classesData, isLoading: isLoadingClasses } = useQuery({
    queryKey: QUERY_KEYS.classesForLeave.forBalances(userRole, isAdmin, teacherContext),
    queryFn: async () => fetchClassesData(isAdmin, teacherContext),
    enabled: !manageOwnBalance && userRole === USER_ROLES.STUDENT,
  });

  const { data: studentsData, isLoading: isLoadingStudents } = useQuery({
    queryKey: QUERY_KEYS.classesForLeave.students(selectedClass),
    queryFn: async () => {
      const response = await api.get(`/students/classes/${selectedClass}/students/`);
      return Array.isArray(response.data) ? { data: response.data } : response.data;
    },
    enabled: !manageOwnBalance && userRole === USER_ROLES.STUDENT && !!selectedClass,
  });

  // Get effective user ID from auth context or selected user
  const effectiveUserId = manageOwnBalance ? currentUser?.public_id : selectedUser;

  const { data: userAllocationsData, isLoading: isLoadingAllocations } = useQuery({
    queryKey: QUERY_KEYS.leave.userAllocations(effectiveUserId),
    queryFn: async () => {
      const response = await api.get(
        `/leave/employee/allocations/?user_public_id=${effectiveUserId}`
      );
      const data = response.data?.data ?? response.data;
      return { data: Array.isArray(data) ? data : [] };
    },
    enabled: !!effectiveUserId,
  });

  const {
    data: userBalancesData,
    isLoading: isLoadingBalances,
    refetch: refetchBalances,
  } = useQuery({
    queryKey: QUERY_KEYS.leave.userBalances(effectiveUserId),
    queryFn: async () => {
      const response = await api.get(`/leave/employee/balances/user/${effectiveUserId}/`);
      return response.data;
    },
    enabled: !!effectiveUserId,
  });

  const manageableUsers = useMemo(
    () => parseManageableUsers(manageableUsersData?.data),
    [manageableUsersData]
  );

  const classes = useMemo(() => parseClasses(classesData?.data), [classesData]);

  const students = useMemo(() => parseStudents(studentsData?.data), [studentsData]);
  const userAllocations = Array.isArray(userAllocationsData?.data)
    ? (userAllocationsData.data as LeaveAllocationForUser[])
    : [];

  // Leave balances API returns data: { user: {...}, balances: [...] }
  const userBalances = useMemo(() => {
    return Array.isArray(userBalancesData?.data?.balances)
      ? (userBalancesData.data.balances as LeaveBalance[])
      : [];
  }, [userBalancesData?.data?.balances]);

  // Filter and paginate balances
  const filteredBalances = useMemo(() => {
    if (!searchQuery.trim()) {
      return userBalances;
    }

    const query = searchQuery.toLowerCase();
    return userBalances.filter(
      (balance) =>
        balance.leave_allocation.leave_type_name.toLowerCase().includes(query) ||
        balance.leave_allocation.display_name.toLowerCase().includes(query) ||
        balance.leave_name.toLowerCase().includes(query)
    );
  }, [userBalances, searchQuery]);

  const paginatedBalances = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredBalances.slice(startIndex, endIndex);
  }, [filteredBalances, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredBalances.length / pageSize);

  const paginationInfo = {
    current_page: currentPage,
    page_size: pageSize,
    count: filteredBalances.length,
    total_pages: totalPages,
    has_next: currentPage < totalPages,
    has_previous: currentPage > 1,
    next_page: currentPage < totalPages ? currentPage + 1 : null,
    previous_page: currentPage > 1 ? currentPage - 1 : null,
  };

  // Get user details - either current user or selected user from API response or lists
  const rawUserDetails = useMemo(
    () =>
      resolveRawUserDetails({
        manageOwnBalance,
        currentUser,
        apiUser: userBalancesData?.data?.user,
        userRole,
        manageableUsers,
        selectedUser,
        students,
      }),
    [
      manageOwnBalance,
      currentUser,
      userBalancesData?.data?.user,
      userRole,
      manageableUsers,
      selectedUser,
      students,
    ]
  );

  // Normalize user details to handle different API response shapes
  const selectedUserDetails = useMemo(() => {
    if (!rawUserDetails) {
      return undefined;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return normalizeUserDetails(rawUserDetails as Record<string, any>);
  }, [rawUserDetails]);

  // Get allocated leave type names from user's balances
  const allocatedLeaveNames = new Set(userBalances.map((b) => b.leave_allocation.public_id));
  // Filter allocations to find unallocated leave types
  // Transform to match dialog's expected format
  const unallocatedLeaveTypes = userAllocations
    .filter((allocation) => !allocatedLeaveNames.has(allocation.public_id))
    .map((allocation) => ({
      public_id: allocation.public_id,
      leave_type_name: allocation.leave_type_name,
      leave_type_code: /\(([^()]+)\)/.exec(allocation.leave_type_name)?.[1] || 'N/A',
      display_name: allocation.leave_type_name,
      total_days: Number.parseFloat(allocation.total_days),
      max_carry_forward_days: Number.parseFloat(allocation.max_carry_forward_days),
    }));

  const pieChartData = userBalances.map((balance, index: number) => ({
    name: getLeaveTypeName(balance),
    value: Number.parseFloat(balance.total_allocated) || 0,
    color: COLORS[index % COLORS.length],
  }));

  const handleEditBalance = (balance: LeaveBalance) => {
    setDialog({ open: true, mode: 'edit', balance });
  };

  const deleteMutation = useDeleteLeaveBalance();

  const handleDeleteBalance = (balance: LeaveBalance) => {
    setDeleteDialog({ open: true, balance });
  };

  const confirmDelete = () => {
    if (!deleteDialog.balance) {
      return;
    }
    deleteMutation.mutate(deleteDialog.balance.public_id, {
      onSuccess: () => {
        toast.success(SuccessMessages.LEAVE.BALANCE_DELETED);
        refetchBalances();
        setDeleteDialog({ open: false, balance: null });
      },
      onError: (error: Error) => {
        const apiError = error as unknown as { response?: { data?: { message?: string } } };
        toast.error(ErrorMessages.LEAVE.DELETE_BALANCE_FAILED, {
          description: apiError.response?.data?.message || ErrorMessages.GENERIC_RETRY,
        });
      },
    });
  };

  const columns = useMemo(() => getLeaveBalanceColumns(handleEditBalance, handleDeleteBalance), []);

  const handleAddBalance = () => {
    if (unallocatedLeaveTypes.length > 0) {
      setDialog({ open: true, mode: 'add', balance: null });
      return;
    }

    if (userAllocations.length === 0) {
      const userOrgRole =
        typeof selectedUserDetails?.organization_role === 'object'
          ? selectedUserDetails?.organization_role?.name
          : selectedUserDetails?.organization_role;
      const roleLabel = userOrgRole || "this user's role";
      const description = isAdmin
        ? `No leave policies are configured for "${roleLabel}". Go to Leave Policies and either enable "All Roles" or add this specific role to the policy.`
        : `No leave types are configured for ${roleLabel}. Please contact the administrator to set up leave allocations.`;

      toast.warning('No leave allocations available', { description, duration: 6000 });
      return;
    }

    toast.info(ErrorMessages.LEAVE.NO_AVAILABLE_TYPES, {
      description: 'All leave types have been assigned to this user.',
    });
  };

  const handleDialogClose = (success?: boolean) => {
    setDialog({ open: false, mode: 'add', balance: null });
    if (success) {
      refetchBalances();
    }
  };

  const showUserSelection = !manageOwnBalance;
  const showBalances = !!effectiveUserId;
  const hasPermission = isAdmin || (!isLoadingContext && teacherContext?.can_manage_balances);

  const userOptions = useMemo(
    () => buildUserOptions(userRole, manageableUsers, students),
    [userRole, manageableUsers, students]
  );

  const userSelectDisabled =
    (userRole === USER_ROLES.STAFF && isLoadingUsers) ||
    (userRole === USER_ROLES.STUDENT && (!selectedClass || isLoadingStudents));

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Briefcase}
        title="Manage Leave Balances"
        description="Create and modify leave balances for your team members"
      />

      <LeavePermissionAlerts
        isAdmin={isAdmin}
        isLoadingContext={isLoadingContext}
        teacherContext={teacherContext}
      />

      {/* Only show content if admin OR teacher has management permissions */}
      {hasPermission && (
        <>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="manage-own" className="cursor-pointer font-medium">
                  Manage my own leave balance
                </Label>
                <Switch
                  id="manage-own"
                  checked={manageOwnBalance}
                  onCheckedChange={setManageOwnBalance}
                />
              </div>
            </CardContent>
          </Card>

          {showUserSelection && (
            <LeaveUserSelection
              isAdmin={isAdmin}
              teacherContext={teacherContext}
              userRole={userRole}
              setUserRole={setUserRole}
              selectedUser={selectedUser}
              setSelectedUser={setSelectedUser}
              selectedClass={selectedClass}
              setSelectedClass={setSelectedClass}
              classes={classes}
              isLoadingClasses={isLoadingClasses}
              userOptions={userOptions}
              userSelectDisabled={userSelectDisabled}
            />
          )}

          {showBalances && (
            <>
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">User Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-hidden rounded-lg border">
                      <table className="w-full">
                        <thead className="sr-only">
                          <tr>
                            <th>Field</th>
                            <th>Value</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          <tr className="hover:bg-muted/50 transition-colors">
                            <td className="text-muted-foreground w-40 px-4 py-3 text-sm font-medium">
                              Full Name
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold">
                              {selectedUserDetails?.full_name || '—'}
                            </td>
                          </tr>
                          <tr className="hover:bg-muted/50 transition-colors">
                            <td className="text-muted-foreground w-40 px-4 py-3 text-sm font-medium">
                              Email
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {selectedUserDetails?.email || '—'}
                            </td>
                          </tr>
                          <tr className="hover:bg-muted/50 transition-colors">
                            <td className="text-muted-foreground w-40 px-4 py-3 text-sm font-medium">
                              Role
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <Badge variant="outline" className="font-medium capitalize">
                                {selectedUserDetails?.role || '—'}
                              </Badge>
                            </td>
                          </tr>
                          <tr className="hover:bg-muted/50 transition-colors">
                            <td className="text-muted-foreground w-40 px-4 py-3 text-sm font-medium">
                              Organization Role
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <Badge variant="secondary" className="font-medium">
                                {typeof selectedUserDetails?.organization_role === 'object' &&
                                selectedUserDetails.organization_role
                                  ? selectedUserDetails.organization_role.name
                                  : selectedUserDetails?.organization_role || 'N/A'}
                              </Badge>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Leave Types Distribution */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Leave Types Distribution</CardTitle>
                    <CardDescription className="mt-1">
                      Visual breakdown of allocations
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <LeaveDistributionChart data={pieChartData} />
                  </CardContent>
                </Card>
              </div>

              {/* Leave Balances Table - Full Width with Pagination and Filters */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Leave Balances</CardTitle>
                      <CardDescription className="mt-1">
                        {filteredBalances.length} of {userBalances.length} leave type(s)
                      </CardDescription>
                    </div>
                    <Button
                      onClick={handleAddBalance}
                      variant="brand"
                      size="sm"
                      className="font-medium shadow-md transition-all hover:shadow-lg"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Leave Balance
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Search Filter */}
                  <div className="relative">
                    <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                    <Input
                      placeholder={FormPlaceholders.SEARCH_LEAVE_TYPES}
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1); // Reset to first page on search
                      }}
                      className="pl-9"
                    />
                  </div>

                  {/* Data Table */}
                  <DataTable
                    columns={columns}
                    data={paginatedBalances}
                    isLoading={isLoadingBalances || isLoadingAllocations}
                    getRowKey={(row: LeaveBalance) => row.public_id}
                    pagination={paginationInfo}
                    onPageChange={setCurrentPage}
                  />
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}

      <LeaveBalanceDialog
        open={dialog.open}
        mode={dialog.mode}
        data={dialog.balance || undefined}
        availableAllocations={unallocatedLeaveTypes}
        userPublicId={effectiveUserId}
        onClose={handleDialogClose}
      />

      <DeleteConfirmationDialog
        open={deleteDialog.open}
        onOpenChange={(open) => !open && setDeleteDialog({ open, balance: null })}
        onConfirm={confirmDelete}
        title="Delete Leave Balance"
        itemName={deleteDialog.balance ? getLeaveTypeName(deleteDialog.balance) : ''}
        isDeleting={deleteMutation.isPending}
        deleteButtonText="Delete Balance"
      />
    </div>
  );
}
