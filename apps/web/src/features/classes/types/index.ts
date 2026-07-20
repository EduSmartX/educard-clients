/**
 * Class Types
 *
 * Re-exports shared types and adds any web-specific extensions.
 * All base types come from @educard/shared for consistency across platforms.
 */

// Re-export all class types from shared package
export type {
  // Class entities
  Class,
  ClassDetail,
  ClassTeacher,
  ClassStudent,
  ClassSubject,
  Section,
  ClassSummary,
  // Payloads
  CreateClassPayload,
  UpdateClassPayload,
  AssignTeachersPayload,
  AssignStudentsPayload,
  RemoveStudentPayload,
  // Query params
  ClassQueryParams,
} from '@educard/shared';

// Re-export common types used in class module
export type {
  ClassMaster,
  AuditFields,
  BulkUploadResult,
  BulkUploadError,
  PaginationMeta,
  ApiListResponse,
  ApiDetailResponse,
} from '@educard/shared';

// Web-specific type aliases for backwards compatibility
export type { ClassQueryParams as FetchClassesParams } from '@educard/shared';

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

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  code: number;
}

// Convenience response type aliases
import type { Class, PaginationMeta } from '@educard/shared';
export type ClassesResponse = ApiResponse<Class[]> & { pagination: PaginationMeta };
export type ClassResponse = ApiResponse<Class>;
export type ClassBulkUploadResponse = ApiResponse<BulkUploadResponse['data']>;
