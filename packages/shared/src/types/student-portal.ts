/**
 * Student Portal Types
 *
 * Types for the dedicated Student Portal (`/student/*`) self-service pages.
 * Mirrors the response shapes returned by the `edusphere.students.api.student`,
 * `edusphere.attendance.api.student`, `edusphere.exams.api.student`,
 * `edusphere.fee.api.student`, `edusphere.timetable.api.student`,
 * `edusphere.homework.api.student`, and `edusphere.leave.api.student` apps.
 *
 * @module types/student-portal
 */

/** A single period on the student's timetable for a given day. */
export interface StudentTimetableEntry {
  slot_public_id: string;
  label: string;
  slot_number: number;
  slot_type: string;
  start_time: string;
  end_time: string;
  subject_name: string | null;
  teacher_name: string | null;
  room: string;
  is_cancelled: boolean;
  override_type:
    | "substitute"
    | "cancelled"
    | "rescheduled"
    | "extra_class"
    | null;
}

/** Attendance percentages shown on the student dashboard. */
export interface StudentDashboardAttendance {
  current_month_percentage: number;
  academic_year_percentage: number;
}

/** Aggregated data for the student dashboard (`GET /students/student/dashboard/`). */
export interface StudentDashboard {
  attendance: StudentDashboardAttendance;
  today_timetable: StudentTimetableEntry[];
  pending_homework_count: number;
  upcoming_exams_count: number;
}
