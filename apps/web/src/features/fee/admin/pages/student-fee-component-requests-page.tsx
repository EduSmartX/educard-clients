/**
 * Student Fee Component Requests Page
 * Admin queue for approving/rejecting parent opt-in/opt-out requests.
 */

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/app-config';
import { PageHeader } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { SearchableSelect } from '@/components/ui/searchable-select';
import {
  CheckCircle2,
  Clock,
  Eye,
  IndianRupee,
  XCircle,
  Filter,
  ClipboardCheck,
} from 'lucide-react';
import { useClasses } from '@/features/classes/hooks/use-classes';
import { useStudentFee, useStudentFees } from '../../hooks/use-fee-queries';
import { useReviewComponentRequests } from '../../hooks/use-fee-mutations';
import {
  ComponentApprovalStatus,
  type StudentFeeComponentItem,
  type StudentFee,
} from '@educard/shared';

function QueueItem({
  fee,
  selected,
  onClick,
}: Readonly<{
  fee: StudentFee;
  selected: boolean;
  onClick: () => void;
}>) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'w-full rounded-xl border px-4 py-3 text-left transition-colors',
        selected
          ? 'border-amber-400 bg-amber-50'
          : 'border-border hover:bg-muted/40 hover:border-amber-300',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold">{fee.student_name}</div>
          <div className="text-muted-foreground mt-0.5 text-sm">{fee.class_name}</div>
          <div className="text-muted-foreground text-xs">{fee.fee_structure_name}</div>
        </div>
        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
          {fee.pending_approvals ?? 0} pending
        </Badge>
      </div>
    </button>
  );
}

