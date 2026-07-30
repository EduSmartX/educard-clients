/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */
import { apiClient } from '@/api/client';

export interface DashboardStats {
  date: string;
  is_holiday: boolean;
  holiday_name: string | null;
  is_working_day: boolean;
  overall_attendance_percentage: number | null;
  students: {
    total_registered: number;
    marked: number;
    present: number;
    absent: number;
    halfday: number;
    attendance_percentage: number | null;
  };
  employees: {
    total_registered: number;
    marked: number;
    present: number;
    absent: number;
    attendance_percentage: number | null;
  };
}

export interface AttendanceReportData {
  total_students: number;
  total_working_days: number;
  attendance_percentage: number;
  avg_present_days: number;
  avg_absent_days: number;
  avg_half_days: number;
  pagination?: {
    page: number;
    page_size: number;
    total_count: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
  student_wise?: {
    student_id: string;
    student_name: string;
    present: number;
    absent: number;
    half_day: number;
    leave: number;
    percentage: number;
  }[];
}

export type StudentRecord = NonNullable<AttendanceReportData['student_wise']>[number];

export const getDashboardStats = async (date: string): Promise<DashboardStats> => {
  const response = await apiClient.get(`/attendance/admin/dashboard-stats/?date=${date}`);
  return response.data.data || response.data;
};

export const getAttendanceReport = async (
  classId: string | null,
  fromDate: string,
  toDate: string,
  page: number = 1,
  pageSize: number = 50
): Promise<AttendanceReportData> => {
  let url = `/attendance/admin/student-report/?page=${page}&page_size=${pageSize}`;
  if (classId) {
    url += `&class_id=${classId}`;
  }

  const response = await apiClient.post(url, {
    start_date: fromDate,
    end_date: toDate,
  });

  const data = response.data.data || response.data;
  const studentWise = data.report || [];
  const pagination = data.pagination;

  const totalStudents = pagination?.total_count || studentWise.length;
  const totalWorkingDays = studentWise[0]?.total_days || 0;

  let totalPresent = 0;
  let totalAbsent = 0;
  let totalHalfDay = 0;

  studentWise.forEach(
    (s: { present_days?: number; absent_days?: number; halfday_count?: number }) => {
      totalPresent += s.present_days || 0;
      totalAbsent += s.absent_days || 0;
      totalHalfDay += s.halfday_count || 0;
    }
  );

  const currentPageStudents = studentWise.length;
  const totalPossible = currentPageStudents * totalWorkingDays;
  const attendancePercentage =
    totalPossible > 0 ? Math.round(((totalPresent + totalHalfDay * 0.5) / totalPossible) * 100) : 0;

  const avgPresent = currentPageStudents > 0 ? totalPresent / currentPageStudents : 0;
  const avgAbsent = currentPageStudents > 0 ? totalAbsent / currentPageStudents : 0;
  const avgHalfDay = currentPageStudents > 0 ? totalHalfDay / currentPageStudents : 0;

  return {
    total_students: totalStudents,
    total_working_days: totalWorkingDays,
    attendance_percentage: attendancePercentage,
    avg_present_days: Math.round(avgPresent * 10) / 10,
    avg_absent_days: Math.round(avgAbsent * 10) / 10,
    avg_half_days: Math.round(avgHalfDay * 10) / 10,
    pagination,
    student_wise: studentWise.map(
      (s: {
        user__public_id?: string;
        user__first_name?: string;
        user__last_name?: string;
        present_days?: number;
        absent_days?: number;
        halfday_count?: number;
        total_days?: number;
      }) => ({
        student_id: s.user__public_id,
        student_name: `${s.user__first_name || ''} ${s.user__last_name || ''}`.trim(),
        present: s.present_days || 0,
        absent: s.absent_days || 0,
        half_day: s.halfday_count || 0,
        leave: 0,
        percentage:
          (s.total_days || 0) > 0
            ? Math.round(
                (((s.present_days || 0) + (s.halfday_count || 0) * 0.5) / (s.total_days || 1)) * 100
              )
            : 0,
      })
    ),
  };
};
