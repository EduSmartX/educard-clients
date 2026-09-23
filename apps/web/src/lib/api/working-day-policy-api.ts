import api from '../api';

export interface WorkingDayPolicy {
  public_id: string;
  sunday_off: boolean;
  saturday_off_pattern: string;
  effective_from: string; // YYYY-MM-DD
  effective_to: string | null; // YYYY-MM-DD or null
  created_at: string;
  updated_at: string;
}

export interface CreateWorkingDayPolicyPayload {
  sunday_off: boolean;
  saturday_off_pattern: string;
  effective_from: string;
  effective_to: string | null;
}

export interface UpdateWorkingDayPolicyPayload {
  sunday_off?: boolean;
  saturday_off_pattern?: string;
  effective_from?: string;
  effective_to?: string | null;
}

export interface WorkingDayPolicyResponse {
  success: boolean;
  message: string;
  data: WorkingDayPolicy[];
  code: number;
}

export interface SingleWorkingDayPolicyResponse {
  success: boolean;
  message: string;
  data: WorkingDayPolicy;
  code: number;
}

/**
 * Fetch all working day policies
 */
export async function getWorkingDayPolicies(): Promise<WorkingDayPolicy[]> {
  const response = await api.get<WorkingDayPolicyResponse>('/attendance/working-day-policy/');
  return response.data.data;
}

/**
 * Fetch current working day policy (most recent one)
 */
export async function getCurrentWorkingDayPolicy(): Promise<WorkingDayPolicy | null> {
  try {
    const response = await api.get<WorkingDayPolicyResponse>('/attendance/working-day-policy/');

    if (response.data.success && response.data.data.length > 0) {
      // Return the first one (they're ordered by -effective_from in backend)
      return response.data.data[0];
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Create new working day policy
 */
export async function createWorkingDayPolicy(
  payload: CreateWorkingDayPolicyPayload
): Promise<WorkingDayPolicy> {
  const response = await api.post<SingleWorkingDayPolicyResponse>(
    '/attendance/admin/working-day-policy/',
    payload
  );
  return response.data.data;
}

/**
 * Update existing working day policy
 */
export async function updateWorkingDayPolicy(
  publicId: string,
  payload: UpdateWorkingDayPolicyPayload
): Promise<WorkingDayPolicy> {
  const response = await api.patch<SingleWorkingDayPolicyResponse>(
    `/attendance/admin/working-day-policy/${publicId}/`,
    payload
  );
  return response.data.data;
}

/**
 * Delete working day policy
 */
export async function deleteWorkingDayPolicy(publicId: string): Promise<void> {
  await api.delete(`/attendance/admin/working-day-policy/${publicId}/`);
}
