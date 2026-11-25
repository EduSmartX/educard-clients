import { APPROVAL_STATUS, APPROVAL_STATUS_LABELS, type ApprovalStatus } from '@educard/shared';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const TONE: Record<ApprovalStatus, string> = {
  [APPROVAL_STATUS.PENDING]: 'bg-amber-100 text-amber-800 hover:bg-amber-100',
  [APPROVAL_STATUS.APPROVED]: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100',
  [APPROVAL_STATUS.REJECTED]: 'bg-rose-100 text-rose-800 hover:bg-rose-100',
  [APPROVAL_STATUS.SUPERSEDED]: 'bg-slate-100 text-slate-600 hover:bg-slate-100',
};

export function ApprovalBadge({ status }: { status: ApprovalStatus }) {
  return (
    <Badge className={cn('shrink-0 font-medium', TONE[status])}>
      {APPROVAL_STATUS_LABELS[status] ?? status}
    </Badge>
  );
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
