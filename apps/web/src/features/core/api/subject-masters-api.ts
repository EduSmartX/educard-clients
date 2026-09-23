import apiClient from '@/lib/api';
import type { ApiListResponse } from '@/lib/utils/api-response-handler';

export interface SubjectMaster {
  id: number;
  name: string;
  code: string;
  description: string | null;
}

export interface FetchSubjectMastersParams {
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

export async function fetchSubjectMasters(
  params: FetchSubjectMastersParams = {}
): Promise<ApiListResponse<SubjectMaster>> {
  const response = await apiClient.get<ApiListResponse<SubjectMaster> | SubjectMaster[]>(
    '/core/subjects/',
    { params: { page_size: 100, ...params } }
  );

  // Handle both paginated and non-paginated responses
  if (Array.isArray(response.data)) {
    // Non-paginated response - wrap in ApiListResponse structure
    return {
      success: true,
      message: 'Subject masters retrieved successfully',
      data: response.data,
      pagination: {
        current_page: 1,
        total_pages: 1,
        count: response.data.length,
        page_size: response.data.length,
        has_next: false,
        has_previous: false,
        next_page: null,
        previous_page: null,
      },
      code: 200,
    };
  }

  // Already in ApiListResponse format
  return response.data;
}
