/**
 * Fee API - Shared across Web, iOS, and Android
 * Uses factory pattern for platform-specific client injection
 */

import type { AxiosInstance } from "axios";
import { API_ENDPOINTS } from "../constants/api-endpoints";
import type { ApiResponse, PaginatedResponse } from "../types/api";
import type {
  FeeStructure,
  FeeStructureCreatePayload,
  FeeStructureUpdatePayload,
  FeeStructureFilters,
  ClassChangeImpact,
  StudentFee,
  StudentFeeCreatePayload,
  StudentFeeUpdatePayload,
  StudentFeeComponentUpdatePayload,
  ComponentReviewPayload,
  StudentFeeFilters,
  FeePayment,
  PaymentCreatePayload,
  PaymentFilters,
  FeeDashboard,
  SendReminderPayload,
  BulkReminderPayload,
  ReminderResult,
} from "../types/fee";

// Re-export types for convenience
export type {
  FeeStructureCreatePayload,
  FeeStructureUpdatePayload,
  FeeStructureFilters,
  StudentFeeCreatePayload,
  StudentFeeUpdatePayload,
  StudentFeeComponentUpdatePayload,
  ComponentReviewPayload,
  StudentFeeFilters,
  PaymentCreatePayload,
  PaymentFilters,
  SendReminderPayload,
  BulkReminderPayload,
  ReminderResult,
};

// ============================================================================
// Fee Structure API (Admin)
// ============================================================================

export function createFeeStructureApi(client: AxiosInstance) {
  return {
    /**
     * List all fee structures with optional filters
     */
    list: async (
      filters?: FeeStructureFilters,
    ): Promise<PaginatedResponse<FeeStructure>> => {
      const response = await client.get<PaginatedResponse<FeeStructure>>(
        API_ENDPOINTS.FEE.ADMIN.STRUCTURES.LIST,
        { params: filters },
      );
      return response.data;
    },

    /**
     * Get a single fee structure by ID
     */
    get: async (id: string): Promise<FeeStructure> => {
      const url = API_ENDPOINTS.FEE.ADMIN.STRUCTURES.DETAIL(id);
      const response = await client.get<ApiResponse<FeeStructure>>(url);
      return response.data.data;
    },

    /**
     * Create a new fee structure
     */
    create: async (data: FeeStructureCreatePayload): Promise<FeeStructure> => {
      const response = await client.post<ApiResponse<FeeStructure>>(
        API_ENDPOINTS.FEE.ADMIN.STRUCTURES.CREATE,
        data,
      );
      return response.data.data;
    },

    /**
     * Update an existing fee structure
     */
    update: async (
      id: string,
      data: FeeStructureUpdatePayload,
    ): Promise<FeeStructure> => {
      const url = API_ENDPOINTS.FEE.ADMIN.STRUCTURES.UPDATE(id);
      const response = await client.patch<ApiResponse<FeeStructure>>(url, data);
      return response.data.data;
    },

    /**
     * Delete a fee structure
     */
    delete: async (id: string): Promise<void> => {
      const url = API_ENDPOINTS.FEE.ADMIN.STRUCTURES.DELETE(id);
      await client.delete(url);
    },

    /**
     * Preview the impact of class changes on student fees
     */
    classChangeImpact: async (
      id: string,
      classPublicIds: string[],
    ): Promise<ClassChangeImpact> => {
      const url = API_ENDPOINTS.FEE.ADMIN.STRUCTURES.CLASS_CHANGE_IMPACT(id);
      const response = await client.post<ApiResponse<ClassChangeImpact>>(url, {
        class_public_ids: classPublicIds,
      });
      return response.data.data;
    },
  };
}

// ============================================================================
// Student Fee API (Admin)
// ============================================================================

export function createStudentFeeApi(client: AxiosInstance) {
  return {
    /**
     * List all student fees with optional filters
     */
    list: async (
      filters?: StudentFeeFilters,
    ): Promise<PaginatedResponse<StudentFee>> => {
      const response = await client.get<PaginatedResponse<StudentFee>>(
        API_ENDPOINTS.FEE.ADMIN.STUDENT_FEES.LIST,
        { params: filters },
      );
      return response.data;
    },

    /**
     * Get a single student fee by ID
     */
    get: async (id: string): Promise<StudentFee> => {
      const url = API_ENDPOINTS.FEE.ADMIN.STUDENT_FEES.DETAIL(id);
      const response = await client.get<ApiResponse<StudentFee>>(url);
      return response.data.data;
    },

    /**
     * Create a new student fee record
     */
    create: async (data: StudentFeeCreatePayload): Promise<StudentFee> => {
      const response = await client.post<ApiResponse<StudentFee>>(
        API_ENDPOINTS.FEE.ADMIN.STUDENT_FEES.CREATE,
        data,
      );
      return response.data.data;
    },

    /**
     * Update a student fee record
     */
    update: async (
      id: string,
      data: StudentFeeUpdatePayload,
    ): Promise<StudentFee> => {
      const url = API_ENDPOINTS.FEE.ADMIN.STUDENT_FEES.UPDATE(id);
      const response = await client.patch<ApiResponse<StudentFee>>(url, data);
      return response.data.data;
    },

    /**
     * Delete a student fee record
     */
    delete: async (id: string): Promise<void> => {
      const url = API_ENDPOINTS.FEE.ADMIN.STUDENT_FEES.DELETE(id);
      await client.delete(url);
    },

    /**
     * Admin: toggle optional component selections + recalculate student fee
     */
    updateComponents: async (
      id: string,
      data: StudentFeeComponentUpdatePayload,
    ): Promise<StudentFee> => {
      const url = API_ENDPOINTS.FEE.ADMIN.STUDENT_FEES.UPDATE_COMPONENTS(id);
      const response = await client.post<ApiResponse<StudentFee>>(url, data);
      return response.data.data;
    },

    /**
     * Admin: approve or reject pending parent component change requests
     */
    reviewComponentRequests: async (
      id: string,
      data: ComponentReviewPayload,
    ): Promise<StudentFee> => {
      const url =
        API_ENDPOINTS.FEE.ADMIN.STUDENT_FEES.REVIEW_COMPONENT_REQUESTS(id);
      const response = await client.post<ApiResponse<StudentFee>>(url, data);
      return response.data.data;
    },
  };
}

