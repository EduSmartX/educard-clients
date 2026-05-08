/**
 * Teacher Types
 * 
 * Re-exports shared types and adds any web-specific extensions.
 * All base types come from @educard/shared for consistency across platforms.
 */

// Re-export all teacher types from shared package
export type {
  // Teacher entities
  Teacher,
  TeacherDetail,
  TeacherUser,
  Subject,
  // Payloads
  CreateTeacherPayload,
  UpdateTeacherPayload,
  // Query params
  TeacherQueryParams,
  // Bulk operations
  TeacherBulkUploadResult,
} from '@educard/shared';

// Re-export common types used in teacher module
export type {
  Address,
  AddressPayload,
  Supervisor,
  OrganizationRole,
  AuditFields,
  BulkUploadResult,
  BulkUploadError,
  PaginationMeta,
  ApiListResponse,
  ApiDetailResponse,
} from '@educard/shared';

// Web-specific type aliases for backwards compatibility
export type { TeacherQueryParams as FetchTeachersParams } from '@educard/shared';

// Web-specific response types
export interface BulkUploadResponse {
  success: boolean;
  message: string;
  data: {
    created_count: number;
    failed_count: number;
    errors?: Array<{
      row: number;
      errors: Record<string, string[]>;
    }>;
  };
}

export interface PaginationInfo {
  current_page: number;
  total_pages: number;
  count: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
  next_page: number | null;
  previous_page: number | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}

export interface BackendApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  pagination?: PaginationInfo;
  code: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  code: number;
}

// Convenience response type aliases
import type { Teacher } from '@educard/shared';
export type TeachersResponse = BackendApiResponse<Teacher[]>;
export type TeacherResponse = ApiResponse<Teacher>;
export type TeacherBulkUploadResponse = ApiResponse<BulkUploadResponse['data']>;
