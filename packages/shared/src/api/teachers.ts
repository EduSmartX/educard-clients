/**
 * Teachers API - Shared
 *
 * Platform-agnostic API functions for teacher management.
 * Used by both Web and Mobile applications.
 */

import type { AxiosInstance } from "axios";
import type { Teacher, TeacherQueryParams } from "../types/teacher";
import type { ApiResponse } from "../types/api";

const BASE_URL = "/teachers";

// Response types for this module
export type TeacherListResponse = ApiResponse<Teacher[]> & {
  data: Teacher[];
  count?: number;
  next?: string | null;
  previous?: string | null;
};

export type TeacherDetailResponse = ApiResponse<Teacher>;

/**
 * Create teachers API functions bound to a specific axios client
 */
export function createTeachersApi(client: AxiosInstance) {
  return {
    /**
     * Fetch list of teachers with optional filters
     */
    async list(params?: TeacherQueryParams): Promise<TeacherListResponse> {
      const response = await client.get<TeacherListResponse>(
        `${BASE_URL}/`,
        { params }
      );
      return response.data;
    },

    /**
     * Fetch single teacher by public_id
     */
    async get(publicId: string): Promise<TeacherDetailResponse> {
      const response = await client.get<TeacherDetailResponse>(
        `${BASE_URL}/${publicId}/`
      );
      return response.data;
    },

    /**
     * Create a new teacher
     */
    async create(data: Partial<Teacher>): Promise<TeacherDetailResponse> {
      const response = await client.post<TeacherDetailResponse>(
        `${BASE_URL}/`,
        data
      );
      return response.data;
    },

    /**
     * Update an existing teacher
     */
    async update(
      publicId: string,
      data: Partial<Teacher>
    ): Promise<TeacherDetailResponse> {
      const response = await client.patch<TeacherDetailResponse>(
        `${BASE_URL}/${publicId}/`,
        data
      );
      return response.data;
    },

    /**
     * Delete a teacher (soft delete)
     */
    async delete(publicId: string): Promise<void> {
      await client.delete(`${BASE_URL}/${publicId}/`);
    },

    /**
     * Restore a deleted teacher
     */
    async restore(publicId: string): Promise<TeacherDetailResponse> {
      const response = await client.post<TeacherDetailResponse>(
        `${BASE_URL}/${publicId}/activate/`
      );
      return response.data;
    },
  };
}

export type TeachersApi = ReturnType<typeof createTeachersApi>;
