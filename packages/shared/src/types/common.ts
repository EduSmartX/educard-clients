/**
 * Common Types
 *
 * Base types and interfaces shared across all feature modules.
 * These types define the standard API response structures, common
 * entities like Address, and reusable building blocks for other types.
 *
 * @module types/common
 */

import type {
  AddressTypeValue,
  GenderValue,
  BloodGroupValue,
} from "../constants";

// API Response Types
// Standard wrappers for backend responses

export interface PaginationMeta {
  count: number;
  current_page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
  next_page: number | null;
  previous_page: number | null;
}

export interface ApiListResponse<T> {
  success: boolean;
  message: string;
  code: number;
  data: T[];
  pagination: PaginationMeta;
}

export interface ApiDetailResponse<T> {
  success: boolean;
  message: string;
  code: number;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  code: number;
  errors?: Record<string, string[]>;
}

// Address Types

export interface Address {
  id?: number;
  address_type: AddressTypeValue;
  street_address: string;
  address_line_2?: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
}

export interface AddressPayload {
  address_type?: AddressTypeValue;
  street_address?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
}

// Organization Types

export interface OrganizationRole {
  id: number;
  code: string;
  name: string;
}

export interface Supervisor {
  public_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name: string;
  phone?: string;
  role?: string;
  role_display?: string;
  organization_role?: string;
  gender?: string;
  employee_id?: string;
  subjects?: string[];
}

// Base User Types

export interface BaseUser {
  public_id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone?: string;
  gender?: GenderValue | "";
  blood_group?: BloodGroupValue;
  date_of_birth?: string;
  is_active: boolean;
  is_email_verified: boolean;
  organization_role?: OrganizationRole | string | null;
  supervisor?: Supervisor | null;
  address?: Address;
  profile_photo_thumbnail?: string | null;
}

export interface BaseUserPayload {
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  gender?: GenderValue | "";
  blood_group?: BloodGroupValue;
  date_of_birth?: string;
  organization_role?: number;
  supervisor_email?: string;
  address?: AddressPayload;
}

// Class Master (Grade Level)

export interface ClassMaster {
  id: number;
  name: string;
  code: string;
  display_order: number;
}

// Audit Fields (for tracking creation/updates)

export interface AuditFields {
  created_at: string;
  updated_at: string;
  created_by_public_id?: string | null;
  created_by_name?: string | null;
  updated_by_public_id?: string | null;
  updated_by_name?: string | null;
}

// Bulk Upload Types

export interface BulkUploadError {
  row: number;
  errors: Record<string, string[]>;
}

export interface BulkUploadResult {
  success: boolean;
  message: string;
  created_count: number;
  failed_count: number;
  errors?: BulkUploadError[];
}

// Query Parameter Base Types

export interface BaseQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
  is_deleted?: boolean;
}
