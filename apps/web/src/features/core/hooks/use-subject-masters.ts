import { useQuery } from '@tanstack/react-query';
import { fetchSubjectMasters, type FetchSubjectMastersParams } from '../api/subject-masters-api';

export function useSubjectMasters(params: FetchSubjectMastersParams = {}) {
  return useQuery({
    queryKey: ['subject-masters', params],
    queryFn: () => fetchSubjectMasters(params),
  });
}
