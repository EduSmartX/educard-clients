/**
 * StudentFeePaymentHistory
 * Collapsible card that lazy-loads payment transactions for a student fee.
 * Only fetches from the API when the user expands the section.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { usePayments } from '../../hooks/use-fee-queries';
import {
  ChevronDown,
  ChevronUp,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Receipt,
} from 'lucide-react';
import type { FeePayment } from '@educard/shared';
import { cn } from '@/lib/utils';

interface StudentFeePaymentHistoryProps {
  studentFeePublicId: string;
  paymentCount?: number;
}

export function StudentFeePaymentHistory({
  studentFeePublicId,
  paymentCount,
}: StudentFeePaymentHistoryProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Only enabled once user opens the section — no API call until then
  const { data, isLoading } = usePayments(
    { student_fee_public_id: studentFeePublicId, page_size: 100 },
    isOpen
  );

  const payments: FeePayment[] = (data?.data ?? []) as FeePayment[];

  let countLabel: number | null = null;
  if (paymentCount !== undefined) {
    countLabel = paymentCount;
  } else if (isOpen && !isLoading) {
    countLabel = payments.length;
  }

  return (
    <Card>
      {/* Toggle header — always visible */}
      <CardHeader className="p-0">
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          className="hover:bg-muted/50 flex w-full items-center justify-between rounded-t-lg px-6 py-4 text-left transition-colors"
        >
          <div className="flex items-center gap-2">
            <Receipt className="text-muted-foreground h-5 w-5" />
            <span className="text-base font-semibold">Payment Transactions</span>
            {countLabel !== null && (
              <span className="text-muted-foreground text-sm font-medium">({countLabel})</span>
            )}
          </div>
          {isOpen ? (
            <ChevronUp className="text-muted-foreground h-5 w-5" />
          ) : (
            <ChevronDown className="text-muted-foreground h-5 w-5" />
          )}
        </button>
      </CardHeader>

      {/* Collapsible body */}
      {isOpen && (
        <CardContent className="px-6 pt-0 pb-4">
          <div className="border-t pt-4">
            {isLoading && (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            )}
            {!isLoading && payments.length === 0 && (
              <div className="text-muted-foreground flex flex-col items-center gap-2 py-8">
                <CreditCard className="h-8 w-8 opacity-40" />
                <p className="text-sm">No payment transactions yet</p>
              </div>
            )}
            {!isLoading && payments.length > 0 && (
              <div className="space-y-2">
                {payments.map((payment) => {
                  const isCredit = payment.transaction_type === 'credit';
                  return (
                    <div
                      key={payment.public_id}
                      className={cn(
                        'flex items-center justify-between gap-4 rounded-lg border p-3',
                        isCredit ? 'border-green-100 bg-green-50/50' : 'border-red-100 bg-red-50/50'
                      )}
                    >
                      {/* Left: icon + date + mode */}
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className={cn(
                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                            isCredit ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          )}
                        >
                          {isCredit ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : (
                            <TrendingDown className="h-4 w-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium">
                              {new Date(payment.payment_date).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                            <Badge variant="outline" className="h-5 px-1.5 py-0 text-xs">
                              {payment.payment_mode_display}
                            </Badge>
                          </div>
                          <div className="text-muted-foreground truncate text-xs">
                            {!!payment.receipt_number && (
                              <span>Receipt: {payment.receipt_number}</span>
                            )}
                            {!!payment.utr_number && (
                              <span className={payment.receipt_number ? '·' : ''}>
                                UTR: {payment.utr_number}
                              </span>
                            )}
                            {!!payment.received_by_name && (
                              <span> · By: {payment.received_by_name}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: amount */}
                      <div
                        className={cn(
                          'shrink-0 text-base font-bold',
                          isCredit ? 'text-green-700' : 'text-red-700'
                        )}
                      >
                        {isCredit ? '+' : '−'}₹{payment.amount?.toLocaleString('en-IN')}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
