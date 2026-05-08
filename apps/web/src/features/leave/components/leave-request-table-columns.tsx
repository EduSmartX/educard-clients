/**
 * Leave Request Table Columns
 * Using common columns pattern like all other list pages
 */
import { X, Eye, Paperclip } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Column } from '@/components/ui/data-table';
import { formatDate } from '@/lib/utils/date-utils';
import { LEAVE_STATUS_CONFIG, type LeaveRequest } from '../types';

interface ColumnActions {
  onView?: (request: LeaveRequest) => void;
  onCancel?: (request: LeaveRequest) => void;
}

export function getLeaveRequestColumns(actions: ColumnActions): Column<LeaveRequest>[] {
  return [
    {
      header: 'Leave Type',
      accessor: (row) => (
        <div className="flex items-center gap-1.5">
          <div>
            <div className="font-medium text-gray-900">{row.leave_name}</div>
            <div className="text-muted-foreground text-xs">{row.leave_type_code}</div>
          </div>
          {row.attachment_url && (
            <span title="Has attachment">
              <Paperclip className="h-3.5 w-3.5 shrink-0 text-blue-500" />
            </span>
          )}
        </div>
      ),
      sortable: true,
      sortKey: 'leave_name',
    },
    {
      header: 'Start / End Date',
      accessor: (row) => (
        <div>
          <div className="text-sm text-gray-900">{formatDate(row.start_date)}</div>
          <div className="text-muted-foreground text-xs">to {formatDate(row.end_date)}</div>
        </div>
      ),
      sortable: true,
      sortKey: 'start_date',
    },
    {
      header: 'Days',
      accessor: (row) => (
        <div className="text-center">
          <span className="font-semibold text-gray-900">{row.number_of_days}</span>
        </div>
      ),
      sortable: true,
      sortKey: 'number_of_days',
      width: 80,
    },
    {
      header: 'Status',
      accessor: (row) => {
        const config = LEAVE_STATUS_CONFIG[row.status];
        return (
          <Badge variant="outline" className={config.className}>
            {config.label}
          </Badge>
        );
      },
      sortable: true,
      sortKey: 'status',
    },
    {
      header: 'Reviewed',
      accessor: (row) => (
        <div>
          <div className="text-sm text-gray-900">{row.reviewed_by_name?.trim() || '-'}</div>
          <div className="text-muted-foreground text-xs">
            {row.reviewed_at ? formatDate(row.reviewed_at) : '-'}
          </div>
        </div>
      ),
      sortable: true,
      sortKey: 'reviewed_at',
    },
    {
      header: 'Comments',
      accessor: (row) => (
        <div
          className="max-w-[220px] truncate text-sm text-gray-900"
          title={row.review_comments || '-'}
        >
          {row.review_comments?.trim() || '-'}
        </div>
      ),
      sortable: false,
    },
    {
      header: 'Created',
      accessor: (row) => (
        <div>
          <div className="text-sm text-gray-900">{row.created_by_name || 'System'}</div>
          <div className="text-muted-foreground text-xs">{formatDate(row.created_at)}</div>
        </div>
      ),
      sortable: true,
      sortKey: 'created_at',
    },
    {
      header: 'Updated',
      accessor: (row) => (
        <div>
          <div className="text-sm text-gray-900">{row.updated_by_name || 'System'}</div>
          <div className="text-muted-foreground text-xs">{formatDate(row.updated_at)}</div>
        </div>
      ),
      sortable: true,
      sortKey: 'updated_at',
    },
    {
      header: 'Actions',
      accessor: (row) => (
        <div className="flex items-center gap-2">
          {actions.onView && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => actions.onView?.(row)}
              className="h-8 px-2 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
          {row.status === 'pending' && actions.onCancel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => actions.onCancel?.(row)}
              className="h-8 px-2 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
      width: 120,
    },
  ];
}
