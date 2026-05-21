/**
 * Parent Fee Dashboard Page
 * Shows parent view of their child's fees
 */

import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle2, Clock, CreditCard, FileText } from 'lucide-react';
import { PageHeader } from '@/components/common';
import { FeeStatusBadge } from '../../components/fee-status-badge';
import { FeeAmount, FeeProgress } from '../../components/fee-amount';
import { useParentStudentFees } from '../../hooks/use-fee-queries';
import { type StudentFee, FeeStatus, FEE_UI_TEXT } from '@educard/shared';

export function ParentFeeDashboardPage() {
  const { data: feesData, isLoading } = useParentStudentFees();

  const fees = feesData?.data ?? [];

  // Calculate totals
  const totalAmount = fees.reduce((sum, fee) => sum + fee.total_amount, 0);
  const totalPaid = fees.reduce((sum, fee) => sum + fee.amount_paid, 0);
  const totalBalance = fees.reduce((sum, fee) => sum + fee.balance, 0);
  const overdueFees = fees.filter((fee) => fee.status === FeeStatus.OVERPAID);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-muted h-8 w-48 animate-pulse rounded" />
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="bg-muted h-4 w-24 rounded" />
              </CardHeader>
              <CardContent>
                <div className="bg-muted h-8 w-32 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={FEE_UI_TEXT.PAGE_TITLES.MY_FEES}
        description="View your child's fee details and payment history"
      />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">Total Fees</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <FeeAmount amount={totalAmount} size="lg" />
            <p className="text-muted-foreground mt-1 text-xs">{fees.length} fee record(s)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">Amount Paid</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <FeeAmount amount={totalPaid} size="lg" variant="success" />
            <p className="text-muted-foreground mt-1 text-xs">
              {((totalPaid / totalAmount) * 100 || 0).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">Balance Due</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <FeeAmount amount={totalBalance} size="lg" variant="danger" />
            {overdueFees.length > 0 && (
              <p className="mt-1 text-xs text-red-600">{overdueFees.length} overdue payment(s)</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Overdue Alert */}
      {overdueFees.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-4 p-4">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <div className="flex-1">
              <p className="font-medium text-red-800">
                You have {overdueFees.length} overdue payment(s)
              </p>
              <p className="text-sm text-red-600">
                Please make the payment at your earliest convenience to avoid late fees.
              </p>
            </div>
            <Button variant="destructive" size="sm" asChild>
              <Link to="/parent/fees/payments">Pay Now</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Fee List */}
      <Card>
        <CardHeader>
          <CardTitle>Fee Details</CardTitle>
        </CardHeader>
        <CardContent>
          {fees.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center">
              {FEE_UI_TEXT.EMPTY_STATES.NO_FEES}
            </div>
          ) : (
            <div className="space-y-4">
              {fees.map((fee) => (
                <FeeCard key={fee.id} fee={fee} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface FeeCardProps {
  fee: StudentFee;
}

function FeeCard({ fee }: FeeCardProps) {
  const isOverdue = fee.status === FeeStatus.OVERPAID;
  const isPaid = fee.status === FeeStatus.PAID;

  return (
    <div className={`rounded-lg border p-4 ${isOverdue ? 'border-red-200 bg-red-50' : ''}`}>
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="font-medium">{fee.fee_structure?.name}</h3>
          <p className="text-muted-foreground text-sm">
            {fee.fee_structure?.academic_year} • {fee.student_class?.name}
          </p>
        </div>
        <FeeStatusBadge status={fee.status} />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div>
          <p className="text-muted-foreground text-sm">Total Amount</p>
          <FeeAmount amount={fee.total_amount} size="sm" />
        </div>
        <div>
          <p className="text-muted-foreground text-sm">Amount Paid</p>
          <FeeAmount amount={fee.amount_paid} size="sm" variant="success" />
        </div>
        <div>
          <p className="text-muted-foreground text-sm">Balance</p>
          <FeeAmount
            amount={fee.balance}
            size="sm"
            variant={fee.balance > 0 ? 'danger' : 'default'}
          />
        </div>
        <div>
          <p className="text-muted-foreground text-sm">Due Date</p>
          <p className={`font-medium ${isOverdue ? 'text-red-600' : ''}`}>
            {fee.due_date
              ? new Date(fee.due_date).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })
              : '-'}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <FeeProgress
          amountPaid={fee.amount_paid}
          totalAmount={fee.total_amount}
          paidPercentage={fee.paid_percentage ?? 0}
        />
      </div>

      {/* Actions */}
      {!isPaid && (
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to={`/parent/fees/${fee.id}`}>View Details</Link>
          </Button>
          <Button size="sm" asChild>
            <Link to={`/parent/fees/${fee.id}/pay`}>
              <CreditCard className="mr-2 h-4 w-4" />
              Pay Now
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
