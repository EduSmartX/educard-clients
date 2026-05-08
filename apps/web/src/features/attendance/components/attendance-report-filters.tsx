/**
 * Attendance Report Filters Component
 * Advanced filtering for attendance reports
 */

import { useMemo } from 'react';
import { Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
}: AttendanceReportFiltersProps) {
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
      <Card className="shadow-sm border border-[#bfd591]" style={{ backgroundColor: '#C5D89D' }}>
        <CardContent className="pt-4 flex items-center justify-between">
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
    <Card className="shadow-sm border border-[#bfd591]" style={{ backgroundColor: '#C5D89D' }}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Report Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Report Type
            </label>
            <Select value={reportType} onValueChange={onReportTypeChange}>
              <SelectTrigger className="bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yearly">Yearly Report</SelectItem>
                <SelectItem value="monthly">Monthly Report</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* View Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">View</label>
            <Select value={viewType} onValueChange={onViewTypeChange}>
              <SelectTrigger className="bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="self">Self</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* View Mode */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Display Mode
            </label>
            <Select value={viewMode} onValueChange={onViewModeChange}>
              <SelectTrigger className="bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="grid">Grid View</SelectItem>
                <SelectItem value="table">Table View</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Staff Selection */}
          {viewType === 'staff' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Staff
              </label>
              <Select
                value={selectedUser}
                onValueChange={onUserChange}
                disabled={isLoadingUsers}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Choose staff member" />
                </SelectTrigger>
                <SelectContent>
                  {manageableUsers.map((staff) => (
                    <SelectItem key={staff.public_id} value={staff.public_id}>
                      {staff.full_name ||
                        `${staff.first_name} ${staff.last_name}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Year Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Year</label>
            <Select
              value={String(selectedYear)}
              onValueChange={(value) => onYearChange(Number(value))}
            >
              <SelectTrigger className="bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Month Selection (only for monthly report) */}
          {reportType === 'monthly' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Month
              </label>
              <Select
                value={String(selectedMonth)}
                onValueChange={(value) => onMonthChange(Number(value))}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((month, index) => (
                    <SelectItem key={index} value={String(index)}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
