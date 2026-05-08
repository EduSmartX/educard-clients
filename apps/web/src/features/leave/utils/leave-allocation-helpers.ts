/**
 * Leave Allocation Form Helper Functions
 * Utilities for data transformation between frontend forms and backend APIs
 */

import { format, parse } from 'date-fns';
import type { LeaveAllocation, OrganizationRole } from '@/lib/api/leave-api';
import {
  getDefaultLeaveAllocationValues,
  type LeaveAllocationFormValues,
} from '../schemas/leave-allocation-schema';

/**
 * Date format constants for consistent date handling
 */
export const DATE_FORMATS = {
  API: 'yyyy-MM-dd', // Backend API format
  DISPLAY: 'MMM dd, yyyy', // User-friendly display format
  DISPLAY_LONG: 'MMMM dd, yyyy', // Full month name
  INPUT: 'yyyy-MM-dd', // HTML input format
} as const;

/**
 * Format date for API submission (YYYY-MM-DD)
 */
export function formatDateForApi(date: Date | string | null | undefined): string {
  if (!date) {
    return '';
  }

  if (typeof date === 'string') {
    try {
      return format(new Date(date), DATE_FORMATS.API);
    } catch {
      return date;
    }
  }

  return format(date, DATE_FORMATS.API);
}

/**
 * Format date for display (MMM DD, YYYY)
 */
export function formatDateForDisplay(date: Date | string | null | undefined): string {
  if (!date) {
    return 'N/A';
  }

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, DATE_FORMATS.DISPLAY);
  } catch {
    return 'Invalid Date';
  }
}

/**
 * Parse date string from API (YYYY-MM-DD) to Date object
 */
export function parseDateFromApi(dateString: string | null | undefined): Date | undefined {
  if (!dateString) {
    return undefined;
  }

  try {
    return parse(dateString, DATE_FORMATS.API, new Date());
  } catch {
    return undefined;
  }
}

/**
 * Get default form values for create mode
 */
export function getDefaultFormValues(): LeaveAllocationFormValues {
  return getDefaultLeaveAllocationValues() as LeaveAllocationFormValues;
}

/**
 * Convert LeaveAllocation API response to form values
 * Used when editing or viewing an existing allocation
 */
export function getFormValuesFromAllocation(
  allocation: LeaveAllocation,
  _roles: OrganizationRole[]
): LeaveAllocationFormValues {
  // Extract leave_type ID from nested object or direct field
  const leaveTypeId = allocation.leave_type ? allocation.leave_type.id : allocation.leave_type_id;

  // Extract role IDs from roles_details array or role_ids field
  const roleIds = allocation.roles_details
    ? allocation.roles_details.map((role) => role.id)
    : allocation.role_ids || [];

  // Parse effective dates
  const effectiveFrom = allocation.effective_from
    ? parseDateFromApi(allocation.effective_from)
    : new Date();

  const effectiveTo = allocation.effective_to
    ? parseDateFromApi(allocation.effective_to)
    : undefined;

  return {
    leave_type: leaveTypeId || undefined, // Ensure it's undefined if not found, not NaN
    name: allocation.name || '',
    description: allocation.description || '',
    total_days: allocation.total_days?.toString() || '0', // Ensure it's always a string
    max_carry_forward_days: allocation.max_carry_forward_days?.toString() || '0', // Ensure it's always a string
    applies_to_all_roles: allocation.applies_to_all_roles || false,
    roles: roleIds,
    effective_from: effectiveFrom,
    effective_to: effectiveTo,
  } as LeaveAllocationFormValues;
}

/**
 * Validate that carry forward days don't exceed total days
 */
export function validateCarryForward(
  totalDays: string,
  carryForwardDays: string
): { valid: boolean; message?: string } {
  const total = parseFloat(totalDays);
  const carryForward = parseFloat(carryForwardDays);

  if (isNaN(total) || isNaN(carryForward)) {
    return { valid: false, message: 'Please enter valid numbers' };
  }

  if (carryForward > total) {
    return {
      valid: false,
      message: 'Carry forward days cannot exceed total days',
    };
  }

  return { valid: true };
}

/**
 * Calculate effective period duration in days
 */
export function calculateEffectivePeriod(
  startDate: Date | string | null | undefined,
  endDate: Date | string | null | undefined
): number | null {
  if (!startDate) {
    return null;
  }

  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = endDate ? (typeof endDate === 'string' ? new Date(endDate) : endDate) : new Date();

  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays >= 0 ? diffDays : null;
}

/**
 * Get role names from role IDs
 */
export function getRoleNames(roleIds: number[], roles: OrganizationRole[]): string {
  if (roleIds.length === 0) {
    return 'None';
  }

  const roleNames = roleIds.map((id) => roles.find((role) => role.id === id)?.name).filter(Boolean);

  return roleNames.length > 0 ? roleNames.join(', ') : 'None';
}

/**
 * Format allocation summary for display
 */
export function formatAllocationSummary(allocation: LeaveAllocation): string {
  const parts = [];

  parts.push(`${allocation.total_days} days total`);

  if (parseFloat(allocation.max_carry_forward_days) > 0) {
    parts.push(`${allocation.max_carry_forward_days} carry forward`);
  }

  if (allocation.effective_from) {
    parts.push(`from ${formatDateForDisplay(allocation.effective_from)}`);
  }

  if (allocation.effective_to) {
    parts.push(`to ${formatDateForDisplay(allocation.effective_to)}`);
  }

  return parts.join(' • ');
}
