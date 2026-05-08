/**
 * Utility to get sidebar configuration based on user role
 */

import { adminSidebarConfig } from '@/features/admin/config/sidebar-config';
import { employeeSidebarConfig } from '@/features/employee/config/sidebar-config';
import { parentSidebarConfig } from '@/features/parent/config/sidebar-config';
import { getStoredUserRole } from '@/lib/utils/storage';

export function getSidebarConfig() {
  const role = getStoredUserRole();
  if (!role) {
    return adminSidebarConfig; // Default fallback
  }

  switch (role) {
    case 'admin':
      return adminSidebarConfig;
    case 'teacher':
    case 'staff':
      return employeeSidebarConfig;
    case 'parent':
      return parentSidebarConfig;
    default:
      return adminSidebarConfig;
  }
}
