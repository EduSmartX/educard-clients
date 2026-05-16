/**
 * Homework Feature Exports
 */

// API functions
export * from './api';

// React Query hooks
export * from './hooks';

// Re-export types and constants from shared package
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
