/**
 * Class & Section Types
 *
 * Type definitions for class/section management including class structure,
 * teacher assignments, student enrollment, and academic organization.
 * Used across Web, iOS, and Android for consistent data handling.
 *
 * @module types/class
 */

import type { AuditFields, BaseQueryParams, ClassMaster } from "./common";

// Related Entities

export interface ClassTeacher {
  public_id: string;
  full_name: string;
  email?: string;
  phone?: string;
  profile_photo_thumbnail?: string | null;
}

export interface ClassStudent {
  public_id: string;
  full_name: string;
  admission_number: string;
  profile_photo_thumbnail?: string | null;
}

export interface ClassSubject {
  public_id: string;
  name: string;
  code?: string;
  teacher?: ClassTeacher | null;
}

export interface Section {
  public_id: string;
  name: string;
  class_id: string;
  class_name?: string;
  class_teacher?: ClassTeacher | null;
  max_students?: number;
  current_students?: number;
  is_active?: boolean;
}

// Class Response Types

export interface Class extends AuditFields {
  public_id: string;
  name: string; // This is actually the section name
  section: string;
  grade?: string;
  display_name?: string;
  academic_year?: string;
  room_number?: string;
  capacity?: number;
  class_master?: ClassMaster | null; // Master class (e.g., "Class 10", "Nehru")
  class_teacher?: ClassTeacher | null;
  students_count?: number;
  student_count?: number; // Backend returns this
  subjects_count?: number; // Number of subjects assigned
  teachers?: ClassTeacher[];
  students?: ClassStudent[];
  is_active?: boolean;
  info?: string;
}

export interface ClassDetail extends Class {
  teachers: ClassTeacher[];
  students: ClassStudent[];
  subjects?: ClassSubject[];
}

export interface ClassSummary {
  public_id: string;
  name: string;
  section: string;
  display_name: string;
}

// Request Payloads

export interface CreateClassPayload {
  name: string;
  section: string;
  grade?: string;
  academic_year?: string;
  room_number?: string;
  capacity?: number;
  class_teacher?: string;
  is_active?: boolean;
}

export interface UpdateClassPayload {
  name?: string;
  section?: string;
  grade?: string;
  academic_year?: string;
  room_number?: string;
  capacity?: number;
  class_teacher?: string | null;
  is_active?: boolean;
}

export interface AssignTeachersPayload {
  teacher_ids: string[];
}

export interface AssignStudentsPayload {
  student_ids: string[];
}

export interface RemoveStudentPayload {
  student_id: string;
}

// Query Parameters

export interface ClassQueryParams extends BaseQueryParams {
  grade?: string;
  academic_year?: string;
  is_active?: boolean;
}
