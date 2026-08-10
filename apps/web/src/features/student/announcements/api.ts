import api from '@/lib/api';
import { API_ENDPOINTS } from '@/constants';
import type { StudentAnnouncementDetail, StudentAnnouncementListItem } from '@educard/shared';

interface ApiResponse<T> {
  data: T;
}

export async function getStudentAnnouncements(): Promise<StudentAnnouncementListItem[]> {
  const res = await api.get<ApiResponse<StudentAnnouncementListItem[]>>(
    API_ENDPOINTS.STUDENT_PORTAL.ANNOUNCEMENTS.LIST
  );
  return res.data.data;
}

export async function getStudentAnnouncementDetail(
  publicId: string
): Promise<StudentAnnouncementDetail> {
  const res = await api.get<ApiResponse<StudentAnnouncementDetail>>(
    API_ENDPOINTS.STUDENT_PORTAL.ANNOUNCEMENTS.DETAIL(publicId)
  );
  return res.data.data;
}
