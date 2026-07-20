/**
 * Exam Types — Re-exports from @educard/shared
 * Single source of truth for Web and Mobile
 *
 * ExamSession -> Exam (session+subject) -> Mark
 */

// Re-export all exam types from shared package
export {
  // Types
  type ExamSessionType,
  type ExamStatus,
  type ExamSession,
  type ExamSessionListParams,
  type ExamSessionCreatePayload,
  type ExamSessionUpdatePayload,
  type Exam,
  type ExamListParams,
  type ExamCreatePayload,
  type ExamUpdatePayload,
  type BulkExamItem,
  type BulkExamCreatePayload,
  type Mark,
  type BulkMarkEntry,
  type BulkMarkUpsertPayload,
  type MarksOverviewSubject,
  type MarksOverviewStudent,
  type MarksOverviewResponse,
  type MarksPermissions,
  type StudentExamMark,
  type StudentMarksEntry,
  type BulkSaveAllMarksPayload,
  // Constants
  EXAM_SESSION_TYPE_LABELS,
  EXAM_SESSION_TYPE_OPTIONS,
  EXAM_STATUS_LABELS,
  EXAM_STATUS_OPTIONS,
  EXAM_STATUS_COLORS,
} from '@educard/shared';
