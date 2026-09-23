/**
 * Leave Management API — Shared between Web and Mobile
 * Factory pattern for platform-agnostic API calls
 */

import type { AxiosInstance } from "axios";

// =============================================================================
// Internal Types (not exported - use types from ../types/leave.ts)
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
    next?: string | null;
    previous?: string | null;
  };
}

interface ApiDetailResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

// Leave Allocation Types
interface LeaveAllocation {
  public_id: string;
  leave_type_id: number;
  leave_type_name: string;
  name: string | null;
  description: string | null;
  total_days: string;
  max_carry_forward_days: string;
  applies_to_all_roles: boolean;
  roles: string;
  role_ids?: number[];
  effective_from: string | null;
  effective_to: string | null;
  created_at: string;
  updated_at: string;
}

interface LeaveAllocationCreatePayload {
  leave_type: number;
  name: string;
  description?: string;
  total_days: string;
  max_carry_forward_days?: string;
  applies_to_all_roles?: boolean;
  roles?: number[];
  effective_from: string;
  effective_to?: string;
}

interface LeaveAllocationUpdatePayload {
  name?: string;
  description?: string;
  total_days?: string;
  max_carry_forward_days?: string;
  applies_to_all_roles?: boolean;
  roles?: number[];
  effective_from?: string;
  effective_to?: string;
}

interface LeaveAllocationQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  leave_type?: number;
  ordering?: string;
}

// Leave Request Types
type LeaveRequestStatus = "pending" | "approved" | "rejected" | "cancelled";

interface LeaveRequest {
  public_id: string;
  user_public_id: string;
  user_name: string;
  user_role: string;
  organization_role: string | { code: string; name: string } | null;
  email: string;
  supervisor_name: string;
  supervisor_public_id: string;
  leave_balance_public_id: string;
  leave_type_code: string;
  leave_type_name: string;
  leave_name: string;
  start_date: string;
  end_date: string;
  number_of_days: number;
  reason: string;
  status: LeaveRequestStatus;
  applied_at: string;
  attachment_url: string | null;
  attachment_name: string;
  reviewed_by_name: string | null;
  reviewed_at: string | null;
  review_comments: string;
  can_be_cancelled: boolean;
  created_at: string;
  updated_at: string;
}

interface LeaveReviewQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
  ordering?: string;
  start_date__gte?: string;
  start_date__lte?: string;
  user?: string;
  user__name?: string;
}

// Leave Balance Types
interface LeaveAllocationSimple {
  public_id: string;
  leave_type_name: string;
  leave_type_code: string;
  display_name: string;
  total_days: string;
  max_carry_forward_days: string;
  effective_from: string | null;
  effective_to: string | null;
}

interface LeaveBalanceSummary {
  public_id: string;
  leave_allocation: LeaveAllocationSimple;
  leave_name: string;
  total_allocated: number;
  used: number;
  pending: number;
  available: number;
  carried_forward: number;
}

interface CreateLeaveRequestPayload {
  leave_balance: string;
  start_date: string;
  end_date: string;
  number_of_days: number;
  reason: string;
}

export interface LeaveApiConfig {
  /** Axios client instance */
  client: AxiosInstance;
}

// =============================================================================
// API Factory
// =============================================================================

