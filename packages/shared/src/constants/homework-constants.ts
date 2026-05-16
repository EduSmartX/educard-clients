/**
 * Homework Constants
 * Shared across all platforms (web, mobile, Android, iOS)
 */

// ============== Status Enums ==============

export const HOMEWORK_STATUS = {
  DRAFT: "draft",
  PUBLISHED: "published",
  ARCHIVED: "archived",
} as const;

export const HOMEWORK_PRIORITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
} as const;

export const SUBMISSION_TYPE = {
  ONLINE: "online",
  OFFLINE: "offline",
  BOTH: "both",
} as const;

export const SUBMISSION_STATUS = {
  PENDING: "pending",
  SUBMITTED: "submitted",
  REVIEWED: "reviewed",
} as const;

export const ATTACHMENT_TYPE = {
  PDF: "pdf",
  DOC: "doc",
  DOCX: "docx",
  IMAGE: "image",
  VIDEO: "video",
  AUDIO: "audio",
  SPREADSHEET: "spreadsheet",
  PRESENTATION: "presentation",
  ARCHIVE: "archive",
  OTHER: "other",
} as const;

// ============== TypeScript Types ==============

export type HomeworkStatus =
  (typeof HOMEWORK_STATUS)[keyof typeof HOMEWORK_STATUS];
export type HomeworkPriority =
  (typeof HOMEWORK_PRIORITY)[keyof typeof HOMEWORK_PRIORITY];
export type SubmissionType =
  (typeof SUBMISSION_TYPE)[keyof typeof SUBMISSION_TYPE];
export type SubmissionStatus =
  (typeof SUBMISSION_STATUS)[keyof typeof SUBMISSION_STATUS];
export type AttachmentType =
  (typeof ATTACHMENT_TYPE)[keyof typeof ATTACHMENT_TYPE];

// ============== Display Options ==============

export const HOMEWORK_STATUS_OPTIONS = [
  { value: HOMEWORK_STATUS.DRAFT, label: "Draft" },
  { value: HOMEWORK_STATUS.PUBLISHED, label: "Published" },
  { value: HOMEWORK_STATUS.ARCHIVED, label: "Archived" },
] as const;

export const HOMEWORK_PRIORITY_OPTIONS = [
  { value: HOMEWORK_PRIORITY.LOW, label: "Low", color: "#6B7280" },
  { value: HOMEWORK_PRIORITY.MEDIUM, label: "Medium", color: "#F59E0B" },
  { value: HOMEWORK_PRIORITY.HIGH, label: "High", color: "#EF4444" },
] as const;

export const SUBMISSION_TYPE_OPTIONS = [
  { value: SUBMISSION_TYPE.ONLINE, label: "Online Submission" },
  { value: SUBMISSION_TYPE.OFFLINE, label: "Offline Submission" },
  { value: SUBMISSION_TYPE.BOTH, label: "Both Online & Offline" },
] as const;

export const SUBMISSION_STATUS_OPTIONS = [
  { value: SUBMISSION_STATUS.PENDING, label: "Pending" },
  { value: SUBMISSION_STATUS.SUBMITTED, label: "Submitted" },
  { value: SUBMISSION_STATUS.REVIEWED, label: "Reviewed" },
] as const;

// ============== Color Maps ==============

export const HOMEWORK_PRIORITY_COLORS: Record<HomeworkPriority, string> = {
  [HOMEWORK_PRIORITY.HIGH]: "#EF4444",
  [HOMEWORK_PRIORITY.MEDIUM]: "#F59E0B",
  [HOMEWORK_PRIORITY.LOW]: "#6B7280",
};

export const SUBMISSION_STATUS_COLORS: Record<SubmissionStatus, string> = {
  [SUBMISSION_STATUS.PENDING]: "#94A3B8",
  [SUBMISSION_STATUS.SUBMITTED]: "#3B82F6",
  [SUBMISSION_STATUS.REVIEWED]: "#10B981",
};

export const HOMEWORK_STATUS_LABELS: Record<HomeworkStatus, string> = {
  [HOMEWORK_STATUS.DRAFT]: "Draft",
  [HOMEWORK_STATUS.PUBLISHED]: "Published",
  [HOMEWORK_STATUS.ARCHIVED]: "Archived",
};

export const SUBMISSION_STATUS_LABELS: Record<SubmissionStatus, string> = {
  [SUBMISSION_STATUS.PENDING]: "Pending",
  [SUBMISSION_STATUS.SUBMITTED]: "Submitted",
  [SUBMISSION_STATUS.REVIEWED]: "Reviewed",
};

