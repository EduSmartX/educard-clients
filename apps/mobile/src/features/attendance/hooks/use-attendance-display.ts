/**
 * Shared hook for formatting attendance display in dashboards
 * Used by both Admin and Employee dashboards to ensure consistent display
 */

import { useCallback } from 'react';

import type { DashboardAttendanceStats } from '../api/attendance-api';

/**
 * Returns a formatted string for attendance display based on stats
 */
export function useAttendanceDisplay(
  attendanceStats: DashboardAttendanceStats | undefined,
) {
  const getAttendanceDisplay = useCallback(() => {
    if (!attendanceStats) return '...';

    if (attendanceStats.is_holiday) {
      return attendanceStats.holiday_name ?? 'Holiday';
    }

    if (!attendanceStats.is_working_day) {
      const reason = attendanceStats.reason;
      if (reason && typeof reason === 'string' && reason !== 'Working Day') {
        if (reason.includes('Saturday')) return 'Sat Off';
        if (reason.includes('Sunday')) return 'Sun Off';
        return 'Off Day';
      }
      return 'Off Day';
    }

    const percentage: unknown = attendanceStats.overall_attendance_percentage;

    if (percentage === null || percentage === undefined) {
      return 'N/A';
    }

    if (typeof percentage === 'string') {
      return 'N/A';
    }

    if (typeof percentage !== 'number' || Number.isNaN(percentage)) {
      return 'N/A';
    }

    return `${Math.round(percentage)}%`;
  }, [attendanceStats]);

  return getAttendanceDisplay;
}
