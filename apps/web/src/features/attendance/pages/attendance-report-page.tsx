import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, eachDayOfInterval, startOfMonth, endOfMonth } from 'date-fns';
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

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function toDateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

function isSaturdayOffForReport(date: Date, pattern: string): boolean {
  if (pattern === 'ALL') {
    return true;
  }
  if (pattern !== 'SECOND_ONLY' && pattern !== 'SECOND_AND_FOURTH') {
    return false;
  }
  const weekOfMonth = Math.ceil(date.getDate() / 7);
  if (pattern === 'SECOND_ONLY') {
    return weekOfMonth === 2;
  }
  return weekOfMonth === 2 || weekOfMonth === 4;
}

function isWeekendForReport(
  date: Date,
  policy: { sunday_off: boolean; saturday_off_pattern: string } | null
): boolean {
  if (!policy) {
    return false;
  }
  const dayOfWeek = date.getDay();
  if (dayOfWeek === 0 && policy.sunday_off) {
    return true;
  }
  if (dayOfWeek === 6) {
    return isSaturdayOffForReport(date, policy.saturday_off_pattern);
  }
  return false;
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
    queryFn: async () => {
      if (viewType === 'self') {
        return getEmployeeAttendance({ from_date: startDate, to_date: endDate });
      } else {
        // For staff view, fetch specific user's attendance
        const response = await apiClient.get('/attendance/employee-attendance/', {
          params: {
            from_date: startDate,
            to_date: endDate,
            user: targetUserId,
          },
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
    },
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
        holidaySet: new Set(),
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
              <label className="mb-2 block text-sm font-semibold text-gray-700">Report Type</label>
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
              <label className="mb-2 block text-sm font-semibold text-gray-700">View</label>
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
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Select Staff
                </label>
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
                  ? typeof selectedUserData.organization_role === 'string'
                    ? selectedUserData.organization_role
                    : (selectedUserData.organization_role as { name?: string })?.name
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
                  {yearlyData.monthlyStats.map((month, index) => (
                    <tr key={index} className="hover:bg-gray-50">
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
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-blue-600" />
                  {MONTHS[selectedMonth]} {selectedYear}
                </CardTitle>
                <Badge variant="outline" className="text-base">
                  {MONTHS[selectedMonth]} {selectedYear}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {(() => {
                const monthStart = startOfMonth(new Date(selectedYear, selectedMonth, 1));
                const monthEnd = endOfMonth(new Date(selectedYear, selectedMonth, 1));
                const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
                const leadingEmptyDays = Array.from({ length: monthStart.getDay() });

                return (
                  <>
                    {/* Week day headers */}
                    <div className="mb-2 grid grid-cols-7 gap-1">
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                        <div
                          key={i}
                          className="py-1 text-center text-xs font-semibold text-gray-600"
                        >
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* Calendar days grid */}
                    <div className="grid grid-cols-7 gap-1">
                      {/* Leading empty cells for proper calendar alignment */}
                      {leadingEmptyDays.map((_, index) => (
                        <div
                          key={`empty-${index}`}
                          className="aspect-square rounded border border-transparent"
                        />
                      ))}

                      {/* Actual days */}
                      {monthDays.map((date) => {
                        const dateKey = toDateKey(date);
                        const attendance = attendanceByDate.get(dateKey);
                        const leave = leaveByDate.get(dateKey);
                        const exception = exceptionalWorkByDate.get(dateKey);
                        const isHoliday = holidaySet.has(dateKey);
                        const isFuture = date > new Date();

                        // Determine day state and styling
                        let bgColor = 'bg-white border-gray-200';
                        let textColor = 'text-gray-900';
                        let icon = null;
                        let statusLabel = '';

                        // Check for force working day exception (overrides holiday/weekend)
                        if (exception?.override_type === 'FORCE_WORKING') {
                          statusLabel = 'Testing';
                          if (attendance?.morning_present && attendance?.afternoon_present) {
                            bgColor = 'bg-green-50 border-green-300';
                            textColor = 'text-green-900';
                            icon = (
                              <div className="mx-auto flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-[10px] font-bold text-white">
                                ✓
                              </div>
                            );
                          } else if (!isFuture) {
                            bgColor = 'bg-red-50 border-red-300';
                            textColor = 'text-red-900';
                            icon = (
                              <div className="mx-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                                ✕
                              </div>
                            );
                          }
                        }
                        // Check for force holiday exception
                        else if (exception?.override_type === 'FORCE_HOLIDAY' || isHoliday) {
                          bgColor = 'bg-purple-50 border-purple-300';
                          textColor = 'text-purple-900';
                          icon = (
                            <div className="mx-auto flex h-5 w-5 items-center justify-center rounded-full bg-purple-500 text-[10px] font-bold text-white">
                              H
                            </div>
                          );
                          statusLabel = 'Weekend';
                        }
                        // Check if it's a weekend based on working day policy
                        else if (isWeekendForReport(date, monthlyDetailData.working_day_policy)) {
                          bgColor = 'bg-purple-50 border-purple-300';
                          textColor = 'text-purple-900';
                          icon = (
                            <div className="mx-auto flex h-5 w-5 items-center justify-center rounded-full bg-purple-500 text-[10px] font-bold text-white">
                              H
                            </div>
                          );
                          statusLabel = 'Weekend';
                        }

                        // Check for approved leave
                        if (!icon && leave?.status === 'approved') {
                          bgColor = 'bg-orange-50 border-orange-300';
                          textColor = 'text-orange-900';
                          icon = (
                            <div className="mx-auto flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
                              ✕
                            </div>
                          );
                        }
                        // Check for pending leave
                        else if (!icon && leave?.status === 'pending') {
                          bgColor = 'bg-orange-50 border-orange-300';
                          textColor = 'text-orange-900';
                          icon = (
                            <div className="mx-auto flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
                              ✕
                            </div>
                          );
                        }
                        // Check for present
                        else if (
                          !icon &&
                          attendance?.morning_present &&
                          attendance?.afternoon_present
                        ) {
                          bgColor = 'bg-green-50 border-green-300';
                          textColor = 'text-green-900';
                          icon = (
                            <div className="mx-auto flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-[10px] font-bold text-white">
                              ✓
                            </div>
                          );
                        }
                        // Check for absent (only on past dates, not weekends/holidays)
                        else if (
                          !icon &&
                          !isFuture &&
                          !isHoliday &&
                          bgColor === 'bg-white border-gray-200'
                        ) {
                          bgColor = 'bg-red-50 border-red-300';
                          textColor = 'text-red-900';
                          icon = (
                            <div className="mx-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                              ✕
                            </div>
                          );
                        }
                        // Future dates - light gray
                        else if (isFuture) {
                          bgColor = 'bg-gray-50 border-gray-200';
                          textColor = 'text-gray-400';
                        }

                        return (
                          <div
                            key={dateKey}
                            className={`flex aspect-square flex-col items-center justify-between rounded border p-1 transition ${bgColor}`}
                          >
                            <div className="w-full text-center">
                              <div className="text-[7px] font-medium text-gray-500">
                                {format(date, 'EEE')}
                              </div>
                              <div className={`text-xs font-bold ${textColor}`}>
                                {format(date, 'd')}
                              </div>
                            </div>
                            <div className="flex w-full flex-1 flex-col items-center justify-center">
                              {icon}
                              {statusLabel && (
                                <div className="mt-0.5 text-[7px] font-medium text-purple-600">
                                  {statusLabel}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                );
              })()}
            </CardContent>
          </Card>

          {/* Insights Panel - Takes 1/3 width with Pie Chart */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Attendance Distribution</CardTitle>
                <p className="text-xs text-gray-600">
                  Overall:{' '}
                  {monthlyDetailData?.stats?.total_working_days > 0
                    ? Math.round(
                        (monthlyDetailData?.stats?.total_present /
                          monthlyDetailData?.stats?.total_working_days) *
                          100
                      )
                    : 0}
                  %
                </p>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                {/* Simple Donut Chart using stroke-dasharray */}
                <div className="relative mb-4 h-48 w-48">
                  <svg viewBox="0 0 100 100" className="-rotate-90 transform">
                    {(() => {
                      const present = monthlyDetailData?.stats?.total_present || 0;
                      const absent = monthlyDetailData?.stats?.total_absent || 0;
                      const leaves = monthlyDetailData?.stats?.total_leaves || 0;
                      const total = present + absent + leaves;

                      if (total === 0) {
                        return (
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke="#e5e7eb"
                            strokeWidth="20"
                          />
                        );
                      }

                      const circumference = 2 * Math.PI * 40; // radius = 40
                      const presentPercent = (present / total) * 100;
                      const absentPercent = (absent / total) * 100;
                      const leavePercent = (leaves / total) * 100;

                      const presentLength = (presentPercent / 100) * circumference;
                      const absentLength = (absentPercent / 100) * circumference;
                      const leaveLength = (leavePercent / 100) * circumference;

                      let offset = 0;

                      return (
                        <>
                          {/* Present segment */}
                          {presentPercent > 0 && (
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              fill="none"
                              stroke="#22c55e"
                              strokeWidth="20"
                              strokeDasharray={`${presentLength} ${circumference - presentLength}`}
                              strokeDashoffset={-offset}
                            />
                          )}

                          {/* Absent segment */}
                          {absentPercent > 0 &&
                            (() => {
                              offset += presentLength;
                              return (
                                <circle
                                  cx="50"
                                  cy="50"
                                  r="40"
                                  fill="none"
                                  stroke="#ef4444"
                                  strokeWidth="20"
                                  strokeDasharray={`${absentLength} ${circumference - absentLength}`}
                                  strokeDashoffset={-offset}
                                />
                              );
                            })()}

                          {/* Leave segment */}
                          {leavePercent > 0 &&
                            (() => {
                              offset += absentLength;
                              return (
                                <circle
                                  cx="50"
                                  cy="50"
                                  r="40"
                                  fill="none"
                                  stroke="#f97316"
                                  strokeWidth="20"
                                  strokeDasharray={`${leaveLength} ${circumference - leaveLength}`}
                                  strokeDashoffset={-offset}
                                />
                              );
                            })()}
                        </>
                      );
                    })()}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-900">
                        {monthlyDetailData?.stats?.total_working_days > 0
                          ? `${Math.round((monthlyDetailData?.stats?.total_present / monthlyDetailData?.stats?.total_working_days) * 100)}%`
                          : '0%'}
                      </div>
                      <div className="mt-1 text-xs text-gray-600">Present</div>
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div className="w-full space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-green-500"></div>
                      <span className="text-xs text-gray-700">Present</span>
                    </div>
                    <span className="text-xs font-semibold text-gray-900">
                      {monthlyDetailData?.stats?.total_present}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-red-500"></div>
                      <span className="text-xs text-gray-700">Absent</span>
                    </div>
                    <span className="text-xs font-semibold text-gray-900">
                      {monthlyDetailData?.stats?.total_absent}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-orange-500"></div>
                      <span className="text-xs text-gray-700">Leave</span>
                    </div>
                    <span className="text-xs font-semibold text-gray-900">
                      {monthlyDetailData?.stats?.total_leaves}
                    </span>
                  </div>
                </div>

                {/* Summary Cards */}
                <div className="mt-4 grid w-full grid-cols-2 gap-2">
                  <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                    <div className="mb-1 text-[10px] font-medium text-green-700">Present</div>
                    <div className="text-xl font-bold text-green-900">
                      {monthlyDetailData?.stats?.total_present}
                    </div>
                  </div>
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                    <div className="mb-1 text-[10px] font-medium text-red-700">Absent</div>
                    <div className="text-xl font-bold text-red-900">
                      {monthlyDetailData?.stats?.total_absent}
                    </div>
                  </div>
                  <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
                    <div className="mb-1 text-[10px] font-medium text-orange-700">Leaves</div>
                    <div className="text-xl font-bold text-orange-900">
                      {monthlyDetailData?.stats?.total_leaves}
                    </div>
                  </div>
                  <div className="rounded-lg border border-purple-200 bg-purple-50 p-3">
                    <div className="mb-1 text-[10px] font-medium text-purple-700">Holidays</div>
                    <div className="text-xl font-bold text-purple-900">
                      {monthlyDetailData?.stats?.total_holidays}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Legend</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <div className="flex h-4 w-4 items-center justify-center rounded-full bg-green-500 text-[10px] text-white">
                    ✓
                  </div>
                  <span className="text-gray-700">Present</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                    ✕
                  </div>
                  <span className="text-gray-700">Absent</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[10px] text-white">
                    ✕
                  </div>
                  <span className="text-gray-700">Leave (Approved)</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="h-4 w-4 rounded border border-purple-300 bg-purple-100"></div>
                  <span className="text-gray-700">Holiday</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
