/**
 * Leave Request Review Dialog
 * Dialog for approving/rejecting leave requests with comments
 */
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Check, X, Loader2, FileText, Download } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { formatDate } from '@/lib/utils/date-utils';
import { getMediaUrl } from '@/lib/utils/media-utils';

interface LeaveRequestReview {
  public_id: string;
  user_name: string;
  organization_role: string | { code: string; name: string };
  email: string;
  leave_name: string;
  leave_type_code: string;
  start_date: string;
  end_date: string;
  number_of_days: string;
  reason: string;
  status: string;
  applied_at: string;
  attachment_url?: string | null;
  attachment_name?: string;
}

interface LeaveRequestReviewDialogProps {
  open: boolean;
  request: LeaveRequestReview | null;
  action: 'approve' | 'reject' | null;
  onClose: () => void;
  onSubmit: (comments: string) => void;
  isPending: boolean;
}

const reviewSchema = z.object({
  comments: z.string().min(1, 'Comments are required'),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

export function LeaveRequestReviewDialog({
  open,
  request,
  action,
  onClose,
  onSubmit,
  isPending,
}: LeaveRequestReviewDialogProps) {
  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      comments: '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({ comments: '' });
    }
  }, [open, form]);

  const handleSubmit = (data: ReviewFormData) => {
    onSubmit(data.comments);
  };

  if (!request) {
    return null;
  }

  const isViewMode = !action;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            {isViewMode
              ? 'Leave Request Details'
              : action === 'approve'
                ? 'Approve Leave Request'
                : 'Reject Leave Request'}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {isViewMode
              ? 'Review the leave request details below'
              : action === 'approve'
                ? 'Provide comments for approving this leave request'
                : 'Provide reason for rejecting this leave request'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Employee Info */}
          <div className="space-y-2 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-700">Employee</span>
              <span className="font-semibold text-blue-900">{request.user_name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-700">Role</span>
              <Badge variant="outline" className="border-blue-300 bg-white text-blue-700">
                {typeof request.organization_role === 'object' && request.organization_role
                  ? request.organization_role.name
                  : request.organization_role}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-700">Email</span>
              <span className="text-sm text-blue-900">{request.email}</span>
            </div>
          </div>

          {/* Leave Details */}
          <div className="space-y-2 rounded-lg border border-indigo-200 bg-indigo-50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-indigo-700">Leave Type</span>
              <span className="font-semibold text-indigo-900">
                {request.leave_name} ({request.leave_type_code})
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-indigo-700">Duration</span>
              <span className="font-semibold text-indigo-900">{request.number_of_days} days</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-indigo-700">Start Date</span>
              <span className="text-sm text-indigo-900">{formatDate(request.start_date)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-indigo-700">End Date</span>
              <span className="text-sm text-indigo-900">{formatDate(request.end_date)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-indigo-700">Applied On</span>
              <span className="text-sm text-indigo-900">{formatDate(request.applied_at)}</span>
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Reason for Leave</label>
            <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 text-sm leading-relaxed whitespace-pre-wrap text-purple-900">
              {request.reason}
            </div>
          </div>

          {/* Attachment */}
          {request.attachment_url && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Supporting Document</label>
              <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2">
                <FileText className="h-4 w-4 shrink-0 text-green-600" />
                <span className="flex-1 truncate text-sm text-green-800">
                  {request.attachment_name || 'Attached document'}
                </span>
                <a
                  href={getMediaUrl(request.attachment_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md bg-green-100 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-200"
                >
                  <Download className="h-3 w-3" />
                  View
                </a>
              </div>
            </div>
          )}

          {/* Comments Form - Only for approve/reject actions */}
          {!isViewMode && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="comments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-900">
                        {action === 'approve' ? 'Approval Comments *' : 'Rejection Reason *'}
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder={
                            action === 'approve'
                              ? 'Enter approval comments...'
                              : 'Enter reason for rejection...'
                          }
                          rows={4}
                          disabled={isPending}
                          className="border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="brandOutline" onClick={onClose} disabled={isPending}>
            {isViewMode ? 'Close' : 'Cancel'}
          </Button>
          {!isViewMode && (
            <Button
              type="button"
              variant={action === 'approve' ? 'brand' : 'destructive'}
              onClick={form.handleSubmit(handleSubmit)}
              disabled={isPending}
              className="shadow-md"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {action === 'approve' && <Check className="mr-2 h-4 w-4" />}
              {action === 'reject' && <X className="mr-2 h-4 w-4" />}
              {action === 'approve' ? 'Approve Request' : 'Reject Request'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
