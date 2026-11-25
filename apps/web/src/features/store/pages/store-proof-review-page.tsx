import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Circle, ClipboardCheck, Flag, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getErrorMessage, type IdCardProofDetail, type ProofDecisionRow } from '@educard/shared';
import { PageHeader } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { COMPANY_NAME, ROUTES } from '@/constants/app-config';
import { cn } from '@/lib/utils';
import { CardSidesCarousel } from '../components/card-sides-carousel';
import { ProofStatusBadge } from '../components/proof-status-badge';
import { useDecideProof, useProofDetail } from '../hooks/use-store';
import { formatDate } from '../utils/store-format';

/** Cards are rendered on demand, so show the class in pages instead of all at once. */
const PAGE_SIZE = 12;

function DecisionRowView({ row }: { row: ProofDecisionRow }) {
  const decided = row.decision !== '';
  const approved = row.decision === 'approved';
  const Icon = !decided ? Circle : approved ? CheckCircle2 : XCircle;
  const tone = !decided ? 'text-slate-400' : approved ? 'text-emerald-600' : 'text-rose-600';
  return (
    <li className="flex items-start gap-2 text-sm">
      <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', tone)} aria-hidden />
      <div className="min-w-0">
        <p className="font-medium">
          {row.role_label}
          {row.required_person && ` (${row.required_person})`}
        </p>
        <p className="text-muted-foreground">
          {!decided
            ? 'Waiting'
            : `${approved ? 'Approved' : 'Asked for changes'} by ${row.decided_by} · ${formatDate(row.decided_at)}`}
        </p>
        {row.comment && <p className="mt-1 italic">“{row.comment}”</p>}
      </div>
    </li>
  );
}

