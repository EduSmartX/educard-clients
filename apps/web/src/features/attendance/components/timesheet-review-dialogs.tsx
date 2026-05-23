/**
 * Timesheet Review Dialogs
 * Approve confirmation and Reject with comments dialogs.
 */

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

import type { TimesheetSubmission } from '@/features/attendance/api/attendance-api';

interface TimesheetApproveDialogProps {
  target: TimesheetSubmission | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (publicId: string) => void;
  isPending: boolean;
}

export function TimesheetApproveDialog({
  target,
  onOpenChange,
  onConfirm,
  isPending,
}: TimesheetApproveDialogProps) {
  return (
    <AlertDialog open={!!target} onOpenChange={(open) => !open && onOpenChange(false)}>
      <AlertDialogContent className="bg-white">
        <AlertDialogHeader>
          <AlertDialogTitle>Approve Timesheet</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to approve the timesheet for{' '}
            <span className="font-semibold text-gray-900">{target?.employee_info.full_name}</span>{' '}
            for the week{' '}
            <span className="font-semibold text-gray-900">
              {target &&
                `${format(parseISO(target.week_start_date), 'MMM dd')} - ${format(parseISO(target.week_end_date), 'MMM dd, yyyy')}`}
            </span>
            ?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-green-600 text-white hover:bg-green-700"
            disabled={isPending}
            onClick={() => {
              if (target) {
                onConfirm(target.public_id);
              }
            }}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Approving…
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Approve
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface TimesheetRejectDialogProps {
  target: TimesheetSubmission | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (publicId: string, comments: string) => void;
  isPending: boolean;
}

export function TimesheetRejectDialog({
  target,
  onOpenChange,
  onConfirm,
  isPending,
}: TimesheetRejectDialogProps) {
  const [comments, setComments] = useState('');

  const handleClose = () => {
    setComments('');
    onOpenChange(false);
  };

  const handleReject = () => {
    if (!target) {
      return;
    }
    if (!comments.trim()) {
      toast.error('Comments are required when rejecting a timesheet.');
      return;
    }
    onConfirm(target.public_id, comments.trim());
    setComments('');
  };

  return (
    <Dialog open={!!target} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="bg-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reject Timesheet</DialogTitle>
          <DialogDescription>
            Rejecting timesheet for{' '}
            <span className="font-semibold text-gray-900">{target?.employee_info.full_name}</span>{' '}
            for the week{' '}
            <span className="font-semibold text-gray-900">
              {target &&
                `${format(parseISO(target.week_start_date), 'MMM dd')} - ${format(parseISO(target.week_end_date), 'MMM dd, yyyy')}`}
            </span>
            . Please provide a reason.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <label className="text-sm font-medium text-gray-700">
            Reason for rejection <span className="text-red-500">*</span>
          </label>
          <Textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Enter reason for rejection..."
            rows={3}
            className="resize-none"
          />
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" disabled={isPending} onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={isPending || !comments.trim()}
            onClick={handleReject}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Rejecting…
              </>
            ) : (
              <>
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
