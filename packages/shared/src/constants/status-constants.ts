/**
 * Shared status constants used across multiple features.
 * Maps to backend API status values.
 */

export const LEAVE_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
} as const;

export type LeaveStatusValue = (typeof LEAVE_STATUS)[keyof typeof LEAVE_STATUS];

export const EXAM_STATUS = {
  DRAFT: "draft",
  SCHEDULED: "scheduled",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export type ExamStatusValue = (typeof EXAM_STATUS)[keyof typeof EXAM_STATUS];

export const ATTENDANCE_STATE = {
  PRESENT: "present",
  ABSENT: "absent",
  HALF_DAY: "half_day",
  LEAVE_APPROVED: "leave-approved",
  LEAVE_PENDING: "leave-pending",
} as const;

export type AttendanceStateValue =
  (typeof ATTENDANCE_STATE)[keyof typeof ATTENDANCE_STATE];

export const OVERRIDE_TYPE = {
  CANCELLED: "cancelled",
  SUBSTITUTED: "substituted",
  RESCHEDULED: "rescheduled",
} as const;

export type OverrideTypeValue =
  (typeof OVERRIDE_TYPE)[keyof typeof OVERRIDE_TYPE];
