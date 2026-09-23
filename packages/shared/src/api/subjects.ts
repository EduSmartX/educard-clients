/**
 * Subjects API - Shared
 *
 * Platform-agnostic API functions for subject management.
 * Used by both Web and Mobile applications.
 *
 * Permission Model:
 * - Admin: Full CRUD access
 * - Teacher (Class Teacher): Can manage subjects in their assigned classes
 * - Teacher (Other): Read-only access
 *
 * The backend returns `can_manage` field indicating whether the user can edit/delete
 */

import type { AxiosInstance } from "axios";
import type {
  Subject,
  SubjectDetail,
  CreateSubjectPayload,
  UpdateSubjectPayload,
  SubjectQueryParams,
} from "../types/subject";
import type { ApiResponse } from "../types/api";

const BASE_URL = "/subjects";

// Response types for this module
export type SubjectListResponse = ApiResponse<Subject[]> & {
  data: Subject[];
  count?: number;
  next?: string | null;
  previous?: string | null;
};

export type SubjectDetailResponse = ApiResponse<SubjectDetail>;

/**
 * Create subjects API functions bound to a specific axios client
 * This allows web and mobile to use their own configured client
 */
export function createSubjectsApi(client: AxiosInstance) {
  return {
    /**
     * Fetch list of subjects with optional filters
     */
    async list(params?: SubjectQueryParams): Promise<SubjectListResponse> {
      const response = await client.get<SubjectListResponse>(
        `${BASE_URL}/`,
        { params }
      );
      // Ensure can_manage defaults to true for UI
      if (response.data.data) {
        response.data.data = response.data.data.map((subject: Subject) => ({
          ...subject,
          can_manage: subject.can_manage ?? true,
        }));
      }
      return response.data;
    },

    /**
     * Fetch single subject by public_id
     */
    async get(
      publicId: string,
      isDeleted = false
    ): Promise<SubjectDetailResponse> {
      const params = isDeleted ? { is_deleted: "true" } : {};
      const response = await client.get<SubjectDetailResponse>(
        `${BASE_URL}/${publicId}/`,
        { params }
      );
      return response.data;
    },

    /**
     * Create a new subject
     */
    async create(
      data: CreateSubjectPayload,
      forceCreate = false
    ): Promise<SubjectDetailResponse> {
      const params = forceCreate ? { force_create: "true" } : {};
      const response = await client.post<SubjectDetailResponse>(
        `${BASE_URL}/`,
        data,
        { params }
      );
      return response.data;
    },

    /**
     * Update an existing subject
     */
    async update(
      publicId: string,
      data: UpdateSubjectPayload
    ): Promise<SubjectDetailResponse> {
      const response = await client.patch<SubjectDetailResponse>(
        `${BASE_URL}/${publicId}/`,
        data
      );
      return response.data;
    },

    /**
     * Delete a subject (soft delete)
     */
    async delete(publicId: string): Promise<void> {
      await client.delete(`${BASE_URL}/${publicId}/`);
    },

    /**
     * Reactivate/restore a deleted subject
     */
    async restore(publicId: string): Promise<SubjectDetailResponse> {
      const response = await client.post<SubjectDetailResponse>(
        `${BASE_URL}/${publicId}/activate/`
      );
      return response.data;
    },

    /**
     * Get subjects by class
     */
    async getByClass(classId: string): Promise<SubjectListResponse> {
      const response = await client.get<SubjectListResponse>(
        `${BASE_URL}/`,
        { params: { class_assigned: classId } }
      );
      return response.data;
    },

    /**
     * Bulk upload subjects (web only - requires FormData)
     */
    async bulkUpload(file: File): Promise<{
      success: boolean;
      message: string;
      total_records: number;
      successful_records: number;
      failed_records: number;
      errors: Array<{ row: number; errors: Record<string, string[]> }>;
    }> {
      const formData = new FormData();
      formData.append("file", file);

      const response = await client.post(`${BASE_URL}/bulk-upload/`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    },

    /**
     * Download subject template
     */
    async downloadTemplate(): Promise<Blob> {
      const response = await client.get(`${BASE_URL}/download-template/`, {
        responseType: "blob",
      });
      return response.data;
    },
  };
}

// Type for the created API
export type SubjectsApi = ReturnType<typeof createSubjectsApi>;
