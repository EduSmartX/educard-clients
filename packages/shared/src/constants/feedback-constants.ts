/**
 * Feedback Constants
 * Single source of truth for feedback types/modules across web and mobile.
 *
 * `icon` holds a Lucide icon name so web (lucide-react) and mobile
 * (lucide-react-native) render the same glyph for a given feedback type.
 */

export const FEEDBACK_TYPE = {
  SUGGESTION: "suggestion",
  IMPROVEMENT: "improvement",
  COMPLAINT: "complaint",
  OTHER: "other",
} as const;

export type FeedbackType = (typeof FEEDBACK_TYPE)[keyof typeof FEEDBACK_TYPE];

export const FEEDBACK_MODULE = {
  STUDENTS: "students",
  TEACHERS: "teachers",
  CLASSES: "classes",
  SUBJECTS: "subjects",
  ATTENDANCE: "attendance",
  TIMETABLE: "timetable",
  EXAMS: "exams",
  HOMEWORK: "homework",
  FEE: "fee",
  LEAVE: "leave",
  NOTIFICATIONS: "notifications",
  ORGANIZATION: "organization",
  OTHER: "other",
} as const;

export type FeedbackModule =
  (typeof FEEDBACK_MODULE)[keyof typeof FEEDBACK_MODULE];

export const FEEDBACK_STATUS = {
  OPEN: "open",
  IN_PROGRESS: "in_progress",
  RESOLVED: "resolved",
  CLOSED: "closed",
} as const;

export type FeedbackStatus =
  (typeof FEEDBACK_STATUS)[keyof typeof FEEDBACK_STATUS];

export const FEEDBACK_STATUS_COLORS: Record<
  FeedbackStatus,
  { color: string; bgColor: string }
> = {
  [FEEDBACK_STATUS.OPEN]: { color: "#dc2626", bgColor: "#fef2f2" },
  [FEEDBACK_STATUS.IN_PROGRESS]: { color: "#d97706", bgColor: "#fffbeb" },
  [FEEDBACK_STATUS.RESOLVED]: { color: "#059669", bgColor: "#ecfdf5" },
  [FEEDBACK_STATUS.CLOSED]: { color: "#64748b", bgColor: "#f1f5f9" },
};

export const FEEDBACK_PROGRESS_STEPS = [
  "Open",
  "In Progress",
  "Resolved",
] as const;

export type FeedbackTypeIconName =
  | "Lightbulb"
  | "TrendingUp"
  | "AlertTriangle"
  | "MessageCircle";

export interface FeedbackTypeOption {
  value: FeedbackType;
  label: string;
  description: string;
  icon: FeedbackTypeIconName;
  /** Foreground / accent colour for the icon and selected state. */
  color: string;
  /** Tinted surface behind the icon. */
  bgColor: string;
  borderColor: string;
}

export const FEEDBACK_TYPE_OPTIONS: readonly FeedbackTypeOption[] = [
  {
    value: FEEDBACK_TYPE.SUGGESTION,
    label: "Suggestion",
    description: "Share an idea for something new",
    icon: "Lightbulb",
    color: "#d97706",
    bgColor: "#fffbeb",
    borderColor: "#fcd34d",
  },
  {
    value: FEEDBACK_TYPE.IMPROVEMENT,
    label: "Improvement",
    description: "Tell us what could work better",
    icon: "TrendingUp",
    color: "#2563eb",
    bgColor: "#eff6ff",
    borderColor: "#93c5fd",
  },
  {
    value: FEEDBACK_TYPE.COMPLAINT,
    label: "Complaint",
    description: "Report a problem you ran into",
    icon: "AlertTriangle",
    color: "#dc2626",
    bgColor: "#fef2f2",
    borderColor: "#fca5a5",
  },
  {
    value: FEEDBACK_TYPE.OTHER,
    label: "Other",
    description: "Anything else you want to tell us",
    icon: "MessageCircle",
    color: "#7c3aed",
    bgColor: "#f5f3ff",
    borderColor: "#c4b5fd",
  },
] as const;

export const FEEDBACK_MODULE_OPTIONS: readonly {
  value: FeedbackModule;
  label: string;
}[] = [
  { value: FEEDBACK_MODULE.STUDENTS, label: "Students" },
  { value: FEEDBACK_MODULE.TEACHERS, label: "Teachers" },
  { value: FEEDBACK_MODULE.CLASSES, label: "Classes" },
  { value: FEEDBACK_MODULE.SUBJECTS, label: "Subjects" },
  { value: FEEDBACK_MODULE.ATTENDANCE, label: "Attendance" },
  { value: FEEDBACK_MODULE.TIMETABLE, label: "Timetable" },
  { value: FEEDBACK_MODULE.EXAMS, label: "Exams" },
  { value: FEEDBACK_MODULE.HOMEWORK, label: "Homework" },
  { value: FEEDBACK_MODULE.FEE, label: "Fee" },
  { value: FEEDBACK_MODULE.LEAVE, label: "Leave" },
  { value: FEEDBACK_MODULE.NOTIFICATIONS, label: "Notifications" },
  { value: FEEDBACK_MODULE.ORGANIZATION, label: "Organization" },
  { value: FEEDBACK_MODULE.OTHER, label: "Other" },
] as const;

export const getFeedbackTypeOption = (
  value: string | null | undefined,
): FeedbackTypeOption =>
  FEEDBACK_TYPE_OPTIONS.find((option) => option.value === value) ??
  FEEDBACK_TYPE_OPTIONS[FEEDBACK_TYPE_OPTIONS.length - 1];

// Attachment rules — kept in sync with the backend feedback module.
export const FEEDBACK_MAX_ATTACHMENTS = 5;
export const FEEDBACK_MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024;
export const FEEDBACK_ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const FEEDBACK_SUBJECT_MAX_LENGTH = 200;
export const FEEDBACK_DESCRIPTION_MAX_LENGTH = 2000;

// Rating bounds — kept in sync with the backend feedback module.
export const FEEDBACK_MIN_RATING = 1;
export const FEEDBACK_MAX_RATING = 5;

export const FEEDBACK_RATING_LABELS: Record<number, string> = {
  1: "Very poor",
  2: "Poor",
  3: "Average",
  4: "Good",
  5: "Excellent",
};