// ============== Utility Functions ==============

export function getPriorityColor(priority: HomeworkPriority): string {
  return HOMEWORK_PRIORITY_COLORS[priority];
}

export function getStatusLabel(status: HomeworkStatus): string {
  return HOMEWORK_STATUS_LABELS[status];
}

export function getSubmissionStatusLabel(status: SubmissionStatus): string {
  return SUBMISSION_STATUS_LABELS[status];
}

export function getSubmissionStatusColor(status: SubmissionStatus): string {
  return SUBMISSION_STATUS_COLORS[status];
}

// ============== File Size Limits ==============

export const HOMEWORK_ATTACHMENT_MAX_SIZE = 10 * 1024 * 1024; // 10MB
export const HOMEWORK_ATTACHMENT_MAX_SIZE_DISPLAY = "10MB";

// ============== Validation ==============

export const HOMEWORK_TITLE_MAX_LENGTH = 255;
export const HOMEWORK_DESCRIPTION_MAX_LENGTH = 2000;
export const HOMEWORK_INSTRUCTIONS_MAX_LENGTH = 5000;
export const HOMEWORK_REFERENCE_LINK_MAX_LENGTH = 500;

// ============== UI Labels & Messages ==============

export const HOMEWORK_UI = {
  // Page Titles
  REVIEW_SUBMISSION: "Review Submission",
  SUBMISSIONS: "Submissions",

  // Buttons
  BACK_TO_SUBMISSIONS: "Back to Submissions",
  PREVIOUS_STUDENT: "Previous Student",
  NEXT_STUDENT: "Next Student",
  SUBMIT_REVIEW: "Submit Review",
  UPDATE_REVIEW: "Update Review",
  SUBMITTING: "Submitting...",
  GO_BACK: "Go Back",

  // Labels
  STUDENT_NOTES: "Student Notes",
  ATTACHMENTS: "Attachments",
  REVIEW_FEEDBACK: "Review Feedback",
  VIEW_ONLY: "View Only",
  LATE: "Late",
  ROLL: "Roll",
  DUE: "Due",
  TOTAL_STUDENTS: "Total Students",
  SUBMITTED: "Submitted",
  PENDING: "Pending",
  REVIEWED: "Reviewed",

  // Placeholders
  FEEDBACK_PLACEHOLDER: "Enter feedback for the student (optional)...",
  FEEDBACK_PLACEHOLDER_READONLY: "No feedback provided yet",
  SEARCH_STUDENTS: "Search students...",

  // Descriptions
  FEEDBACK_IS_OPTIONAL: "Feedback is optional",
  FEEDBACK_PROVIDED: "Feedback provided for this submission",
  ONLY_ASSIGNED_TEACHER_CAN_REVIEW: "Only the assigned teacher can review",

  // Empty States
  NO_SUBMISSIONS_YET: "No Submissions Yet",
  NO_SUBMISSIONS_DESC: "Students haven't submitted their homework yet.",
  SUBMISSION_NOT_FOUND: "Submission Not Found",
  SUBMISSION_NOT_FOUND_DESC:
    "The submission you're looking for doesn't exist or you don't have access to it.",
  NO_MATCHING_SUBMISSIONS: "No Matching Submissions",
  NO_MATCHING_DESC: "Try adjusting your search or filter criteria.",
  SELECT_HOMEWORK: "Select Homework",
  SELECT_HOMEWORK_DESC:
    "Click on a homework card above to view its submissions.",

  // Status Messages
  REVIEWED_BY: "Reviewed by",

  // Success Messages
  HOMEWORK_CREATED: "Homework created successfully",
  HOMEWORK_UPDATED: "Homework updated successfully",
  HOMEWORK_DELETED: "Homework deleted successfully",
  FILE_UPLOADED: "File uploaded successfully",
  ATTACHMENT_REMOVED: "Attachment removed",
  SUBMISSION_REVIEWED: "Submission reviewed successfully",

  // Error Messages
  SELECT_AT_LEAST_ONE_SUBJECT: "Please select at least one subject",
  FIX_FORM_ERRORS: "Please fix the form errors",
  ADD_TITLE_FOR: "Please add a title for:",
  FAILED_TO_CREATE: "Failed to create homework",
  FAILED_TO_UPDATE: "Failed to update homework",
  FAILED_TO_DELETE: "Failed to delete homework",
  FAILED_TO_UPLOAD: "Failed to upload file",
  FAILED_TO_REMOVE: "Failed to remove attachment",
  FAILED_TO_REVIEW: "Failed to review submission",
} as const;
