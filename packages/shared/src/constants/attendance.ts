/**
 * Attendance Module Constants
 * Shared across Web, iOS, and Android
 */

export const SaturdayOffPattern = {
  ALL: "ALL",
  SECOND_ONLY: "SECOND_ONLY",
  SECOND_AND_FOURTH: "SECOND_AND_FOURTH",
  NONE: "NONE",
} as const;

export type SaturdayOffPatternType =
  (typeof SaturdayOffPattern)[keyof typeof SaturdayOffPattern];

export const SaturdayOffPatternLabels: Record<SaturdayOffPatternType, string> =
  {
    [SaturdayOffPattern.ALL]: "All Saturdays Off",
    [SaturdayOffPattern.SECOND_ONLY]: "Second Saturday Only",
    [SaturdayOffPattern.SECOND_AND_FOURTH]: "Second and Fourth Saturday",
    [SaturdayOffPattern.NONE]: "No Saturday Off",
  };

export const HolidayType = {
  SUNDAY: "SUNDAY",
  SATURDAY: "SATURDAY",
  SECOND_SATURDAY: "SECOND_SATURDAY",
  NATIONAL_HOLIDAY: "NATIONAL_HOLIDAY",
  FESTIVAL: "FESTIVAL",
  ORGANIZATION_HOLIDAY: "ORGANIZATION_HOLIDAY",
  OTHER: "OTHER",
} as const;

export type HolidayTypeValue = (typeof HolidayType)[keyof typeof HolidayType];

export const HolidayTypeLabels: Record<HolidayTypeValue, string> = {
  [HolidayType.SUNDAY]: "Sunday",
  [HolidayType.SATURDAY]: "Saturday",
  [HolidayType.SECOND_SATURDAY]: "Second Saturday",
  [HolidayType.NATIONAL_HOLIDAY]: "National Holiday",
  [HolidayType.FESTIVAL]: "Festival",
  [HolidayType.ORGANIZATION_HOLIDAY]: "Organization Holiday",
  [HolidayType.OTHER]: "Other",
};

/**
 * Attendance marking permission types
 * Matches backend AttendancePermissions constants
 */
export const AttendancePermissions = {
  CLASS_TEACHER_ONLY: "class_teacher_only",
  ANY_TEACHER_WHO_TEACHES_FOR_CLASS: "any_teacher_who_teaches_for_class",
  ANY_TEACHER_IN_ORGANIZATION: "any_teacher_in_organization",
} as const;

export type AttendancePermissionType =
  (typeof AttendancePermissions)[keyof typeof AttendancePermissions];

export const AttendancePermissionLabels: Record<
  AttendancePermissionType,
  string
> = {
  [AttendancePermissions.CLASS_TEACHER_ONLY]: "Class Teacher Only",
  [AttendancePermissions.ANY_TEACHER_WHO_TEACHES_FOR_CLASS]:
    "Any Teacher Who Teaches for Class",
  [AttendancePermissions.ANY_TEACHER_IN_ORGANIZATION]:
    "Any Teacher in Organization",
};

/**
 * Attendance status types
 */
export const AttendanceStatus = {
  PRESENT: "present",
  ABSENT: "absent",
  HALF_DAY_FIRST: "half_day_first",
  HALF_DAY_SECOND: "half_day_second",
  LEAVE: "leave",
  HOLIDAY: "holiday",
} as const;

export type AttendanceStatusType =
  (typeof AttendanceStatus)[keyof typeof AttendanceStatus];

export const AttendanceStatusLabels: Record<AttendanceStatusType, string> = {
  [AttendanceStatus.PRESENT]: "Present",
  [AttendanceStatus.ABSENT]: "Absent",
  [AttendanceStatus.HALF_DAY_FIRST]: "Half Day - First Half",
  [AttendanceStatus.HALF_DAY_SECOND]: "Half Day - Second Half",
  [AttendanceStatus.LEAVE]: "On Leave",
  [AttendanceStatus.HOLIDAY]: "Holiday",
};

/**
 * Timesheet submission status values
 * Matches backend TimesheetSubmission.SubmissionStatus choices
 */
export const TimesheetStatus = {
  DRAFT: "DRAFT",
  SUBMITTED: "SUBMITTED",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  RETURNED: "RETURNED",
} as const;

export type TimesheetStatusValue =
  (typeof TimesheetStatus)[keyof typeof TimesheetStatus];

export const TimesheetStatusLabels: Record<TimesheetStatusValue, string> = {
  [TimesheetStatus.DRAFT]: "Draft",
  [TimesheetStatus.SUBMITTED]: "Pending Approval",
  [TimesheetStatus.APPROVED]: "Approved",
  [TimesheetStatus.REJECTED]: "Rejected",
  [TimesheetStatus.RETURNED]: "Returned",
};

/**
 * Timesheet review action types
 */
export const TimesheetReviewAction = {
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export type TimesheetReviewActionValue =
  (typeof TimesheetReviewAction)[keyof typeof TimesheetReviewAction];

/**
 * Leave-related day types for attendance locking
 */
export const DayLockReason = {
  HOLIDAY: "holiday",
  LEAVE: "leave",
  NON_WORKING_DAY: "non_working_day",
} as const;

export type DayLockReasonValue =
  (typeof DayLockReason)[keyof typeof DayLockReason];

/**
 * Attendance session types (morning/afternoon)
 */
export const AttendanceSession = {
  MORNING: "morning",
  AFTERNOON: "afternoon",
  FULL_DAY: "full_day",
} as const;

export type AttendanceSessionValue =
  (typeof AttendanceSession)[keyof typeof AttendanceSession];

export const AttendanceSessionLabels: Record<AttendanceSessionValue, string> = {
  [AttendanceSession.MORNING]: "Morning",
  [AttendanceSession.AFTERNOON]: "Afternoon",
  [AttendanceSession.FULL_DAY]: "Full Day",
};
