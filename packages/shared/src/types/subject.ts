/**
 * Subject Types
 *
 * Type definitions for subject management including subject assignments,
 * class-subject mappings, and teacher-subject associations.
 * Used across Web, iOS, and Android for consistent data handling.
 *
 * @module types/subject
 */

import type { AuditFields, BaseQueryParams } from "./common";

// Subject Type Options
export type SubjectTypeValue = "core" | "elective" | "language" | "";

// Related Entities

export interface SubjectTeacher {
  public_id: string;
  full_name: string;
  email?: string;
}

// Subject Response Types

export interface SubjectItem extends AuditFields {
  public_id: string;
  name: string;
  code?: string;
  description?: string;
  subject_type?: SubjectTypeValue;
  // Backend returns class_info (serializer field name) from class_assigned (model field)
  class_info?: {
    public_id: string;
    name: string;
    class_master_name?: string;
  };
  // Legacy field name (some endpoints may still use this)
  class_assigned?: {
    public_id: string;
    name: string;
  };
  subject_info?: {
    id: number;
    name: string;
    code?: string;
  };
  teacher_info?: SubjectTeacher | null;
  teacher?: SubjectTeacher | null;
  is_active?: boolean;
  can_manage?: boolean;
  display_order?: number;
}

// Alias for backward compatibility and cleaner imports
export type Subject = SubjectItem;

export interface SubjectDetail extends SubjectItem {
  class_info: {
    public_id: string;
    name: string;
    section?: string;
    class_master_name?: string;
  };
  subject_info: {
    id: number;
    name: string;
    code?: string;
  };
}

// Request Payloads

export interface CreateSubjectPayload {
  class_id: string;
  subject_id: number;
  teacher_id?: string;
  description?: string;
  subject_type?: SubjectTypeValue;
  display_order?: number;
}

export interface UpdateSubjectPayload {
  teacher_id?: string | null;
  description?: string;
  subject_type?: SubjectTypeValue;
  is_active?: boolean;
  display_order?: number;
}

// Query Parameters

export interface SubjectQueryParams extends BaseQueryParams {
  class_id?: string;
  class_assigned?: string;
  subject_type?: SubjectTypeValue;
  is_active?: boolean;
}
