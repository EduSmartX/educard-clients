/**
 * Teacher Types
 *
 * Type definitions for teacher/employee management including profiles,
 * qualifications, subjects taught, and employment details.
 * Used across Web, iOS, and Android for consistent data handling.
 *
 * @module types/teacher
 */

import type {
  AddressPayload,
  Address,
  AuditFields,
  BulkUploadResult,
  BaseQueryParams,
  Supervisor,
  OrganizationRole,
} from "./common";

// Related Entities

export interface Subject {
  public_id: string;
  id?: number;
  code?: string;
  name: string;
}

export interface TeacherUser {
  public_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  full_name: string;
  gender?: string;
  date_of_birth?: string;
  blood_group?: string;
  organization_role?: OrganizationRole | null;
  supervisor?: Supervisor;
  address?: Address;
}

// Teacher Response Types (List View - flattened for performance)

export interface Teacher extends AuditFields {
  public_id: string;
  employee_id: string;
  full_name: string;
  email: string;
  phone: string;
  gender?: string;
  profile_photo_thumbnail?: string | null;
  designation: string;
  specialization: string;
  highest_qualification?: string;
  experience_years?: number;
  subjects?: Subject[];
}

// Teacher Response Types (Detail View - nested for complete info)

export interface TeacherDetail extends AuditFields {
  public_id: string;
  user: TeacherUser;
  employee_id: string;
  designation: string;
  highest_qualification: string;
  specialization: string;
  experience_years: number | null;
  joining_date: string | null;
  subjects: Subject[];
  emergency_contact_name: string;
  emergency_contact_number: string;
  is_first_login: boolean;
  is_deleted: boolean;
}

// Request Payloads

export interface CreateTeacherPayload {
  employee_id: string;
  designation?: string;
  highest_qualification?: string;
  specialization?: string;
  experience_years?: number;
  joining_date?: string;
  subjects?: number[];
  emergency_contact_name?: string;
  emergency_contact_number?: string;
  user: {
    email: string;
    first_name: string;
    last_name: string;
    gender: string;
    organization_role?: number;
    phone?: string;
    blood_group?: string;
    date_of_birth?: string;
    supervisor_email?: string;
    address?: AddressPayload;
  };
}

export interface UpdateTeacherPayload {
  employee_id?: string;
  designation?: string;
  highest_qualification?: string;
  specialization?: string;
  experience_years?: number;
  joining_date?: string;
  subjects?: number[];
  emergency_contact_name?: string;
  emergency_contact_number?: string;
  user?: {
    email?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    gender?: string;
    organization_role?: number;
    supervisor_email?: string;
    blood_group?: string;
    date_of_birth?: string;
    address?: AddressPayload;
  };
}

// Query Parameters

export interface TeacherQueryParams extends BaseQueryParams {
  designation?: string;
  subject?: string;
}

// Bulk Operations

export type TeacherBulkUploadResult = BulkUploadResult;
