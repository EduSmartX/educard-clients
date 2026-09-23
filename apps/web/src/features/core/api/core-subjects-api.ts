/**
 * Core Subjects API
 * API calls for fetching master/core subjects (not organization-specific)
 */

import api from '@/lib/api';

export interface CoreSubject {
  id: number;
  name: string;
  code: string;
  description?: string;
}

const CORE_SUBJECTS_BASE = '/core/subjects';

/**
 * Fetch all core/master subjects
 * These are the generalized subjects available system-wide
 */
export async function fetchCoreSubjects(): Promise<CoreSubject[]> {
  const response = await api.get<{ data: CoreSubject[] } | CoreSubject[]>(CORE_SUBJECTS_BASE);

  // Handle both formats: direct array or wrapped in data property
  if (Array.isArray(response.data)) {
    return response.data;
  }

  // If response.data has a data property (wrapped response)
  if (response.data && typeof response.data === 'object' && 'data' in response.data) {
    return (response.data as { data: CoreSubject[] }).data;
  }

  return [];
}
