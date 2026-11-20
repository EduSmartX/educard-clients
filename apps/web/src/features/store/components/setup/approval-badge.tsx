import { APPROVAL_STATUS, APPROVAL_STATUS_LABELS, type ApprovalStatus } from '@educard/shared';
import { Badge } from '@/components/ui/badge';

const VARIANT: Record<ApprovalStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  [APPROVAL_STATUS.PENDING]: 'secondary',
  [APPROVAL_STATUS.APPROVED]: 'default',
  [APPROVAL_STATUS.REJECTED]: 'destructive',
  [APPROVAL_STATUS.SUPERSEDED]: 'outline',
};

export function ApprovalBadge({ status }: { status: ApprovalStatus }) {
  return <Badge variant={VARIANT[status]}>{APPROVAL_STATUS_LABELS[status] ?? status}</Badge>;
}

/** EduCard's reason, shown when a submission was rejected. */
export function ReviewNotes({ status, notes }: { status: ApprovalStatus; notes: string }) {
  if (status !== APPROVAL_STATUS.REJECTED || !notes) {
    return null;
  }
  return (
    <p className="bg-destructive/10 text-destructive rounded-md px-2 py-1 text-xs">
      EduCard: {notes}
    </p>
  );
}
