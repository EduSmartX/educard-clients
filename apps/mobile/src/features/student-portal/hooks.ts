/**
 * Student Portal — React Query Hooks
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';

import {
  fetchDashboard,
  fetchAttendanceSummary,
  fetchAttendanceCalendar,
  fetchTimetable,
  fetchHomework,
  fetchHomeworkDetail,
  submitHomework,
  fetchExamSessions,
  fetchExamSessionDetail,
  fetchFeeSummary,
  fetchFeePayments,
  fetchFeeComponents,
  requestFeeOptIn,
  requestFeeOptOut,
  fetchLeaveBalance,
  fetchLeaveRequests,
} from './api';

const KEYS = {
  dashboard: ['student', 'dashboard'],
  attendance: ['student', 'attendance'],
  attendanceCalendar: (m: number, y: number) => [
    'student',
    'attendance',
    'calendar',
    m,
    y,
  ],
  timetable: (date: string) => ['student', 'timetable', date],
  homework: (date?: string) => ['student', 'homework', date],
  homeworkDetail: (id: string) => ['student', 'homework', 'detail', id],
  examSessions: ['student', 'exams', 'sessions'],
  examDetail: (id: string) => ['student', 'exams', 'detail', id],
  feeSummary: ['student', 'fee', 'summary'],
  feePayments: ['student', 'fee', 'payments'],
  feeComponents: ['student', 'fee', 'components'],
  leaveBalance: ['student', 'leave', 'balance'],
  leaveRequests: ['student', 'leave', 'requests'],
};

export function useStudentDashboard() {
  return useQuery({
    queryKey: KEYS.dashboard,
    queryFn: fetchDashboard,
    staleTime: 5 * 60_000,
  });
}

export function useAttendanceSummary() {
  return useQuery({
    queryKey: KEYS.attendance,
    queryFn: fetchAttendanceSummary,
    staleTime: 5 * 60_000,
  });
}

export function useAttendanceCalendar(month: number, year: number) {
  return useQuery({
    queryKey: KEYS.attendanceCalendar(month, year),
    queryFn: () => fetchAttendanceCalendar(month, year),
    staleTime: 10 * 60_000,
  });
}

export function useTimetable(date: string) {
  return useQuery({
    queryKey: KEYS.timetable(date),
    queryFn: () => fetchTimetable(date),
    staleTime: 10 * 60_000,
    // Dashboard primes this same key; always re-fetch so the screen shows live data.
    refetchOnMount: 'always',
  });
}

export function useStudentHomework(date?: string) {
  return useQuery({
    queryKey: KEYS.homework(date),
    queryFn: () => fetchHomework(date),
    staleTime: 5 * 60_000,
  });
}

export function useHomeworkDetail(publicId: string | null) {
  return useQuery({
    queryKey: KEYS.homeworkDetail(publicId ?? ''),
    queryFn: () => fetchHomeworkDetail(publicId ?? ''),
    enabled: !!publicId,
    // Switching between homework keeps the current content until the next loads.
    placeholderData: keepPreviousData,
  });
}

export function useSubmitHomework() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      publicId,
      data,
    }: {
      publicId: string;
      data: {
        notes?: string;
        file?: { uri: string; name: string; type: string };
      };
    }) => submitHomework(publicId, data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['student', 'homework'] }),
  });
}

export function useExamSessions() {
  return useQuery({
    queryKey: KEYS.examSessions,
    queryFn: fetchExamSessions,
    staleTime: 10 * 60_000,
  });
}

export function useExamSessionDetail(publicId: string | null) {
  return useQuery({
    queryKey: KEYS.examDetail(publicId ?? ''),
    queryFn: () => fetchExamSessionDetail(publicId ?? ''),
    enabled: !!publicId,
  });
}

export function useFeeSummary() {
  return useQuery({
    queryKey: KEYS.feeSummary,
    queryFn: fetchFeeSummary,
    staleTime: 0,
  });
}

export function useFeePayments() {
  return useQuery({
    queryKey: KEYS.feePayments,
    queryFn: fetchFeePayments,
    staleTime: 30_000,
  });
}

export function useFeeComponents() {
  return useQuery({
    queryKey: KEYS.feeComponents,
    queryFn: fetchFeeComponents,
    staleTime: 0,
  });
}

export function useFeeOptOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      publicId,
      requestNote,
    }: {
      publicId: string;
      requestNote: string;
    }) => requestFeeOptOut(publicId, requestNote),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['student', 'fee'] }),
  });
}

export function useFeeOptIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      publicId,
      requestNote,
    }: {
      publicId: string;
      requestNote: string;
    }) => requestFeeOptIn(publicId, requestNote),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['student', 'fee'] }),
  });
}

export function useLeaveBalance() {
  return useQuery({
    queryKey: KEYS.leaveBalance,
    queryFn: fetchLeaveBalance,
    staleTime: 5 * 60_000,
  });
}

export function useLeaveRequests() {
  return useQuery({
    queryKey: KEYS.leaveRequests,
    queryFn: fetchLeaveRequests,
    staleTime: 5 * 60_000,
  });
}
