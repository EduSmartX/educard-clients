// Re-export types directly from shared
export type {
  ExamSession,
  ExamSessionType,
  ExamStatus,
  Exam,
  Mark,
  BulkMarkEntry,
  MarksOverviewResponse,
  ExamSessionCreatePayload,
  ExamCreatePayload,
  BulkSaveAllMarksPayload,
} from '@educard/shared';

export {
  EXAM_SESSION_TYPE_LABELS,
  EXAM_SESSION_TYPE_OPTIONS,
  EXAM_STATUS_LABELS,
  EXAM_STATUS_OPTIONS,
  EXAM_STATUS_COLORS,
} from '@educard/shared';

export * from './hooks';
export * from './api';
