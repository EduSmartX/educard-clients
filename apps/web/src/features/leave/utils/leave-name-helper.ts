/**
 * Leave Name Helper Utility
 * Provides consistent leave name display across all components
 */

interface LeaveBalanceSummary {
  leave_type_name: string;
}

interface LeaveWithName {
  leave_name?: string;
  leave_allocation?: {
    display_name?: string;
    leave_type_name: string;
  };
}

interface LeaveBalance {
  leave_name?: string;
  leave_allocation: {
    display_name?: string;
    leave_type_name: string;
  };
}

type LeaveObject = LeaveWithName | LeaveBalance | LeaveBalanceSummary;

// Type guards
function isLeaveBalanceSummary(obj: LeaveObject): obj is LeaveBalanceSummary {
  return 'leave_type_name' in obj && !('leave_allocation' in obj);
}

function hasLeaveAllocation(obj: LeaveObject): obj is LeaveBalance | LeaveWithName {
  return 'leave_allocation' in obj;
}

/**
 * Get proper leave type name with format:
 * - If custom name exists: "Master Leave Name (Custom Name)"
 * - Otherwise: "Master Leave Name"
 */
export function getLeaveTypeName(leave: LeaveObject): string {
  if (isLeaveBalanceSummary(leave)) {
    return leave.leave_type_name || 'Unknown';
  }

  if (hasLeaveAllocation(leave)) {
    const masterName = leave.leave_allocation?.leave_type_name || 'Unknown';
    const customName = leave.leave_name?.trim();

    // If custom name exists and is different from master name, show both
    if (customName && customName !== masterName) {
      return `${masterName} (${customName})`;
    }

    // Otherwise just show master name
    return masterName;
  }

  return 'Unknown';
}
