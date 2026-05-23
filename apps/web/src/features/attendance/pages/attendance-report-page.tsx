import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { CalendarDays, Loader2 } from 'lucide-react';

import { PageHeader } from '@/components/common';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Combobox } from '@/components/ui/combobox';
import { MonthYearPicker } from '@/components/ui/month-year-picker';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useAuth } from '@/hooks/use-auth';
import {
  getEmployeeAttendance,
  getMonthlyAttendanceSummary,
} from '@/features/attendance/api/attendance-api';
import apiClient from '@/lib/api';
import { EmployeeInfoCard } from '@/features/attendance/components/employee-info-card';
import { MonthlyCalendarCard } from '@/features/attendance/components/monthly-calendar-card';
import { AttendanceInsightsPanel } from '@/features/attendance/components/attendance-insights-panel';
import { YearlyCalendarGrid } from '@/features/attendance/components/yearly-calendar-grid';
import type { ReportType, ViewType } from '../components/attendance-report-filters';
import { getCurrentAcademicYear } from '@/lib/api/academic-year-api';

type AttendanceRecord = {
  public_id: string;
  date: string;
  morning_present: boolean;
  afternoon_present: boolean;
  approval_status: string;
};

interface ManageableUser {
  public_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  full_name: string;
}

function getOrganizationRoleName(role: unknown): string | null {
  if (typeof role === 'string') {
    return role;
  }
  return (role as { name?: string })?.name || null;
}

function parseManageableUsers(data: unknown): ManageableUser[] {
  if (!data) { return []; }
  const record = data as { users?: unknown };
  if (Array.isArray(record.users)) {
    return record.users as ManageableUser[];
  }
  if (Array.isArray(data)) {
    return data as ManageableUser[];
  }
  return [];
}

async function fetchMonthlyAttendanceDetail(
  viewType: ViewType,
  startDate: string,
  endDate: string,
  targetUserId: string | undefined
) {
  if (viewType === 'self') {
    return getEmployeeAttendance({ from_date: startDate, to_date: endDate });
  }
  const response = await apiClient.get('/attendance/employee-attendance/', {
    params: { from_date: startDate, to_date: endDate, user: targetUserId },
  });
  const payload = response.data?.data || {};
  return {
    records: payload.records || [],
    stats: payload.stats || {},
    employee_id: payload.employee_id || null,
    user_info: payload.user_info || null,
    date_range: payload.date_range || { from_date: startDate, to_date: endDate },
    working_day_policy: payload.working_day_policy || null,
    calendar_exceptions: payload.calendar_exceptions || [],
    holiday_descriptions: payload.holiday_descriptions || {},
    pagination: payload.pagination || {},
  };
}

