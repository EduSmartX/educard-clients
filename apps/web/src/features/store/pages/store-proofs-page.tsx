/**
 * ID card approvals - the cards EduCard designed, grouped by order, one row per class.
 *
 * Overview tiles double as filters (waiting / changes requested / approved / cancelled);
 * each class row says who has approved or who is still awaited, with one clear action.
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Ban,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  IdCard,
  Layers,
  PenLine,
  Search,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { IdCardProofSummary } from '@educard/shared';
import { PageHeader } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { COMPANY_NAME, ROUTES } from '@/constants/app-config';
import { cn } from '@/lib/utils';
import { ProofStatusBadge } from '../components/proof-status-badge';
import { StoreEmptyState } from '../components/store-empty-state';
import { useProofs } from '../hooks/use-store';
import { formatDate } from '../utils/store-format';

type Bucket = 'waiting' | 'changes' | 'approved' | 'cancelled';
type Filter = Bucket | 'all';

/** Where a proof stands, as the school sees it. */
function bucketOf(proof: IdCardProofSummary): Bucket {
  if (proof.order_status === 'cancelled') {
    return 'cancelled';
  }
  if (proof.status === 'approved') {
    return 'approved';
  }
  if (proof.status === 'changes_requested') {
    return 'changes';
  }
  return 'waiting';
}

const BUCKETS: Record<
  Bucket,
  { label: string; icon: LucideIcon; tile: string; iconBox: string; accent: string }
> = {
  waiting: {
    label: 'Waiting for approval',
    icon: Clock3,
    tile: 'border-amber-200 bg-amber-50/70 dark:border-amber-900/50 dark:bg-amber-950/30',
    iconBox: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
    accent: 'bg-amber-400',
  },
  changes: {
    label: 'Changes requested',
    icon: PenLine,
    tile: 'border-rose-200 bg-rose-50/70 dark:border-rose-900/50 dark:bg-rose-950/30',
    iconBox: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300',
    accent: 'bg-rose-400',
  },
  approved: {
    label: 'Approved',
    icon: CheckCircle2,
    tile: 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/50 dark:bg-emerald-950/30',
    iconBox: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
    accent: 'bg-emerald-500',
  },
  cancelled: {
    label: 'Order cancelled',
    icon: Ban,
    tile: 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40',
    iconBox: 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    accent: 'bg-slate-300 dark:bg-slate-600',
  },
};
const BUCKET_ORDER: Bucket[] = ['waiting', 'changes', 'approved', 'cancelled'];

/** "Approved by Vinod Reddem" / "Waiting for School admin or Class teacher (…)". */
function approvalLine(proof: IdCardProofSummary): string {
  const approvedBy = proof.decisions
    .filter((row) => row.decision === 'approved' && row.decided_by)
    .map((row) => row.decided_by);
  const changesBy = proof.decisions
    .filter((row) => row.decision === 'changes_requested' && row.decided_by)
    .map((row) => row.decided_by);
  if (changesBy.length) {
    return `Changes asked by ${[...new Set(changesBy)].join(' and ')}`;
  }
  if (approvedBy.length) {
    return `Approved by ${[...new Set(approvedBy)].join(' and ')}`;
  }
  const waitingFor = proof.decisions
    .filter((row) => !row.decision && !row.not_needed)
    .map((row) =>
      row.required_person ? `${row.role_label} (${row.required_person})` : row.role_label
    );
  if (!waitingFor.length) {
    return '';
  }
  const joiner = proof.approval_rule === 'any' ? ' or ' : ' and ';
  return `Waiting for ${waitingFor.join(joiner)}`;
}

function OverviewTile({
  bucket,
  count,
  active,
  onClick,
}: {
  bucket: Bucket;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  const { label, icon: Icon, tile, iconBox } = BUCKETS[bucket];
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex items-center gap-3 rounded-xl border p-4 text-left transition-shadow hover:shadow-md',
        tile,
        active && 'ring-primary ring-2 ring-offset-2'
      )}
    >
      <span
        className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', iconBox)}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <span>
        <span className="block text-2xl leading-none font-bold">{count}</span>
        <span className="text-muted-foreground mt-1 block text-sm">{label}</span>
      </span>
    </button>
  );
}

