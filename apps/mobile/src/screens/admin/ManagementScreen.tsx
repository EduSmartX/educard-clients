/**
 * Management Screen - Organization data management (Admin)
 */

import { useMemo } from 'react';

import {
  ManagementScreenBase,
  createManagementItems,
} from '@/components/screens/ManagementScreenBase';
import {
  idCardReviewTile,
  storeOrdersTile,
  storeTile,
  useShowIdCardReview,
} from '@/features/store/store-menu-items';

const adminItems = createManagementItems(true);

export default function ManagementScreen() {
  // ID Card Preview appears once the school has an approved ID card design.
  const showIdCards = useShowIdCardReview();
  const items = useMemo(
    () => [
      ...adminItems,
      ...(showIdCards ? [idCardReviewTile] : []),
      storeTile,
      storeOrdersTile,
    ],
    [showIdCards],
  );
  return <ManagementScreenBase items={items} settingsScreen="Settings" />;
}
