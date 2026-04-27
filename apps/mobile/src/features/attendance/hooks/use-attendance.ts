/**
 * Attendance Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';

import {
  getEligibleClasses,
  validateAttendanceDate,
  getComprehensiveAttendance,
  bulkMarkAttendance,
  getEmployeeAttendance,
  bulkSubmitEmployeeAttendance,
  getTimesheetSubmissions,
  checkTimesheetStatus,
  getOrganizationHolidays,
} from '../api/attendance-api';

// ============================================================================
// Student Attendance Hooks
// ============================================================================

export function useEligibleClasses() {
  return useQuery({
    queryKey: ['attendance', 'eligible-classes'],
    queryFn: () => getEligibleClasses('attendance'),
    staleTime: 5 * 60_000,
  });
}

export function useValidateAttendanceDate(classId: string, date: string) {
  return useQuery({
    queryKey: ['attendance', 'validate', classId, date],
    queryFn: () => validateAttendanceDate(classId, date),
    enabled: !!classId && !!date,
    staleTime: 60_000,
  });
}

export function useComprehensiveAttendance(classId: string, date: string, enabled = true) {
  return useQuery({
    queryKey: ['attendance', 'comprehensive', classId, date],
    queryFn: () => getComprehensiveAttendance(classId, date),
    enabled: enabled && !!classId && !!date,
    staleTime: 30_000,
  });
}

export function useBulkMarkAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      classId,
      payload,
    }: {
      classId: string;
      payload: Parameters<typeof bulkMarkAttendance>[1];
    }) => bulkMarkAttendance(classId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
}

// ============================================================================
// Employee Timesheet Hooks
// ============================================================================

export function useEmployeeAttendance(fromDate: string, toDate: string, enabled = true) {
  return useQuery({
    queryKey: ['employee-attendance', fromDate, toDate],
    queryFn: () => getEmployeeAttendance({ from_date: fromDate, to_date: toDate }),
    enabled: enabled && !!fromDate && !!toDate,
    staleTime: 30_000,
  });
}

export function useSubmitTimesheet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: bulkSubmitEmployeeAttendance,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employee-attendance'] });
      qc.invalidateQueries({ queryKey: ['timesheets'] });
      Alert.alert('Success', 'Timesheet submitted for review.');
    },
    onError: (err: any) => {
      const data = err?.response?.data;
      let msg = 'Failed to submit timesheet.';
      if (data?.errors?.timesheet_submission) {
        msg = data.errors.timesheet_submission.flat().join('\n');
      } else if (data?.errors?.attendance_records) {
        const recs = data.errors.attendance_records;
        msg = Array.isArray(recs)
          ? recs
              .flat()
              .map((r: any) => (typeof r === 'string' ? r : JSON.stringify(r)))
              .join('\n')
          : String(recs);
      } else if (data?.message) {
        msg = data.message;
      } else if (data?.error) {
        msg = data.error;
      } else if (data?.detail) {
        msg = data.detail;
      }
      Alert.alert('Error', msg);
    },
  });
}

export function useTimesheetSubmissions(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['timesheets', 'self', params],
    queryFn: () => getTimesheetSubmissions(params),
    staleTime: 30_000,
  });
}

export function useCheckTimesheetStatus(weekStart: string, weekEnd: string) {
  return useQuery({
    queryKey: ['timesheets', 'check-status', weekStart, weekEnd],
    queryFn: () => checkTimesheetStatus({ week_start_date: weekStart, week_end_date: weekEnd }),
    enabled: !!weekStart && !!weekEnd,
    staleTime: 60_000,
  });
}

export function useOrganizationHolidays(fromDate: string, toDate: string, enabled = true) {
  return useQuery({
    queryKey: ['holidays', fromDate, toDate],
    queryFn: () => getOrganizationHolidays({ from_date: fromDate, to_date: toDate }),
    enabled: enabled && !!fromDate && !!toDate,
    staleTime: 5 * 60_000,
  });
}