export function createLeaveApi(config: LeaveApiConfig) {
  const { client } = config;

  return {
    // =========================================================================
    // Leave Allocations (Admin)
    // =========================================================================

    async listAllocations(params?: LeaveAllocationQueryParams): Promise<{
      data: LeaveAllocation[];
      pagination: ApiListResponse<LeaveAllocation>["pagination"];
    }> {
      const res = await client.get<ApiListResponse<LeaveAllocation>>(
        "/leave/admin/allocations/",
        { params },
      );
      return { data: res.data.data, pagination: res.data.pagination };
    },

    async getAllocation(publicId: string): Promise<LeaveAllocation> {
      const res = await client.get<ApiDetailResponse<LeaveAllocation>>(
        `/leave/admin/allocations/${publicId}/`,
      );
      return res.data.data;
    },

    async createAllocation(
      data: LeaveAllocationCreatePayload,
    ): Promise<LeaveAllocation> {
      const res = await client.post<ApiDetailResponse<LeaveAllocation>>(
        "/leave/admin/allocations/",
        data,
      );
      return res.data.data;
    },

    async updateAllocation(
      publicId: string,
      data: LeaveAllocationUpdatePayload,
    ): Promise<LeaveAllocation> {
      const res = await client.patch<ApiDetailResponse<LeaveAllocation>>(
        `/leave/admin/allocations/${publicId}/`,
        data,
      );
      return res.data.data;
    },

    async deleteAllocation(publicId: string): Promise<void> {
      try {
        await client.delete(`/leave/admin/allocations/${publicId}/`);
      } catch (error: unknown) {
        const axiosError = error as {
          response?: { status?: number };
          message?: string;
        };
        const status = axiosError?.response?.status;
        if (status && status >= 200 && status < 300) {
          return;
        }
        if (axiosError?.message === "Network Error" && !axiosError?.response) {
          return;
        }
        throw error;
      }
    },

    // =========================================================================
    // Leave Allocations (Employee - Read Only)
    // =========================================================================

    async listEmployeeAllocations(
      params?: LeaveAllocationQueryParams,
    ): Promise<{
      data: LeaveAllocation[];
      pagination: ApiListResponse<LeaveAllocation>["pagination"];
    }> {
      const res = await client.get<ApiListResponse<LeaveAllocation>>(
        "/leave/employee/allocations/",
        { params },
      );
      return { data: res.data.data, pagination: res.data.pagination };
    },

    // =========================================================================
    // Leave Reviews (Supervisors/Admins)
    // =========================================================================

    async listReviews(params?: LeaveReviewQueryParams): Promise<{
      data: LeaveRequest[];
      pagination: ApiListResponse<LeaveRequest>["pagination"];
    }> {
      const res = await client.get<ApiListResponse<LeaveRequest>>(
        "/leave/employee/reviews/",
        { params },
      );
      return { data: res.data.data, pagination: res.data.pagination };
    },

    async getReview(publicId: string): Promise<LeaveRequest> {
      const res = await client.get<ApiDetailResponse<LeaveRequest>>(
        `/leave/employee/reviews/${publicId}/`,
      );
      return res.data.data;
    },

    async approveRequest(
      publicId: string,
      data?: { review_comments?: string },
    ): Promise<LeaveRequest> {
      const res = await client.post<ApiDetailResponse<LeaveRequest>>(
        `/leave/employee/reviews/${publicId}/approve/`,
        data ?? {},
      );
      return res.data.data;
    },

    async rejectRequest(
      publicId: string,
      data?: { review_comments?: string },
    ): Promise<LeaveRequest> {
      const res = await client.post<ApiDetailResponse<LeaveRequest>>(
        `/leave/employee/reviews/${publicId}/reject/`,
        data ?? {},
      );
      return res.data.data;
    },

    // =========================================================================
    // My Leave (Current User)
    // =========================================================================

    async getMyBalances(): Promise<LeaveBalanceSummary[]> {
      const res = await client.get<ApiDetailResponse<LeaveBalanceSummary[]>>(
        "/leave/employee/balances/my-balance/",
      );
      return res.data.data;
    },

    async getMyRequests(params?: {
      page?: number;
      page_size?: number;
      status?: string;
    }): Promise<{
      data: LeaveRequest[];
      pagination: ApiListResponse<LeaveRequest>["pagination"];
    }> {
      const res = await client.get<ApiListResponse<LeaveRequest>>(
        "/leave/user/requests/",
        { params },
      );
      return { data: res.data.data, pagination: res.data.pagination };
    },

    async createRequest(
      data: CreateLeaveRequestPayload,
    ): Promise<LeaveRequest> {
      const res = await client.post<ApiDetailResponse<LeaveRequest>>(
        "/leave/user/requests/",
        data,
      );
      return res.data.data;
    },

    async cancelRequest(publicId: string): Promise<LeaveRequest> {
      const res = await client.post<ApiDetailResponse<LeaveRequest>>(
        `/leave/user/requests/${publicId}/cancel/`,
      );
      return res.data.data;
    },

    // =========================================================================
    // Utilities
    // =========================================================================

    async calculateWorkingDays(
      startDate: string,
      endDate: string,
    ): Promise<{ working_days: number; holidays: string[] }> {
      const res = await client.post<
        ApiDetailResponse<{ working_days: number; holidays: string[] }>
      >("/leave/employee/calculate-working-days/", {
        start_date: startDate,
        end_date: endDate,
      });
      return res.data.data;
    },
  };
}

export type LeaveApi = ReturnType<typeof createLeaveApi>;
