/**
 * Student Types
 * 
 * Re-exports shared types and adds any web-specific extensions.
 * All base types come from @educard/shared for consistency across platforms.
 */

// Re-export all student types from shared package
export type {
  // Student entities
  Student,
  StudentListItem,
  StudentUserInfo,
  StudentClassInfo,
  StudentClassTeacher,
  Guardian,
  // Payloads
  StudentUserPayload,
  CreateStudentPayload,
  UpdateStudentPayload,
  StudentBulkUploadPayload,
  // Query params
  StudentQueryParams,
  // Bulk operations
  StudentBulkUploadResult,
  ExportStudentsPayload,
  ExportStudentsResult,
} from '@educard/shared';

// Re-export common types used in student module
export type {
  Address,
  AddressPayload,
  ClassMaster,
  Supervisor,
  OrganizationRole,
  AuditFields,
  BulkUploadResult,
  BulkUploadError,
} from '@educard/shared';

// Web-specific type aliases for backwards compatibility
export type { StudentClassInfo as ClassInfo } from '@educard/shared';
export type { StudentClassTeacher as ClassTeacher } from '@educard/shared';
export type { Supervisor as SupervisorInfo } from '@educard/shared';
export type { StudentBulkUploadPayload as BulkUploadStudentsPayload } from '@educard/shared';
