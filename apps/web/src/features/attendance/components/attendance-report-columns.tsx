/**
 * Attendance Report Table Columns Configuration
 * Column definitions for yearly and monthly attendance reports
 */

import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import type { Column } from '@/components/ui/data-table';

// Yearly Report Row Type
export interface YearlyReportRow {
  month: string;
  totalWorkingDays: number;
  present: number;
  absent: number;
  leaves: number;
  holidays: number;
}

// Monthly Report Row Type  
export interface MonthlyReportRow {
  date: string;
  day: string;
  status: 'P' | 'A' | 'L' | 'H';
}

/**
 * Creates columns for yearly attendance report
 */
export function createYearlyReportColumns(): Column<YearlyReportRow>[] {
  return [
    {
      header: 'Month',
      accessor: (row) => (
        <div className="font-semibold text-gray-900">{row.month}</div>
      ),
      sortable: true,
      sortKey: 'month',
    },
    {
      header: 'Working Days',
      accessor: (row) => (
        <div className="text-center font-medium text-gray-700">
          {row.totalWorkingDays}
        </div>
      ),
      sortable: true,
      sortKey: 'totalWorkingDays',
    },
    {
      header: 'Present',
      accessor: (row) => (
        <Badge className="bg-green-600 hover:bg-green-700 font-semibold">
          {row.present}
        </Badge>
      ),
      sortable: true,
      sortKey: 'present',
    },
    {
      header: 'Absent',
      accessor: (row) => (
        <Badge className="bg-red-600 hover:bg-red-700 font-semibold">
          {row.absent}
        </Badge>
      ),
      sortable: true,
      sortKey: 'absent',
    },
    {
      header: 'Leaves',
      accessor: (row) => (
        <Badge className="bg-blue-600 hover:bg-blue-700 font-semibold">
          {row.leaves}
        </Badge>
      ),
      sortable: true,
      sortKey: 'leaves',
    },
    {
      header: 'Holidays',
      accessor: (row) => (
        <Badge className="bg-purple-600 hover:bg-purple-700 font-semibold">
          {row.holidays}
        </Badge>
      ),
      sortable: true,
      sortKey: 'holidays',
    },
  ];
}

/**
 * Creates columns for monthly attendance report
 */
export function createMonthlyReportColumns(): Column<MonthlyReportRow>[] {
  return [
    {
      header: 'Date',
      accessor: (row) => (
        <div className="font-medium text-gray-900">{row.date}</div>
      ),
      sortable: true,
      sortKey: 'date',
    },
    {
      header: 'Day',
      accessor: (row) => (
        <div className="text-gray-700">{row.day}</div>
      ),
      sortable: false,
    },
    {
      header: 'Status',
      accessor: (row) => {
        const statusConfig = {
          P: { label: 'Present', color: 'bg-green-600' },
          A: { label: 'Absent', color: 'bg-red-600' },
          L: { label: 'Leave', color: 'bg-blue-600' },
          H: { label: 'Holiday', color: 'bg-purple-600' },
        };
        
        const config = statusConfig[row.status];
        
        return (
          <Badge className={`${config.color} hover:${config.color}/90 font-semibold`}>
            {config.label}
          </Badge>
        );
      },
      sortable: true,
      sortKey: 'status',
    },
  ];
}

/**
 * Export yearly report data to CSV
 */
export function exportYearlyReportToCSV(
  data: YearlyReportRow[],
  totals: {
    totalWorkingDays: number;
    present: number;
    absent: number;
    leaves: number;
    holidays: number;
  },
  userName: string,
  year: number
): void {
  const headers = ['Month', 'Working Days', 'Present', 'Absent', 'Leaves', 'Holidays'];
  
  const rows = data.map((row) => [
    row.month,
    row.totalWorkingDays.toString(),
    row.present.toString(),
    row.absent.toString(),
    row.leaves.toString(),
    row.holidays.toString(),
  ]);
  
  // Add totals row
  rows.push([
    'TOTAL',
    totals.totalWorkingDays.toString(),
    totals.present.toString(),
    totals.absent.toString(),
    totals.leaves.toString(),
    totals.holidays.toString(),
  ]);
  
  const csvContent = [
    [`Yearly Attendance Report - ${year}`],
    [`Employee: ${userName}`],
    [`Generated: ${format(new Date(), 'MMM dd, yyyy hh:mm a')}`],
    [],
    headers,
    ...rows,
  ]
    .map((row) => row.join(','))
    .join('\n');
  
  downloadCSV(csvContent, `attendance-report-${year}-${sanitizeFilename(userName)}.csv`);
}

/**
 * Export monthly report data to CSV
 */
export function exportMonthlyReportToCSV(
  data: MonthlyReportRow[],
  totals: {
    totalWorkingDays: number;
    present: number;
    absent: number;
    leaves: number;
    holidays: number;
  },
  userName: string,
  year: number,
  month: string
): void {
  const headers = ['Date', 'Day', 'Status'];
  
  const rows = data.map((row) => [
    row.date,
    row.day,
    row.status === 'P' ? 'Present' : row.status === 'A' ? 'Absent' : row.status === 'L' ? 'Leave' : 'Holiday',
  ]);
  
  const csvContent = [
    [`Monthly Attendance Report - ${month} ${year}`],
    [`Employee: ${userName}`],
    [`Generated: ${format(new Date(), 'MMM dd, yyyy hh:mm a')}`],
    [],
    [`Summary: Working Days: ${totals.totalWorkingDays}, Present: ${totals.present}, Absent: ${totals.absent}, Leaves: ${totals.leaves}, Holidays: ${totals.holidays}`],
    [],
    headers,
    ...rows,
  ]
    .map((row) => row.join(','))
    .join('\n');
  
  downloadCSV(csvContent, `attendance-report-${month}-${year}-${sanitizeFilename(userName)}.csv`);
}

/**
 * Helper function to download CSV file
 */
function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * Sanitize filename to remove special characters
 */
function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-z0-9]/gi, '-').toLowerCase();
}
