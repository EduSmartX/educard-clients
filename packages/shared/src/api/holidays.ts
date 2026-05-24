/**
 * Holidays API — Shared between Web and Mobile
 * Factory pattern for platform-agnostic API calls
 */

import type { AxiosInstance } from "axios";
import type {
  Holiday,
  HolidayListParams,
  HolidayCreatePayload,
  HolidayUpdatePayload,
  WorkingDayPolicy,
  WorkingDayPolicyCreatePayload,
  WorkingDayPolicyUpdatePayload,
} from "../types/holiday";

// =============================================================================
// Types
// =============================================================================

interface ApiListResponse<T> {
  success: boolean;
  message?: string;
  data: T[];
  pagination?: {
    count?: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
}

interface ApiDetailResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface HolidaysApiConfig {
  /** Axios client instance */
  client: AxiosInstance;
}

// =============================================================================
// API Factory
// =============================================================================

export function createHolidaysApi(config: HolidaysApiConfig) {
  const { client } = config;

  return {
    // =========================================================================
    // Holidays (Read - all users)
    // =========================================================================

    async listHolidays(params?: HolidayListParams): Promise<{
      data: Holiday[];
      pagination?: ApiListResponse<Holiday>["pagination"];
    }> {
      const queryParams = new URLSearchParams();
      if (params?.from_date) {
        queryParams.append("from_date", params.from_date);
      }
      if (params?.to_date) {
        queryParams.append("to_date", params.to_date);
      }
      if (params?.holiday_type) {
        queryParams.append("holiday_type", params.holiday_type);
      }
      if (params?.ordering) {
        queryParams.append("ordering", params.ordering);
      }
      if (params?.page) {
        queryParams.append("page", params.page.toString());
      }
      if (params?.page_size) {
        queryParams.append("page_size", params.page_size.toString());
      }

      const queryString = queryParams.toString();
      const url = `/attendance/holiday-calendar/${queryString ? `?${queryString}` : ""}`;
      const res = await client.get<ApiListResponse<Holiday>>(url);
      return { data: res.data.data, pagination: res.data.pagination };
    },

    async getHoliday(publicId: string): Promise<Holiday> {
      const res = await client.get<ApiDetailResponse<Holiday>>(
        `/attendance/holiday-calendar/${publicId}/`,
      );
      return res.data.data;
    },

    // =========================================================================
    // Holidays (Admin CRUD)
    // =========================================================================

    async createHoliday(data: HolidayCreatePayload): Promise<Holiday> {
      const res = await client.post<ApiDetailResponse<Holiday>>(
        "/attendance/admin/holiday-calendar/",
        data,
      );
      return res.data.data;
    },

    async updateHoliday(
      publicId: string,
      data: HolidayUpdatePayload,
    ): Promise<Holiday> {
      const res = await client.patch<ApiDetailResponse<Holiday>>(
        `/attendance/admin/holiday-calendar/${publicId}/`,
        data,
      );
      return res.data.data;
    },

    async deleteHoliday(publicId: string): Promise<void> {
      await client.delete(`/attendance/admin/holiday-calendar/${publicId}/`);
    },

    // =========================================================================
    // Working Day Policy
    // =========================================================================

    async listWorkingDayPolicies(): Promise<WorkingDayPolicy[]> {
      const res = await client.get<ApiListResponse<WorkingDayPolicy>>(
        "/attendance/working-day-policy/",
      );
      return res.data.data;
    },

    async getWorkingDayPolicy(publicId: string): Promise<WorkingDayPolicy> {
      const res = await client.get<ApiDetailResponse<WorkingDayPolicy>>(
        `/attendance/working-day-policy/${publicId}/`,
      );
      return res.data.data;
    },

    async createWorkingDayPolicy(
      data: WorkingDayPolicyCreatePayload,
    ): Promise<WorkingDayPolicy> {
      const res = await client.post<ApiDetailResponse<WorkingDayPolicy>>(
        "/attendance/admin/working-day-policy/",
        data,
      );
      return res.data.data;
    },

    async updateWorkingDayPolicy(
      publicId: string,
      data: WorkingDayPolicyUpdatePayload,
    ): Promise<WorkingDayPolicy> {
      const res = await client.patch<ApiDetailResponse<WorkingDayPolicy>>(
        `/attendance/admin/working-day-policy/${publicId}/`,
        data,
      );
      return res.data.data;
    },

    async deleteWorkingDayPolicy(publicId: string): Promise<void> {
      await client.delete(`/attendance/admin/working-day-policy/${publicId}/`);
    },
  };
}

export type HolidaysApi = ReturnType<typeof createHolidaysApi>;
