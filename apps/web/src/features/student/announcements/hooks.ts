import { useQuery } from '@tanstack/react-query';
import { QueryKeys } from '@/constants';
import type { AnnouncementFilterParams } from '@/features/announcements/api/announcements-api';
import { getStudentAnnouncementDetail, getStudentAnnouncements } from './api';

export function useStudentAnnouncements(filters: AnnouncementFilterParams = {}) {
  return useQuery({
    queryKey: [...QueryKeys.STUDENT_PORTAL.ANNOUNCEMENTS_LIST, filters],
    queryFn: () => getStudentAnnouncements(filters),
    staleTime: 2 * 60 * 1000,
    placeholderData: (previous) => previous,
  });
}

export function useStudentAnnouncementDetail(publicId: string | null) {
  return useQuery({
    queryKey: QueryKeys.STUDENT_PORTAL.ANNOUNCEMENT_DETAIL(publicId ?? ''),
    queryFn: () => getStudentAnnouncementDetail(publicId ?? ''),
    enabled: !!publicId,
  });
}
