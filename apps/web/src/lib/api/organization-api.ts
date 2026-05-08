import api from '../api';

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
  password2: string;
  notification_opt_in: boolean;
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

export interface OrganizationRegistrationData {
  organization_info: OrganizationInfo;
  admin_info: AdminInfo;
  address_info?: AddressInfo;
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
      legal_entity?: string;
      agent_referral?: string;
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
      latitude?: string | null;
      longitude?: string | null;
      created_at: string;
    };
  };
  code: number;
}

/**
 * Register a new organization with admin user
 */
export async function registerOrganization(
  data: OrganizationRegistrationData
): Promise<OrganizationRegistrationResponse> {
  const response = await api.post('/organizations/register/', data);
  return response.data;
}

export interface AcademicYear {
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

export interface AcademicYearResponse {
  success: boolean;
  message: string;
  data: AcademicYear;
  code: number;
}

export interface OrganizationProfile {
  public_id: string;
  name: string;
  type: string;
  email: string;
  phone_number: string;
  website_url?: string;
  board_affiliation?: string;
  legal_entity?: string;
  agent_referral?: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

/**
 * Get organization profile
 */
export async function getOrganizationProfile(): Promise<OrganizationProfile> {
  const response = await api.get('/organizations/profile/');
  return response.data;
}

/**
 * Get current academic year for the organization
 */
export async function getCurrentAcademicYear(): Promise<AcademicYearResponse> {
  const response = await api.get('/organization-preferences/current-academic-year/');
  return response.data;
}

/**
 * Update organization profile
 */
export async function updateOrganizationProfile(
  data: Partial<OrganizationInfo>
): Promise<OrganizationProfile> {
  const response = await api.patch('/organizations/profile/', data);
  return response.data;
}