function ClassRow({ proof, onOpen }: { proof: IdCardProofSummary; onOpen: () => void }) {
  const bucket = bucketOf(proof);
  const { iconBox, accent } = BUCKETS[bucket];
  const needsMe = proof.can_decide && bucket === 'waiting' && !proof.my_decision;
  const line = approvalLine(proof);

  return (
    <div className="hover:bg-muted/40 relative flex flex-wrap items-center gap-4 px-5 py-4 transition-colors">
      <span className={cn('absolute inset-y-3 left-0 w-1 rounded-r', accent)} aria-hidden />
      <span
        className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-lg', iconBox)}
      >
        <IdCard className="h-5 w-5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-base font-semibold">{proof.class_name || 'Whole school'}</span>
          <ProofStatusBadge
            status={proof.status}
            label={proof.status_label}
            cancelled={bucket === 'cancelled'}
          />
          {needsMe && (
            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700 dark:bg-violet-900/50 dark:text-violet-300">
              Your approval needed
            </span>
          )}
        </div>
        <p className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" aria-hidden />
            {proof.student_count} student{proof.student_count === 1 ? '' : 's'}
          </span>
          <span className="inline-flex items-center gap-1">
            <Layers className="h-3.5 w-3.5" aria-hidden />
            Version {proof.version}
          </span>
          <span>{proof.product_name}</span>
        </p>
        {line && <p className="text-sm">{line}</p>}
      </div>
      <Button
        size="sm"
        variant={needsMe ? 'default' : 'outline'}
        onClick={onOpen}
        className="shrink-0"
      >
        {needsMe ? 'Review & approve' : 'View cards'}
        <ArrowRight className="ml-1 h-4 w-4" aria-hidden />
      </Button>
    </div>
  );
}

export default function StoreProofsPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useProofs();
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');

  const proofs = useMemo(() => data?.data ?? [], [data]);
  const counts = useMemo(() => {
    const result: Record<Bucket, number> = { waiting: 0, changes: 0, approved: 0, cancelled: 0 };
    for (const proof of proofs) {
      result[bucketOf(proof)] += 1;
    }
    return result;
  }, [proofs]);

  // Filtered, then grouped by order (newest order first, as the API returns them).
  const groups = useMemo(() => {
    const query = search.trim().toLowerCase();
    const shown = proofs.filter(
      (proof) =>
        (filter === 'all' || bucketOf(proof) === filter) &&
        (!query ||
          proof.class_name.toLowerCase().includes(query) ||
          proof.order_number.toLowerCase().includes(query) ||
          proof.product_name.toLowerCase().includes(query))
    );
    const byOrder = new Map<string, IdCardProofSummary[]>();
    for (const proof of shown) {
      byOrder.set(proof.order_number, [...(byOrder.get(proof.order_number) ?? []), proof]);
    }
    return [...byOrder.entries()];
  }, [proofs, filter, search]);

  const open = (proof: IdCardProofSummary) =>
    navigate(ROUTES.STORE.PROOF.replace(':proofId', proof.public_id));
  const toggle = (bucket: Bucket) => setFilter((current) => (current === bucket ? 'all' : bucket));

  return (
    <div className="space-y-6">
      <PageHeader
        title="ID card approvals"
        description={`Check the designed ID cards for every student, then approve them so ${COMPANY_NAME} can print`}
        icon={ClipboardCheck}
      />

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {BUCKET_ORDER.map((bucket) => (
              <Skeleton key={bucket} className="h-20 w-full" />
            ))}
          </div>
          <Skeleton className="h-48 w-full" />
        </div>
      ) : proofs.length === 0 ? (
        <StoreEmptyState
          title="Nothing to approve yet"
          description="When {company} has designed the ID cards for an order, they will appear here for you to check."
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {BUCKET_ORDER.map((bucket) => (
              <OverviewTile
                key={bucket}
                bucket={bucket}
                count={counts[bucket]}
                active={filter === bucket}
                onClick={() => toggle(bucket)}
              />
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-muted-foreground text-sm">
              {filter === 'all' ? (
                'Showing every class.'
              ) : (
                <>
                  Showing <strong className="text-foreground">{BUCKETS[filter].label}</strong>.{' '}
                  <button
                    type="button"
                    className="text-primary font-medium underline-offset-2 hover:underline"
                    onClick={() => setFilter('all')}
                  >
                    Show all
                  </button>
                </>
              )}
            </p>
            <div className="relative w-full sm:w-72">
              <Search
                className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
                aria-hidden
              />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search class or order number"
                className="pl-9"
                aria-label="Search class or order number"
              />
            </div>
          </div>

          {groups.length === 0 ? (
            <div className="rounded-xl border border-dashed py-12 text-center">
              <p className="font-medium">No ID cards match</p>
              <p className="text-muted-foreground mt-1 text-sm">Try another status or search.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {groups.map(([orderNumber, rows]) => (
                <Card key={orderNumber} className="overflow-hidden p-0">
                  <div className="bg-muted/40 flex flex-wrap items-center justify-between gap-2 border-b px-5 py-3">
                    <div>
                      <p className="font-semibold">Order {orderNumber}</p>
                      <p className="text-muted-foreground text-xs">
                        Sent {formatDate(rows[0].sent_at)} · {rows.length} class
                        {rows.length === 1 ? '' : 'es'}
                      </p>
                    </div>
                    {rows[0].order_status === 'cancelled' && (
                      <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-700 dark:bg-rose-900/50 dark:text-rose-300">
                        Order cancelled
                      </span>
                    )}
                  </div>
                  <div className="divide-y">
                    {rows.map((proof) => (
                      <ClassRow key={proof.public_id} proof={proof} onOpen={() => open(proof)} />
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