export default function StoreProofReviewPage() {
  const navigate = useNavigate();
  const { proofId = '' } = useParams<{ proofId: string }>();
  const { data, isLoading, isError } = useProofDetail(proofId);
  const decide = useDecideProof(proofId);

  const [visible, setVisible] = useState(PAGE_SIZE);
  const [flags, setFlags] = useState<Record<string, string>>({});
  const [openNote, setOpenNote] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [asking, setAsking] = useState(false);

  const proof: IdCardProofDetail | undefined = data?.data;
  const goBack = () => navigate(ROUTES.STORE.PROOFS);

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }
  if (isError || !proof) {
    return (
      <div className="space-y-4">
        <PageHeader title="ID card approval" description="This proof could not be opened" />
        <Button variant="outline" onClick={goBack}>
          <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
          Back to approvals
        </Button>
      </div>
    );
  }

  const flagged = Object.keys(flags);
  const shown = proof.students.slice(0, visible);

  const toggleFlag = (studentId: string) => {
    setFlags((current) => {
      const next = { ...current };
      if (studentId in next) {
        delete next[studentId];
      } else {
        next[studentId] = '';
      }
      return next;
    });
    setOpenNote(studentId);
  };

  const submit = (decision: 'approved' | 'changes_requested') => {
    decide.mutate(
      {
        decision,
        comment: comment.trim(),
        flagged_students:
          decision === 'changes_requested'
            ? flagged.map((student) => ({ student, note: flags[student].trim() }))
            : [],
      },
      {
        onSuccess: (response) => {
          toast.success(response.message);
          setAsking(false);
        },
        onError: (error) => toast.error(getErrorMessage(error)),
      }
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${proof.product_name} · ${proof.class_name}`}
        description={`Order ${proof.order_number} · ${proof.student_count} students · version ${proof.version}`}
        icon={ClipboardCheck}
        actions={[{ label: 'All approvals', onClick: goBack, variant: 'outline', icon: ArrowLeft }]}
      />

      <div className="grid gap-4 md:grid-cols-[1fr_20rem]">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              Status
              <ProofStatusBadge status={proof.status} label={proof.status_label} />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              {COMPANY_NAME} sent these designed cards on {formatDate(proof.sent_at)}. Look through
              every student’s card (front and back). Details are filled in from your student
              records, so a wrong name or missing photo here is a record to fix.
            </p>
            {proof.notes && (
              <p className="bg-muted rounded-md p-2">
                <strong>Note from {COMPANY_NAME}:</strong> {proof.notes}
              </p>
            )}
            {proof.status === 'approved' && (
              <p className="font-medium text-emerald-700">
                Approved by everyone. {COMPANY_NAME} will print and ship these cards.
              </p>
            )}
            {proof.status === 'changes_requested' && (
              <p className="font-medium text-rose-700">
                Changes were requested. {COMPANY_NAME} will fix them and send a new version.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Approvals needed</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {proof.decisions.map((row) => (
                <DecisionRowView key={row.role} row={row} />
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {shown.map((student) => {
          const isFlagged = student.public_id in flags;
          return (
            <Card key={student.public_id} className={cn(isFlagged && 'border-rose-300')}>
              <CardContent className="space-y-2 p-3">
                <CardSidesCarousel
                  frontPath={student.front_preview_url}
                  backPath={student.back_preview_url}
                  orientation={proof.orientation}
                  alt={`${student.name} ID card`}
                />
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 text-sm">
                    <p className="truncate font-medium">{student.name}</p>
                    {student.roll_number && (
                      <p className="text-muted-foreground text-xs">Roll {student.roll_number}</p>
                    )}
                  </div>
                  {proof.can_decide && (
                    <Button
                      type="button"
                      size="sm"
                      variant={isFlagged ? 'destructive' : 'outline'}
                      onClick={() => toggleFlag(student.public_id)}
                    >
                      <Flag className="mr-1 h-3.5 w-3.5" aria-hidden />
                      {isFlagged ? 'Flagged' : 'Flag'}
                    </Button>
                  )}
                </div>
                {isFlagged && openNote === student.public_id && (
                  <Input
                    autoFocus
                    placeholder="What is wrong with this card?"
                    maxLength={300}
                    value={flags[student.public_id]}
                    onChange={(event) =>
                      setFlags((current) => ({
                        ...current,
                        [student.public_id]: event.target.value,
                      }))
                    }
                  />
                )}
                {isFlagged && openNote !== student.public_id && flags[student.public_id] && (
                  <button
                    type="button"
                    className="text-left text-xs text-rose-700 underline-offset-2 hover:underline"
                    onClick={() => setOpenNote(student.public_id)}
                  >
                    {flags[student.public_id]}
                  </button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {visible < proof.students.length && (
        <div className="text-center">
          <Button variant="outline" onClick={() => setVisible((count) => count + PAGE_SIZE)}>
            Show more ({proof.students.length - visible} left)
          </Button>
        </div>
      )}

      {proof.can_decide && (
        <div className="bg-background sticky bottom-0 -mx-1 space-y-3 rounded-lg border p-4 shadow-lg">
          {asking && (
            <Textarea
              autoFocus
              rows={2}
              maxLength={1000}
              placeholder="Say what needs to change (you can also flag individual students above)"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
            />
          )}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-muted-foreground text-sm">
              {flagged.length > 0
                ? `${flagged.length} student${flagged.length === 1 ? '' : 's'} flagged`
                : 'Everything looks right? Approve. Otherwise flag the cards that need fixing.'}
            </p>
            <div className="flex gap-2">
              {asking ? (
                <>
                  <Button variant="outline" onClick={() => setAsking(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    disabled={decide.isPending}
                    onClick={() => submit('changes_requested')}
                  >
                    Send change request
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setAsking(true)}>
                    Request changes
                  </Button>
                  <Button
                    disabled={decide.isPending || flagged.length > 0}
                    title={flagged.length > 0 ? 'Remove the flags to approve' : undefined}
                    onClick={() => submit('approved')}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden />
                    Approve all {proof.student_count} cards
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {proof.my_decision && (
        <p className="text-muted-foreground text-sm">
          You {proof.my_decision === 'approved' ? 'approved' : 'asked for changes to'} this proof.
          {proof.can_decide && ' You can look again and change your answer at any time.'}
        </p>
      )}
    </div>
  );
}
