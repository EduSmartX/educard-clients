/**
 * Management Screen - Organization data management (Admin)
 */

import {
  ManagementScreenBase,
  createManagementItems,
} from '@/components/screens/ManagementScreenBase';

const adminItems = createManagementItems(true);

export default function ManagementScreen() {
  return <ManagementScreenBase items={adminItems} settingsScreen="Settings" />;
}
