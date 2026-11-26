/**
 * Store and ID card menu tiles, shared by the Manage and Admin tabs (same shape as the
 * web sidebar entries), plus whether "ID Card Review" should show at all.
 */

import {
  ClipboardCheck,
  IdCard,
  Package,
  Settings2,
  ShoppingBag,
} from 'lucide-react-native';

import type { ManagementItem } from '@/components/screens/ManagementScreenBase';
import { useAuthStore } from '@/lib/auth-store';
import { isAdminRole, isTeacherRole } from '@/utils/role-utils';

import { useIdCardStatus } from './hooks/use-store';

/** Manage tab: every student's card, one at a time (once a design is approved). */
export const idCardReviewTile: ManagementItem = {
  id: 'id-card-review',
  title: 'ID Card Review',
  subtitle: 'Check each student’s card',
  icon: IdCard,
  gradient: ['#0d9488', '#2dd4bf'],
  screen: 'IdCardReview',
};

/** Manage tab: order ID cards, uniforms and supplies (school admin). */
export const storeTile: ManagementItem = {
  id: 'store',
  title: 'Store',
  subtitle: 'Order ID cards & supplies',
  icon: ShoppingBag,
  gradient: ['#ea580c', '#fb923c'],
  screen: 'StoreCatalog',
};

/** Manage tab: placed orders through to delivery (school admin). */
export const storeOrdersTile: ManagementItem = {
  id: 'store-orders',
  title: 'Store Orders',
  subtitle: 'Track orders to delivery',
  icon: Package,
  gradient: ['#0891b2', '#22d3ee'],
  screen: 'StoreOrders',
};

/** Admin tab: approve the cards EduCard designed (school admin and class teachers). */
export const idCardApprovalsTile: ManagementItem = {
  id: 'id-card-approvals',
  title: 'ID Card Approvals',
  subtitle: 'Approve designed cards',
  icon: ClipboardCheck,
  gradient: ['#7c3aed', '#a78bfa'],
  screen: 'StoreProofs',
};

/** Admin tab: product looks, photos and the ID card design (school admin). */
export const storeSetupTile: ManagementItem = {
  id: 'store-setup',
  title: 'Store Setup',
  subtitle: 'Designs, looks & photos',
  icon: Settings2,
  gradient: ['#4f46e5', '#818cf8'],
  screen: 'StoreSetup',
};

/**
 * "ID Card Review" shows only for the school admin and teachers, and only once the
 * school has an approved ID card design (same rule as the web sidebar).
 */
export function useShowIdCardReview(): boolean {
  const role = useAuthStore(state => state.user?.role);
  const allowed = isAdminRole(role) || isTeacherRole(role);
  const { data: hasApprovedDesign = false } = useIdCardStatus(allowed);
  return allowed && hasApprovedDesign;
}
