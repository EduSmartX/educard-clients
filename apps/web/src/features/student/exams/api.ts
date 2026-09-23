import api from '@/lib/api';
import { API_ENDPOINTS } from '@/constants';

export interface ExamSession {
  public_id: string;
  name: string;
  session_type: string;
  academic_year_name: string;
  start_date: string;
  end_date: string;
  description: string;
}

export interface ExamResult {
  exam_public_id: string;
  subject_name: string;
  teacher_name: string | null;
  date: string | null;
  start_time: string | null;
  end_time: string | null;
  status: string;
  max_marks: number;
  passing_marks: number;
  marks_obtained: number | null;
  is_absent: boolean;
  percentage: number | null;
  grade: string | null;
  passed: boolean | null;
}

export interface ExamSessionDetail extends ExamSession {
  exams: ExamResult[];
  overall_percentage: number;
  overall_grade: string | null;
  rank: number | null;
  total_students: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export async function getStudentExamSessions(): Promise<ExamSession[]> {
  const res = await api.get<ApiResponse<ExamSession[]>>(
    API_ENDPOINTS.STUDENT_PORTAL.EXAMS.SESSIONS
  );
  return res.data.data;
}

export async function getExamSessionDetail(publicId: string): Promise<ExamSessionDetail> {
  const res = await api.get<ApiResponse<ExamSessionDetail>>(
    API_ENDPOINTS.STUDENT_PORTAL.EXAMS.SESSION_DETAIL(publicId)
  );
  return res.data.data;
}
