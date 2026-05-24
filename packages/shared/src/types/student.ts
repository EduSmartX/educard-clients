/**
 * Student Types
 *
 * Type definitions for student management module including student profiles,
 * guardian information, class assignments, and bulk operations.
 * Used across Web, iOS, and Android for consistent data handling.
 *
 * @module types/student
 */

import type { GenderValue, BloodGroupValue } from "../constants";
import type {
  Address,
  AddressPayload,
  ClassMaster,
  Supervisor,
  OrganizationRole,
  AuditFields,
  BulkUploadResult,
  BaseQueryParams,
} from "./common";

// Related Entities

export interface StudentClassTeacher {
  public_id: string;
  full_name: string;
  email: string;
}

export interface StudentClassInfo {
  public_id: string;
  class_master_name: string;
  class_master: ClassMaster;
  name: string;
  class_teacher: StudentClassTeacher | null;
  capacity: number;
  student_count: number;
  is_full: boolean;
}

export interface StudentUserInfo {
  public_id: string;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string;
  gender: GenderValue | "";
  blood_group?: BloodGroupValue;
  date_of_birth?: string;
  organization_role: OrganizationRole | string;
  supervisor: Supervisor | null;
  address?: Address;
  is_active: boolean;
  is_email_verified: boolean;
}

export interface Guardian {
  public_id?: string;
  name: string;
  phone: string;
  email?: string;
  relationship: string;
  is_primary?: boolean;
  occupation?: string;
  address?: Address;
}

// Student Response Types

export interface Student extends AuditFields {
  public_id: string;
  user_info: StudentUserInfo;
  class_info: StudentClassInfo;
  full_name: string;
  roll_number: string;
  admission_number: string;
  admission_date: string;
  guardian_name?: string;
  guardian_phone?: string;
  guardian_email?: string;
  guardian_relationship?: string;
  medical_conditions?: string;
  description?: string;
  previous_school_name?: string;
  previous_school_address?: string;
  previous_school_class?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  profile_photo_thumbnail?: string | null;
}

export interface StudentListItem {
  public_id: string;
  full_name: string;
  roll_number: string;
  admission_number: string;
  admission_date?: string;
  email?: string;
  phone?: string;
  class_name: string;
  class_id: string;
  class_master_name: string;
  gender: GenderValue | "";
  is_active: boolean;
  can_manage?: boolean;
  profile_photo_thumbnail?: string | null;
}

// Request Payloads

export interface StudentUserPayload {
  username?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role: "student";
  gender?: GenderValue | "";
  blood_group?: BloodGroupValue;
  date_of_birth?: string;
  supervisor_email?: string;
  address?: AddressPayload;
}

export interface CreateStudentPayload {
  user: StudentUserPayload;
  roll_number: string;
  admission_number?: string;
  admission_date?: string;
  guardian_name?: string;
  guardian_phone?: string;
  guardian_email?: string;
  guardian_relationship?: string;
  medical_conditions?: string;
  description?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  previous_school_name?: string;
  previous_school_address?: string;
  previous_school_class?: string;
}

export interface UpdateStudentPayload {
  user?: Partial<Omit<StudentUserPayload, "role">>;
  roll_number?: string;
  admission_number?: string;
  admission_date?: string;
  guardian_name?: string;
  guardian_phone?: string;
  guardian_email?: string;
  guardian_relationship?: string;
  medical_conditions?: string;
  description?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  previous_school_name?: string;
  previous_school_address?: string;
  previous_school_class?: string;
}

// Query Parameters

export interface StudentQueryParams extends BaseQueryParams {
  class_master_id?: string;
  class_assigned__public_id?: string;
  user__public_id?: string;
  user__gender?: string;
  for_attendance?: boolean;
  embed_images?: boolean;
  admission_date_from?: string;
  admission_date_to?: string;
  is_deleted?: boolean;
}

// Bulk Operations

export interface StudentBulkUploadPayload {
  file: File;
  class_id: string;
}

export type StudentBulkUploadResult = BulkUploadResult;

export interface ExportStudentsPayload {
  class_id?: string;
  email_addresses?: string[];
}

export interface ExportStudentsResult {
  success: boolean;
  message: string;
  file_url?: string;
}
