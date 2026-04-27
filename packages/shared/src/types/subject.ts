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
  class_assigned?: {
    public_id: string;
    name: string;
  };
  teacher?: SubjectTeacher | null;
  is_active?: boolean;
}

export interface SubjectDetail extends SubjectItem {
  class_assigned: {
    public_id: string;
    name: string;
    section?: string;
    class_master_name?: string;
  };
}

// Request Payloads

export interface CreateSubjectPayload {
  class_id: string;
  subject_id: number;
  teacher_id?: string;
  description?: string;
  subject_type?: SubjectTypeValue;
}

export interface UpdateSubjectPayload {
  teacher_id?: string | null;
  description?: string;
  subject_type?: SubjectTypeValue;
  is_active?: boolean;
}

// Query Parameters

export interface SubjectQueryParams extends BaseQueryParams {
  class_id?: string;
  class_assigned?: string;
  subject_type?: SubjectTypeValue;
  is_active?: boolean;
}
