/**
 * Homework Types
 * Shared between Web, iOS, and Android
 */

import type {
  HomeworkStatus,
  HomeworkPriority,
  SubmissionType,
  SubmissionStatus,
  AttachmentType,
} from "../constants/homework-constants";

// ============== Attachment ==============

export interface HomeworkAttachment {
  public_id: string;
  file_name: string;
  file_type: AttachmentType;
  file_size: number;
  url: string;
  created_at: string;
}

// ============== Submission Stats ==============

export interface SubmissionStats {
  total_students: number;
  submitted: number;
  pending: number;
  reviewed: number;
  late: number;
  completion_rate: number;
}

// ============== Homework ==============

export interface Homework {
  public_id: string;
  title: string;
  description: string;
  class_public_id: string;
  class_name: string;
  subject_public_id: string;
  subject_name: string;
  subject_teacher_public_id: string | null;
  assigned_by_public_id: string;
  assigned_by_name: string;
  due_datetime: string;
  assigned_date: string; // The date for which homework is given (YYYY-MM-DD)
  status: HomeworkStatus;
  priority: HomeworkPriority;
  submission_type: SubmissionType;
  reference_link: string;
  is_overdue: boolean;
  days_until_due: number | null;
  attachment_count: number;
  submission_stats: SubmissionStats;
  created_at: string;
  updated_at: string;
}

export interface HomeworkDetail extends Homework {
  instructions: string;
  attachments: HomeworkAttachment[];
  is_accepting_submissions: boolean;
}

// ============== Submission ==============

export interface HomeworkSubmission {
  public_id: string;
  homework_title: string;
  student_public_id: string;
  student_name: string;
  student_roll_number: string;
  status: SubmissionStatus;
  submitted_at: string;
  is_late: boolean;
  reviewed_by_name: string | null;
  reviewed_at: string | null;
}

export interface HomeworkSubmissionDetail extends HomeworkSubmission {
  notes: string;
  feedback: string;
  attachments: HomeworkAttachment[];
}

// ============== Dashboard & Analytics ==============

export interface HomeworkDashboardStats {
  total_homework: number;
  published: number;
  draft: number;
  overdue: number;
  pending_submissions: number;
  reviewed_submissions: number;
  upcoming_count: number;
  completion_rate: number;
}

export interface CalendarHomework {
  public_id: string;
  title: string;
  due_datetime: string;
  class_name: string;
  subject_name: string;
  priority: HomeworkPriority;
  status: HomeworkStatus;
  color: string;
}

// ============== Teacher Classes ==============

export interface TeacherClass {
  public_id: string;
  name: string;
  class_master_name: string;
  is_class_teacher: boolean;
  subjects: {
    public_id: string;
    subject_name: string;
    is_teacher?: boolean;
    teacher_name?: string;
  }[];
}

// ============== API Payloads ==============

export interface HomeworkCreatePayload {
  title: string;
  description?: string;
  instructions?: string;
  subject_public_id: string;
  due_datetime: string;
  assigned_date?: string; // The date for which homework is given (YYYY-MM-DD)
  status?: HomeworkStatus;
  priority?: HomeworkPriority;
  submission_type?: SubmissionType;
  reference_link?: string;
}

export interface HomeworkUpdatePayload {
  title?: string;
  description?: string;
  instructions?: string;
  due_datetime?: string;
  status?: HomeworkStatus;
  priority?: HomeworkPriority;
  submission_type?: SubmissionType;
  reference_link?: string;
}

export interface ReviewSubmissionPayload {
  feedback?: string;
}

// ============== Query Params ==============

export interface HomeworkListParams {
  class_public_id?: string;
  subject_public_id?: string;
  status?: HomeworkStatus;
  priority?: HomeworkPriority;
  assigned_date?: string; // Filter by the date for which homework was given (YYYY-MM-DD)
  due_date_from?: string;
  due_date_to?: string;
  ordering?: string;
  my_homework?: boolean;
}

export interface SubmissionListParams {
  status?: SubmissionStatus;
  is_late?: boolean;
  ordering?: string;
}

export interface CalendarParams {
  start_date?: string;
  end_date?: string;
  class_public_id?: string;
}

// ============== API Response ==============

export interface HomeworkApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface SubmissionsResponse {
  submissions: HomeworkSubmission[];
  stats: SubmissionStats;
}
