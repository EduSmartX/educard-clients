/**
 * Management Screen - Organization data management (Employee/Teacher View)
 * Thin wrapper over ManagementScreenBase with employee-specific routes.
 * Teachers: View-only access (permission checks handled by backend/shared screens)
 */

import { Megaphone } from 'lucide-react-native';
import { useMemo } from 'react';

import {
  ManagementScreenBase,
  createManagementItems,
  type ManagementItem,
} from '@/components/screens/ManagementScreenBase';
import {
  idCardReviewTile,
  useShowIdCardReview,
} from '@/features/store/store-menu-items';

// Admins reach announcements from the Admin tab instead.
const employeeItems: ManagementItem[] = [
  ...createManagementItems(false),
  {
    id: 'announcements',
    title: 'Announcements',
    subtitle: 'Share updates',
    icon: Megaphone,
    gradient: ['#d946ef', '#f0abfc'],
    screen: 'Announcements',
  },
];

export default function ManagementScreen() {
  // Teachers check their classes' cards once the school has an approved design.
  const showIdCards = useShowIdCardReview();
  const items = useMemo(
    () => (showIdCards ? [...employeeItems, idCardReviewTile] : employeeItems),
    [showIdCards],
  );
  return <ManagementScreenBase items={items} settingsScreen="Settings" />;
}
