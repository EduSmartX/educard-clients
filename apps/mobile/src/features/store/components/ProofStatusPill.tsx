/**
 * Where an ID card proof is: waiting for approval, changes requested, approved, replaced.
 */
import type { ProofStatus } from '@educard/shared';

import { StatusBadge } from '@/components/ui/StatusBadge';

const COLOURS: Record<ProofStatus, string> = {
  sent: '#d97706',
  changes_requested: '#dc2626',
  approved: '#16a34a',
  superseded: '#6b7280',
};

/** `cancelled`: the order was cancelled, so the pill is red whatever the proof status. */
export function ProofStatusPill({
  status,
  label,
  size = 'md',
  cancelled = false,
}: {
  status: ProofStatus;
  label: string;
  size?: 'sm' | 'md' | 'lg';
  cancelled?: boolean;
}) {
  return (
    <StatusBadge
      label={label}
      color={cancelled ? '#dc2626' : (COLOURS[status] ?? '#6b7280')}
      size={size}
    />
  );
}
