import { useQuery } from '@tanstack/react-query';
import { QueryKeys } from '@/constants';
import { getStudentAnnouncementDetail, getStudentAnnouncements } from './api';

export function useStudentAnnouncements() {
  return useQuery({
    queryKey: QueryKeys.STUDENT_PORTAL.ANNOUNCEMENTS_LIST,
    queryFn: getStudentAnnouncements,
    staleTime: 2 * 60 * 1000,
  });
}

export function useStudentAnnouncementDetail(publicId: string | null) {
  return useQuery({
    queryKey: QueryKeys.STUDENT_PORTAL.ANNOUNCEMENT_DETAIL(publicId ?? ''),
    queryFn: () => getStudentAnnouncementDetail(publicId ?? ''),
    enabled: !!publicId,
  });
}
