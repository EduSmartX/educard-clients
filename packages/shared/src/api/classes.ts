/**
 * Shared API - Classes
 */

import type { AxiosInstance } from 'axios';
import type { ApiResponse, PaginatedResponse, PaginationParams, Class, Section } from '../types';

export interface CreateClassData {
  name: string;
  academic_year: string;
  class_teacher_id?: string;
  room_number?: string;
  capacity?: number;
}

export interface UpdateClassData extends Partial<CreateClassData> {}

export interface CreateSectionData {
  name: string;
  class_id: string;
  class_teacher_id?: string;
  max_students?: number;
}

/**
 * Create classes API endpoints
 */
export function createClassesApi(client: AxiosInstance) {
  return {
    /**
     * Get all classes
     */
    getAll: async (params?: PaginationParams & {
      academic_year?: string;
    }): Promise<PaginatedResponse<Class>> => {
      const response = await client.get<PaginatedResponse<Class>>('/classes/', { params });
      return response.data;
    },

    /**
     * Get a single class by ID
     */
    getById: async (id: string): Promise<Class> => {
      const response = await client.get<ApiResponse<Class>>(`/classes/${id}/`);
      return response.data.data;
    },

    /**
     * Create a new class
     */
    create: async (data: CreateClassData): Promise<Class> => {
      const response = await client.post<ApiResponse<Class>>('/classes/', data);
      return response.data.data;
    },

    /**
     * Update a class
     */
    update: async (id: string, data: UpdateClassData): Promise<Class> => {
      const response = await client.patch<ApiResponse<Class>>(`/classes/${id}/`, data);
      return response.data.data;
    },

    /**
     * Delete a class
     */
    delete: async (id: string): Promise<void> => {
      await client.delete(`/classes/${id}/`);
    },

    /**
     * Get sections for a class
     */
    getSections: async (classId: string): Promise<Section[]> => {
      const response = await client.get<ApiResponse<Section[]>>(`/classes/${classId}/sections/`);
      return response.data.data;
    },

    /**
     * Create a section
     */
    createSection: async (data: CreateSectionData): Promise<Section> => {
      const response = await client.post<ApiResponse<Section>>('/sections/', data);
      return response.data.data;
    },

    /**
     * Update a section
     */
    updateSection: async (id: string, data: Partial<CreateSectionData>): Promise<Section> => {
      const response = await client.patch<ApiResponse<Section>>(`/sections/${id}/`, data);
      return response.data.data;
    },

    /**
     * Delete a section
     */
    deleteSection: async (id: string): Promise<void> => {
      await client.delete(`/sections/${id}/`);
    },

    /**
     * Get class statistics
     */
    getStats: async (id: string): Promise<{
      total_students: number;
      total_subjects: number;
      attendance_rate: number;
      average_performance: number;
    }> => {
      const response = await client.get<ApiResponse<{
        total_students: number;
        total_subjects: number;
        attendance_rate: number;
        average_performance: number;
      }>>(`/classes/${id}/stats/`);
      return response.data.data;
    },
  };
}

export type ClassesApi = ReturnType<typeof createClassesApi>;