export function StudentFeeComponentRequestsPage() {
  const navigate = useNavigate();

  const [classFilter, setClassFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentFeeId, setSelectedStudentFeeId] = useState<string>();
  const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({});

  const { data: classesData } = useClasses();
  const { data: queueData, isLoading: isQueueLoading } = useStudentFees({
    class_public_id: classFilter !== 'all' ? classFilter : undefined,
    has_pending_component_requests: true,
    page_size: 100,
  });

  const queueItems = useMemo(() => queueData?.data ?? [], [queueData?.data]);

  const filteredQueueItems = useMemo(() => {
    if (!searchQuery.trim()) {
      return queueItems;
    }
    const query = searchQuery.toLowerCase();
    return queueItems.filter((fee) => {
      return (
        fee.student_name.toLowerCase().includes(query) ||
        fee.class_name.toLowerCase().includes(query) ||
        fee.fee_structure_name.toLowerCase().includes(query)
      );
    });
  }, [queueItems, searchQuery]);

  useEffect(() => {
    if (!filteredQueueItems.length) {
      setSelectedStudentFeeId(undefined);
      return;
    }

    const selectedStillExists = filteredQueueItems.some(
      (item) => item.public_id === selectedStudentFeeId
    );
    if (!selectedStudentFeeId || !selectedStillExists) {
      setSelectedStudentFeeId(filteredQueueItems[0].public_id);
    }
  }, [filteredQueueItems, selectedStudentFeeId]);

  const { data: selectedStudentFee, isLoading: isDetailLoading } =
    useStudentFee(selectedStudentFeeId);
  const reviewRequests = useReviewComponentRequests();

  const pendingComponents = (selectedStudentFee?.components ?? []).filter(
    (component: StudentFeeComponentItem) =>
      component.approval_status === ComponentApprovalStatus.PENDING
  );

  const handleApprove = (componentPublicId: string) => {
    if (!selectedStudentFeeId) {
      return;
    }

    reviewRequests.mutate({
      id: selectedStudentFeeId,
      data: { decisions: [{ component_public_id: componentPublicId, action: 'approve' }] },
    });
  };

  const handleReject = (componentPublicId: string) => {
    if (!selectedStudentFeeId) {
      return;
    }

    reviewRequests.mutate({
      id: selectedStudentFeeId,
      data: {
        decisions: [
          {
            component_public_id: componentPublicId,
            action: 'reject',
            admin_note: rejectNotes[componentPublicId] ?? '',
          },
        ],
      },
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Component Change Requests"
        description="Approve or reject parent opt-in/opt-out requests for optional fee components"
        actions={[
          {
            label: 'Back to Student Fees',
            onClick: () => navigate(ROUTES.FEES.STUDENT_FEES),
            variant: 'outline' as const,
          },
          {
            label: 'Open Student Fee',
            onClick: () =>
              selectedStudentFeeId &&
              navigate(ROUTES.FEES.STUDENT_FEES_VIEW.replace(':id', selectedStudentFeeId)),
            variant: 'secondary' as const,
            icon: Eye,
          },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <Card>
          <CardHeader className="space-y-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardCheck className="h-5 w-5 text-amber-600" />
              Change Request Queue
            </CardTitle>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-xs uppercase">
                  <Filter className="h-3.5 w-3.5" />
                  Class
                </Label>
                <SearchableSelect
                  options={[
                    { value: 'all', label: 'All Classes' },
                    ...(classesData?.data ?? []).map((cls) => {
                      const label =
                        cls.display_name ||
                        (cls.class_master?.name
                          ? `${cls.class_master.name} - ${cls.name}`
                          : cls.name);
                      return { value: cls.public_id, label };
                    }),
                  ]}
                  value={classFilter}
                  onValueChange={setClassFilter}
                  placeholder="All Classes"
                  searchPlaceholder="Search classes..."
                />
              </div>

              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by student, class, structure..."
              />
            </div>
          </CardHeader>

          <CardContent>
            <div className="space-y-3">
              {isQueueLoading && (
                <>
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </>
              )}

              {!isQueueLoading && filteredQueueItems.length === 0 && (
                <div className="text-muted-foreground rounded-xl border border-dashed p-6 text-center text-sm">
                  No pending component requests found.
                </div>
              )}

              {filteredQueueItems.map((fee) => (
                <QueueItem
                  key={fee.public_id}
                  fee={fee}
                  selected={fee.public_id === selectedStudentFeeId}
                  onClick={() => setSelectedStudentFeeId(fee.public_id)}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-amber-600" />
              Review Requests
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {isDetailLoading && (
              <>
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </>
            )}

            {!isDetailLoading && !selectedStudentFee && (
              <div className="text-muted-foreground rounded-xl border border-dashed p-8 text-center text-sm">
                Select a student fee record to review requests.
              </div>
            )}

            {!!selectedStudentFee && !isDetailLoading && (
              <>
                <div className="bg-muted/40 rounded-xl border p-4">
                  <div className="font-semibold">{selectedStudentFee.student_name}</div>
                  <div className="text-muted-foreground text-sm">
                    {selectedStudentFee.class_name} · {selectedStudentFee.fee_structure_name}
                  </div>
                </div>

                {pendingComponents.length === 0 && (
                  <div className="text-muted-foreground rounded-xl border border-dashed p-8 text-center text-sm">
                    No pending requests for this student.
                  </div>
                )}

                {pendingComponents.map((component: StudentFeeComponentItem) => (
                  <div
                    key={component.public_id}
                    className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/40 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="font-semibold">{component.name}</div>
                        <div className="text-muted-foreground text-sm">
                          Requested action:{' '}
                          <span className="text-foreground font-medium">
                            {component.is_selected ? 'Opt in' : 'Opt out'}
                          </span>
                        </div>
                        {component.request_note && (
                          <div className="mt-1 text-sm">
                            <span className="font-medium">Parent note:</span>{' '}
                            {component.request_note}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center text-base font-semibold">
                        <IndianRupee className="h-4 w-4" />
                        {component.amount.toLocaleString('en-IN')}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-muted-foreground text-xs">
                        Rejection note (optional)
                      </Label>
                      <Input
                        value={rejectNotes[component.public_id] ?? ''}
                        onChange={(e) =>
                          setRejectNotes((prev) => ({
                            ...prev,
                            [component.public_id]: e.target.value,
                          }))
                        }
                        placeholder="Reason if rejecting this request"
                      />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        className="bg-green-600 text-white hover:bg-green-700"
                        disabled={reviewRequests.isPending}
                        onClick={() => handleApprove(component.public_id)}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        disabled={reviewRequests.isPending}
                        onClick={() => handleReject(component.public_id)}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
