/**
 * Cancel Leave Request Dialog
 */
import { useState } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ErrorMessages, FormPlaceholders, SuccessMessages, ToastTitles } from '@/constants';
import { formatDate } from '@/lib/utils/date-utils';
import { getErrorMessage } from '@/lib/utils/error-handler';
import { useCancelLeaveRequest } from '../hooks';
import type { LeaveRequest } from '../types';

interface CancelLeaveRequestDialogProps {
  request: LeaveRequest;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CancelLeaveRequestDialog({
  request,
  isOpen,
  onClose,
  onSuccess,
}: CancelLeaveRequestDialogProps) {
  const [cancellationReason, setCancellationReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const cancelMutation = useCancelLeaveRequest();

  const handleCancel = () => {
    setError(null);
    cancelMutation.mutate(
      {
        publicId: request.public_id,
        data: cancellationReason ? { cancellation_reason: cancellationReason } : undefined,
      },
      {
        onSuccess: () => {
          toast.success(SuccessMessages.LEAVE.REQUEST_CANCELLED);
          onSuccess();
        },
        onError: (err) => {
          const errorMessage = getErrorMessage(err, ErrorMessages.LEAVE.CANCEL_REQUEST_FAILED);
          setError(errorMessage);
          toast.error(ToastTitles.ERROR, {
            description: errorMessage,
          });
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <X className="h-5 w-5 text-red-600" />
            Cancel Leave Request
          </DialogTitle>
          <DialogDescription>Are you sure you want to cancel this leave request?</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2 text-sm bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between">
              <span className="text-gray-600">Leave Type:</span>
              <span className="font-medium text-gray-900">{request.leave_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Duration:</span>
              <span className="font-medium text-gray-900">
                {formatDate(request.start_date)} - {formatDate(request.end_date)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Days:</span>
              <span className="font-medium text-gray-900">{request.number_of_days}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cancellation-reason">Cancellation Reason (Optional)</Label>
            <Textarea
              id="cancellation-reason"
              placeholder={FormPlaceholders.PROVIDE_CANCELLATION_REASON}
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              rows={3}
              className="bg-white"
              disabled={cancelMutation.isPending}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="brandOutline" onClick={onClose} disabled={cancelMutation.isPending}>
            No, Keep It
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={cancelMutation.isPending}
            className="gap-2"
          >
            {cancelMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Yes, Cancel Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
