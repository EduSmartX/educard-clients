/**
 * Shared API - Students
 */

import type { AxiosInstance } from "axios";
import type {
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
  Student,
} from "../types";

export interface CreateStudentData {
  admission_number: string;
  name: string;
  date_of_birth: string;
  gender: "male" | "female" | "other";
  class_id: string;
  section?: string;
  roll_number?: string;
  parent_id?: string;
  blood_group?: string;
  address?: string;
  phone?: string;
  email?: string;
}

export interface UpdateStudentData extends Partial<CreateStudentData> {
  is_active?: boolean;
}

/**
 * Create students API endpoints
 */
export function createStudentsApi(client: AxiosInstance) {
  return {
    /**
     * Get all students with pagination
     */
    getAll: async (
      params?: PaginationParams,
    ): Promise<PaginatedResponse<Student>> => {
      const response = await client.get<PaginatedResponse<Student>>(
        "/students/",
        { params },
      );
      return response.data;
    },

    /**
     * Get a single student by ID
     */
    getById: async (id: string): Promise<Student> => {
      const response = await client.get<ApiResponse<Student>>(
        `/students/${id}/`,
      );
      return response.data.data;
    },

    /**
     * Create a new student
     */
    create: async (data: CreateStudentData): Promise<Student> => {
      const response = await client.post<ApiResponse<Student>>(
        "/students/",
        data,
      );
      return response.data.data;
    },

    /**
     * Update a student
     */
    update: async (id: string, data: UpdateStudentData): Promise<Student> => {
      const response = await client.patch<ApiResponse<Student>>(
        `/students/${id}/`,
        data,
      );
      return response.data.data;
    },

    /**
     * Delete a student
     */
    delete: async (id: string): Promise<void> => {
      await client.delete(`/students/${id}/`);
    },

    /**
     * Get students by class
     */
    getByClass: async (
      classId: string,
      params?: PaginationParams,
    ): Promise<PaginatedResponse<Student>> => {
      const response = await client.get<PaginatedResponse<Student>>(
        `/classes/${classId}/students/`,
        { params },
      );
      return response.data;
    },

    /**
     * Get students by parent
     */
    getByParent: async (parentId: string): Promise<Student[]> => {
      const response = await client.get<ApiResponse<Student[]>>(
        `/parents/${parentId}/children/`,
      );
      return response.data.data;
    },

    /**
     * Search students
     */
    search: async (
      query: string,
      params?: PaginationParams,
    ): Promise<PaginatedResponse<Student>> => {
      const response = await client.get<PaginatedResponse<Student>>(
        "/students/",
        {
          params: { ...params, search: query },
        },
      );
      return response.data;
    },
  };
}

export type StudentsApi = ReturnType<typeof createStudentsApi>;
