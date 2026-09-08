/**
 * Notification Constants
 * Mirrors `edusphere.notifications.constants` on the backend.
 *
 * `icon` holds a Lucide icon name so web (lucide-react) and mobile
 * (lucide-react-native) render the same glyph for a given category.
 */

export const NOTIFICATION_CATEGORY = {
  SECURITY: "security",
  ACCOUNT: "account",
  ANNOUNCEMENTS: "announcements",
  ATTENDANCE: "attendance",
  LEAVE: "leave",
  ACADEMICS: "academics",
  HOMEWORK: "homework",
  EXAMS: "exams",
  FEES: "fees",
  TIMETABLE: "timetable",
  WORK_POLICY: "work_policy",
  TIMESHEET: "timesheet",
  ORGANIZATION: "organization",
} as const;

export type NotificationCategory =
  (typeof NOTIFICATION_CATEGORY)[keyof typeof NOTIFICATION_CATEGORY];

/** Categories the server never lets a user disable. */
export const MANDATORY_NOTIFICATION_CATEGORIES: readonly NotificationCategory[] =
  [NOTIFICATION_CATEGORY.SECURITY, NOTIFICATION_CATEGORY.ACCOUNT] as const;

export const NOTIFICATION_CATEGORY_LABELS: Record<
  NotificationCategory,
  string
> = {
  [NOTIFICATION_CATEGORY.SECURITY]: "Security",
  [NOTIFICATION_CATEGORY.ACCOUNT]: "Account",
  [NOTIFICATION_CATEGORY.ANNOUNCEMENTS]: "Announcements",
  [NOTIFICATION_CATEGORY.ATTENDANCE]: "Attendance",
  [NOTIFICATION_CATEGORY.LEAVE]: "Leave",
  [NOTIFICATION_CATEGORY.ACADEMICS]: "Academics",
  [NOTIFICATION_CATEGORY.HOMEWORK]: "Homework",
  [NOTIFICATION_CATEGORY.EXAMS]: "Exams",
  [NOTIFICATION_CATEGORY.FEES]: "Fees",
  [NOTIFICATION_CATEGORY.TIMETABLE]: "Timetable",
  [NOTIFICATION_CATEGORY.WORK_POLICY]: "Work Policy",
  [NOTIFICATION_CATEGORY.TIMESHEET]: "Timesheet",
  [NOTIFICATION_CATEGORY.ORGANIZATION]: "Organization",
};

export const NOTIFICATION_CATEGORY_ICONS: Record<NotificationCategory, string> =
  {
    [NOTIFICATION_CATEGORY.SECURITY]: "ShieldCheck",
    [NOTIFICATION_CATEGORY.ACCOUNT]: "UserCog",
    [NOTIFICATION_CATEGORY.ANNOUNCEMENTS]: "Megaphone",
    [NOTIFICATION_CATEGORY.ATTENDANCE]: "CalendarCheck",
    [NOTIFICATION_CATEGORY.LEAVE]: "CalendarOff",
    [NOTIFICATION_CATEGORY.ACADEMICS]: "GraduationCap",
    [NOTIFICATION_CATEGORY.HOMEWORK]: "BookOpen",
    [NOTIFICATION_CATEGORY.EXAMS]: "ClipboardList",
    [NOTIFICATION_CATEGORY.FEES]: "IndianRupee",
    [NOTIFICATION_CATEGORY.TIMETABLE]: "CalendarClock",
    [NOTIFICATION_CATEGORY.WORK_POLICY]: "Briefcase",
    [NOTIFICATION_CATEGORY.TIMESHEET]: "Clock",
    [NOTIFICATION_CATEGORY.ORGANIZATION]: "Building2",
  };

export const NOTIFICATION_PRIORITY = {
  LOW: "low",
  NORMAL: "normal",
  HIGH: "high",
} as const;

export type NotificationPriority =
  (typeof NOTIFICATION_PRIORITY)[keyof typeof NOTIFICATION_PRIORITY];

export const NOTIFICATION_EVENT_TYPE = {
  ANNOUNCEMENT_PUBLISHED: "announcement_published",
} as const;

export type NotificationEventType =
  (typeof NOTIFICATION_EVENT_TYPE)[keyof typeof NOTIFICATION_EVENT_TYPE];

export const DEVICE_PLATFORM = {
  ANDROID: "android",
  IOS: "ios",
  WEB: "web",
} as const;

export type DevicePlatform =
  (typeof DEVICE_PLATFORM)[keyof typeof DEVICE_PLATFORM];

/** Unread badge cap; counts above this render as "99+". */
export const NOTIFICATION_BADGE_MAX = 99;

/**
 * Fallback unread-count poll for web sessions where the browser denied or does
 * not support push. Push-enabled sessions refresh from the message itself.
 */
export const NOTIFICATION_UNREAD_POLL_MS = 300_000;
