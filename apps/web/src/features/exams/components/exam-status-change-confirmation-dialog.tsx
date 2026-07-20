import { EXAM_STATUS_LABELS, type ExamStatus } from '@educard/shared';
import { WarningConfirmationDialog } from '@/components/common';

interface ExamStatusChangeConfirmationDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onConfirm: () => void;
  readonly isLoading?: boolean;
  readonly fromStatus: ExamStatus;
  readonly toStatus: ExamStatus;
  readonly examName?: string;
  readonly affectedCount?: number;
}

function getTransitionWarning(fromStatus: ExamStatus, toStatus: ExamStatus) {
  if (fromStatus === 'scheduled' && toStatus === 'draft') {
    return 'This moves the exam back to planning mode. Any published schedule communication may become outdated.';
  }

  if (fromStatus === 'completed' && toStatus === 'scheduled') {
    return 'This reopens a completed exam. Marks-entry flow may be impacted until exam completion is set again.';
  }

  return 'This is a backward status move. Please confirm this change is intentional.';
}

export function ExamStatusChangeConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
  fromStatus,
  toStatus,
  examName,
  affectedCount,
}: ExamStatusChangeConfirmationDialogProps) {
  const fromLabel = EXAM_STATUS_LABELS[fromStatus] || fromStatus;
  const toLabel = EXAM_STATUS_LABELS[toStatus] || toStatus;
  const isBulk = typeof affectedCount === 'number';

  const description = isBulk
    ? `You are about to update ${affectedCount} exam(s) from ${fromLabel} to ${toLabel}.`
    : `You are about to update "${examName || 'this exam'}" from ${fromLabel} to ${toLabel}.`;

  return (
    <WarningConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
      title="Confirm Status Regression"
      description={description}
      warningText={getTransitionWarning(fromStatus, toStatus)}
      isLoading={isLoading}
      confirmButtonText="Yes, update status"
      cancelButtonText="Cancel"
    />
  );
}
