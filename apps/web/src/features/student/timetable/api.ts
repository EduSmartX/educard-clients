import api from '@/lib/api';
import { API_ENDPOINTS } from '@/constants';

export interface TimetableEntry {
  slot_public_id: string;
  label: string;
  slot_number: number;
  slot_type: string;
  start_time: string;
  end_time: string;
  subject_name: string | null;
  teacher_name: string | null;
  room: string;
  is_cancelled: boolean;
}

interface ApiResponse<T> {
  data: T;
}

export async function getTimetableForDate(dateStr: string): Promise<TimetableEntry[]> {
  const res = await api.get<ApiResponse<TimetableEntry[]>>(API_ENDPOINTS.STUDENT_PORTAL.TIMETABLE, {
    params: { date: dateStr },
  });
  return res.data.data;
}
