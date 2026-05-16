/**
 * Homework Types
 * Re-exports from @educard/shared
 */

// Re-export constants and utilities
export {
  HOMEWORK_STATUS,
  HOMEWORK_PRIORITY,
  SUBMISSION_TYPE,
  SUBMISSION_STATUS,
  ATTACHMENT_TYPE,
  HOMEWORK_STATUS_OPTIONS,
  HOMEWORK_PRIORITY_OPTIONS,
  SUBMISSION_TYPE_OPTIONS,
  SUBMISSION_STATUS_OPTIONS,
  getPriorityColor,
  getStatusLabel,
  getSubmissionStatusLabel,
  getSubmissionStatusColor,
} from '@educard/shared';

// Re-export types
export type {
  HomeworkStatus,
  HomeworkPriority,
  SubmissionType,
  SubmissionStatus,
  AttachmentType,
  HomeworkAttachment,
  SubmissionStats,
  Homework,
  HomeworkDetail,
  HomeworkSubmission,
  HomeworkSubmissionDetail,
  HomeworkDashboardStats,
  CalendarHomework,
  TeacherClass,
  HomeworkCreatePayload,
  HomeworkUpdatePayload,
  ReviewSubmissionPayload,
  HomeworkListParams,
  SubmissionListParams,
  CalendarParams,
  HomeworkApiResponse,
  SubmissionsResponse,
} from '@educard/shared';
