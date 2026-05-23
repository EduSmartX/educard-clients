/**
 * Attendance Report Filters Component
 * Advanced filtering for attendance reports
 */

import { useMemo } from 'react';
import { Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Badge } from '@/components/ui/badge';

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

export type ReportType = 'yearly' | 'monthly';
export type ViewType = 'self' | 'staff';
export type ViewMode = 'grid' | 'table';

interface AttendanceReportFiltersProps {
  // Filter values
  reportType: ReportType;
  viewType: ViewType;
  viewMode: ViewMode;
  selectedUser: string;
  selectedYear: number;
  selectedMonth: number;

  // Change handlers
  onReportTypeChange: (value: ReportType) => void;
  onViewTypeChange: (value: ViewType) => void;
  onViewModeChange: (value: ViewMode) => void;
  onUserChange: (value: string) => void;
  onYearChange: (value: number) => void;
  onMonthChange: (value: number) => void;

  // Options
  manageableUsers: Array<{
    public_id: string;
    full_name: string;
    first_name: string;
    last_name: string;
  }>;
  isLoadingUsers?: boolean;

  // UI State
  collapsed?: boolean;
}

export function AttendanceReportFilters({
  reportType,
  viewType,
  viewMode,
  selectedUser,
  selectedYear,
  selectedMonth,
  onReportTypeChange,
  onViewTypeChange,
  onViewModeChange,
  onUserChange,
  onYearChange,
  onMonthChange,
  manageableUsers,
  isLoadingUsers,
  collapsed = false,
}: Readonly<AttendanceReportFiltersProps>) {
  const currentYear = new Date().getFullYear();

  const years = useMemo(() => {
    const yearsArray = [];
    for (let i = currentYear - 5; i <= currentYear + 1; i++) {
      yearsArray.push(i);
    }
    return yearsArray;
  }, [currentYear]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (viewType === 'staff' && selectedUser) {
      count++;
    }
    if (selectedYear !== currentYear) {
      count++;
    }
    if (reportType === 'monthly') {
      count++;
    }
    return count;
  }, [viewType, selectedUser, selectedYear, currentYear, reportType]);

  if (collapsed) {
    return (
      <Card className="border border-[#bfd591] shadow-sm" style={{ backgroundColor: '#C5D89D' }}>
        <CardContent className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-700" />
            <span className="text-sm font-semibold text-gray-700">Filters Applied</span>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="bg-white">
                {activeFiltersCount}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-[#bfd591] shadow-sm" style={{ backgroundColor: '#C5D89D' }}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Filter className="h-4 w-4" />
          Filter Options
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="bg-white">
              {activeFiltersCount} active
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Report Type */}
          <div>
            <span className="mb-2 block text-sm font-semibold text-gray-700">Report Type</span>
            <SearchableSelect
              options={[
                { value: 'yearly', label: 'Yearly Report' },
                { value: 'monthly', label: 'Monthly Report' },
              ]}
              value={reportType}
              onValueChange={(value) => onReportTypeChange(value as ReportType)}
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
              onValueChange={(value) => onViewTypeChange(value as ViewType)}
              placeholder="Select view"
              className="bg-white"
            />
          </div>

          {/* View Mode */}
          <div>
            <span className="mb-2 block text-sm font-semibold text-gray-700">Display Mode</span>
            <SearchableSelect
              options={[
                { value: 'grid', label: 'Grid View' },
                { value: 'table', label: 'Table View' },
              ]}
              value={viewMode}
              onValueChange={(value) => onViewModeChange(value as ViewMode)}
              placeholder="Select view mode"
              className="bg-white"
            />
          </div>

          {/* Staff Selection */}
          {viewType === 'staff' && (
            <div>
              <span className="mb-2 block text-sm font-semibold text-gray-700">Select Staff</span>
              <SearchableSelect
                options={manageableUsers.map((staff) => ({
                  value: staff.public_id,
                  label: staff.full_name || `${staff.first_name} ${staff.last_name}`,
                }))}
                value={selectedUser}
                onValueChange={onUserChange}
                placeholder="Choose staff member"
                searchPlaceholder="Search staff..."
                disabled={isLoadingUsers}
                emptyText={isLoadingUsers ? 'Loading...' : 'No staff found'}
                className="bg-white"
              />
            </div>
          )}

          {/* Year Selection */}
          <div>
            <span className="mb-2 block text-sm font-semibold text-gray-700">Year</span>
            <SearchableSelect
              options={years.map((year) => ({
                value: String(year),
                label: String(year),
              }))}
              value={String(selectedYear)}
              onValueChange={(value) => onYearChange(Number(value))}
              placeholder="Select year"
              className="bg-white"
            />
          </div>

          {/* Month Selection (only for monthly report) */}
          {reportType === 'monthly' && (
            <div>
              <span className="mb-2 block text-sm font-semibold text-gray-700">Month</span>
              <SearchableSelect
                options={MONTHS.map((month, index) => ({
                  value: String(index),
                  label: month,
                }))}
                value={String(selectedMonth)}
                onValueChange={(value) => onMonthChange(Number(value))}
                placeholder="Select month"
                searchPlaceholder="Search months..."
                className="bg-white"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
