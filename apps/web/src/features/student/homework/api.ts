import api from '@/lib/api';
import { API_ENDPOINTS } from '@/constants';

export interface HomeworkItem {
  public_id: string;
  title: string;
  description: string;
  subject_name: string;
  assigned_by_name: string;
  assigned_date: string;
  due_datetime: string;
  priority: 'low' | 'medium' | 'high';
  submission_type: 'online' | 'offline' | 'both';
  reference_link: string | null;
  chapter: string | null;
  is_overdue: boolean;
  days_until_due: number | null;
  my_submission_status: 'not_submitted' | 'submitted' | 'reviewed' | null;
}

export interface HomeworkDetail extends HomeworkItem {
  instructions: string;
  attachments: { public_id: string; file_name: string; file_type: string; file_url: string }[];
  is_accepting_submissions: boolean;
  my_submission: {
    public_id: string;
    notes: string;
    submitted_at: string;
    status: string;
    is_late: boolean;
    feedback: string | null;
    review_outcome: 'approved' | 'rejected' | null;
    reviewed_by_name: string | null;
    reviewed_at: string | null;
    attachments: { public_id: string; file_name: string; file_url: string }[];
  } | null;
  submission_history: {
    public_id: string;
    notes: string;
    submitted_at: string;
    status: string;
    is_late: boolean;
    feedback: string | null;
    review_outcome: 'approved' | 'rejected' | null;
    reviewed_by_name: string | null;
    reviewed_at: string | null;
    attachments: { public_id: string; file_name: string; file_url: string }[];
  }[];
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export async function getStudentHomework(date?: string): Promise<HomeworkItem[]> {
  const params = date ? { date } : undefined;
  const res = await api.get<ApiResponse<HomeworkItem[]>>(
    API_ENDPOINTS.STUDENT_PORTAL.HOMEWORK.LIST,
    { params }
  );
  return res.data.data;
}

export async function getHomeworkDetail(publicId: string): Promise<HomeworkDetail> {
  const res = await api.get<ApiResponse<HomeworkDetail>>(
    API_ENDPOINTS.STUDENT_PORTAL.HOMEWORK.DETAIL(publicId)
  );
  return res.data.data;
}

export async function submitHomework(
  publicId: string,
  data: { notes?: string; file?: File }
): Promise<void> {
  const formData = new FormData();
  if (data.notes) {
    formData.append('notes', data.notes);
  }
  if (data.file) {
    formData.append('file', data.file);
  }
  await api.post(API_ENDPOINTS.STUDENT_PORTAL.HOMEWORK.SUBMIT(publicId), formData, {
    headers: { 'Content-Type': undefined },
  });
}
