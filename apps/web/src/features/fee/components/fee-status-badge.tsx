/**
 * Fee Status Badge Component
 * Displays fee status with appropriate colors
 */

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { FeeStatus, FeeStatusLabels, type FeeStatusType } from '@educard/shared';

interface FeeStatusBadgeProps {
  status: FeeStatusType;
  className?: string;
  showIcon?: boolean;
}

const statusStyles: Record<FeeStatusType, string> = {
  [FeeStatus.PENDING]: 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100',
  [FeeStatus.PARTIAL]: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100',
  [FeeStatus.PAID]: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100',
  [FeeStatus.OVERDUE]: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-100',
  [FeeStatus.WAIVED]: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100',
  [FeeStatus.REFUNDING]: 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100',
  [FeeStatus.REFUNDED]: 'bg-sky-100 text-sky-800 border-sky-200 hover:bg-sky-100',
};

const statusIcons: Record<FeeStatusType, string> = {
  [FeeStatus.PENDING]: '⏳',
  [FeeStatus.PARTIAL]: '◐',
  [FeeStatus.PAID]: '✓',
  [FeeStatus.OVERDUE]: '⚠',
  [FeeStatus.WAIVED]: '—',
  [FeeStatus.REFUNDING]: '↩',
  [FeeStatus.REFUNDED]: '✓',
};

export function FeeStatusBadge({ status, className, showIcon = false }: FeeStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium',
        statusStyles[status] || statusStyles[FeeStatus.PENDING],
        className
      )}
    >
      {showIcon && <span className="mr-1">{statusIcons[status]}</span>}
      {FeeStatusLabels[status] || status}
    </Badge>
  );
}
