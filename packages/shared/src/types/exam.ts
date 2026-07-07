/**
 * Exam Types — Shared between Web and Mobile
 * Matches backend API responses for ExamSession, Exam, Mark
 */

// =============================================================================
// Enums & Constants
// =============================================================================

export type ExamSessionType =
  | "unit_test"
  | "quarterly"
  | "half_yearly"
  | "annual"
  | "custom";

export const EXAM_SESSION_TYPE_LABELS: Record<ExamSessionType, string> = {
  unit_test: "Unit Test",
  quarterly: "Quarterly",
  half_yearly: "Half Yearly",
  annual: "Annual / Final Year",
  custom: "Custom",
};

export const EXAM_SESSION_TYPE_OPTIONS = Object.entries(
  EXAM_SESSION_TYPE_LABELS,
).map(([value, label]) => ({ value: value as ExamSessionType, label }));

export type ExamStatus =
  | "draft"
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled";

export const EXAM_STATUS_LABELS: Record<ExamStatus, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const EXAM_STATUS_OPTIONS = Object.entries(EXAM_STATUS_LABELS).map(
  ([value, label]) => ({
    value: value as ExamStatus,
    label,
  }),
);

export const EXAM_STATUS_COLORS: Record<
  ExamStatus,
  { bg: string; text: string }
> = {
  draft: { bg: "#f1f5f9", text: "#64748b" },
  scheduled: { bg: "#eff6ff", text: "#2563eb" },
  in_progress: { bg: "#fef3c7", text: "#d97706" },
  completed: { bg: "#dcfce7", text: "#16a34a" },
  cancelled: { bg: "#fee2e2", text: "#dc2626" },
};

// =============================================================================
// Exam Session Types
// =============================================================================

export interface ExamSession {
  public_id: string;
  name: string;
  session_type: ExamSessionType;
  academic_year: string;
  academic_year_public_id: string;
  description: string;
  start_date: string | null;
  end_date: string | null;
  exam_count: number;
  created_at: string;
  updated_at: string;
  created_by_public_id?: string | null;
  created_by_name?: string | null;
  updated_by_public_id?: string | null;
  updated_by_name?: string | null;
}

export interface ExamSessionListParams {
  page?: number;
  page_size?: number;
  search?: string;
  academic_year?: string;
  session_type?: string;
  is_deleted?: boolean;
}

export interface ExamSessionCreatePayload {
  name: string;
  session_type: ExamSessionType;
  academic_year: string;
  description?: string;
  start_date?: string | null;
  end_date?: string | null;
}

export interface ExamSessionUpdatePayload {
  name?: string;
  session_type?: ExamSessionType;
  academic_year?: string;
  description?: string;
  start_date?: string | null;
  end_date?: string | null;
}

// =============================================================================
// Exam Types (Session + Subject combination)
// =============================================================================

export interface Exam {
  public_id: string;
  session_name: string;
  session_public_id: string;
  session_type: ExamSessionType;
  session_start_date?: string | null;
  session_end_date?: string | null;
  subject_name: string;
  subject_public_id: string;
  class_name: string;
  class_public_id: string;
  status: ExamStatus;
  is_marks_published: boolean;
  max_marks: number;
  passing_marks: number;
  date: string | null;
  start_time: string | null;
  end_time: string | null;
  duration: number | null;
  duration_formatted: string | null;
  description: string;
  marks_count: number;
  created_at: string;
  updated_at?: string;
  created_by_public_id?: string | null;
  created_by_name?: string | null;
  updated_by_public_id?: string | null;
  updated_by_name?: string | null;
}

export interface ExamListParams {
  page?: number;
  page_size?: number;
  search?: string;
  session?: string;
  status?: string;
  class_id?: string;
  subject?: string;
  is_deleted?: boolean;
}

export interface ExamCreatePayload {
  session_id: string;
  subject_id: string;
  max_marks?: number;
  passing_marks?: number;
  status?: ExamStatus;
  date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  description?: string;
}

export interface ExamUpdatePayload {
  status?: ExamStatus;
  max_marks?: number;
  passing_marks?: number;
  date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  description?: string;
}

// Bulk exam creation
export interface BulkExamItem {
  subject_id: string;
  max_marks?: number;
  passing_marks?: number;
  date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
}

export interface BulkExamCreatePayload {
  session_id: string;
  class_id?: string;
  status?: ExamStatus;
  exams: BulkExamItem[];
}

// =============================================================================
// Mark Types
// =============================================================================

export interface Mark {
  public_id: string;
  student_name: string;
  student_public_id: string;
  student_admission_number: string;
  student_roll_number?: string | null;
  subject_name?: string;
  class_name?: string;
  exam_public_id?: string;
  session_name?: string;
  marks_obtained: number;
  max_marks: number;
  passing_marks: number;
  is_absent: boolean;
  is_pass: boolean;
  percentage: number;
  created_at?: string;
  updated_at?: string;
  created_by_public_id?: string | null;
  created_by_name?: string | null;
  updated_by_public_id?: string | null;
  updated_by_name?: string | null;
}

export interface BulkMarkEntry {
  student_id: string;
  marks_obtained: number;
  is_absent?: boolean;
}

export interface BulkMarkUpsertPayload {
  session_id: string;
  exam_id: string;
  marks: BulkMarkEntry[];
}

// =============================================================================
// Marks Overview Types
// =============================================================================

export interface MarksOverviewSubject {
  exam_public_id: string;
  subject_public_id?: string;
  subject_name: string;
  max_marks: number;
  passing_marks: number;
  status: string;
  is_marks_published?: boolean;
  total_students: number;
  appeared: number;
  absent: number;
  passed: number;
  failed: number;
  average_marks: number;
  pass_percentage: number;
}

export interface MarksOverviewStudent {
  student_public_id: string;
  student_name: string;
  admission_number: string;
  roll_number: string | null;
  marks?: Record<
    string,
    {
      marks_obtained: number;
      is_absent: boolean;
      max_marks: number;
      is_pass: boolean;
    }
  >;
  summary?: {
    total_max: number;
    total_obtained: number;
    percentage: number;
    is_pass: boolean | null;
  };
}

export interface MarksOverviewResponse {
  session: { public_id: string; name: string; session_type: string };
  class_info: {
    public_id: string;
    name: string;
    class_master_name: string;
    section_name: string;
  };
  subjects: MarksOverviewSubject[];
  students: MarksOverviewStudent[];
  stats: {
    total_students: number;
    passed_count: number;
    failed_count: number;
    pass_percentage: number;
  };
  permissions?: MarksPermissions;
}

export interface MarksPermissions {
  is_admin: boolean;
  is_class_teacher: boolean;
  can_edit_all_subjects: boolean;
  can_edit: boolean;
  editable_subject_ids: string[] | null;
}

// Bulk Save All Marks (for Marks Overview page)
export interface StudentExamMark {
  exam_id: string;
  marks_obtained: number | null;
  is_absent: boolean;
}

export interface StudentMarksEntry {
  student_id: string;
  marks: StudentExamMark[];
}

export interface BulkSaveAllMarksPayload {
  session_id: string;
  class_id: string;
  students: StudentMarksEntry[];
}
