/**
 * Payment Form Component
 * Form for recording fee payments
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SearchableSelect } from '@/components/ui/searchable-select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { FeeAmount } from '../../components/fee-amount';
import {
  type StudentFee,
  type PaymentCreatePayload,
  PaymentMode,
  PAYMENT_MODE_OPTIONS,
  FEE_UI_TEXT,
} from '@educard/shared';

// Form validation schema
const paymentFormSchema = z.object({
  amount: z.coerce.number().min(1, 'Amount must be greater than 0'),
  payment_mode: z.nativeEnum(PaymentMode),
  transaction_id: z.string().optional(),
  payment_date: z.string().min(1, 'Payment date is required'),
  remarks: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

interface PaymentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentFee: StudentFee | null;
  onSubmit: (studentFeeId: string, data: PaymentCreatePayload) => void;
  isLoading?: boolean;
}

export function PaymentFormDialog({
  open,
  onOpenChange,
  studentFee,
  onSubmit,
  isLoading,
}: PaymentFormDialogProps) {
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      amount: studentFee?.balance_due ?? 0,
      payment_mode: PaymentMode.CASH,
      transaction_id: '',
      payment_date: new Date().toISOString().split('T')[0],
      remarks: '',
    },
  });

  // Reset form when dialog opens with new student fee
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && studentFee) {
      form.reset({
        amount: studentFee.balance_due,
        payment_mode: PaymentMode.CASH,
        transaction_id: '',
        payment_date: new Date().toISOString().split('T')[0],
        remarks: '',
      });
    }
    onOpenChange(isOpen);
  };

  const handleSubmit = (values: PaymentFormValues) => {
    if (!studentFee) {
      return;
    }

    const payload: PaymentCreatePayload = {
      student_fee_public_id: studentFee.public_id,
      amount: values.amount,
      payment_mode: values.payment_mode,
      transaction_id: values.transaction_id || undefined,
      payment_date: values.payment_date,
      remarks: values.remarks || undefined,
    };

    onSubmit(studentFee.public_id, payload);
  };

  const watchPaymentMode = form.watch('payment_mode');
  const requiresTransactionId = watchPaymentMode !== PaymentMode.CASH;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[calc(100vw-1.5rem)] sm:w-full sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{FEE_UI_TEXT.FORM.RECORD_PAYMENT}</DialogTitle>
          <DialogDescription>
            {studentFee && (
              <span>
                Recording payment for <span className="font-medium">{studentFee.student_name}</span>
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {studentFee && (
          <div className="grid grid-cols-3 gap-4 border-b py-4">
            <div>
              <p className="text-muted-foreground text-sm">Total Amount</p>
              <FeeAmount amount={studentFee.final_amount} size="sm" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Amount Paid</p>
              <FeeAmount amount={studentFee.amount_paid} size="sm" colorCode={true} />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Balance</p>
              <FeeAmount amount={studentFee.balance_due} size="sm" colorCode={true} />
            </div>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Amount */}
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{FEE_UI_TEXT.LABELS.AMOUNT}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={studentFee?.balance_due}
                        step={0.01}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Max: ₹{studentFee?.balance_due?.toLocaleString('en-IN')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Payment Date */}
              <FormField
                control={form.control}
                name="payment_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{FEE_UI_TEXT.LABELS.PAYMENT_DATE}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Payment Mode */}
              <FormField
                control={form.control}
                name="payment_mode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{FEE_UI_TEXT.LABELS.PAYMENT_MODE}</FormLabel>
                    <FormControl>
                      <SearchableSelect
                        options={PAYMENT_MODE_OPTIONS.map((option) => ({
                          value: option.value,
                          label: option.label,
                        }))}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Select payment mode"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Transaction ID */}
              <FormField
                control={form.control}
                name="transaction_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {FEE_UI_TEXT.LABELS.TRANSACTION_ID}
                      {requiresTransactionId && <span className="text-destructive ml-1">*</span>}
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., TXN123456789" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Remarks */}
            <FormField
              control={form.control}
              name="remarks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{FEE_UI_TEXT.LABELS.REMARKS}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional remarks about this payment"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {FEE_UI_TEXT.BUTTONS.CANCEL}
              </Button>
              <Button type="submit" variant="brand" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {FEE_UI_TEXT.BUTTONS.RECORD_PAYMENT}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
