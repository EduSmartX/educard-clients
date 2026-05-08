/**
 * Leave Management Dashboard
 */
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Briefcase,
  Plus,
  Calendar,
  RefreshCw,
  Filter,
  X,
  ArrowLeft,
  User,
  Mail,
  Phone,
  Briefcase as BriefcaseIcon,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/common';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { ResourceFilter, type FilterField } from '@/components/filters/resource-filter';
import {
  useMyLeaveBalancesSummary,
  useMyLeaveRequests,
  useUserLeaveBalancesSummary,
  useUserLeaveRequests,
} from '../hooks';
import { LeaveRequestStatus, type LeaveBalanceSummary, type LeaveRequest } from '../types';
import { getLeaveRequestColumns } from './leave-request-table-columns';
import { CancelLeaveRequestDialog } from './cancel-leave-request-dialog';
import { getLeaveTypeName } from '../utils/leave-name-helper';
import api from '@/lib/api';

interface UserInfo {
  public_id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string;
  role: string;
  role_display: string;
  organization_role: string | { code: string; name: string };
  employee_id?: string;
  profile_image?: string;
}

export function LeaveDashboard() {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId?: string }>();
  const isViewingOtherUser = !!userId;

  const [cancelRequest, setCancelRequest] = useState<LeaveRequest | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string>>({});

  // Fetch user info if viewing another user's dashboard
  const { data: userInfoData } = useQuery({
    queryKey: ['user-info', userId],
    queryFn: async () => {
      const response = await api.get(`/users/profile/${userId}/`);
      return response.data;
    },
    enabled: isViewingOtherUser,
  });

  const userInfo = userInfoData?.data as UserInfo | undefined;

  // Fetch leave balances - use appropriate hook based on viewing mode
  const {
    data: myBalancesData,
    isLoading: isLoadingMyBalances,
    refetch: refetchMyBalances,
  } = useMyLeaveBalancesSummary();

  const {
    data: userBalancesData,
    isLoading: isLoadingUserBalances,
    refetch: refetchUserBalances,
  } = useUserLeaveBalancesSummary(userId || '');

  const balancesData = isViewingOtherUser ? userBalancesData : myBalancesData;
  const isLoadingBalances = isViewingOtherUser ? isLoadingUserBalances : isLoadingMyBalances;
  const refetchBalances = isViewingOtherUser ? refetchUserBalances : refetchMyBalances;

  // Fetch leave requests - use appropriate hook based on viewing mode
  const {
    data: myRequestsData,
    isLoading: isLoadingMyRequests,
    refetch: refetchMyRequests,
  } = useMyLeaveRequests({
    page: currentPage,
    page_size: 10,
    ...appliedFilters,
  });

  const {
    data: userRequestsData,
    isLoading: isLoadingUserRequests,
    refetch: refetchUserRequests,
  } = useUserLeaveRequests(userId || '', {
    page: currentPage,
    page_size: 10,
    ...appliedFilters,
  });

  const requestsData = isViewingOtherUser ? userRequestsData : myRequestsData;
  const isLoadingRequests = isViewingOtherUser ? isLoadingUserRequests : isLoadingMyRequests;
  const refetchRequests = isViewingOtherUser ? refetchUserRequests : refetchMyRequests;

  const rawBalances = balancesData?.data as unknown;
  let balances: LeaveBalanceSummary[] = [];
  if (Array.isArray(rawBalances)) {
    balances = rawBalances as LeaveBalanceSummary[];
  } else if (
    rawBalances &&
    typeof rawBalances === 'object' &&
    'balances' in (rawBalances as object)
  ) {
    const ob = rawBalances as { balances?: unknown };
    if (Array.isArray(ob.balances)) {
      balances = ob.balances as LeaveBalanceSummary[];
    }
  }
  const requests = Array.isArray(requestsData?.data) ? requestsData.data : [];
  const pagination = requestsData?.pagination;

  // Map pagination to DataTable format
  const mappedPagination = pagination
    ? (() => {
        const current_page = Number(pagination.page) || 1;
        const page_size = Number(pagination.page_size) || Number(pagination.count) || 10;
        const count = Number(pagination.count) || 0;
        const total_pages =
          Number(pagination.total_pages) || Math.max(1, Math.ceil(count / page_size));

        return {
          current_page,
          total_pages,
          count,
          page_size,
          has_next: Boolean(pagination.has_next),
          has_previous: Boolean(pagination.has_previous),
          next_page: pagination.has_next ? current_page + 1 : null,
          previous_page: pagination.has_previous ? current_page - 1 : null,
        };
      })()
    : undefined;

  const activeFiltersCount = Object.keys(appliedFilters).filter(
    (key) => appliedFilters[key]
  ).length;

  const handleApplyLeave = () => navigate('/leave/requests/new');
  const handleRefresh = () => {
    refetchBalances();
    refetchRequests();
  };
  const handleCancelRequest = (request: LeaveRequest) => setCancelRequest(request);
  const handleFilterApply = (applied: Record<string, string>) => {
    setAppliedFilters(applied);
    setFilters(applied);
    setCurrentPage(1);
  };
  const handleFilterReset = () => {
    setFilters({});
    setAppliedFilters({});
    setCurrentPage(1);
  };

  const filterFields: FilterField[] = [
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: LeaveRequestStatus.PENDING, label: 'Pending' },
        { value: LeaveRequestStatus.APPROVED, label: 'Approved' },
        { value: LeaveRequestStatus.REJECTED, label: 'Rejected' },
        { value: LeaveRequestStatus.CANCELLED, label: 'Cancelled' },
      ],
      placeholder: 'All statuses',
    },
    {
      name: 'start_date_from',
      label: 'From Date',
      type: 'date',
      placeholder: 'Start date',
    },
    {
      name: 'start_date_to',
      label: 'To Date',
      type: 'date',
      placeholder: 'End date',
    },
  ];

  const columns = getLeaveRequestColumns({
    onView: (request) => navigate(`/leave/requests/${request.public_id}`),
    onCancel: handleCancelRequest,
  });

  // Modern UI: summary cards and per-type cards
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fcff] to-[#f3f7fa] p-0">
      <div className="mx-auto max-w-6xl space-y-6 px-2 py-4 sm:space-y-8 sm:px-4 sm:py-8">
        {/* User Info Banner - Only show when viewing another user's dashboard */}
        {isViewingOtherUser && userInfo && (
          <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  {userInfo.profile_image ? (
                    <img
                      src={userInfo.profile_image}
                      alt={userInfo.full_name}
                      className="h-16 w-16 rounded-full border-2 border-blue-300 object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-blue-300 bg-blue-200">
                      <User className="h-8 w-8 text-blue-600" />
                    </div>
                  )}
                  <div className="space-y-2">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{userInfo.full_name}</h2>
                      <p className="text-sm text-gray-600">
                        {typeof userInfo.organization_role === 'object' &&
                        userInfo.organization_role
                          ? userInfo.organization_role.name
                          : userInfo.organization_role}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-700">
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span>{userInfo.email}</span>
                      </div>
                      {userInfo.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <span>{userInfo.phone}</span>
                        </div>
                      )}
                      {userInfo.employee_id && (
                        <div className="flex items-center gap-1.5">
                          <BriefcaseIcon className="h-4 w-4 text-gray-500" />
                          <span>ID: {userInfo.employee_id}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => navigate('/leave/reviews')}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Reviews
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <PageHeader
          title={
            isViewingOtherUser ? `${userInfo?.full_name}'s Leave Dashboard` : 'Leave Management'
          }
          icon={Briefcase}
          description={
            isViewingOtherUser
              ? "View employee's leave balances and requests"
              : 'Manage your leave balances and requests'
          }
        >
          <Button
            onClick={handleRefresh}
            variant="outline"
            className="gap-2 border-blue-300 text-blue-700 hover:bg-blue-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          {!isViewingOtherUser && (
            <Button onClick={handleApplyLeave} variant="brand" className="gap-2 shadow-md">
              <Plus className="h-4 w-4" />
              Apply for Leave
            </Button>
          )}
        </PageHeader>

        <div>
          <h2 className="text-primary mb-3 text-xl font-bold sm:mb-4 sm:text-2xl">
            Leave Balances
          </h2>
          {isLoadingBalances && !balancesData ? (
            <div className="mb-4 flex gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="w-[180px] min-w-[180px]">
                  <CardContent className="py-8">
                    <Skeleton className="mb-2 h-10 w-24" />
                    <Skeleton className="h-5 w-20" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : balances.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="text-muted-foreground mb-4 h-12 w-12" />
                <p className="text-muted-foreground text-center">
                  No leave balances found. Contact your administrator to set up your leave
                  allocations.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Summary Cards: Available, Used, Pending */}
              <div className="mb-6 grid grid-cols-3 gap-3 sm:gap-4">
                {(() => {
                  const totalAvailable = balances.reduce((sum, b) => sum + (b.available || 0), 0);
                  return (
                    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-green-300 bg-green-50 px-2 py-4 shadow-sm sm:px-6 sm:py-5">
                      <div className="text-2xl font-extrabold text-green-700 sm:text-4xl">
                        {totalAvailable.toFixed(1)}
                      </div>
                      <div className="mt-1 text-center text-xs font-semibold text-green-900 sm:mt-2 sm:text-sm">
                        Total Available
                      </div>
                    </div>
                  );
                })()}
                {(() => {
                  const totalUsed = balances.reduce((sum, b) => sum + (b.used || 0), 0);
                  return (
                    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-red-300 bg-red-50 px-2 py-4 shadow-sm sm:px-6 sm:py-5">
                      <div className="text-2xl font-extrabold text-red-700 sm:text-4xl">
                        {totalUsed}
                      </div>
                      <div className="mt-1 text-center text-xs font-semibold text-red-900 sm:mt-2 sm:text-sm">
                        Total Used
                      </div>
                    </div>
                  );
                })()}
                {(() => {
                  const totalPending = balances.reduce((sum, b) => sum + (b.pending || 0), 0);
                  return (
                    <div className="flex flex-col items-center justify-center rounded-xl border-2 border-yellow-300 bg-yellow-50 px-2 py-4 shadow-sm sm:px-6 sm:py-5">
                      <div className="text-2xl font-extrabold text-yellow-700 sm:text-4xl">
                        {totalPending}
                      </div>
                      <div className="mt-1 text-center text-xs font-semibold text-yellow-900 sm:mt-2 sm:text-sm">
                        Pending Leaves
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Per-Leave-Type Cards */}
              <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
                {balances.map((balance, index) => {
                  const total = balance.total_allocated || 0;
                  const available = balance.available || 0;
                  const used = balance.used || 0;
                  const pending = balance.pending || 0;

                  // Color palette cycling
                  const cardStyles = [
                    {
                      border: 'border-green-300',
                      bg: 'bg-green-50',
                      text: 'text-green-700',
                      code: 'border-green-400',
                    },
                    {
                      border: 'border-blue-300',
                      bg: 'bg-blue-50',
                      text: 'text-blue-700',
                      code: 'border-blue-400',
                    },
                    {
                      border: 'border-purple-300',
                      bg: 'bg-purple-50',
                      text: 'text-purple-700',
                      code: 'border-purple-400',
                    },
                    {
                      border: 'border-orange-300',
                      bg: 'bg-orange-50',
                      text: 'text-orange-700',
                      code: 'border-orange-400',
                    },
                    {
                      border: 'border-green-300',
                      bg: 'bg-green-50',
                      text: 'text-green-700',
                      code: 'border-green-400',
                    },
                  ];
                  const style = cardStyles[index % cardStyles.length];

                  return (
                    <div
                      key={balance.public_id}
                      className={`rounded-xl border-2 ${style.border} ${style.bg} flex flex-col items-center justify-center px-3 py-4 shadow-sm transition-shadow hover:shadow-md sm:px-6 sm:py-5`}
                    >
                      <div
                        className={`mb-2 text-xs font-bold sm:text-base ${style.text} text-center`}
                      >
                        {getLeaveTypeName(balance)}
                      </div>
                      <div className="mb-2 flex flex-wrap items-center justify-center gap-2">
                        <div className={`text-xl font-extrabold sm:text-3xl ${style.text}`}>
                          {parseFloat(total.toString()).toFixed(1)}
                        </div>
                      </div>
                      <div className="flex w-full flex-col gap-1.5 text-[10px] font-semibold sm:gap-2 sm:text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-700">Available:</span>
                          <span className="font-bold text-green-700">{available}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-700">Used:</span>
                          <span className="font-bold text-red-700">{used}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-700">Pending:</span>
                          <span className="font-bold text-yellow-700">{pending}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Leave Requests</CardTitle>
                <CardDescription>Your leave applications and their status</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {activeFiltersCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleFilterReset}
                    className="h-8 px-2 text-xs"
                  >
                    <X className="mr-1 h-3 w-3" />
                    Clear ({activeFiltersCount})
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {showFilters && (
              <div className="mb-4">
                <ResourceFilter
                  fields={filterFields}
                  onFilter={handleFilterApply}
                  onReset={handleFilterReset}
                  defaultValues={filters}
                  onFieldChange={(name, value) =>
                    setFilters((prev) => ({ ...prev, [name]: value }))
                  }
                />
              </div>
            )}
            {isLoadingRequests && !requestsData ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={requests}
                isLoading={isLoadingRequests}
                pagination={mappedPagination}
                onPageChange={setCurrentPage}
                emptyMessage={
                  activeFiltersCount > 0
                    ? 'No leave requests found matching your filters.'
                    : 'No leave requests found. Click "Apply Leave" to create your first request.'
                }
                emptyAction={
                  !activeFiltersCount && requests.length === 0
                    ? {
                        label: 'Apply for Leave',
                        onClick: handleApplyLeave,
                      }
                    : undefined
                }
                getRowKey={(row) => row.public_id}
              />
            )}
          </CardContent>
        </Card>

        {cancelRequest && (
          <CancelLeaveRequestDialog
            request={cancelRequest}
            isOpen={!!cancelRequest}
            onClose={() => setCancelRequest(null)}
            onSuccess={() => {
              setCancelRequest(null);
              refetchRequests();
              refetchBalances();
            }}
          />
        )}
      </div>
    </div>
  );
}
