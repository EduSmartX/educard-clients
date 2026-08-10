/**
 * Organization API endpoints
 */

import apiClient from './client';

export interface OrganizationInfo {
  name: string;
  type: string;
  email: string;
  phone_number: string;
  website_url?: string;
  board_affiliation?: string;
  legal_entity?: string;
  agent_referral?: string;
}

export interface AdminInfo {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  password2: string; // Confirm password
  notification_opt_in: boolean;
  can_teach_subject: boolean;
  phone?: string;
  gender?: string;
}

export interface AddressInfo {
  street_address: string;
  address_line_2?: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  latitude?: string;
  longitude?: string;
}

export interface TeacherInfo {
  employee_id: string;
}

export interface OrganizationRegistrationData {
  organization_info: OrganizationInfo;
  admin_info: AdminInfo;
  address_info?: AddressInfo;
  teacher_info?: TeacherInfo;
}

export interface OrganizationRegistrationResponse {
  success: boolean;
  message: string;
  data: {
    organization_info: {
      public_id: string;
      name: string;
      type: string;
      email: string;
      phone_number: string;
      website_url?: string;
      board_affiliation?: string;
      is_active: boolean;
      is_verified: boolean;
      created_at: string;
    };
    admin_info: {
      public_id: string;
      username: string;
      first_name: string;
      last_name: string;
      email: string;
      role: string;
      notification_opt_in: boolean;
      created_at: string;
    };
    address_info?: {
      public_id: string;
      street_address: string;
      address_line_2?: string;
      city: string;
      state: string;
      zip_code: string;
      country: string;
      created_at: string;
    };
  };
  code: number;
}

/**
 * Register a new organization with admin user
 * Endpoint: POST /organizations/register/
 */
export async function registerOrganization(
  data: OrganizationRegistrationData,
): Promise<OrganizationRegistrationResponse> {
  const response = await apiClient.post<OrganizationRegistrationResponse>(
    '/organizations/register/',
    data,
  );
  return response.data;
}

// ─── Organization Profile & Settings (admin) ────────────────────────────────

interface OrgApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  code: number;
}

export interface OrganizationAddressDetail {
  public_id?: string;
  street_address: string;
  address_line_2?: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  full_address?: string;
}

export interface OrganizationProfile {
  public_id: string;
  name: string;
  organization_type: string;
  email: string;
  phone: string;
  registration_number?: string;
  corporate_identification_number?: string;
  tax_id?: string;
  website_url?: string;
  board_affiliation?: string;
  address?: OrganizationAddressDetail;
  is_active: boolean;
  is_approved: boolean;
}

export interface UpdateOrganizationPayload {
  name?: string;
  organization_type?: string;
  email?: string;
  phone?: string;
  registration_number?: string;
  corporate_identification_number?: string;
  tax_id?: string;
  website_url?: string;
  board_affiliation?: string;
}

export interface UpdateOrganizationAddressPayload {
  street_address?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
}

/**
 * Get the current user's organization profile.
 * Endpoint: GET /organizations/me/
 */
export async function getOrganizationProfile(): Promise<OrganizationProfile> {
  const response =
    await apiClient.get<OrgApiResponse<OrganizationProfile>>(
      '/organizations/me/',
    );
  return response.data.data;
}

/**
 * Update organization information.
 * Endpoint: PATCH /organizations/{publicId}/
 */
export async function updateOrganization(
  publicId: string,
  payload: UpdateOrganizationPayload,
): Promise<OrganizationProfile> {
  const response = await apiClient.patch<OrgApiResponse<OrganizationProfile>>(
    `/organizations/${publicId}/`,
    payload,
  );
  return response.data.data;
}

/**
 * Update organization address.
 * Endpoint: PATCH /organizations/{publicId}/update-address/
 */
export async function updateOrganizationAddress(
  publicId: string,
  payload: UpdateOrganizationAddressPayload,
): Promise<OrganizationAddressDetail> {
  const response = await apiClient.patch<
    OrgApiResponse<{ address_info: OrganizationAddressDetail }>
  >(`/organizations/${publicId}/update-address/`, payload);
  return response.data.data.address_info;
}
