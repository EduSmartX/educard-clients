/**
 * Leave Management API Functions
 * Handles all API calls related to leave allocations, types, balances, and requests
 */

import api from '../api';
import { isAdminUser } from '../utils/auth-utils';
import {
  handleListResponse,
  handleDetailResponse,
  handlePaginatedResponse,
  type ApiListResponse,
} from '../utils/api-response-handler';

// ============================================================================
// API Endpoint Configuration
// ============================================================================

// Admin endpoints - Full CRUD operations
const ADMIN_ENDPOINTS = {
  ALLOCATIONS: '/leave/admin/allocations/',
  BALANCES: '/leave/admin/balances/',
  REQUESTS: '/leave/admin/requests/',
};

// Employee endpoints - Employee self-service and class teacher access
const EMPLOYEE_ENDPOINTS = {
  ALLOCATIONS: '/leave/employee/allocations/',
  BALANCES: '/leave/employee/balances/',
  REQUESTS: '/leave/employee/requests/',
  REVIEWS: '/leave/employee/reviews/',
};

/**
 * Get the appropriate endpoint based on user role and operation type
 */
function getEndpoint(
  type: 'allocations' | 'balances' | 'requests' | 'reviews',
  isWriteOperation = false
): string {
  // Write operations always use admin endpoint
  if (isWriteOperation) {
    switch (type) {
      case 'allocations':
        return ADMIN_ENDPOINTS.ALLOCATIONS;
      case 'balances':
        return ADMIN_ENDPOINTS.BALANCES;
      case 'requests':
        return ADMIN_ENDPOINTS.REQUESTS;
      default:
        return ADMIN_ENDPOINTS.REQUESTS;
    }
  }

  // Read operations: use employee endpoint for non-admins, admin endpoint for admins
  if (isAdminUser()) {
    switch (type) {
      case 'allocations':
        return ADMIN_ENDPOINTS.ALLOCATIONS;
      case 'balances':
        return ADMIN_ENDPOINTS.BALANCES;
      case 'requests':
        return ADMIN_ENDPOINTS.REQUESTS;
      default:
        return ADMIN_ENDPOINTS.REQUESTS;
    }
  } else {
    switch (type) {
      case 'allocations':
        return EMPLOYEE_ENDPOINTS.ALLOCATIONS;
      case 'balances':
        return EMPLOYEE_ENDPOINTS.BALANCES;
      case 'requests':
        return EMPLOYEE_ENDPOINTS.REQUESTS;
      case 'reviews':
        return EMPLOYEE_ENDPOINTS.REVIEWS;
      default:
        return EMPLOYEE_ENDPOINTS.REQUESTS;
    }
  }
}

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface LeaveType {
  id: number;
  name: string;
  code: string;
  description?: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface OrganizationRole {
  id: number;
  name: string;
  code: string;
  description?: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface LeaveAllocationPayload {
  leave_type: number;
  name: string;
  description?: string;
  total_days: string;
  max_carry_forward_days: string;
  applies_to_all_roles?: boolean;
  roles: number[];
  effective_from: string;
  effective_to?: string;
}

export interface LeaveAllocation {
  public_id: string;
  leave_type_id: number;
  leave_type_name: string;
  name: string | null;
  description: string | null;
  total_days: string;
  max_carry_forward_days: string;
  applies_to_all_roles: boolean;
  roles: string; // Comma-separated string of role names
  role_ids?: number[]; // Array of role IDs
  roles_details?: OrganizationRole[]; // Full role objects
  leave_type?: LeaveType; // Full leave type object
  effective_from: string | null;
  effective_to: string | null;
  created_at: string;
  updated_at: string;
  created_by_public_id: string | null;
  created_by_name: string | null;
  updated_by_public_id: string | null;
  updated_by_name: string | null;
}

export interface LeaveBalance {
  public_id: string;
  user: {
    public_id: string;
    full_name: string;
    email: string;
    role: string;
  };
  leave_allocation: {
    public_id: string;
    leave_type_name: string;
    leave_type_code: string;
    display_name: string;
    total_days: number;
    max_carry_forward_days: number;
    effective_from: string | null;
    effective_to: string | null;
  };
  leave_name: string;
  total_allocated: string; // API returns as string
  used: number;
  pending: number;
  available: number;
  carried_forward: string; // API returns as string
  created_at: string;
  updated_at: string;
  created_by_public_id?: string | null;
  created_by_name?: string | null;
  updated_by_public_id?: string | null;
  updated_by_name?: string | null;
}

export interface LeaveRequest {
  public_id: string;
  user_public_id: string;
  user_name: string;
  user_role: string;
  leave_type_code: string;
  leave_name: string;
  start_date: string;
  end_date: string;
  number_of_days: string;
  is_half_day: boolean;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  applied_at: string;
  reviewed_by_name: string | null;
  reviewed_at: string | null;
  review_comments: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// API Functions
// ============================================================================

export const leaveApi = {
  // ========== Leave Types ==========

  /**
   * Get all leave types
   */
  getLeaveTypes: async (): Promise<LeaveType[]> => {
    const { data } = await api.get('/core/leave-types/');
    return handleListResponse<LeaveType>(data, 'getLeaveTypes');
  },

  /**
   * Get organization roles
   */
  getOrganizationRoles: async (): Promise<OrganizationRole[]> => {
    const { data } = await api.get('/core/organization-role-types/');
    return handleListResponse<OrganizationRole>(data, 'getOrganizationRoles');
  },

  // ========== Leave Allocations ==========

  /**
   * Get all leave allocations with optional filters
   */
  getAllocations: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    leave_type?: number;
    ordering?: string;
    readOnly?: boolean;
  }): Promise<ApiListResponse<LeaveAllocation>> => {
    const endpoint = getEndpoint('allocations', false); // Read operation
    const { readOnly: _readOnly, ...apiParams } = params || {};
    const { data } = await api.get(endpoint, {
      params: apiParams,
    });
    return handlePaginatedResponse<LeaveAllocation>(data, 'getAllocations');
  },

  /**
   * Get a specific leave allocation by ID
   */
  getAllocation: async (publicId: string): Promise<LeaveAllocation> => {
    const endpoint = getEndpoint('allocations', false);
    const { data } = await api.get(`${endpoint}${publicId}/`);
    return handleDetailResponse<LeaveAllocation>(data, 'getAllocation');
  },

  /**
   * Create a new leave allocation
   */
  createAllocation: async (payload: LeaveAllocationPayload): Promise<LeaveAllocation> => {
    const endpoint = getEndpoint('allocations', true); // Write operation
    const { data } = await api.post(endpoint, payload);
    return handleDetailResponse<LeaveAllocation>(data, 'createAllocation');
  },

  /**
   * Update an existing leave allocation
   */
  updateAllocation: async (
    publicId: string,
    payload: Partial<LeaveAllocationPayload>
  ): Promise<LeaveAllocation> => {
    const endpoint = getEndpoint('allocations', true); // Write operation
    const { data } = await api.patch(`${endpoint}${publicId}/`, payload);
    return handleDetailResponse<LeaveAllocation>(data, 'updateAllocation');
  },

  /**
   * Delete a leave allocation
   */
  deleteAllocation: async (publicId: string): Promise<void> => {
    const endpoint = getEndpoint('allocations', true); // Write operation
    await api.delete(`${endpoint}${publicId}/`);
  },

  // ========== Leave Balances ==========

  /**
   * Get all leave balances with optional filters
   */
  getBalances: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    user?: string;
    leave_type?: number;
  }): Promise<ApiListResponse<LeaveBalance>> => {
    const endpoint = getEndpoint('balances', false); // Read operation
    const { data } = await api.get(endpoint, {
      params,
    });
    return handlePaginatedResponse<LeaveBalance>(data, 'getBalances');
  },

  /**
   * Get a specific leave balance by ID
   */
  getBalance: async (publicId: string): Promise<LeaveBalance> => {
    const endpoint = getEndpoint('balances', false);
    const { data } = await api.get(`${endpoint}${publicId}/`);
    return handleDetailResponse<LeaveBalance>(data, 'getBalance');
  },

  // ========== Leave Requests ==========

  /**
   * Get all leave requests with optional filters
   */
  getRequests: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    status?: string;
    user?: string;
  }): Promise<ApiListResponse<LeaveRequest>> => {
    const endpoint = getEndpoint('requests', false); // Read operation
    const { data } = await api.get(endpoint, {
      params,
    });
    return handlePaginatedResponse<LeaveRequest>(data, 'getRequests');
  },

  /**
   * Get a specific leave request by ID
   */
  getRequest: async (publicId: string): Promise<LeaveRequest> => {
    const endpoint = getEndpoint('requests', false);
    const { data } = await api.get(`${endpoint}${publicId}/`);
    return handleDetailResponse<LeaveRequest>(data, 'getRequest');
  },
};
