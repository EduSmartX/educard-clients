import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ErrorMessages, SuccessMessages, ToastTitles } from '@/constants';
import {
  getEligibleClasses,
  validateAttendanceDate,
  getComprehensiveAttendance,
  bulkMarkAttendance,
} from '../api/attendance-api';
import type { BulkAttendancePayload } from '../types/index';

// Query keys
export const attendanceKeys = {
  all: ['attendance'] as const,
  eligibleClasses: () => [...attendanceKeys.all, 'eligible-classes'] as const,
  comprehensiveAttendance: (classId: string, date: string) =>
    [...attendanceKeys.all, 'comprehensive', classId, date] as const,
  dateValidation: (classId: string, date: string) =>
    [...attendanceKeys.all, 'validate', classId, date] as const,
};

// Hook to get eligible classes
export const useEligibleClasses = () => {
  return useQuery({
    queryKey: attendanceKeys.eligibleClasses(),
    queryFn: () => getEligibleClasses('attendance'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to get comprehensive attendance data (students + attendance + leaves)
export const useComprehensiveAttendance = (classId: string, date: string, enabled = true) => {
  return useQuery({
    queryKey: attendanceKeys.comprehensiveAttendance(classId, date),
    queryFn: () => getComprehensiveAttendance(classId, date),
    enabled: enabled && !!classId && !!date,
    staleTime: 30 * 1000, // 30 seconds
  });
};

// Hook to validate date
export const useValidateDate = (classId: string, date: string, enabled = true) => {
  return useQuery({
    queryKey: attendanceKeys.dateValidation(classId, date),
    queryFn: () => validateAttendanceDate(classId, date),
    enabled: enabled && !!classId && !!date,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

// Hook to bulk mark attendance
export const useBulkMarkAttendance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ classId, payload }: { classId: string; payload: BulkAttendancePayload }) =>
      bulkMarkAttendance(classId, payload),
    onSuccess: (_data, variables) => {
      // Invalidate comprehensive attendance query
      queryClient.invalidateQueries({
        queryKey: attendanceKeys.comprehensiveAttendance(variables.classId, variables.payload.date),
      });

      toast.success(SuccessMessages.ATTENDANCE.MARK_SUCCESS, {
        description: `Attendance has been saved for ${variables.payload.date}`,
      });
    },
    onError: (error: unknown) => {
      // Safely extract message from unknown error object
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      const errorMessage =
        err?.response?.data?.message || err?.message || ErrorMessages.ATTENDANCE.MARK_FAILED;

      toast.error(ToastTitles.ERROR, {
        description: errorMessage,
      });
    },
  });
};
