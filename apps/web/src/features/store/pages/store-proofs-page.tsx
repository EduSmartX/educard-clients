import { useNavigate } from 'react-router-dom';
import { ClipboardCheck, ChevronRight } from 'lucide-react';
import { PageHeader } from '@/components/common';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { COMPANY_NAME, ROUTES } from '@/constants/app-config';
import { ProofStatusBadge } from '../components/proof-status-badge';
import { StoreEmptyState } from '../components/store-empty-state';
import { useProofs } from '../hooks/use-store';
import { formatDate } from '../utils/store-format';

export default function StoreProofsPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useProofs();
  const proofs = data?.data ?? [];
  const waiting = proofs.filter((proof) => proof.can_decide).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="ID card approvals"
        description={`Check the designed ID cards for every student, then approve them so ${COMPANY_NAME} can print`}
        icon={ClipboardCheck}
      />

      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : proofs.length === 0 ? (
        <StoreEmptyState
          title="Nothing to approve yet"
          description="When {company} has designed the ID cards for an order, they will appear here for you to check."
        />
      ) : (
        <div className="space-y-3">
          {waiting > 0 && (
            <p className="text-sm font-medium text-amber-700">
              {waiting} proof{waiting === 1 ? '' : 's'} waiting for your decision
            </p>
          )}
          {proofs.map((proof) => (
            <Card
              key={proof.public_id}
              role="button"
              tabIndex={0}
              onClick={() => navigate(ROUTES.STORE.PROOF.replace(':proofId', proof.public_id))}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  navigate(ROUTES.STORE.PROOF.replace(':proofId', proof.public_id));
                }
              }}
              className="hover:bg-muted/40 cursor-pointer transition-colors"
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">
                      {proof.product_name} · {proof.class_name}
                    </span>
                    <ProofStatusBadge status={proof.status} label={proof.status_label} />
                    {proof.can_decide && !proof.my_decision && (
                      <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">
                        Your approval needed
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Order {proof.order_number} · {proof.student_count} student
                    {proof.student_count === 1 ? '' : 's'} · version {proof.version} · sent{' '}
                    {formatDate(proof.sent_at)}
                  </p>
                </div>
                <ChevronRight className="text-muted-foreground h-5 w-5" aria-hidden />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
