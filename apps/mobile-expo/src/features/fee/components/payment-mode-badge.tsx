/**
 * Payment Mode Badge Component for Mobile
 * Displays payment mode with appropriate styling
 */

import type { PaymentModeType } from '@educard/shared';
import { PaymentMode, PaymentModeLabels } from '@educard/shared';
import React from 'react';

import { StatusBadge } from '@/components/ui/StatusBadge';

interface PaymentModeBadgeProps {
  mode: PaymentModeType;
  size?: 'sm' | 'md' | 'lg';
}

const PaymentModeColors: Record<PaymentModeType, string> = {
  [PaymentMode.CASH]: '#10B981',
  [PaymentMode.CHEQUE]: '#F59E0B',
  [PaymentMode.BANK_TRANSFER]: '#3B82F6',
  [PaymentMode.UPI]: '#8B5CF6',
  [PaymentMode.CARD]: '#EC4899',
  [PaymentMode.ONLINE]: '#06B6D4',
};

export function PaymentModeBadge({ mode, size = 'md' }: PaymentModeBadgeProps) {
  const label = PaymentModeLabels[mode] || mode;
  const color = PaymentModeColors[mode] || '#6B7280';

  return <StatusBadge label={label} color={color} size={size} />;
}
