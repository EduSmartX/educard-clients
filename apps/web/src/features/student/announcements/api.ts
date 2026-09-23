import api from '@/lib/api';
import { API_ENDPOINTS } from '@/constants';
import type { StudentAnnouncementDetail, StudentAnnouncementListItem } from '@educard/shared';
import type {
  AnnouncementFilterParams,
  Paginated,
  PaginationMeta,
} from '@/features/announcements/api/announcements-api';

interface ApiResponse<T> {
  data: T;
  pagination?: PaginationMeta;
}

const EMPTY_PAGINATION: PaginationMeta = {
  current_page: 1,
  total_pages: 1,
  count: 0,
  page_size: 25,
  has_next: false,
  has_previous: false,
};

export async function getStudentAnnouncements(
  filters: AnnouncementFilterParams = {}
): Promise<Paginated<StudentAnnouncementListItem>> {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, value]) => (value ?? '').toString().trim() !== '')
  );
  const res = await api.get<ApiResponse<StudentAnnouncementListItem[]>>(
    API_ENDPOINTS.STUDENT_PORTAL.ANNOUNCEMENTS.LIST,
    { params }
  );
  return {
    items: res.data.data ?? [],
    pagination: res.data.pagination ?? EMPTY_PAGINATION,
  };
}

export async function getStudentAnnouncementDetail(
  publicId: string
): Promise<StudentAnnouncementDetail> {
  const res = await api.get<ApiResponse<StudentAnnouncementDetail>>(
    API_ENDPOINTS.STUDENT_PORTAL.ANNOUNCEMENTS.DETAIL(publicId)
  );
  return res.data.data;
}
