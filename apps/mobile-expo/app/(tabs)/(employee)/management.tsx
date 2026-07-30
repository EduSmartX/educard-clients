/**
 * Management Screen - Organization data management (Employee/Teacher View)
 * Thin wrapper over ManagementScreenBase with employee-specific routes.
 * Teachers: View-only access (permission checks handled by backend/shared screens)
 */

import {
  ManagementScreenBase,
  createManagementItems,
} from '@/components/screens/ManagementScreenBase';

const employeeItems = createManagementItems('/(shared-screens)');

export default function ManagementScreen() {
  return <ManagementScreenBase items={employeeItems} settingsRoute="/(tabs)/(employee)/settings" />;
}
