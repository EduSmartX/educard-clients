import api from '../api';

// TypeScript interfaces matching backend serializers
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
}

export interface GroupedPreference {
  category: string;
  preferences: OrganizationPreference[];
  count: number;
}

export interface PreferenceUpdateRequest {
  value: string | string[];
}

export interface BulkUpdateRequest {
  preferences: Array<{
    public_id: string;
    value: string | string[];
  }>;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  code: number;
}

/**
 * Fetch all organization preferences
 * @param grouped - Whether to return preferences grouped by category
 * @param category - Optional category filter
 */
export async function getOrganizationPreferences(
  grouped = false,
  category?: string
): Promise<ApiResponse<OrganizationPreference[]>> {
  const params = new URLSearchParams();
  if (grouped) params.append('grouped', 'false'); // We'll handle grouping on frontend
  if (category) params.append('category', category);

  const response = await api.get(`/organization-preferences/?${params.toString()}`);
  return response.data;
}

/**
 * Fetch preferences grouped by category
 */
export async function getGroupedPreferences(): Promise<ApiResponse<GroupedPreference[]>> {
  const response = await api.get('/organization-preferences/?grouped=true');
  return response.data;
}

/**
 * Get a single preference by public_id
 */
export async function getPreference(
  publicId: string
): Promise<ApiResponse<OrganizationPreference>> {
  const response = await api.get(`/organization-preferences/${publicId}/`);
  return response.data;
}

/**
 * Update a single preference
 */
export async function updatePreference(
  publicId: string,
  value: string | string[]
): Promise<ApiResponse<OrganizationPreference>> {
  const response = await api.patch(`/organization-preferences/${publicId}/`, { value });
  return response.data;
}

/**
 * Bulk update multiple preferences
 */
export async function bulkUpdatePreferences(
  updates: Array<{ public_id: string; value: string | string[] }>
): Promise<ApiResponse<OrganizationPreference[]>> {
  const response = await api.post('/organization-preferences/bulk-update/', {
    preferences: updates.map((u) => ({ key: u.public_id, value: u.value })),
  });
  return response.data;
}
