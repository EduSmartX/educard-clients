/**
 * Exam Types — matches backend API
 */

export type ExamSessionType = 'unit_test' | 'quarterly' | 'half_yearly' | 'annual' | 'custom';

export const EXAM_SESSION_TYPE_LABELS: Record<ExamSessionType, string> = {
  unit_test: 'Unit Test',
  quarterly: 'Quarterly',
  half_yearly: 'Half Yearly',
  annual: 'Annual',
  custom: 'Custom',
};

export type ExamStatus = 'draft' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export const EXAM_STATUS_LABELS: Record<ExamStatus, string> = {
  draft: 'Draft',
  scheduled: 'Scheduled',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const EXAM_STATUS_COLORS: Record<ExamStatus, { bg: string; text: string }> = {
  draft: { bg: '#f1f5f9', text: '#64748b' },
  scheduled: { bg: '#eff6ff', text: '#2563eb' },
  in_progress: { bg: '#fef3c7', text: '#d97706' },
  completed: { bg: '#dcfce7', text: '#16a34a' },
  cancelled: { bg: '#fee2e2', text: '#dc2626' },
};

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
}

export interface Exam {
  public_id: string;
  session_name: string;
  session_public_id: string;
  session_type: ExamSessionType;
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
  duration: number | null;
  duration_formatted: string | null;
  description: string;
  marks_count: number;
  created_at: string;
}

export interface Mark {
  public_id: string;
  student_name: string;
  student_public_id: string;
  student_admission_number: string;
  marks_obtained: number;
  max_marks: number;
  passing_marks: number;
  is_absent: boolean;
  is_pass: boolean;
  percentage: number;
}

export interface MarksOverviewSubject {
  exam_public_id: string;
  subject_name: string;
  max_marks: number;
  passing_marks: number;
  status: string;
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
    { marks_obtained: number; is_absent: boolean; max_marks: number; is_pass: boolean }
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
  class_info: { public_id: string; name: string; class_master_name: string; section_name: string };
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

export interface BulkMarkEntry {
  student_id: string;
  marks_obtained: number;
  is_absent?: boolean;
}

// Mutation Payloads

export interface ExamSessionCreatePayload {
  name: string;
  session_type: ExamSessionType;
  academic_year: string;
  description?: string;
  start_date?: string | null;
  end_date?: string | null;
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

// Permission info returned with marks overview
export interface MarksPermissions {
  is_admin: boolean;
  is_class_teacher: boolean;
  can_edit_all_subjects: boolean;
  can_edit: boolean; // True if user can edit any subjects
  editable_subject_ids: string[] | null; // null = all subjects, [] = view-only
}
