import api from '@/lib/api';
import { API_ENDPOINTS } from '@/constants';

export interface AttendancePeriodStats {
  working_days: number;
  present_days: number;
  absent_days: number;
  half_days: number;
  percentage: number;
}

export interface AttendanceSummary {
  current_month: AttendancePeriodStats;
  previous_month_percentage: number;
  academic_year_percentage: number;
  growth_rate: number;
}

export interface CalendarDay {
  date: string;
  status: 'present' | 'absent' | 'half_day' | 'holiday' | 'weekend' | 'not_marked';
  is_working_day: boolean;
  holiday_name: string | null;
}

export interface MonthlyBreakdown {
  month_name: string;
  month_number: number;
  year: number;
  working_days: number;
  present_days: number;
  absent_days: number;
  half_days: number;
  percentage: number;
}

export interface YearlyReport {
  academic_year: { name: string; start_date: string; end_date: string };
  months: MonthlyBreakdown[];
  total_summary: {
    total_working_days: number;
    total_present_days: number;
    overall_percentage: number;
  };
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export async function getAttendanceSummary(): Promise<AttendanceSummary> {
  const res = await api.get<ApiResponse<AttendanceSummary>>(
    API_ENDPOINTS.STUDENT_PORTAL.ATTENDANCE.SUMMARY
  );
  return res.data.data;
}

export async function getAttendanceCalendar(year: number, month: number): Promise<CalendarDay[]> {
  const res = await api.get<ApiResponse<CalendarDay[]>>(
    API_ENDPOINTS.STUDENT_PORTAL.ATTENDANCE.CALENDAR,
    { params: { year, month } }
  );
  return res.data.data;
}

export async function getYearlyReport(): Promise<YearlyReport> {
  const res = await api.get<ApiResponse<YearlyReport>>(
    API_ENDPOINTS.STUDENT_PORTAL.ATTENDANCE.YEARLY_REPORT
  );
  return res.data.data;
}
