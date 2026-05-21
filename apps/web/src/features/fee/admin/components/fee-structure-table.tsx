/**
 * Fee Structure Table Component
 * Displays list of fee structures with actions using reusable DataTable
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DeleteConfirmationDialog, WarningConfirmationDialog } from '@/components/common';
import { FeeAmount } from '../../components/fee-amount';
import { useDeleteFeeStructure } from '../../hooks/use-fee-mutations';
import type { FeeStructureListItem } from '@educard/shared';
import { format } from 'date-fns';
import { Eye, Pencil, Trash2, Users } from 'lucide-react';
import { ROUTES } from '@/constants/app-config';

interface FeeStructureTableProps {
  data: FeeStructureListItem[];
  isLoading?: boolean;
}

export function FeeStructureTable({ data, isLoading }: FeeStructureTableProps) {
  const navigate = useNavigate();
  const [editConfirmId, setEditConfirmId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FeeStructureListItem | null>(null);
  const deleteFeeStructure = useDeleteFeeStructure();

  const handleEditConfirm = () => {
    if (editConfirmId) {
      navigate(`${ROUTES.FEES.STRUCTURES}/${editConfirmId}/edit`);
      setEditConfirmId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) {
      return;
    }
    await deleteFeeStructure.mutateAsync(deleteTarget.public_id);
    setDeleteTarget(null);
  };

  const columns: Column<FeeStructureListItem>[] = [
    {
      header: 'Name',
      accessor: (row) => <span className="font-medium">{row.name}</span>,
      sortable: true,
      sortKey: 'name',
      width: 200,
    },
    {
      header: 'Academic Year',
      accessor: 'academic_year',
      sortable: true,
      width: 120,
    },
    {
      header: 'Classes',
      accessor: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.class_names.slice(0, 2).map((className, idx) => (
            <Badge key={idx} variant="secondary" className="text-xs">
              {className}
            </Badge>
          ))}
          {row.class_names.length > 2 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="hover:bg-muted cursor-pointer text-xs">
                    +{row.class_names.length - 2} more
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <div className="space-y-1">
                    {row.class_names.slice(2).map((cls, idx) => (
                      <div key={idx} className="text-xs">
                        {cls}
                      </div>
                    ))}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      ),
      width: 180,
    },
    {
      header: 'Total Amount',
      accessor: (row) => <FeeAmount amount={row.total_amount} />,
      sortable: true,
      sortKey: 'total_amount',
      className: 'text-right',
      headerClassName: 'text-right',
      width: 130,
    },
    {
      header: 'Due Date',
      accessor: (row) => format(new Date(row.due_date), 'dd MMM yyyy'),
      sortable: true,
      sortKey: 'due_date',
      width: 120,
    },
    {
      header: 'Students',
      accessor: (row) => (
        <div className="flex items-center justify-center gap-1">
          <Users className="text-muted-foreground h-4 w-4" />
          <span>{row.student_count}</span>
        </div>
      ),
      sortable: true,
      sortKey: 'student_count',
      className: 'text-center',
      headerClassName: 'text-center',
      width: 100,
    },
    {
      header: 'Status',
      accessor: (row) => (
        <Badge variant={row.is_active ? 'default' : 'secondary'}>
          {row.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
      className: 'text-center',
      headerClassName: 'text-center',
      width: 100,
    },
    {
      header: 'Actions',
      accessor: (row) => (
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                  onClick={() => navigate(`${ROUTES.FEES.STRUCTURES}/${row.public_id}`)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>View Details</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                  onClick={() => setEditConfirmId(row.public_id)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => setDeleteTarget(row)}
                  disabled={deleteFeeStructure.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete Fee Structure</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      ),
      width: 130,
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        emptyMessage="No fee structures found"
        emptyAction={{
          label: 'Create your first fee structure',
          onClick: () => navigate(ROUTES.FEES.STRUCTURES_NEW),
        }}
        getRowKey={(row) => row.public_id}
        maxHeight="600px"
        minWidth="1000px"
      />

      {/* Edit Confirmation Dialog */}
      <WarningConfirmationDialog
        open={!!editConfirmId}
        onOpenChange={(open) => !open && setEditConfirmId(null)}
        onConfirm={handleEditConfirm}
        title="Edit Fee Structure"
        confirmButtonText="Continue to Edit"
        cancelButtonText="Cancel"
        description={
          <div className="space-y-3">
            <span className="text-foreground block font-medium">
              Editing this fee structure may impact student fees. Here's what can happen:
            </span>
            <div className="space-y-1.5 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm">
              <p>
                📋 <strong>Changing components or amount</strong> → All student fees will be
                recalculated. Paid amounts stay intact, only balance due changes.
              </p>
              <p>
                ➕ <strong>Adding new classes</strong> → Fee will be automatically assigned to all
                students in those classes.
              </p>
              <p>
                ➖ <strong>Removing classes</strong> → Unpaid records will be deleted. Paid records
                will be marked "Cancelled" for refund review.
              </p>
            </div>
            <span className="block text-sm font-medium text-amber-700">
              You'll see a detailed impact summary before final confirmation.
            </span>
          </div>
        }
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Fee Structure"
        itemName={deleteTarget?.name}
        description={`You are deleting ${deleteTarget?.name ?? 'this fee structure'}. ${deleteTarget?.student_count ?? 0} student fee records are going to be deleted for this fee structure. This action cannot be undone.`}
        isDeleting={deleteFeeStructure.isPending}
        deleteButtonText="Delete Fee Structure"
        cancelButtonText="Cancel"
      />
    </>
  );
}
