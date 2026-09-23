/**
 * Attendance Service - Shared Business Logic
 *
 * Contains calculation and transformation logic for attendance management.
 * Used by both Web and Mobile applications.
 */

export interface AttendanceStats {
  totalDays: number;
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  onLeave: number;
  percentage: number;
}

export interface DailyAttendanceSummary {
  totalStudents: number;
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  onLeave: number;
  notMarked: number;
  percentage: number;
}

// Use a different name to avoid conflict with constants/attendance.ts
export type AttendanceStatusValue = "present" | "absent" | "late" | "half_day" | "on_leave";

/**
 * Attendance service with calculation utilities
 */
export const attendanceService = {
  /**
   * Calculate attendance statistics for a student
   */
  calculateStudentStats(
    records: Array<{ status: AttendanceStatusValue }>
  ): AttendanceStats {
    const stats = {
      totalDays: records.length,
      present: 0,
      absent: 0,
      late: 0,
      halfDay: 0,
      onLeave: 0,
      percentage: 0,
    };

    records.forEach(({ status }) => {
      switch (status) {
        case "present":
          stats.present++;
          break;
        case "absent":
          stats.absent++;
          break;
        case "late":
          stats.late++;
          break;
        case "half_day":
          stats.halfDay++;
          break;
        case "on_leave":
          stats.onLeave++;
          break;
      }
    });

    // Calculate percentage (present + late count as attended)
    const attendedDays = stats.present + stats.late + stats.halfDay * 0.5;
    const workingDays = stats.totalDays - stats.onLeave;
    stats.percentage =
      workingDays > 0
        ? Math.round((attendedDays / workingDays) * 10000) / 100
        : 0;

    return stats;
  },

  /**
   * Calculate daily attendance summary for a class
   */
  calculateDailySummary(
    records: Array<{ status?: AttendanceStatusValue | null }>
  ): DailyAttendanceSummary {
    const summary = {
      totalStudents: records.length,
      present: 0,
      absent: 0,
      late: 0,
      halfDay: 0,
      onLeave: 0,
      notMarked: 0,
      percentage: 0,
    };

    records.forEach(({ status }) => {
      if (!status) {
        summary.notMarked++;
        return;
      }

      switch (status) {
        case "present":
          summary.present++;
          break;
        case "absent":
          summary.absent++;
          break;
        case "late":
          summary.late++;
          break;
        case "half_day":
          summary.halfDay++;
          break;
        case "on_leave":
          summary.onLeave++;
          break;
      }
    });

    // Calculate percentage
    const markedCount = summary.totalStudents - summary.notMarked;
    const presentCount = summary.present + summary.late;
    summary.percentage =
      markedCount > 0
        ? Math.round((presentCount / markedCount) * 10000) / 100
        : 0;

    return summary;
  },

  /**
   * Get status color for UI
   */
  getStatusColor(status: AttendanceStatusValue | null): string {
    const colors: Record<string, string> = {
      present: "bg-green-100 text-green-800",
      absent: "bg-red-100 text-red-800",
      late: "bg-yellow-100 text-yellow-800",
      half_day: "bg-orange-100 text-orange-800",
      on_leave: "bg-blue-100 text-blue-800",
    };
    return status ? colors[status] || "bg-gray-100 text-gray-800" : "bg-gray-100 text-gray-800";
  },

  /**
   * Get status label for display
   */
  getStatusLabel(status: AttendanceStatusValue | null): string {
    const labels: Record<string, string> = {
      present: "Present",
      absent: "Absent",
      late: "Late",
      half_day: "Half Day",
      on_leave: "On Leave",
    };
    return status ? labels[status] || "Not Marked" : "Not Marked";
  },

  /**
   * Check if attendance percentage is below threshold
   */
  isBelowThreshold(percentage: number, threshold = 75): boolean {
    return percentage < threshold;
  },

  /**
   * Get attendance status based on percentage
   */
  getAttendanceStatus(
    percentage: number
  ): "excellent" | "good" | "average" | "poor" | "critical" {
    if (percentage >= 90) {return "excellent";}
    if (percentage >= 75) {return "good";}
    if (percentage >= 60) {return "average";}
    if (percentage >= 40) {return "poor";}
    return "critical";
  },
};

export type AttendanceService = typeof attendanceService;
