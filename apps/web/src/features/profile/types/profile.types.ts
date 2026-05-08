/**
 * Profile Types
 * Type definitions for user profile data
 */

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  code: number;
}

/**
 * Address interface
 */
export interface Address {
  public_id?: string;
  street_address: string;
  address_line_2?: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  full_address?: string;
}

export interface UserProfile {
  public_id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string;
  role: string;
  gender: string;
  blood_group?: string;
  date_of_birth?: string;
  organization_role: string | { code: string; name: string };
  is_active: boolean;
  is_email_verified: boolean;
  notification_opt_in: boolean;
  address?: Address;
}

export interface UpdateProfilePayload {
  first_name?: string;
  last_name?: string;
  phone?: string;
  gender?: string;
  blood_group?: string;
  date_of_birth?: string;
  organization_role?: string;
  notification_opt_in?: boolean;
  address?: {
    address_type?: string;
    street_address?: string;
    address_line_2?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    country?: string;
    latitude?: string;
    longitude?: string;
  };
}

export interface ChangePasswordPayload {
  old_password: string;
  new_password: string;
  confirm_password: string;
}

export interface SendOTPPayload {
  email?: string;
  phone?: string;
  purpose: 'EMAIL_VERIFICATION' | 'PHONE_VERIFICATION';
}

export interface UpdateEmailPayload {
  new_email: string;
  otp: string;
}

export interface UpdatePhonePayload {
  new_phone: string;
  otp: string;
}

// Deprecated - kept for backwards compatibility
export interface UpdateAddressPayload {
  street_address?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
}

/**
 * Profile Image types (from attachments backend)
 */
export interface ProfileImage {
  public_id: string;
  owner_type: 'user' | 'organization';
  image_type: 'profile_photo' | 'org_logo' | 'org_favicon' | 'org_letterhead';
  mime_type: string;
  file_size: number;
  width: number | null;
  height: number | null;
  is_current: boolean;
  url: string;
  thumbnail_url: string;
  created_at: string;
}
