/**
 * Record Payment Page
 * Dedicated full-page form for recording fee payments (Credit) or refunds (Debit).
 * Can be opened standalone (/fees/payments/new) or pre-loaded from a student fee
 * (/fees/students/:id/payment/new).
 */

import { useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ROUTES } from '@/constants/app-config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PageHeader } from '@/components/common';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { DatePicker } from '@/components/ui/date-picker';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, IndianRupee, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FeeStatusBadge } from '../../components/fee-status-badge';
import { FeeAmount } from '../../components/fee-amount';
import { useStudentFee, useStudentFees } from '../../hooks/use-fee-queries';
import { useCreatePayment } from '../../hooks/use-fee-mutations';
import {
  PaymentMode,
  PAYMENT_MODE_OPTIONS,
  TransactionType,
  TRANSACTION_TYPE_OPTIONS,
  type PaymentCreatePayload,
} from '@educard/shared';

// ─── Form Schema ─────────────────────────────────────────────────────────────

const paymentFormSchema = z.object({
  student_fee_public_id: z.string().min(1, 'Please select a student fee'),
  transaction_type: z.nativeEnum(TransactionType),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  payment_date: z.string().min(1, 'Payment date is required'),
  payment_mode: z.nativeEnum(PaymentMode),
  transaction_id: z.string().optional(),
  utr_number: z.string().optional(),
  remarks: z.string().optional(),
  bank_name: z.string().optional(),
  cheque_number: z.string().optional(),
  cheque_date: z.string().optional(),
  card_last_four: z.string().max(4).optional(),
  upi_id: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

// ─── Component ───────────────────────────────────────────────────────────────

export function RecordPaymentPage() {
  const { id } = useParams<{ id?: string }>(); // present on /students/:id/payment/new
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // If `id` param → pre-load that student fee. Otherwise show a selector.
  const preloadId = id ?? searchParams.get('student_fee') ?? undefined;

  const { data: preloadedFee, isLoading: feeLoading } = useStudentFee(preloadId);
  const { data: allFeesData } = useStudentFees(preloadId ? undefined : { page_size: 200 });

  const createPayment = useCreatePayment();

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      student_fee_public_id: preloadId ?? '',
      transaction_type: TransactionType.CREDIT,
      amount: 0,
      payment_date: new Date().toISOString().split('T')[0],
      payment_mode: PaymentMode.CASH,
      transaction_id: '',
      utr_number: '',
      remarks: '',
      bank_name: '',
      cheque_number: '',
      cheque_date: '',
      card_last_four: '',
      upi_id: '',
    },
  });

  // Pre-fill amount when student fee loads
  useEffect(() => {
    if (preloadedFee) {
      const txType = form.getValues('transaction_type');
      const defaultAmount =
        txType === TransactionType.DEBIT ? preloadedFee.amount_paid : preloadedFee.balance_due;
      form.setValue('student_fee_public_id', preloadedFee.public_id);
      form.setValue('amount', defaultAmount > 0 ? defaultAmount : 0);
    }
  }, [preloadedFee, form]);

  // When transaction type changes, update the suggested amount
  const watchedTxType = form.watch('transaction_type');
  const watchedStudentFeeId = form.watch('student_fee_public_id');
  const watchedMode = form.watch('payment_mode');

  // Resolve the currently-selected fee (either preloaded or chosen from selector)
  const selectedFee =
    preloadedFee ?? (allFeesData?.data ?? []).find((f) => f.public_id === watchedStudentFeeId);

  useEffect(() => {
    if (selectedFee) {
      const suggested =
        watchedTxType === TransactionType.DEBIT ? selectedFee.amount_paid : selectedFee.balance_due;
      form.setValue('amount', suggested > 0 ? suggested : 0);
    }
  }, [watchedTxType, selectedFee, form]);

  const isRefund = watchedTxType === TransactionType.DEBIT;
  const requiresTransactionRef =
    watchedMode !== PaymentMode.CASH && watchedMode !== PaymentMode.CHEQUE;
  const isCheque = watchedMode === PaymentMode.CHEQUE;
  const isUpi = watchedMode === PaymentMode.UPI;
  const isCard = watchedMode === PaymentMode.CARD;

  const maxAmount = selectedFee
    ? isRefund
      ? selectedFee.amount_paid
      : selectedFee.balance_due
    : undefined;

  const handleSubmit = (values: PaymentFormValues) => {
    const payload: PaymentCreatePayload = {
      student_fee_public_id: values.student_fee_public_id,
      amount: values.amount,
      transaction_type: values.transaction_type,
      payment_date: values.payment_date,
      payment_mode: values.payment_mode,
      transaction_id: values.transaction_id || undefined,
      utr_number: values.utr_number || undefined,
      remarks: values.remarks || undefined,
      bank_name: values.bank_name || undefined,
      cheque_number: values.cheque_number || undefined,
      cheque_date: values.cheque_date || undefined,
      card_last_four: values.card_last_four || undefined,
      upi_id: values.upi_id || undefined,
    };

    createPayment.mutate(payload, {
      onSuccess: () => {
        if (preloadId) {
          navigate(ROUTES.FEES.STUDENT_FEES_VIEW.replace(':id', preloadId));
        } else {
          navigate(ROUTES.FEES.PAYMENTS);
        }
      },
      onError: (error) => {
        // Apply field-level errors inline (e.g. amount exceeds balance_due)
        import('@/lib/utils/error-handler').then(({ applyFieldErrors }) => {
          applyFieldErrors(error, form.setError);
        });
      },
    });
  };

  const handleBack = () => {
    if (preloadId) {
      navigate(ROUTES.FEES.STUDENT_FEES_VIEW.replace(':id', preloadId));
    } else {
      navigate(ROUTES.FEES.PAYMENTS);
    }
  };

  if (preloadId && feeLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <PageHeader
        title={isRefund ? 'Issue Refund' : 'Record Payment'}
        description={
          selectedFee
            ? `${selectedFee.student_name} · ${selectedFee.class_name} · ${selectedFee.fee_structure_name}`
            : undefined
        }
        actions={[
          {
            label: 'Cancel',
            onClick: handleBack,
            variant: 'outline' as const,
          },
        ]}
      />

      {/* ── Fee Summary Card ── */}
      {selectedFee && (
        <Card className="border-l-primary border-l-4">
          <CardContent className="pt-4">
            <div className="flex flex-wrap items-center gap-6">
              <div>
                <p className="text-muted-foreground text-xs tracking-wide uppercase">Total</p>
                <FeeAmount amount={selectedFee.final_amount} size="lg" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs tracking-wide uppercase">Paid</p>
                <FeeAmount amount={selectedFee.amount_paid} size="lg" className="text-green-600" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs tracking-wide uppercase">Balance</p>
                <FeeAmount
                  amount={selectedFee.balance_due}
                  size="lg"
                  className={selectedFee.balance_due > 0 ? 'text-red-600' : 'text-green-600'}
                />
              </div>
              <div className="ml-auto">
                <FeeStatusBadge status={selectedFee.status} />
                {selectedFee.is_overdue && (
                  <Badge variant="destructive" className="ml-2">
                    Overdue
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Form ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            {isRefund ? (
              <>
                <TrendingDown className="h-5 w-5 text-red-500" />
                Refund Details
              </>
            ) : (
              <>
                <TrendingUp className="h-5 w-5 text-green-500" />
                Payment Details
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Student Fee Selector (only when not pre-loaded) */}
              {!preloadId && (
                <FormField
                  control={form.control}
                  name="student_fee_public_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student Fee</FormLabel>
                      <FormControl>
                        <SearchableSelect
                          options={(allFeesData?.data ?? []).map((f) => ({
                            value: f.public_id,
                            label: `${f.student_name} — ${f.class_name} — ${f.fee_structure_name}`,
                          }))}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Search for a student..."
                          searchPlaceholder="Type student name..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Transaction Type Toggle */}
              <FormField
                control={form.control}
                name="transaction_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transaction Type</FormLabel>
                    <FormControl>
                      <div className="flex gap-3">
                        {TRANSACTION_TYPE_OPTIONS.map((opt) => {
                          const isActive = field.value === opt.value;
                          const isDebit = opt.value === TransactionType.DEBIT;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => field.onChange(opt.value)}
                              className={cn(
                                'flex flex-1 items-center justify-center gap-2 rounded-lg border-2 py-3 text-sm font-medium transition-all',
                                isActive &&
                                  !isDebit &&
                                  'border-green-500 bg-green-50 text-green-700',
                                isActive && isDebit && 'border-red-500 bg-red-50 text-red-700',
                                !isActive &&
                                  'border-border text-muted-foreground hover:border-muted-foreground'
                              )}
                            >
                              {isDebit ? (
                                <TrendingDown className="h-4 w-4" />
                              ) : (
                                <TrendingUp className="h-4 w-4" />
                              )}
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Refund warning */}
              {isRefund && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    A debit will reduce the student's paid amount and increase the balance due. Max
                    refund:{' '}
                    <strong>₹{selectedFee?.amount_paid?.toLocaleString('en-IN') ?? '—'}</strong>
                  </span>
                </div>
              )}

              <Separator />

              {/* Amount + Date */}
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        <IndianRupee className="h-3.5 w-3.5" />
                        Amount
                      </FormLabel>
                      <FormControl>
                        <Input type="number" min={0.01} max={maxAmount} step={0.01} {...field} />
                      </FormControl>
                      {maxAmount !== undefined && (
                        <FormDescription>Max: ₹{maxAmount.toLocaleString('en-IN')}</FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="payment_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isRefund ? 'Refund Date' : 'Payment Date'}</FormLabel>
                      <FormControl>
                        <DatePicker
                          value={field.value ? new Date(field.value) : null}
                          onChange={(date) =>
                            field.onChange(date ? date.toISOString().split('T')[0] : '')
                          }
                          maxDate={new Date()}
                          placeholder={isRefund ? 'Select refund date' : 'Select payment date'}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Payment Mode */}
              <FormField
                control={form.control}
                name="payment_mode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Mode</FormLabel>
                    <FormControl>
                      <SearchableSelect
                        options={PAYMENT_MODE_OPTIONS}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Select mode"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Conditional fields by mode */}
              {(requiresTransactionRef || isUpi) && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="transaction_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Transaction ID</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. TXN123456789" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="utr_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>UTR Number</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. SBIN0001234567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {isUpi && (
                <FormField
                  control={form.control}
                  name="upi_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>UPI ID</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. name@upi" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {isCheque && (
                <div className="grid gap-4 sm:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="cheque_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Cheque Number <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="123456" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bank_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Bank Name <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. SBI" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cheque_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cheque Date</FormLabel>
                        <FormControl>
                          <DatePicker
                            value={field.value ? new Date(field.value) : null}
                            onChange={(date) =>
                              field.onChange(date ? date.toISOString().split('T')[0] : '')
                            }
                            placeholder="Select cheque date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {isCard && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="card_last_four"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Card Last 4 Digits</FormLabel>
                        <FormControl>
                          <Input maxLength={4} placeholder="1234" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Remarks */}
              <FormField
                control={form.control}
                name="remarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remarks</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={
                          isRefund ? 'Reason for refund...' : 'Optional notes about this payment...'
                        }
                        className="resize-none"
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={handleBack}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createPayment.isPending}
                  variant={isRefund ? 'destructive' : 'default'}
                  className={!isRefund ? 'bg-green-600 hover:bg-green-700' : ''}
                >
                  {createPayment.isPending
                    ? 'Saving...'
                    : isRefund
                      ? 'Issue Refund'
                      : 'Record Payment'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
