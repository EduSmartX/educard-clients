/**
 * Organization Preferences — API Layer
 */

import { apiClient } from '@/api/client';

// ============================================================================
// Types
// ============================================================================

export interface OrganizationPreference {
  public_id: string;
  display_name: string;
  key: string;
  category: string;
  field_type: 'string' | 'number' | 'choice' | 'multi-choice' | 'radio' | 'time';
  default_value: string;
  applicable_values: string[] | null;
  description: string;
  value: string | string[];
  depends_on: string | null;
}

export interface GroupedPreference {
  category: string;
  preferences: OrganizationPreference[];
  count: number;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  code: number;
}

// ============================================================================
// API Functions
// ============================================================================

export async function getOrganizationPreferences(
  category?: string
): Promise<ApiResponse<OrganizationPreference[]>> {
  const params = new URLSearchParams();
  if (category) params.append('category', category);
  const response = await apiClient.get<ApiResponse<OrganizationPreference[]>>(
    `/organization-preferences/?${params.toString()}`
  );
  return response.data;
}

export async function getGroupedPreferences(): Promise<ApiResponse<GroupedPreference[]>> {
  const response = await apiClient.get<ApiResponse<GroupedPreference[]>>(
    '/organization-preferences/?grouped=true'
  );
  return response.data;
}

export async function getPreferenceById(
  publicId: string
): Promise<ApiResponse<OrganizationPreference>> {
  const response = await apiClient.get<ApiResponse<OrganizationPreference>>(
    `/organization-preferences/${publicId}/`
  );
  return response.data;
}

export async function updatePreference(
  publicId: string,
  value: string | string[]
): Promise<ApiResponse<OrganizationPreference>> {
  const response = await apiClient.patch<ApiResponse<OrganizationPreference>>(
    `/organization-preferences/${publicId}/`,
    { value }
  );
  return response.data;
}

export async function resetPreference(
  publicId: string
): Promise<ApiResponse<OrganizationPreference>> {
  const response = await apiClient.post<ApiResponse<OrganizationPreference>>(
    `/organization-preferences/${publicId}/reset/`
  );
  return response.data;
}
