/**
 * Exam Types � simplified 3-table design
 * ExamSession -> Exam (session+subject) -> Mark
 */

// -- Exam Session --------------------------------------------------

export type ExamSessionType =
  | 'unit_test'
  | 'quarterly'
  | 'half_yearly'
  | 'annual'
  | 'custom';

export const EXAM_SESSION_TYPE_LABELS: Record<ExamSessionType, string> = {
  unit_test: 'Unit Test',
  quarterly: 'Quarterly',
  half_yearly: 'Half Yearly',
  annual: 'Annual / Final Year',
  custom: 'Custom',
};

export const EXAM_SESSION_TYPE_OPTIONS = Object.entries(EXAM_SESSION_TYPE_LABELS).map(
  ([value, label]) => ({ value, label })
);

export type ExamStatus = 'draft' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export const EXAM_STATUS_LABELS: Record<ExamStatus, string> = {
  draft: 'Draft',
  scheduled: 'Scheduled',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const EXAM_STATUS_OPTIONS = Object.entries(EXAM_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export interface ExamSession {
  public_id: string;
  name: string;
  session_type: ExamSessionType;
  academic_year: string;
  description: string;
  start_date: string | null;
  end_date: string | null;
  exam_count: number;
  created_at: string;
  updated_at: string;
  created_by_public_id: string | null;
  created_by_name: string | null;
  updated_by_public_id: string | null;
  updated_by_name: string | null;
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

// -- Exam (session + subject, class derived from subject) ----------

export interface Exam {
  public_id: string;
  session_name: string;
  session_public_id: string;
  session_type: ExamSessionType;
  session_start_date: string | null;
  session_end_date: string | null;
  subject_name: string;
  subject_public_id: string;
  class_name: string;
  class_public_id: string;
  status: ExamStatus;
  max_marks: number;
  passing_marks: number;
  date: string | null;
  start_time: string | null;
  end_time: string | null;
  duration: number | null;  // Duration in minutes
  duration_formatted: string | null;  // e.g., "2h 30m" or "45m"
  description: string;
  marks_count: number;
  created_at: string;
  updated_at: string;
  created_by_public_id: string | null;
  created_by_name: string | null;
  updated_by_public_id: string | null;
  updated_by_name: string | null;
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

// Bulk exam creation types
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

// -- Marks ---------------------------------------------------------

export interface Mark {
  public_id: string;
  student_name: string;
  student_public_id: string;
  student_admission_number: string;
  subject_name: string;
  class_name: string;
  exam_public_id: string;
  session_name: string;
  marks_obtained: number;
  max_marks: number;
  passing_marks: number;
  is_absent: boolean;
  is_pass: boolean;
  percentage: number;
  created_at: string;
  updated_at: string;
  created_by_public_id: string | null;
  created_by_name: string | null;
  updated_by_public_id: string | null;
  updated_by_name: string | null;
}

export interface BulkMarkEntry {
  student_id: string;
  marks_obtained: number;
  is_absent?: boolean;
}
