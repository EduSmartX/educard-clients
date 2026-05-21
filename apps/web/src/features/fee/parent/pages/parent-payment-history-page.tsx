/**
 * Parent Payment History Page
 * Shows payment history for parent's child
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Receipt } from 'lucide-react';
import { PaymentModeBadge } from '../../components/payment-mode-badge';
import { FeeAmount } from '../../components/fee-amount';
import { useParentPaymentHistory } from '../../hooks/use-fee-queries';
import { type FeePayment, FEE_UI_TEXT } from '@educard/shared';
import { PageHeader } from '@/components/common';

export function ParentPaymentHistoryPage() {
  const { data: paymentsData, isLoading } = useParentPaymentHistory();

  const payments = paymentsData?.data ?? [];

  const handleDownloadReceipt = (_paymentId: string) => {
    // TODO: Implement receipt download
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-muted h-8 w-48 animate-pulse rounded" />
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="bg-muted h-24 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={FEE_UI_TEXT.PAGE_TITLES.PAYMENT_HISTORY}
        description="View your payment history and download receipts"
      />

      {/* Payment List */}
      <Card>
        <CardHeader>
          <CardTitle>All Payments ({payments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center">
              {FEE_UI_TEXT.EMPTY_STATES.NO_PAYMENTS}
            </div>
          ) : (
            <div className="space-y-4">
              {payments.map((payment) => (
                <PaymentCard
                  key={payment.id}
                  payment={payment}
                  onDownloadReceipt={handleDownloadReceipt}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface PaymentCardProps {
  payment: FeePayment;
  onDownloadReceipt: (paymentId: string) => void;
}

function PaymentCard({ payment, onDownloadReceipt }: PaymentCardProps) {
  return (
    <div className="hover:bg-muted/50 rounded-lg border p-4 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-green-100 p-2">
            <Receipt className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{payment.student_fee?.fee_structure?.name}</span>
              <PaymentModeBadge mode={payment.payment_mode} />
            </div>
            <p className="text-muted-foreground text-sm">
              {payment.payment_date
                ? new Date(payment.payment_date).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })
                : '-'}
            </p>
            {payment.receipt_number && (
              <p className="text-muted-foreground text-sm">Receipt: {payment.receipt_number}</p>
            )}
            {payment.transaction_id && (
              <p className="text-muted-foreground text-sm">Transaction: {payment.transaction_id}</p>
            )}
          </div>
        </div>
        <div className="text-right">
          <FeeAmount amount={payment.amount} size="lg" variant="success" />
          <Button
            variant="ghost"
            size="sm"
            className="mt-2"
            onClick={() => onDownloadReceipt(payment.id)}
          >
            <Download className="mr-2 h-4 w-4" />
            Receipt
          </Button>
        </div>
      </div>
      {payment.remarks && (
        <div className="mt-3 border-t pt-3">
          <p className="text-muted-foreground text-sm">
            <span className="font-medium">Remarks:</span> {payment.remarks}
          </p>
        </div>
      )}
    </div>
  );
}
