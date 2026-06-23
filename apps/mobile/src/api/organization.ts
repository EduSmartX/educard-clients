/**
 * Organization API endpoints
 * Based on web frontend's organization-api.ts
 */

import apiClient from './client';

// Types matching backend API structure
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
  data: OrganizationRegistrationData
): Promise<OrganizationRegistrationResponse> {
  const response = await apiClient.post<OrganizationRegistrationResponse>(
    '/organizations/register/',
    data
  );
  return response.data;
}