export function AttendanceReportPage() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const [reportType, setReportType] = useState<ReportType>('monthly');
  const [viewType, setViewType] = useState<ViewType>('self');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [showCalendarView, setShowCalendarView] = useState(false);

  // Extract year and month from selectedDate for backward compatibility
  const selectedYear = selectedDate.getFullYear();
  const selectedMonth = selectedDate.getMonth();

  // Fetch current academic year (only needed for yearly report view)
  const { data: academicYear } = useQuery({
    queryKey: ['current-academic-year'],
    queryFn: getCurrentAcademicYear,
  });

  // No need to update selectedDate based on academic year
  // The report should default to current month which is already set via useState(new Date())

  // Fetch manageable users for staff view
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

  const manageableUsers = useMemo(
    () => parseManageableUsers(manageableUsersData?.data),
    [manageableUsersData]
  );

  // Determine date range based on report type (only needed for monthly view)
  const { startDate, endDate } = useMemo(() => {
    if (reportType === 'monthly') {
      const monthStart = startOfMonth(new Date(selectedYear, selectedMonth, 1));
      const monthEnd = endOfMonth(new Date(selectedYear, selectedMonth, 1));
      return {
        startDate: format(monthStart, 'yyyy-MM-dd'),
        endDate: format(monthEnd, 'yyyy-MM-dd'),
      };
    }
    // For yearly reports, we don't need these dates since backend API handles it
    return { startDate: '', endDate: '' };
  }, [reportType, selectedYear, selectedMonth]);

  // Determine which user's data to fetch
  const targetUserId = viewType === 'staff' ? selectedUser : user?.public_id;

  // 🚀 NEW: Fetch monthly attendance summary for yearly reports (backend-calculated)
  const { data: monthlySummaryData, isLoading: loadingMonthlySummary } = useQuery({
    queryKey: ['monthly-attendance-summary', targetUserId, selectedYear],
    queryFn: () =>
      getMonthlyAttendanceSummary({
        user: targetUserId!,
        year: selectedYear,
      }),
    enabled: !!targetUserId && reportType === 'yearly',
  });

  // Fetch monthly attendance data for monthly view (day-by-day detail)
  const { data: monthlyDetailData, isLoading: loadingMonthlyDetail } = useQuery({
    queryKey: ['attendance-report-monthly', targetUserId, startDate, endDate, viewType],
    queryFn: () => fetchMonthlyAttendanceDetail(viewType, startDate, endDate, targetUserId),
    enabled: !!targetUserId && reportType === 'monthly',
  });

  const isLoading = loadingMonthlySummary || loadingMonthlyDetail || isLoadingUsers;

  // ✅ Backend-calculated yearly data (no frontend calculation needed!)
  const yearlyData = useMemo(() => {
    if (reportType !== 'yearly' || !monthlySummaryData) {
      return null;
    }

    const monthlyStats = monthlySummaryData.monthly_data.map((month) => ({
      month: month.month_name,
      totalWorkingDays: month.total_working_days,
      present: month.total_present,
      absent: month.total_absent,
      leaves: month.total_leaves,
      holidays: month.total_holidays,
      attendancePercentage: month.attendance_percentage,
    }));

    const totals = monthlySummaryData.total_summary;

    return { monthlyStats, totals };
  }, [reportType, monthlySummaryData]);

  // For monthly calendar view, create lookup maps from the detail data
  const { attendanceByDate, leaveByDate, holidaySet, exceptionalWorkByDate } = useMemo(() => {
    if (!monthlyDetailData) {
      return {
        attendanceByDate: new Map(),
        leaveByDate: new Map(),
        holidaySet: new Set<string>(),
        exceptionalWorkByDate: new Map(),
      };
    }

    // Build attendance map
    const attMap = new Map<string, AttendanceRecord>();
    (monthlyDetailData.records || []).forEach((record: AttendanceRecord) => {
      attMap.set(record.date, record);
    });

    // Build leave map from embedded leave records
    const lvMap = new Map();
    // Note: monthlyDetailData.records already have leaves merged, so we extract from there
    // Or if you have separate leave data, process it here

    // Build holiday set from holiday_descriptions
    const holSet = new Set<string>();
    if (monthlyDetailData.holiday_descriptions) {
      Object.keys(monthlyDetailData.holiday_descriptions).forEach((dateKey) => {
        holSet.add(dateKey);
      });
    }

    // Build exceptional work map
    const excMap = new Map();
    (monthlyDetailData.calendar_exceptions || []).forEach((exception: { date: string }) => {
      excMap.set(exception.date, exception);
    });

    return {
      attendanceByDate: attMap,
      leaveByDate: lvMap,
      holidaySet: holSet,
      exceptionalWorkByDate: excMap,
    };
  }, [monthlyDetailData]);

  const loading = isLoading;

  const selectedUserData = useMemo(() => {
    if (viewType === 'self') {
      return user;
    }
    // For staff view, prefer user_info from API response (more complete data)
    if (viewType === 'staff' && monthlyDetailData?.user_info) {
      return monthlyDetailData.user_info;
    }
    return manageableUsers.find((u) => u.public_id === selectedUser);
  }, [viewType, user, manageableUsers, selectedUser, monthlyDetailData]);

  return (
    <div className="container mx-auto space-y-6 py-6">
      <PageHeader
        title="Attendance Report"
        description="View yearly and monthly attendance reports with comprehensive analytics"
      />

      {/* Filter Section */}
      <Card className="border border-blue-200 shadow-sm" style={{ backgroundColor: '#E3F2FD' }}>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {/* Report Type */}
            <div>
              <span className="mb-2 block text-sm font-semibold text-gray-700">Report Type</span>
              <SearchableSelect
                options={[
                  { value: 'yearly', label: 'Yearly Report' },
                  { value: 'monthly', label: 'Monthly Report' },
                ]}
                value={reportType}
                onValueChange={(value) => setReportType(value as ReportType)}
                placeholder="Select report type"
                className="bg-white"
              />
            </div>

            {/* View Type */}
            <div>
              <span className="mb-2 block text-sm font-semibold text-gray-700">View</span>
              <SearchableSelect
                options={[
                  { value: 'self', label: 'Self' },
                  { value: 'staff', label: 'Staff' },
                ]}
                value={viewType}
                onValueChange={(value) => setViewType(value as ViewType)}
                placeholder="Select view"
                className="bg-white"
              />
            </div>

            {/* Staff Selection */}
            {viewType === 'staff' && (
              <div>
                <span className="mb-2 block text-sm font-semibold text-gray-700">Select Staff</span>
                <Combobox
                  options={manageableUsers.map((staff) => ({
                    value: staff.public_id,
                    label: staff.full_name || `${staff.first_name} ${staff.last_name}`,
                  }))}
                  value={selectedUser}
                  onValueChange={setSelectedUser}
                  placeholder="Choose staff member"
                  searchPlaceholder="Search staff..."
                  emptyText="No staff members found"
                  disabled={isLoadingUsers}
                  className="bg-white"
                />
              </div>
            )}

            {/* Month/Year Selection */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                {reportType === 'monthly' ? 'Select Month & Year' : 'Select Year'}
              </label>
              <MonthYearPicker
                value={selectedDate}
                onChange={(date) => date && setSelectedDate(date)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Info Card with Monthly Report - Matching Timesheet Overview Design */}
      {selectedUserData && (
        <Card className="border border-[#bfd591] shadow-sm" style={{ backgroundColor: '#C5D89D' }}>
          <CardContent className="grid grid-cols-1 gap-4 pt-6 lg:grid-cols-2">
            <EmployeeInfoCard
              user={selectedUserData}
              organization={
                'organization' in selectedUserData
                  ? (selectedUserData.organization as { name?: string })
                  : undefined
              }
              organizationRole={
                'organization_role' in selectedUserData && selectedUserData.organization_role
                  ? getOrganizationRoleName(selectedUserData.organization_role)
                  : null
              }
              employeeId={monthlyDetailData?.employee_id || null}
              showProfileImage={true}
            />

            {targetUserId && monthlyDetailData && reportType === 'monthly' && (
              <Card className="border-0 bg-white shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-xl font-bold">
                      <CalendarDays className="h-6 w-6 text-blue-600" />
                      Monthly Report
                    </CardTitle>
                    <Badge variant="outline" className="text-sm">
                      {format(new Date(selectedYear, selectedMonth), 'MMMM yyyy')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="mb-1 text-sm text-gray-600">Attendance Summary</div>
                    <div className="mb-2 text-base font-semibold">
                      {monthlyDetailData.stats?.total_working_days > 0
                        ? `${Math.round((monthlyDetailData?.stats?.total_present / monthlyDetailData?.stats?.total_working_days) * 100)}% present`
                        : '0% present'}
                    </div>
                    <div className="flex h-2 overflow-hidden rounded-full bg-gray-200">
                      {monthlyDetailData.stats?.total_present > 0 && (
                        <div
                          className="bg-green-500"
                          style={{
                            width: `${(monthlyDetailData?.stats?.total_present / monthlyDetailData?.stats?.total_working_days) * 100}%`,
                          }}
                        />
                      )}
                      {monthlyDetailData.stats?.total_absent > 0 && (
                        <div
                          className="bg-red-500"
                          style={{
                            width: `${(monthlyDetailData?.stats?.total_absent / monthlyDetailData?.stats?.total_working_days) * 100}%`,
                          }}
                        />
                      )}
                      {monthlyDetailData.stats?.total_leaves > 0 && (
                        <div
                          className="bg-orange-500"
                          style={{
                            width: `${(monthlyDetailData?.stats?.total_leaves / monthlyDetailData?.stats?.total_working_days) * 100}%`,
                          }}
                        />
                      )}
                      {monthlyDetailData.stats?.total_holidays > 0 && (
                        <div
                          className="bg-purple-500"
                          style={{
                            width: `${(monthlyDetailData?.stats?.total_holidays / monthlyDetailData?.stats?.total_working_days) * 100}%`,
                          }}
                        />
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-xs text-gray-600">
                      <span className="flex items-center gap-1">
                        <span className="h-3 w-3 rounded-sm bg-green-500"></span>
                        Present {monthlyDetailData.stats?.total_present || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="h-3 w-3 rounded-sm bg-red-500"></span>
                        Absent {monthlyDetailData.stats?.total_absent || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="h-3 w-3 rounded-sm bg-orange-500"></span>
                        Leave {monthlyDetailData.stats?.total_leaves || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="h-3 w-3 rounded-sm bg-purple-500"></span>
                        Holiday {monthlyDetailData.stats?.total_holidays || 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {targetUserId && yearlyData && reportType === 'yearly' && (
              <Card className="border-0 bg-white shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-xl font-bold">
                      <CalendarDays className="h-6 w-6 text-blue-600" />
                      Yearly Report
                    </CardTitle>
                    <Badge variant="outline" className="text-sm">
                      {academicYear
                        ? academicYear.name
                        : `${selectedYear}-${String(selectedYear + 1).slice(-2)}`}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="mb-1 text-sm text-gray-600">Attendance Summary</div>
                    <div className="mb-2 text-base font-semibold">
                      {yearlyData.totals?.total_working_days > 0
                        ? `${Math.round((yearlyData.totals?.total_present / yearlyData.totals?.total_working_days) * 100)}% present`
                        : '0% present'}
                    </div>
                    <div className="flex h-2 overflow-hidden rounded-full bg-gray-200">
                      {yearlyData.totals?.total_present > 0 && (
                        <div
                          className="bg-green-500"
                          style={{
                            width: `${(yearlyData.totals?.total_present / yearlyData.totals?.total_working_days) * 100}%`,
                          }}
                        />
                      )}
                      {yearlyData.totals?.total_absent > 0 && (
                        <div
                          className="bg-red-500"
                          style={{
                            width: `${(yearlyData.totals?.total_absent / yearlyData.totals?.total_working_days) * 100}%`,
                          }}
                        />
                      )}
                      {yearlyData.totals?.total_leaves > 0 && (
                        <div
                          className="bg-orange-500"
                          style={{
                            width: `${(yearlyData.totals?.total_leaves / yearlyData.totals?.total_working_days) * 100}%`,
                          }}
                        />
                      )}
                      {yearlyData.totals?.total_holidays > 0 && (
                        <div
                          className="bg-purple-500"
                          style={{
                            width: `${(yearlyData.totals?.total_holidays / yearlyData.totals?.total_working_days) * 100}%`,
                          }}
                        />
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-xs text-gray-600">
                      <span className="flex items-center gap-1">
                        <span className="h-3 w-3 rounded-sm bg-green-500"></span>
                        Present {yearlyData.totals?.total_present || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="h-3 w-3 rounded-sm bg-red-500"></span>
                        Absent {yearlyData.totals?.total_absent || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="h-3 w-3 rounded-sm bg-orange-500"></span>
                        Leave {yearlyData.totals?.total_leaves || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="h-3 w-3 rounded-sm bg-purple-500"></span>
                        Holiday {yearlyData.totals?.total_holidays || 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      )}

      {/* View Calendar Button for Yearly Report */}
      {reportType === 'yearly' && targetUserId && monthlySummaryData && (
        <div className="flex justify-center">
          <Button
            onClick={() => setShowCalendarView(!showCalendarView)}
            variant={showCalendarView ? 'default' : 'outline'}
            className={`min-w-[200px] ${showCalendarView ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}`}
          >
            {showCalendarView ? 'Hide Calendar View' : 'View Calendar Grid'}
          </Button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="flex items-center justify-center py-12 text-gray-500">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            Loading attendance data...
          </CardContent>
        </Card>
      )}

      {/* Yearly Report Table */}
      {!loading && reportType === 'yearly' && yearlyData && !showCalendarView && (
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-blue-600" />
                {academicYear
                  ? `Academic Year Attendance Report - ${academicYear.name}`
                  : `Yearly Attendance Report - ${selectedYear}`}
              </CardTitle>
              <Badge variant="outline" className="text-base">
                {academicYear ? academicYear.name : selectedYear}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-blue-100">
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">
                      Month
                    </th>
                    <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700">
                      Total Working Days
                    </th>
                    <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700">
                      Total Present
                    </th>
                    <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700">
                      Total Absent
                    </th>
                    <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-700">
                      Total Leaves
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {yearlyData.monthlyStats.map((month) => (
                    <tr key={month.month} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 font-medium text-gray-800">
                        {month.month}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center text-gray-700">
                        {month.totalWorkingDays}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center font-semibold text-green-700">
                        {month.present}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center font-semibold text-red-700">
                        {month.absent}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center font-semibold text-blue-700">
                        {month.leaves}
                      </td>
                    </tr>
                  ))}
                  {/* Totals Row */}
                  <tr className="bg-green-100 font-bold">
                    <td className="border border-gray-300 px-4 py-3 text-gray-800">TOTAL</td>
                    <td className="border border-gray-300 px-4 py-3 text-center text-gray-800">
                      {yearlyData.totals.total_working_days}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-center text-green-800">
                      {yearlyData.totals.total_present}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-center text-red-800">
                      {yearlyData.totals.total_absent}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-center text-blue-800">
                      {yearlyData.totals.total_leaves}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Yearly Calendar Grid */}
      {!loading && reportType === 'yearly' && targetUserId && showCalendarView && (
        <YearlyCalendarGrid
          userId={targetUserId}
          year={selectedYear}
          academicYearName={academicYear?.name}
        />
      )}

      {/* Monthly Report - Calendar View */}
      {!loading && reportType === 'monthly' && monthlyDetailData && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Calendar Section - Takes 2/3 width */}
          <MonthlyCalendarCard
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            attendanceByDate={attendanceByDate}
            leaveByDate={leaveByDate}
            holidaySet={holidaySet}
            exceptionalWorkByDate={exceptionalWorkByDate}
            workingDayPolicy={monthlyDetailData.working_day_policy}
          />

          {/* Insights Panel - Takes 1/3 width with Pie Chart */}
          <AttendanceInsightsPanel stats={monthlyDetailData.stats} />
        </div>
      )}
    </div>
  );
}
