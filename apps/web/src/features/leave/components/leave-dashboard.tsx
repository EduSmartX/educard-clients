/**
 * Leave Management Dashboard
 */
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Briefcase, Plus, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/common';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
import { UserInfoBanner, type UserInfo } from './user-info-banner';
import { LeaveBalancesSection } from './leave-balances-section';
import { LeaveRequestsFilterHeader } from './leave-requests-filter-header';
import api from '@/lib/api';

function parseLeaveBalances(rawBalances: unknown): LeaveBalanceSummary[] {
  if (Array.isArray(rawBalances)) {
    return rawBalances as LeaveBalanceSummary[];
  }
  if (rawBalances && typeof rawBalances === 'object' && 'balances' in rawBalances) {
    const ob = rawBalances as { balances?: unknown };
    if (Array.isArray(ob.balances)) {
      return ob.balances as LeaveBalanceSummary[];
    }
  }
  return [];
}

export function LeaveDashboard() {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId?: string }>();
  const isViewingOtherUser = !!userId;

  const [cancelRequest, setCancelRequest] = useState<LeaveRequest | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
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
  const balances = parseLeaveBalances(rawBalances);
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

  const pageTitle = isViewingOtherUser
    ? `${userInfo?.full_name}'s Leave Dashboard`
    : 'Leave Management';
  const pageDescription = isViewingOtherUser
    ? "View employee's leave balances and requests"
    : 'Manage your leave balances and requests';
  const emptyMessage =
    activeFiltersCount > 0
      ? 'No leave requests found matching your filters.'
      : 'No leave requests found. Click "Apply Leave" to create your first request.';
  const emptyAction =
    !activeFiltersCount && requests.length === 0
      ? { label: 'Apply for Leave', onClick: handleApplyLeave }
      : undefined;

  // Modern UI: summary cards and per-type cards
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fcff] to-[#f3f7fa] p-0">
      <div className="mx-auto max-w-6xl space-y-6 px-2 py-4 sm:space-y-8 sm:px-4 sm:py-8">
        {/* User Info Banner - Only show when viewing another user's dashboard */}
        {isViewingOtherUser && userInfo && (
          <UserInfoBanner userInfo={userInfo} onBack={() => navigate('/leave/reviews')} />
        )}

        <PageHeader title={pageTitle} icon={Briefcase} description={pageDescription}>
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

        <LeaveBalancesSection
          balances={balances}
          isLoading={isLoadingBalances}
          hasData={!!balancesData}
        />

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Leave Requests</CardTitle>
                <CardDescription>Your leave applications and their status</CardDescription>
              </div>
              <LeaveRequestsFilterHeader
                activeFiltersCount={activeFiltersCount}
                onReset={handleFilterReset}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <ResourceFilter
                fields={filterFields}
                onFilter={handleFilterApply}
                onReset={handleFilterReset}
                defaultValues={filters}
                onFieldChange={(name, value) => setFilters((prev) => ({ ...prev, [name]: value }))}
              />
            </div>
            {isLoadingRequests && !requestsData ? (
              <div className="space-y-3">
                {[
                  'skeleton-req-1',
                  'skeleton-req-2',
                  'skeleton-req-3',
                  'skeleton-req-4',
                  'skeleton-req-5',
                ].map((key) => (
                  <Skeleton key={key} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={requests}
                isLoading={isLoadingRequests}
                pagination={mappedPagination}
                onPageChange={setCurrentPage}
                emptyMessage={emptyMessage}
                emptyAction={emptyAction}
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