// ============================================================================
// Payment API (Admin)
// ============================================================================

export function createFeePaymentApi(client: AxiosInstance) {
  return {
    /**
     * List all payments with optional filters
     */
    list: async (
      filters?: PaymentFilters,
    ): Promise<PaginatedResponse<FeePayment>> => {
      const response = await client.get<PaginatedResponse<FeePayment>>(
        API_ENDPOINTS.FEE.ADMIN.PAYMENTS.LIST,
        { params: filters },
      );
      return response.data;
    },

    /**
     * Get a single payment by ID
     */
    get: async (id: string): Promise<FeePayment> => {
      const url = API_ENDPOINTS.FEE.ADMIN.PAYMENTS.DETAIL(id);
      const response = await client.get<ApiResponse<FeePayment>>(url);
      return response.data.data;
    },

    /**
     * Record a new payment
     */
    create: async (data: PaymentCreatePayload): Promise<FeePayment> => {
      const response = await client.post<ApiResponse<FeePayment>>(
        API_ENDPOINTS.FEE.ADMIN.PAYMENTS.CREATE,
        data,
      );
      return response.data.data;
    },
  };
}

// ============================================================================
// Dashboard API (Admin)
// ============================================================================

export function createFeeDashboardApi(client: AxiosInstance) {
  return {
    /**
     * Get fee dashboard statistics
     */
    get: async (): Promise<FeeDashboard> => {
      const response = await client.get<ApiResponse<FeeDashboard>>(
        API_ENDPOINTS.FEE.ADMIN.DASHBOARD.LIST,
      );
      return response.data.data;
    },

    /**
     * Get defaulters list (students with low payment percentage)
     */
    getDefaulters: async (
      paidPercentageLt?: number,
    ): Promise<PaginatedResponse<StudentFee>> => {
      const response = await client.get<PaginatedResponse<StudentFee>>(
        API_ENDPOINTS.FEE.ADMIN.DASHBOARD.DEFAULTERS,
        { params: { paid_percentage_lt: paidPercentageLt } },
      );
      return response.data;
    },
  };
}

// ============================================================================
// Reminder API (Admin)
// ============================================================================

export function createFeeReminderApi(client: AxiosInstance) {
  return {
    /**
     * Send reminder to a single student's parent
     */
    send: async (data: SendReminderPayload): Promise<ReminderResult> => {
      const response = await client.post<ApiResponse<ReminderResult>>(
        API_ENDPOINTS.FEE.ADMIN.REMINDERS.CREATE,
        data,
      );
      return response.data.data;
    },

    /**
     * Send reminders to multiple students' parents
     */
    sendBulk: async (data: BulkReminderPayload): Promise<ReminderResult> => {
      const response = await client.post<ApiResponse<ReminderResult>>(
        API_ENDPOINTS.FEE.ADMIN.REMINDERS.BULK,
        data,
      );
      return response.data.data;
    },
  };
}

// ============================================================================
// Parent Fee API (Read-only)
// ============================================================================

export function createParentFeeApi(client: AxiosInstance) {
  return {
    /**
     * List fees for parent's children
     */
    list: async (): Promise<PaginatedResponse<StudentFee>> => {
      const response = await client.get<PaginatedResponse<StudentFee>>(
        API_ENDPOINTS.FEE.PARENT.LIST,
      );
      return response.data;
    },

    /**
     * Get details of a specific fee
     */
    get: async (id: string): Promise<StudentFee> => {
      const url = API_ENDPOINTS.FEE.PARENT.DETAIL(id);
      const response = await client.get<ApiResponse<StudentFee>>(url);
      return response.data.data;
    },

    /**
     * Get payment history for a specific fee
     */
    getPayments: async (id: string): Promise<FeePayment[]> => {
      const url = API_ENDPOINTS.FEE.PARENT.PAYMENTS(id);
      const response = await client.get<ApiResponse<FeePayment[]>>(url);
      return response.data.data;
    },
  };
}

// ============================================================================
// Combined Fee API Factory
// ============================================================================

export function createFeeApi(client: AxiosInstance) {
  return {
    structures: createFeeStructureApi(client),
    studentFees: createStudentFeeApi(client),
    payments: createFeePaymentApi(client),
    dashboard: createFeeDashboardApi(client),
    reminders: createFeeReminderApi(client),
    parent: createParentFeeApi(client),
  };
}

// Export types for external use
export type FeeStructureApi = ReturnType<typeof createFeeStructureApi>;
export type StudentFeeApi = ReturnType<typeof createStudentFeeApi>;
export type FeePaymentApi = ReturnType<typeof createFeePaymentApi>;
export type FeeDashboardApi = ReturnType<typeof createFeeDashboardApi>;
export type FeeReminderApi = ReturnType<typeof createFeeReminderApi>;
export type ParentFeeApi = ReturnType<typeof createParentFeeApi>;
export type FeeApi = ReturnType<typeof createFeeApi>;
