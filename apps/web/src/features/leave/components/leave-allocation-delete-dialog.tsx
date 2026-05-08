/**
 * Leave Allocation Delete Dialog Component
 */

import { DeleteConfirmationDialog } from '@/components/common/delete-confirmation-dialog';
import type { LeaveAllocation } from '@/lib/api/leave-api';

interface LeaveAllocationDeleteDialogProps {
  open: boolean;
  allocation: LeaveAllocation | null;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function LeaveAllocationDeleteDialog({
  open,
  allocation,
  isPending,
  onOpenChange,
  onConfirm,
}: LeaveAllocationDeleteDialogProps) {
  return (
    <DeleteConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
      title="Delete Leave Allocation Policy"
      itemName={allocation?.name || allocation?.leave_type_name}
      isDeleting={isPending}
      deleteButtonText="Delete Policy"
    />
  );
}
