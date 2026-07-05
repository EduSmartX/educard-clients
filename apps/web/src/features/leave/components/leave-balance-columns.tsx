import { Edit, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { type Column } from '@/components/ui/data-table';
import { type LeaveBalance } from '@/lib/api/leave-api';
import { getLeaveTypeName } from '../utils/leave-name-helper';

function formatDisplayName(name: string | null | undefined): string {
  if (!name || name.toLowerCase() === 'string string') {
    return 'System';
  }
  return name.trim();
}

export function getLeaveBalanceColumns(
  onEdit: (balance: LeaveBalance) => void,
  onDelete: (balance: LeaveBalance) => void
): Column<LeaveBalance>[] {
  return [
    {
      header: 'Leave Type',
      accessor: (row: LeaveBalance) => (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-medium">
            {getLeaveTypeName(row)}
          </Badge>
        </div>
      ),
    },
    {
      header: 'Allocated',
      accessor: (row: LeaveBalance) => (
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">
            {Number.parseFloat(row.total_allocated).toFixed(1)}
          </div>
          <div className="text-muted-foreground text-xs">days</div>
        </div>
      ),
      width: 120,
    },
    {
      header: 'Used',
      accessor: (row: LeaveBalance) => (
        <div className="text-center">
          <div className="text-lg font-semibold text-red-600">{Number(row.used).toFixed(1)}</div>
          <div className="text-muted-foreground text-xs">days</div>
        </div>
      ),
      width: 120,
    },
    {
      header: 'Carried Forward',
      accessor: (row: LeaveBalance) => (
        <div className="text-center">
          <div className="text-lg font-semibold text-green-600">
            {Number.parseFloat(row.carried_forward).toFixed(1)}
          </div>
          <div className="text-muted-foreground text-xs">days</div>
        </div>
      ),
      width: 140,
    },
    {
      header: 'Available',
      accessor: (row: LeaveBalance) => (
        <div className="text-center">
          <div className="text-lg font-bold text-blue-600">{Number(row.available).toFixed(1)}</div>
          <div className="text-muted-foreground text-xs">days</div>
        </div>
      ),
      width: 120,
    },
    {
      header: 'Created',
      accessor: (row: LeaveBalance) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">{formatDisplayName(row.created_by_name)}</div>
          <div className="text-muted-foreground text-xs">
            {new Date(row.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </div>
        </div>
      ),
      sortable: true,
      sortKey: 'created_at',
    },
    {
      header: 'Updated',
      accessor: (row: LeaveBalance) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">{formatDisplayName(row.updated_by_name)}</div>
          <div className="text-muted-foreground text-xs">
            {new Date(row.updated_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </div>
        </div>
      ),
      sortable: true,
      sortKey: 'updated_at',
    },
    {
      header: 'Actions',
      accessor: (row: LeaveBalance) => (
        <div className="flex items-center justify-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => onEdit(row)} className="h-8 w-8 p-0">
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(row)}
            className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
      width: 100,
    },
  ];
}
