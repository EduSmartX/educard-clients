import { apiClient } from '@/api/client';

export interface CalendarException {
  public_id: string;
  date: string;
  override_type: 'FORCE_WORKING' | 'FORCE_HOLIDAY';
  reason: string;
  is_applicable_to_all_classes: boolean;
  is_applicable_to_all_teachers: boolean;
  classes?: { public_id: string; display_name: string }[];
  created_at: string;
}

export interface CalendarExceptionCreate {
  date: string;
  override_type: 'FORCE_WORKING' | 'FORCE_HOLIDAY';
  reason: string;
  is_applicable_to_all_classes: boolean;
  is_applicable_to_all_teachers: boolean;
  classes?: string[];
}

export const getCalendarExceptions = async (): Promise<CalendarException[]> => {
  const response = await apiClient.get('/attendance/admin/calendar-exception/');
  return (
    response.data.data?.results ||
    response.data.results ||
    response.data.data ||
    response.data
  );
};

export const createCalendarException = async (
  data: CalendarExceptionCreate,
): Promise<CalendarException> => {
  const response = await apiClient.post(
    '/attendance/admin/calendar-exception/',
    data,
  );
  return response.data.data || response.data;
};

export const deleteCalendarException = async (id: string): Promise<void> => {
  await apiClient.delete(`/attendance/admin/calendar-exception/${id}/`);
};
