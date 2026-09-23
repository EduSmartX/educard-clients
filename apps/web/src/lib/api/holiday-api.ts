import api from '../api';
import type { ApiListResponse, ApiDetailResponse } from '@/lib/utils/api-response-handler';
import type { SaturdayOffPatternType } from '@/constants';

// ============================================================================
// TypeScript Interfaces
// ============================================================================

export interface WorkingDayPolicy {
  public_id: string;
  sunday_off: boolean;
  saturday_off_pattern: SaturdayOffPatternType;
  effective_from: string;
  effective_to: string | null;
  created_at: string;
  updated_at: string;
  created_by_public_id: string | null;
  created_by_name: string | null;
  updated_by_public_id: string | null;
  updated_by_name: string | null;
}

export type WorkingDayPolicyResponse = ApiListResponse<WorkingDayPolicy>;

export interface CreateWorkingDayPolicyPayload {
  sunday_off: boolean;
  saturday_off_pattern: SaturdayOffPatternType;
  effective_from: string;
  effective_to?: string | null;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch working day policy
 */
export async function fetchWorkingDayPolicy(): Promise<WorkingDayPolicyResponse> {
  const response = await api.get<WorkingDayPolicyResponse>('/attendance/working-day-policy/');

  if (!response.data.success || response.data.code < 200 || response.data.code >= 300) {
    throw new Error(response.data.message || 'Failed to fetch working day policy');
  }

  return response.data;
}

/**
 * Create a new working day policy
 */
export async function createWorkingDayPolicy(
  payload: CreateWorkingDayPolicyPayload
): Promise<ApiDetailResponse<WorkingDayPolicy>> {
  const response = await api.post<ApiDetailResponse<WorkingDayPolicy>>(
    '/attendance/working-day-policy/',
    payload
  );

  if (!response.data.success || response.data.code < 200 || response.data.code >= 300) {
    throw new Error(response.data.message || 'Failed to create working day policy');
  }

  return response.data;
}

/**
 * Update an existing working day policy
 */
export async function updateWorkingDayPolicy(
  publicId: string,
  payload: Partial<CreateWorkingDayPolicyPayload>
): Promise<ApiDetailResponse<WorkingDayPolicy>> {
  const response = await api.patch<ApiDetailResponse<WorkingDayPolicy>>(
    `/attendance/working-day-policy/${publicId}/`,
    payload
  );

  if (!response.data.success || response.data.code < 200 || response.data.code >= 300) {
    throw new Error(response.data.message || 'Failed to update working day policy');
  }

  return response.data;
}
