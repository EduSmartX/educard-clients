/**
 * Send Reminder Dialog Component
 * Dialog for sending fee reminders to parents
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
  type SendReminderPayload,
  type ReminderChannelType,
  ReminderChannel,
  REMINDER_CHANNEL_OPTIONS,
  FEE_UI_TEXT,
} from '@educard/shared';

// Form validation schema
const reminderFormSchema = z.object({
  channel: z.enum([ReminderChannel.SMS, ReminderChannel.WHATSAPP, ReminderChannel.EMAIL]),
  custom_message: z.string().optional(),
});

type ReminderFormValues = z.infer<typeof reminderFormSchema>;

interface SendReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentFee: StudentFee | null;
  onSubmit: (studentFeeId: string, data: SendReminderPayload) => void;
  isLoading?: boolean;
}

export function SendReminderDialog({
  open,
  onOpenChange,
  studentFee,
  onSubmit,
  isLoading,
}: SendReminderDialogProps) {
  const form = useForm<ReminderFormValues>({
    resolver: zodResolver(reminderFormSchema),
    defaultValues: {
      channel: ReminderChannel.EMAIL,
      custom_message: '',
    },
  });

  const handleSubmit = (values: ReminderFormValues) => {
    if (!studentFee) {
      return;
    }

    const payload: SendReminderPayload = {
      student_fee_public_id: studentFee.public_id,
      channel: values.channel as ReminderChannelType,
    };

    onSubmit(studentFee.public_id, payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{FEE_UI_TEXT.FORM.SEND_REMINDER}</DialogTitle>
          <DialogDescription>
            {studentFee && (
              <span>
                Send a fee reminder to the parent of{' '}
                <span className="font-medium">{studentFee.student_name}</span>
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {studentFee && (
          <div className="grid grid-cols-3 gap-4 border-b py-4">
            <div>
              <p className="text-muted-foreground text-sm">Fee Structure</p>
              <p className="font-medium">{studentFee.fee_structure_name}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Balance Due</p>
              <FeeAmount amount={studentFee.balance_due} size="sm" colorCode={true} />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Due Date</p>
              <p className="font-medium">
                {studentFee.due_date
                  ? new Date(studentFee.due_date).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })
                  : '-'}
              </p>
            </div>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Channel Selection */}
            <FormField
              control={form.control}
              name="channel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{FEE_UI_TEXT.LABELS.REMINDER_CHANNELS}</FormLabel>
                  <FormControl>
                    <SearchableSelect
                      options={REMINDER_CHANNEL_OPTIONS.map((option) => ({
                        value: option.value,
                        label: option.label,
                      }))}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select a channel"
                    />
                  </FormControl>
                  <FormDescription>Select how to send the reminder</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Custom Message */}
            <FormField
              control={form.control}
              name="custom_message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{FEE_UI_TEXT.LABELS.CUSTOM_MESSAGE}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add a custom message to include with the reminder (optional)"
                      className="min-h-[100px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    This message will be added to the standard fee reminder
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {FEE_UI_TEXT.BUTTONS.CANCEL}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {FEE_UI_TEXT.BUTTONS.SEND_REMINDER}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
