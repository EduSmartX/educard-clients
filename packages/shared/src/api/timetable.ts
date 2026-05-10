/**
 * Timetable API — Shared between Web and Mobile
 * Factory pattern for platform-agnostic API calls
 */

import type { AxiosInstance } from 'axios';
import type {
  ClassGroup,
  ClassGroupCreatePayload,
  ClassGroupUpdatePayload,
  TimetableSlot,
  TimetableSlotCreatePayload,
  BulkSlotPayload,
  TimetableEntry,
  TimetableEntryCreatePayload,
  TimetableEntryUpdatePayload,
  ClassTimetableResponse,
  MyTimetableResponse,
} from '../types/timetable';

// =============================================================================
// Types
// =============================================================================

interface ApiResponse<T> {
  status?: string;
  success?: boolean;
  message?: string;
  data: T;
  warnings?: string[] | null;
}

interface ApiListResponse<T> {
  success?: boolean;
  status?: string;
  message?: string;
  data: T[];
  pagination?: {
    count?: number;
    total_count?: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
}

export interface TimetableApiConfig {
  /** Axios client instance */
  client: AxiosInstance;
}

// =============================================================================
// Endpoints
// =============================================================================

const ADMIN_BASE = '/timetable/admin';
const EMPLOYEE_BASE = '/timetable/employee';

// =============================================================================
// API Factory
// =============================================================================

export function createTimetableApi(config: TimetableApiConfig) {
  const { client } = config;

  return {
    // =========================================================================
    // Class Groups
    // =========================================================================

    async listClassGroups(): Promise<ClassGroup[]> {
      const res = await client.get<ApiResponse<ClassGroup[]>>(`${ADMIN_BASE}/class-groups/`);
      return res.data.data;
    },

    async getClassGroup(publicId: string): Promise<ClassGroup> {
      const res = await client.get<ApiResponse<ClassGroup>>(`${ADMIN_BASE}/class-groups/${publicId}/`);
      return res.data.data;
    },

    async createClassGroup(data: ClassGroupCreatePayload): Promise<ClassGroup> {
      const res = await client.post<ApiResponse<ClassGroup>>(`${ADMIN_BASE}/class-groups/`, data);
      return res.data.data;
    },

    async updateClassGroup(publicId: string, data: ClassGroupUpdatePayload): Promise<ClassGroup> {
      const res = await client.put<ApiResponse<ClassGroup>>(
        `${ADMIN_BASE}/class-groups/${publicId}/`,
        data
      );
      return res.data.data;
    },

    async deleteClassGroup(publicId: string): Promise<void> {
      await client.delete(`${ADMIN_BASE}/class-groups/${publicId}/`);
    },

    async addClassToGroup(groupPublicId: string, classPublicId: string): Promise<void> {
      await client.post(`${ADMIN_BASE}/class-groups/${groupPublicId}/classes/`, {
        class_public_id: classPublicId,
      });
    },

    async removeClassFromGroup(groupPublicId: string, classPublicId: string): Promise<void> {
      await client.delete(`${ADMIN_BASE}/class-groups/${groupPublicId}/classes/${classPublicId}/`);
    },

    // =========================================================================
    // Timetable Slots
    // =========================================================================

    async listSlots(groupId: string, day?: number): Promise<TimetableSlot[]> {
      const params = day !== undefined ? { day } : {};
      const res = await client.get<ApiResponse<TimetableSlot[]>>(
        `${ADMIN_BASE}/class-groups/${groupId}/slots/`,
        { params }
      );
      return res.data.data;
    },

    async createSlot(groupId: string, data: TimetableSlotCreatePayload): Promise<TimetableSlot> {
      const res = await client.post<ApiResponse<TimetableSlot>>(
        `${ADMIN_BASE}/class-groups/${groupId}/slots/`,
        data
      );
      return res.data.data;
    },

    async bulkSaveSlots(groupPublicId: string, data: BulkSlotPayload): Promise<TimetableSlot[]> {
      const res = await client.post<ApiResponse<TimetableSlot[]>>(
        `${ADMIN_BASE}/class-groups/${groupPublicId}/slots/`,
        data
      );
      return res.data.data;
    },

    async clearDaySlots(groupPublicId: string, day: number): Promise<void> {
      await client.delete(`${ADMIN_BASE}/class-groups/${groupPublicId}/slots/day/${day}/`);
    },

    async deleteSlot(groupId: string, slotId: string): Promise<void> {
      await client.delete(`${ADMIN_BASE}/class-groups/${groupId}/slots/${slotId}/`);
    },

    // =========================================================================
    // Timetable Entries
    // =========================================================================

    async listEntries(params?: { class_id?: string; teacher_id?: string; day_of_week?: number }): Promise<TimetableEntry[]> {
      const res = await client.get<ApiListResponse<TimetableEntry>>(`${ADMIN_BASE}/entries/`, { params });
      return res.data.data;
    },

    async createEntry(
      data: TimetableEntryCreatePayload
    ): Promise<{ entry: TimetableEntry; warnings?: string[] | null }> {
      const res = await client.post<ApiResponse<TimetableEntry>>(`${ADMIN_BASE}/entries/`, data);
      return { entry: res.data.data, warnings: res.data.warnings };
    },

    async updateEntry(publicId: string, data: TimetableEntryUpdatePayload): Promise<TimetableEntry> {
      const res = await client.patch<ApiResponse<TimetableEntry>>(
        `${ADMIN_BASE}/entries/${publicId}/`,
        data
      );
      return res.data.data;
    },

    async deleteEntry(publicId: string): Promise<void> {
      await client.delete(`${ADMIN_BASE}/entries/${publicId}/`);
    },

    // =========================================================================
    // Class Timetable View
    // =========================================================================

    async getClassTimetable(classId: string): Promise<ClassTimetableResponse> {
      const res = await client.get<ApiResponse<ClassTimetableResponse>>(
        `${ADMIN_BASE}/class/${classId}/timetable/`
      );
      return res.data.data;
    },

    // =========================================================================
    // My Timetable (Teacher View)
    // =========================================================================

    async getMyTimetable(): Promise<MyTimetableResponse> {
      const res = await client.get<ApiResponse<MyTimetableResponse>>(
        `${EMPLOYEE_BASE}/my-timetable/`
      );
      return res.data.data;
    },
  };
}

export type TimetableApi = ReturnType<typeof createTimetableApi>;
