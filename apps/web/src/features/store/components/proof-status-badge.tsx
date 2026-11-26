import type { ProofStatus } from '@educard/shared';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const TONE: Record<ProofStatus, string> = {
  sent: 'bg-amber-100 text-amber-800 hover:bg-amber-100',
  changes_requested: 'bg-rose-100 text-rose-800 hover:bg-rose-100',
  approved: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100',
  superseded: 'bg-slate-100 text-slate-600 hover:bg-slate-100',
};

const CANCELLED_TONE = 'bg-rose-100 text-rose-800 hover:bg-rose-100';

/** `cancelled`: the order was cancelled, so the proof is shown in red whatever its status. */
export function ProofStatusBadge({
  status,
  label,
  cancelled = false,
}: {
  status: ProofStatus;
  label: string;
  cancelled?: boolean;
}) {
  return (
    <Badge className={cn('shrink-0 font-medium', cancelled ? CANCELLED_TONE : TONE[status])}>
      {label}
    </Badge>
  );
}
