/**
 * Management Screen - Organization data management (Admin)
 * Thin wrapper over ManagementScreenBase with admin-specific routes.
 */

import {
  ManagementScreenBase,
  createManagementItems,
} from '@/components/screens/ManagementScreenBase';

const adminItems = createManagementItems('/(tabs)/(admin)');

export default function ManagementScreen() {
  return <ManagementScreenBase items={adminItems} settingsRoute="/(tabs)/(admin)/settings" />;
}
