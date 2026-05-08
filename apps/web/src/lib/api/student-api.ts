import api from '../api';

// Types
export interface Student {
  id: string;
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    phone_number: string;
    date_of_birth: string;
  };
  admission_number: string;
  roll_number: string;
  class_info: {
    id: string;
    name: string;
    section: string;
  };
  date_of_joining: string;
  blood_group: string;
  address: string;
  parent_details: {
    father_name: string;
    father_phone: string;
    mother_name: string;
    mother_phone: string;
    guardian_name?: string;
    guardian_phone?: string;
  };
  emergency_contact: {
    name: string;
    relationship: string;
    phone: string;
  };
  profile_image?: string;
  status: 'active' | 'inactive' | 'graduated';
  created_at: string;
  updated_at: string;
}

export interface StudentListParams {
  page?: number;
  page_size?: number;
  search?: string;
  class_id?: string;
  status?: string;
  ordering?: string;
}

export interface StudentFormData {
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  date_of_birth: string;
  admission_number: string;
  roll_number: string;
  class_id: string;
  date_of_joining: string;
  blood_group: string;
  address: string;
  father_name: string;
  father_phone: string;
  mother_name: string;
  mother_phone: string;
  guardian_name?: string;
  guardian_phone?: string;
  emergency_contact_name: string;
  emergency_contact_relationship: string;
  emergency_contact_phone: string;
  profile_image?: File;
  status?: 'active' | 'inactive';
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// API Functions
export const studentApi = {
  /**
   * Get paginated list of students
   */
  getAll: async (params?: StudentListParams): Promise<PaginatedResponse<Student>> => {
    const { data } = await api.get('/students/', { params });
    return data;
  },

  /**
   * Get student by ID
   */
  getById: async (id: string): Promise<Student> => {
    const { data } = await api.get(`/students/${id}/`);
    return data;
  },

  /**
   * Create new student
   */
  create: async (formData: StudentFormData): Promise<Student> => {
    // If profile_image exists, send as multipart/form-data
    if (formData.profile_image) {
      const form = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          form.append(key, value);
        }
      });
      const { data } = await api.post('/students/', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    }

    // Otherwise send as JSON
    const { data } = await api.post('/students/', formData);
    return data;
  },

  /**
   * Update existing student
   */
  update: async (id: string, formData: Partial<StudentFormData>): Promise<Student> => {
    // If profile_image exists, send as multipart/form-data
    if (formData.profile_image) {
      const form = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          form.append(key, value);
        }
      });
      const { data } = await api.patch(`/students/${id}/`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    }

    // Otherwise send as JSON
    const { data } = await api.patch(`/students/${id}/`, formData);
    return data;
  },

  /**
   * Delete student
   */
  delete: async (id: string): Promise<void> => {
    await api.delete(`/students/${id}/`);
  },

  /**
   * Bulk upload students from file
   */
  bulkUpload: async (file: File): Promise<{ success: number; errors: unknown[] }> => {
    const form = new FormData();
    form.append('file', file);
    const { data } = await api.post('/students/bulk-upload/', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  /**
   * Download student template for bulk upload
   */
  downloadTemplate: async (): Promise<Blob> => {
    const { data } = await api.get('/students/download-template/', {
      responseType: 'blob',
    });
    return data;
  },

  /**
   * Get student attendance summary
   */
  getAttendanceSummary: async (
    id: string,
    params?: { start_date?: string; end_date?: string }
  ): Promise<{
    total_days: number;
    present: number;
    absent: number;
    late: number;
    attendance_percentage: number;
  }> => {
    const { data } = await api.get(`/students/${id}/attendance-summary/`, { params });
    return data;
  },

  /**
   * Promote students to next class
   */
  promoteStudents: async (studentIds: string[], toClassId: string): Promise<void> => {
    await api.post('/students/promote/', {
      student_ids: studentIds,
      to_class_id: toClassId,
    });
  },
};
