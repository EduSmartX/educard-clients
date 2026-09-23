import type { AttendanceReportData, StudentRecord } from '../api/dashboard-api';

export interface AttendanceInsights {
  classHealth: 'excellent' | 'good' | 'concern' | 'critical';
  overallPercentage: number;
  totalStudents: number;
  totalWorkingDays: number;
  excellentStudents: StudentRecord[];
  goodStudents: StudentRecord[];
  atRiskStudents: StudentRecord[];
  criticalStudents: StudentRecord[];
  perfectAttendance: StudentRecord[];
  highAbsentees: StudentRecord[];
  frequentHalfDays: StudentRecord[];
  avgAbsent: number;
  avgHalfDay: number;
  avgPresent: number;
}

/** Compute attendance insights from report data */
export function computeAttendanceInsights(
  activeReportData: AttendanceReportData | undefined,
  displayStudents: StudentRecord[]
): AttendanceInsights | null {
  if (!activeReportData || !displayStudents || displayStudents.length === 0) {
    return null;
  }

  const students = displayStudents;
  const totalStudents = students.length;
  const totalWorkingDays = activeReportData.total_working_days;

  const excellentStudents = students.filter((s) => s.percentage >= 95);
  const goodStudents = students.filter((s) => s.percentage >= 85 && s.percentage < 95);
  const atRiskStudents = students.filter((s) => s.percentage >= 75 && s.percentage < 85);
  const criticalStudents = students.filter((s) => s.percentage < 75);

  const perfectAttendance = students.filter((s) => s.percentage === 100);
  const highAbsentees = students.filter((s) => s.absent >= 3).sort((a, b) => b.absent - a.absent);
  const frequentHalfDays = students
    .filter((s) => s.half_day >= 2)
    .sort((a, b) => b.half_day - a.half_day);

  const overallPercentage = activeReportData.attendance_percentage;
  let classHealth: AttendanceInsights['classHealth'] = 'excellent';
  if (overallPercentage < 75) classHealth = 'critical';
  else if (overallPercentage < 85) classHealth = 'concern';
  else if (overallPercentage < 95) classHealth = 'good';

  return {
    classHealth,
    overallPercentage,
    totalStudents,
    totalWorkingDays,
    excellentStudents,
    goodStudents,
    atRiskStudents,
    criticalStudents,
    perfectAttendance,
    highAbsentees: highAbsentees.slice(0, 5),
    frequentHalfDays: frequentHalfDays.slice(0, 3),
    avgAbsent: activeReportData.avg_absent_days,
    avgHalfDay: activeReportData.avg_half_days,
    avgPresent: activeReportData.avg_present_days,
  };
}

export function getHealthColor(health: string) {
  switch (health) {
    case 'excellent':
      return { bg: '#dcfce7', text: '#16a34a', icon: '#22c55e' };
    case 'good':
      return { bg: '#dbeafe', text: '#2563eb', icon: '#3b82f6' };
    case 'concern':
      return { bg: '#fef3c7', text: '#d97706', icon: '#f59e0b' };
    case 'critical':
      return { bg: '#fee2e2', text: '#dc2626', icon: '#ef4444' };
    default:
      return { bg: '#f3f4f6', text: '#6b7280', icon: '#9ca3af' };
  }
}

export function getHealthLabel(health: string) {
  switch (health) {
    case 'excellent':
      return 'Excellent Attendance!';
    case 'good':
      return 'Good Attendance';
    case 'concern':
      return 'Needs Attention';
    default:
      return 'Critical - Action Required';
  }
}

export function getAvatarBgColor(percentage: number) {
  if (percentage >= 95) return '#dcfce7';
  if (percentage >= 85) return '#dbeafe';
  if (percentage >= 75) return '#fef3c7';
  return '#fee2e2';
}

export function getAvatarTextColor(percentage: number) {
  if (percentage >= 95) return '#16a34a';
  if (percentage >= 85) return '#2563eb';
  if (percentage >= 75) return '#d97706';
  return '#dc2626';
}

export function getPercentageStyle(percentage: number, styles: Record<string, object>) {
  if (percentage >= 95) return styles.percentageGreen;
  if (percentage >= 85) return styles.percentageBlue;
  if (percentage >= 75) return styles.percentageYellow;
  return styles.percentageRed;
}
