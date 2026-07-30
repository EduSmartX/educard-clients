/**
 * Fee Status Badge Component for Mobile
 * Displays fee status with appropriate styling
 */

import type { FeeStatusType } from '@educard/shared';
import { FeeStatusLabels, FeeStatusColors } from '@educard/shared';
import React from 'react';

import { StatusBadge } from '@/components/ui/StatusBadge';

interface FeeStatusBadgeProps {
  status: FeeStatusType;
  size?: 'sm' | 'md' | 'lg';
}

export function FeeStatusBadge({ status, size = 'md' }: FeeStatusBadgeProps) {
  const label = FeeStatusLabels[status] || status;
  const color = FeeStatusColors[status] || '#6B7280';

  return <StatusBadge label={label} color={color} size={size} />;
}
