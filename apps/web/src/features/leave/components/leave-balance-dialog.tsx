/**
 * Leave Balance Dialog
 * Reusable dialog for creating/editing leave balances
 * Used by admin/managers to allocate leave to users
 */
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { CommonUiText, ErrorMessages, FormPlaceholders, SuccessMessages } from '@/constants';
import type { LeaveBalance } from '@/lib/api/leave-api';
import { getErrorMessage } from '@/lib/utils/error-handler';
import { useCreateLeaveBalance, useUpdateLeaveBalance } from '../hooks';

interface LeaveAllocationOption {
  public_id: string;
  leave_type_name: string;
  leave_type_code: string;
  display_name: string;
  total_days: number;
  max_carry_forward_days?: number;
}

interface LeaveBalanceDialogProps {
  open: boolean;
  mode: 'add' | 'edit';
  data?: LeaveBalance;
  availableAllocations: LeaveAllocationOption[];
  userPublicId?: string;
  onClose: (success?: boolean) => void;
}

export function LeaveBalanceDialog({
  open,
  mode,
  data,
  availableAllocations,
  userPublicId,
  onClose,
}: LeaveBalanceDialogProps) {
  const [allocationId, setAllocationId] = useState('');
  const [totalAllocated, setTotalAllocated] = useState(0);
  const [carryForward, setCarryForward] = useState(0);

  // Get selected allocation details
  const selectedAllocation = availableAllocations.find((a) => a.public_id === allocationId);

  // Reset form when dialog opens/closes or data changes
  useEffect(() => {
    if (open) {
      setAllocationId(data?.leave_allocation?.public_id || '');
      setTotalAllocated(data?.total_allocated ? parseFloat(data.total_allocated) : 0);
      setCarryForward(data?.carried_forward ? parseFloat(data.carried_forward) : 0);
    } else {
      // Reset form when dialog closes
      setAllocationId('');
      setTotalAllocated(0);
      setCarryForward(0);
    }
  }, [open, data]);

  // Auto-fill total allocated and carry forward when allocation is selected
  useEffect(() => {
    if (selectedAllocation && mode === 'add') {
      setTotalAllocated(selectedAllocation.total_days);
      setCarryForward(selectedAllocation.max_carry_forward_days || 0);
    }
  }, [selectedAllocation, mode]);

  const createBalanceMutation = useCreateLeaveBalance();
  const updateBalanceMutation = useUpdateLeaveBalance();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!userPublicId) {
      toast.error(ErrorMessages.LEAVE.USER_NOT_SELECTED);
      return;
    }

    if (mode === 'add') {
      createBalanceMutation.mutate(
        {
          leave_allocation: allocationId,
          total_allocated: totalAllocated,
          user: userPublicId,
        },
        {
          onSuccess: () => {
            toast.success(SuccessMessages.LEAVE.BALANCE_ADDED);
            onClose(true);
          },
          onError: (error: Error) => {
            toast.error(ErrorMessages.LEAVE.ADD_BALANCE_FAILED, {
              description: getErrorMessage(error),
            });
          },
        }
      );
    } else if (mode === 'edit' && data) {
      updateBalanceMutation.mutate(
        {
          public_id: data.public_id,
          total_allocated: totalAllocated,
          carried_forward: carryForward,
        },
        {
          onSuccess: () => {
            toast.success(SuccessMessages.LEAVE.BALANCE_UPDATED);
            onClose(true);
          },
          onError: (error: Error) => {
            toast.error(ErrorMessages.LEAVE.UPDATE_BALANCE_FAILED, {
              description: getErrorMessage(error),
            });
          },
        }
      );
    }
  };

  const allocationOptions = availableAllocations.map((allocation) => ({
    value: allocation.public_id,
    label: allocation.display_name,
    description: `${allocation.total_days} days allocated | ${allocation.max_carry_forward_days || 0} days carry forward`,
  }));

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="bg-white sm:max-w-[550px]">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl font-bold text-gray-900">
            {mode === 'add' ? 'Add Leave Balance' : 'Edit Leave Balance'}
          </DialogTitle>
          <DialogDescription className="text-base text-gray-600">
            {mode === 'add'
              ? 'Allocate leave balance to a user based on a leave policy.'
              : 'Modify the allocated leave balance for this user.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-3">
            <Label htmlFor="allocation" className="text-sm font-semibold text-gray-900">
              Leave Allocation Policy <span className="text-red-500">*</span>
            </Label>
            <Combobox
              options={allocationOptions}
              value={allocationId}
              onValueChange={setAllocationId}
              placeholder={FormPlaceholders.SELECT_LEAVE_ALLOCATION_POLICY}
              emptyText="No allocation policies available"
              disabled={mode === 'edit'} // Can't change allocation once created
            />
            {mode === 'edit' && (
              <p className="rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-600">
                ⚠️ Leave allocation cannot be changed after creation
              </p>
            )}
            {mode === 'add' && availableAllocations.length === 0 && (
              <p className="rounded border border-red-200 bg-red-50 p-2 text-xs text-red-600">
                ⚠️ No available leave allocation policies. All policies have been assigned.
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Label htmlFor="totalAllocated" className="text-sm font-semibold text-gray-900">
              Total Days Allocated <span className="text-red-500">*</span>
            </Label>
            <Input
              id="totalAllocated"
              type="number"
              value={totalAllocated}
              onChange={(e) => setTotalAllocated(Number(e.target.value))}
              min={0}
              step={0.5}
              required
              placeholder={FormPlaceholders.ENTER_ALLOCATED_DAYS}
              className="h-11 text-base"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="carryForward" className="text-sm font-semibold text-gray-900">
              Maximum Carry Forward Days
            </Label>
            <Input
              id="carryForward"
              type="number"
              value={carryForward}
              onChange={(e) => setCarryForward(Number(e.target.value))}
              min={0}
              step={0.5}
              placeholder={FormPlaceholders.ENTER_CARRY_FORWARD_DAYS}
              className="h-11 text-base"
            />
          </div>

          <DialogFooter className="gap-3 pt-4">
            <Button
              type="button"
              variant="brandOutline"
              onClick={() => onClose()}
              disabled={createBalanceMutation.isPending || updateBalanceMutation.isPending}
              className="min-w-[100px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="brand"
              disabled={
                (mode === 'add' && createBalanceMutation.isPending) ||
                (mode === 'edit' && updateBalanceMutation.isPending) ||
                !allocationId ||
                totalAllocated <= 0
              }
              className="min-w-[120px]"
            >
              {createBalanceMutation.isPending || updateBalanceMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {CommonUiText.SAVING}
                </span>
              ) : mode === 'add' ? (
                '✓ Add Balance'
              ) : (
                '✓ Update Balance'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
