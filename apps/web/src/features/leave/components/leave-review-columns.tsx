/**
 * Column definitions for Leave Request Reviews table
 */
import { Check, X, Eye, Paperclip } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Column } from '@/components/ui/data-table';

export interface LeaveRequestReview {
  public_id: string;
  user_public_id: string;
  user_name: string;
  user_role: string;
  organization_role: string | { code: string; name: string };
  email: string;
  supervisor_name: string;
  supervisor_public_id: string;
  leave_balance_public_id: string;
  leave_type_code: string;
  leave_name: string;
  start_date: string;
  end_date: string;
  number_of_days: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  applied_at: string;
  attachment_url?: string | null;
  attachment_name?: string;
  reviewed_by_name: string | null;
  reviewed_at: string | null;
  review_comments: string;
  can_be_cancelled: boolean;
  created_at: string;
  updated_at: string;
}

const STATUS_CONFIG = {
  pending: { label: 'Pending', className: 'bg-yellow-500 text-white hover:bg-yellow-600' },
  approved: { label: 'Approved', className: 'bg-green-500 text-white hover:bg-green-600' },
  rejected: { label: 'Rejected', className: 'bg-red-500 text-white hover:bg-red-600' },
  cancelled: { label: 'Cancelled', className: 'bg-gray-500 text-white hover:bg-gray-600' },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

interface ColumnActions {
  onNavigate: (path: string) => void;
  onApprove: (row: LeaveRequestReview) => void;
  onReject: (row: LeaveRequestReview) => void;
  onViewDetails: (row: LeaveRequestReview) => void;
}

export function getLeaveReviewColumns(actions: Readonly<ColumnActions>): Column<LeaveRequestReview>[] {
  return [
    {
      header: 'Employee',
      accessor: (row) => (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                actions.onNavigate(`/leave/dashboard/${row.user_public_id}`);
              }}
              className="w-full text-left text-blue-600 hover:text-blue-700 focus:underline focus:outline-none"
              aria-label={`View ${row.user_name}'s leave dashboard`}
            >
              <div className="flex flex-col items-start gap-0.5">
                <div className="font-medium">{row.user_name}</div>
                <div className="text-muted-foreground text-xs">
                  {typeof row.organization_role === 'object' && row.organization_role
                    ? row.organization_role.name
                    : row.organization_role}
                </div>
              </div>
            </button>
          </TooltipTrigger>
          <TooltipContent>View {row.user_name}&apos;s leave dashboard</TooltipContent>
        </Tooltip>
      ),
    },
    {
      header: 'Leave Type',
      accessor: (row) => (
        <div className="flex items-center gap-1.5">
          <div>
            <div className="font-medium">{row.leave_name}</div>
            <div className="text-muted-foreground text-xs">{row.leave_type_code}</div>
          </div>
          {row.attachment_url && (
            <span title="Has attachment">
              <Paperclip className="h-3.5 w-3.5 shrink-0 text-blue-500" />
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Leave Duration',
      accessor: (row) => (
        <div className="text-sm">
          <div>
            {formatDate(row.start_date)} - {formatDate(row.end_date)}
          </div>
          <div className="text-muted-foreground text-xs">
            {row.number_of_days} day{Number(row.number_of_days) === 1 ? '' : 's'}
          </div>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (row) => {
        const config = STATUS_CONFIG[row.status];
        return <Badge className={config.className}>{config.label}</Badge>;
      },
    },
    {
      header: 'Reason',
      accessor: (row) => (
        <div className="max-w-xs truncate text-sm" title={row.reason}>
          {row.reason}
        </div>
      ),
    },
    {
      header: 'Actions',
      accessor: (row) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => actions.onApprove(row)}
            className="h-8 w-8 p-0 text-green-600 hover:bg-green-50 hover:text-green-700"
            disabled={row.status !== 'pending'}
            title="Approve"
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => actions.onReject(row)}
            className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
            disabled={row.status !== 'pending'}
            title="Reject"
          >
            <X className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => actions.onViewDetails(row)}
            className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ),
      width: 120,
    },
  ];
}
