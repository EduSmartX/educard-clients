/**
 * Student Fee Detail Page
 * Shows detailed view of a student's fee with components and payment history
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/app-config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Calendar,
  IndianRupee,
  Pencil,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Tag,
} from 'lucide-react';
import { PageHeader } from '@/components/common';
import { FeeStatusBadge } from '../../components/fee-status-badge';
import { useStudentFee } from '../../hooks/use-fee-queries';
import {
  useReviewComponentRequests,
  useMarkStudentFeeRefunded,
  useInitiateRefund,
} from '../../hooks/use-fee-mutations';
import { Skeleton } from '@/components/ui/skeleton';
import { StudentFeePaymentHistory } from '../components/student-fee-payment-history';
import type { StudentFeeComponentItem, StudentFee } from '@educard/shared';

// ─── Inline helper component ──────────────────────────────────────────────────

interface DiscountCardProps {
  studentFee: StudentFee;
}

function DiscountCard({ studentFee }: DiscountCardProps) {
  const [open, setOpen] = useState(false);
  return (
    <Card>
      <CardHeader className="p-0">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="hover:bg-muted/50 flex w-full items-center justify-between rounded-t-lg px-6 py-4 text-left transition-colors"
        >
          <div className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-green-600" />
            <span className="text-base font-semibold">Discount &amp; Referral</span>
            <span className="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
              {studentFee.discount_percentage}% off
            </span>
          </div>
          {open ? (
            <ChevronUp className="text-muted-foreground h-5 w-5" />
          ) : (
            <ChevronDown className="text-muted-foreground h-5 w-5" />
          )}
        </button>
      </CardHeader>
      {open && (
        <CardContent className="px-6 pt-0 pb-4">
          <div className="space-y-3 border-t pt-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Base Amount</span>
              <span className="text-muted-foreground font-medium line-through">
                ₹{studentFee.base_amount?.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex items-center justify-between text-green-700">
              <span className="font-medium">Discount ({studentFee.discount_percentage}%)</span>
              <span className="font-semibold">
                − ₹{studentFee.discount_amount?.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex items-center justify-between border-t pt-3 font-semibold">
              <span>Final Amount</span>
              <span className="text-base font-bold">
                ₹{studentFee.final_amount?.toLocaleString('en-IN')}
              </span>
            </div>
            {studentFee.discount_reason && (
              <div className="text-muted-foreground border-t pt-2 text-xs">
                <span className="text-foreground font-medium">Reason: </span>
                {studentFee.discount_reason}
              </div>
            )}
            {studentFee.referral_name && (
              <div className="text-muted-foreground text-xs">
                <span className="text-foreground font-medium">Referral: </span>
                {studentFee.referral_name}
                {studentFee.referral_code && ` (${studentFee.referral_code})`}
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export function StudentFeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: studentFee, isLoading } = useStudentFee(id!);
  const reviewRequests = useReviewComponentRequests();
  const markRefunded = useMarkStudentFeeRefunded();
  const initiateRefund = useInitiateRefund();

  // Refund confirmation dialogs
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [showInitiateRefundDialog, setShowInitiateRefundDialog] = useState(false);

  // Per-component reject note state: { [component_public_id]: string }
  const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({});

  const pendingComponents = (studentFee?.components ?? []).filter(
    (c: StudentFeeComponentItem) => c.approval_status === 'pending'
  );

  const handleApprove = (componentPublicId: string) => {
    reviewRequests.mutate({
      id: id!,
      data: { decisions: [{ component_public_id: componentPublicId, action: 'approve' }] },
    });
  };

  const handleReject = (componentPublicId: string) => {
    reviewRequests.mutate({
      id: id!,
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!studentFee) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">Student fee record not found.</p>
        <Button variant="link" onClick={() => navigate(ROUTES.FEES.STUDENT_FEES)}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={studentFee.student_name}
        description={`${studentFee.class_name} • ${studentFee.fee_structure_name} • ${studentFee.academic_year}`}
        actions={[
          ...(studentFee.status === 'refunding'
            ? [
                {
                  label: markRefunded.isPending ? 'Processing...' : 'Mark as Refunded',
                  onClick: () => setShowRefundDialog(true),
                  variant: 'outline' as const,
                  icon: RefreshCw,
                  disabled: markRefunded.isPending,
                  className: 'border-orange-300 text-orange-700 hover:bg-orange-50',
                },
              ]
            : []),
          // Show "Initiate Refund" when student has overpaid and refund not already in progress
          ...(studentFee.amount_paid > studentFee.final_amount &&
          !['refunding', 'refunded'].includes(studentFee.status)
            ? [
                {
                  label: initiateRefund.isPending ? 'Processing...' : 'Initiate Refund',
                  onClick: () => setShowInitiateRefundDialog(true),
                  variant: 'outline' as const,
                  icon: RefreshCw,
                  disabled: initiateRefund.isPending,
                  className: 'border-red-300 text-red-700 hover:bg-red-50',
                },
              ]
            : []),
          {
            label: 'Record Payment',
            onClick: () => navigate(ROUTES.FEES.PAYMENT_NEW_FOR_STUDENT.replace(':id', id || '')),
            variant: 'outline' as const,
            icon: CreditCard,
            className: 'border-green-300 text-green-700 hover:bg-green-50',
          },
          {
            label: 'Edit',
            onClick: () => navigate(ROUTES.FEES.STUDENT_FEES_EDIT.replace(':id', id || '')),
            variant: 'outline' as const,
            icon: Pencil,
          },
        ]}
      >
        <div className="mt-1 flex items-center gap-2">
          {studentFee.student_roll_number && (
            <span className="text-foreground bg-muted rounded-md px-2 py-0.5 text-sm font-bold">
              {studentFee.student_roll_number}
            </span>
          )}
          <FeeStatusBadge status={studentFee.status} />
        </div>
      </PageHeader>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Total Amount */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-muted-foreground text-sm">Total Amount</div>
            <div className="flex items-center text-2xl font-bold">
              <IndianRupee className="h-5 w-5" />
              {studentFee.final_amount?.toLocaleString('en-IN')}
            </div>
            {studentFee.discount_percentage > 0 && (
              <div className="mt-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                  <Tag className="h-3 w-3" />
                  {studentFee.discount_percentage}% off
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-muted-foreground text-sm">Amount Paid</div>
            <div className="flex items-center text-2xl font-bold text-green-600">
              <IndianRupee className="h-5 w-5" />
              {studentFee.amount_paid?.toLocaleString('en-IN')}
            </div>
            {studentFee.last_payment_date && (
              <div className="text-muted-foreground mt-1 text-xs">
                Last: {new Date(studentFee.last_payment_date).toLocaleDateString('en-IN')}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            {studentFee.balance_due < 0 ? (
              <>
                <div className="text-sm font-medium text-orange-600">Overpaid</div>
                <div className="flex items-center text-2xl font-bold text-orange-600">
                  <IndianRupee className="h-5 w-5" />
                  {Math.abs(studentFee.balance_due).toLocaleString('en-IN')}
                </div>
                <div className="mt-1 text-xs text-orange-500">Excess payment — refund required</div>
              </>
            ) : (
              <>
                <div className="text-muted-foreground text-sm">Balance Due</div>
                <div className="flex items-center text-2xl font-bold text-red-600">
                  <IndianRupee className="h-5 w-5" />
                  {studentFee.balance_due?.toLocaleString('en-IN')}
                </div>
                {studentFee.reminder_count > 0 && (
                  <div className="text-muted-foreground mt-1 text-xs">
                    {studentFee.reminder_count} reminder{studentFee.reminder_count > 1 ? 's' : ''}{' '}
                    sent
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-muted-foreground text-sm">Due Date</div>
            <div className="flex items-center gap-2 text-2xl font-bold">
              <Calendar className="text-muted-foreground h-5 w-5" />
              {studentFee.due_date
                ? new Date(studentFee.due_date).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })
                : '-'}
            </div>
            {studentFee.is_overdue && (
              <Badge variant="destructive" className="mt-1">
                Overdue
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pending Parent Component Change Requests */}
      {pendingComponents.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-amber-800">
              <Clock className="h-5 w-5" />
              Pending Parent Requests ({pendingComponents.length})
            </CardTitle>
            <p className="text-sm text-amber-700">
              The parent has requested changes to the following components. Review and approve or
              reject each request.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingComponents.map((component: StudentFeeComponentItem) => (
              <div
                key={component.public_id}
                className="space-y-3 rounded-lg border border-amber-200 bg-white p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="font-medium">{component.name}</div>
                    <div className="text-muted-foreground mt-0.5 text-sm">
                      Requested:{' '}
                      <span className="font-medium">
                        {component.is_selected ? 'Add (opt-in)' : 'Remove (opt-out)'}
                      </span>{' '}
                      · ₹{component.amount?.toLocaleString('en-IN')}
                    </div>
                    {component.request_note && (
                      <div className="text-muted-foreground mt-1 text-sm">
                        <span className="font-medium">Parent note:</span> {component.request_note}
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 border-green-300 text-green-700 hover:bg-green-50"
                      disabled={reviewRequests.isPending}
                      onClick={() => handleApprove(component.public_id)}
                    >
                      <CheckCircle className="h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 border-red-300 text-red-700 hover:bg-red-50"
                      disabled={reviewRequests.isPending}
                      onClick={() => handleReject(component.public_id)}
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </div>
                {/* Optional reject note */}
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">
                    Rejection reason (optional)
                  </Label>
                  <Input
                    className="h-8 text-sm"
                    placeholder="Reason if rejecting…"
                    value={rejectNotes[component.public_id] ?? ''}
                    onChange={(e) =>
                      setRejectNotes((prev) => ({
                        ...prev,
                        [component.public_id]: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Fee Components */}
      {studentFee.components && studentFee.components.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Fee Components</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {studentFee.components.map((component: StudentFeeComponentItem, idx: number) => (
                <div
                  key={component.public_id || idx}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <div className="font-medium">{component.name}</div>
                    <div className="text-muted-foreground text-sm">
                      {component.component_type === 'mandatory' ? 'Mandatory' : 'Optional'}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 text-right">
                    <div className="font-semibold">
                      ₹{component.amount?.toLocaleString('en-IN')}
                    </div>
                    <Badge
                      variant={component.is_selected ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {component.is_selected ? 'Selected' : 'Not Selected'}
                    </Badge>
                    {component.approval_status === 'pending' && (
                      <Badge variant="outline" className="border-amber-400 text-xs text-amber-700">
                        Pending Review
                      </Badge>
                    )}
                    {component.approval_status === 'rejected' && (
                      <Badge variant="outline" className="border-red-400 text-xs text-red-700">
                        Rejected
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Discount & Referral — standalone collapsible card, only shown when discount exists */}
      {studentFee.discount_percentage > 0 && <DiscountCard studentFee={studentFee} />}

      {/* Payment Transactions — lazy-loaded collapsible */}
      <StudentFeePaymentHistory
        studentFeePublicId={studentFee.public_id}
        paymentCount={studentFee.payment_count}
      />

      {/* Mark as Refunded confirmation dialog */}
      <AlertDialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Refund Issued</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you have issued the refund of{' '}
              <span className="font-semibold">
                ₹{studentFee.amount_paid?.toLocaleString('en-IN')}
              </span>{' '}
              to <span className="font-semibold">{studentFee.student_name}</span>?
              <br />
              <br />
              This will mark the fee as <span className="font-semibold">Refunded</span> and cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-orange-600 hover:bg-orange-700"
              onClick={() => {
                markRefunded.mutate(id!);
                setShowRefundDialog(false);
              }}
            >
              Yes, Mark as Refunded
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Initiate Refund confirmation dialog (overpayment) */}
      <AlertDialog open={showInitiateRefundDialog} onOpenChange={setShowInitiateRefundDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Initiate Refund</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-semibold">{studentFee.student_name}</span> has overpaid by{' '}
              <span className="font-semibold text-red-600">
                ₹{Math.abs(studentFee.balance_due).toLocaleString('en-IN')}
              </span>{' '}
              (Paid ₹{studentFee.amount_paid?.toLocaleString('en-IN')} vs Total ₹
              {studentFee.final_amount?.toLocaleString('en-IN')}).
              <br />
              <br />
              This will mark the fee as <span className="font-semibold">Refunding</span>. Once you
              have processed the refund, mark it as Refunded.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                initiateRefund.mutate(id!);
                setShowInitiateRefundDialog(false);
              }}
            >
              Yes, Initiate Refund
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
