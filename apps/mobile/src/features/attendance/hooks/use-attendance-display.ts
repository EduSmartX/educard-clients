/**
 * Shared hook for formatting attendance display in dashboards
 * Used by both Admin and Employee dashboards to ensure consistent display
 */

import { useCallback } from 'react';

import type { DashboardAttendanceStats } from '../api/attendance-api';

/**
 * Returns a formatted string for attendance display based on stats
 * Handles: holidays, off days (weekends), working days with percentage, and edge cases
 */
export function useAttendanceDisplay(attendanceStats: DashboardAttendanceStats | undefined) {
  const getAttendanceDisplay = useCallback(() => {
    if (!attendanceStats) return '...';

    // Holiday - show holiday name
    if (attendanceStats.is_holiday) {
      return attendanceStats.holiday_name ?? 'Holiday';
    }

    // Non-working day (weekend, etc.) - show shortened reason
    if (!attendanceStats.is_working_day) {
      const reason = attendanceStats.reason;
      if (reason && typeof reason === 'string' && reason !== 'Working Day') {
        if (reason.includes('Saturday')) return 'Sat Off';
        if (reason.includes('Sunday')) return 'Sun Off';
        return 'Off Day';
      }
      return 'Off Day';
    }

    // Working day - show attendance percentage
    const percentage: unknown = attendanceStats.overall_attendance_percentage;

    // Handle null, undefined, or non-numeric values
    if (percentage === null || percentage === undefined) {
      return 'N/A';
    }

    // If percentage is a string (API bug), return N/A
    if (typeof percentage === 'string') {
      return 'N/A';
    }

    // Ensure it's a valid number
    if (typeof percentage !== 'number' || isNaN(percentage)) {
      return 'N/A';
    }

    return `${Math.round(percentage)}%`;
  }, [attendanceStats]);

  return getAttendanceDisplay;
}
