import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getStudentHomework, getHomeworkDetail, submitHomework } from './api';

export function useStudentHomework(date?: string) {
  return useQuery({
    queryKey: ['student', 'homework', 'list', date],
    queryFn: () => getStudentHomework(date),
    staleTime: 5 * 60 * 1000,
  });
}

export function useHomeworkDetail(publicId: string | null) {
  return useQuery({
    queryKey: ['student', 'homework', 'detail', publicId],
    queryFn: () => getHomeworkDetail(publicId!),
    enabled: !!publicId,
  });
}

export function useSubmitHomework() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ publicId, data }: { publicId: string; data: { notes?: string; file?: File } }) =>
      submitHomework(publicId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', 'homework'] });
    },
  });
}
