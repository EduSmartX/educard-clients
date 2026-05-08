/**
 * Subject Types
 */

export interface CoreSubject {
  id: number;
  name: string;
  code: string;
}

export interface ClassInfo {
  public_id: string;
  class_master_name: string;
  name: string;
}

export interface TeacherInfo {
  public_id: string;
  email: string;
  full_name: string;
  employee_id: string;
}

export interface Subject {
  public_id: string;
  class_info: ClassInfo;
  subject_info: CoreSubject;
  teacher_info: TeacherInfo | null;
  description: string;
  created_at: string;
  updated_at: string;
  created_by_public_id: string | null;
  created_by_name: string | null;
  updated_by_public_id: string | null;
  updated_by_name: string | null;
  can_manage?: boolean; // For class teachers - indicates if they can edit/delete this subject
}

export interface SubjectListParams {
  page?: number;
  page_size?: number;
  search?: string;
  class_assigned?: string;
  subject_master?: number;
  teacher?: string;
  is_deleted?: boolean;
}

export interface SubjectFormData {
  class_id: string;
  subject_id: number;
  teacher_id?: string;
  description?: string;
}

export interface SubjectCreatePayload {
  class_id: string;
  subject_id: number;
  teacher_id?: string | null;
  description?: string;
}

export interface SubjectUpdatePayload {
  teacher_id?: string | null;
  description?: string;
}

export interface SubjectBulkUploadPayload {
  file: File;
}
