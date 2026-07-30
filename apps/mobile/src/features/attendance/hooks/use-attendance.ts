import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  handleMutationError,
  type MutationOptions,
} from '@/lib/mutation-utils';
import { showToast } from '@/utils/toast';
import { useCriticalOperation } from '@/providers/critical-operation-context';

import {
  getDashboardAttendanceStats,
  getEligibleClasses,
  validateAttendanceDate,
  getComprehensiveAttendance,
  bulkMarkAttendance,
  getMyAttendance,
  checkTimesheetStatus,
  submitTimesheet,
  returnTimesheetToDraft,
} from '../api/attendance-api';
import type {
  DashboardAttendanceStats,
  EligibleClass,
  DateValidation,
  ComprehensiveAttendanceRecord,
  BulkAttendancePayload,
  EmployeeAttendanceResponse,
  TimesheetStatus,
  SubmitTimesheetPayload,
} from '../api/attendance-api';

// Query keys
export const attendanceKeys = {
  all: ['attendance'] as const,
  dashboard: () => [...attendanceKeys.all, 'dashboard-stats'] as const,
  eligibleClasses: () => [...attendanceKeys.all, 'eligible-classes'] as const,
  comprehensiveAttendance: (classId: string, date: string) =>
    [...attendanceKeys.all, 'comprehensive', classId, date] as const,
  dateValidation: (classId: string, date: string) =>
    [...attendanceKeys.all, 'validate', classId, date] as const,
};

export function useDashboardAttendanceStats() {
  return useQuery<DashboardAttendanceStats>({
    queryKey: attendanceKeys.dashboard(),
    queryFn: getDashboardAttendanceStats,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
  });
}

// Hook to get eligible classes for marking attendance
export function useEligibleClasses() {
  return useQuery<EligibleClass[]>({
    queryKey: attendanceKeys.eligibleClasses(),
    queryFn: () => getEligibleClasses('attendance'),
    staleTime: 5 * 60 * 1000,
  });
}

// Hook to validate attendance date
export function useValidateDate(classId: string, date: string, enabled = true) {
  return useQuery<DateValidation>({
    queryKey: attendanceKeys.dateValidation(classId, date),
    queryFn: () => validateAttendanceDate(classId, date),
    enabled: enabled && !!classId && !!date,
    staleTime: 1 * 60 * 1000,
  });
}

// Hook to get comprehensive attendance data
export function useComprehensiveAttendance(
  classId: string,
  date: string,
  enabled = true,
) {
  return useQuery<ComprehensiveAttendanceRecord[]>({
    queryKey: attendanceKeys.comprehensiveAttendance(classId, date),
    queryFn: () => getComprehensiveAttendance(classId, date),
    enabled: enabled && !!classId && !!date,
    staleTime: 30 * 1000,
  });
}

// Hook to bulk mark attendance
export function useBulkMarkAttendance(options?: MutationOptions) {
  const queryClient = useQueryClient();
  const { beginCriticalOperation, endCriticalOperation } =
    useCriticalOperation();

  return useMutation({
    mutationFn: ({
      classId,
      payload,
    }: {
      classId: string;
      payload: BulkAttendancePayload;
    }) => bulkMarkAttendance(classId, payload),
    onMutate: () => {
      beginCriticalOperation({
        title: 'Saving attendance',
        description: 'Saving attendance for the whole class...',
      });
    },
    onSuccess: (response, variables) => {
      void queryClient.invalidateQueries({
        queryKey: attendanceKeys.comprehensiveAttendance(
          variables.classId,
          variables.payload.date,
        ),
      });
      void queryClient.invalidateQueries({
        queryKey: attendanceKeys.dashboard(),
      });

      showToast('success', response.message || 'Attendance saved successfully');
      options?.onSuccess?.();
    },
    onError: (error: unknown) => {
      handleMutationError(error, 'Failed to save attendance', options?.onError);
    },
    onSettled: () => {
      endCriticalOperation();
    },
  });
}

// ============== EMPLOYEE TIMESHEET HOOKS ==============

// Hook to get employee's own attendance for timesheet
export function useMyAttendance(
  fromDate: string,
  toDate: string,
  enabled = true,
) {
  return useQuery<EmployeeAttendanceResponse>({
    queryKey: [...attendanceKeys.all, 'my-attendance', fromDate, toDate],
    queryFn: () => getMyAttendance(fromDate, toDate),
    enabled: enabled && !!fromDate && !!toDate,
    staleTime: 30 * 1000,
  });
}

// Hook to check timesheet status
export function useTimesheetStatus(
  fromDate: string,
  toDate: string,
  enabled = true,
) {
  return useQuery<TimesheetStatus>({
    queryKey: [...attendanceKeys.all, 'timesheet-status', fromDate, toDate],
    queryFn: () => checkTimesheetStatus(fromDate, toDate),
    enabled: enabled && !!fromDate && !!toDate,
    staleTime: 30 * 1000,
  });
}

// Hook to submit timesheet
export function useSubmitTimesheet(options?: MutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SubmitTimesheetPayload) => submitTimesheet(payload),
    onSuccess: (response, _variables) => {
      void queryClient.invalidateQueries({
        queryKey: [...attendanceKeys.all, 'my-attendance'],
      });
      void queryClient.invalidateQueries({
        queryKey: [...attendanceKeys.all, 'timesheet-status'],
      });
      showToast(
        'success',
        response.message || 'Timesheet submitted successfully',
      );
      options?.onSuccess?.();
    },
    onError: (error: unknown) => {
      handleMutationError(
        error,
        'Failed to submit timesheet',
        options?.onError,
      );
    },
  });
}

// Hook to return timesheet to draft
export function useReturnTimesheetToDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ fromDate, toDate }: { fromDate: string; toDate: string }) =>
      returnTimesheetToDraft(fromDate, toDate),
    onSuccess: response => {
      void queryClient.invalidateQueries({
        queryKey: [...attendanceKeys.all, 'my-attendance'],
      });
      void queryClient.invalidateQueries({
        queryKey: [...attendanceKeys.all, 'timesheet-status'],
      });
      showToast('success', response.message || 'Timesheet returned to draft');
    },
    onError: (error: unknown) => {
      handleMutationError(error, 'Failed to return timesheet to draft');
    },
  });
}
