/**
 * useDeleteConfirm — Shared delete-with-confirmation pattern
 * Uses reusable ConfirmDialog + mutation so list screens don't rewrite delete UX.
 */

import { getErrorMessage } from '@educard/shared';
import { useCallback, useMemo, useState } from 'react';

import type { ConfirmDialogProps } from '@/components/common/ConfirmDialog';
import { showToast } from '@/utils/toast';

interface UseDeleteConfirmOptions<T = string> {
  /** e.g. "Teacher", "Student" */
  entityName: string;
  /** React-Query mutation object – must have `.mutateAsync(data)` */
  deleteMutation: {
    mutateAsync: (data: T) => Promise<unknown>;
  };
  /** Called after successful delete — use to refetch list */
  onSuccess?: () => void;
}

export function useDeleteConfirm<T = string>({
  entityName,
  deleteMutation,
  onSuccess,
}: UseDeleteConfirmOptions<T>) {
  const [target, setTarget] = useState<{ data: T; displayName: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDelete = useCallback((data: T, displayName: string) => {
    setTarget({ data, displayName });
  }, []);

  const handleCancel = useCallback(() => {
    if (!isDeleting) setTarget(null);
  }, [isDeleting]);

  const handleConfirm = useCallback(() => {
    if (!target || isDeleting) return;

    setIsDeleting(true);
    void (async () => {
      try {
        await deleteMutation.mutateAsync(target.data);
        onSuccess?.();
        setTarget(null);
      } catch (error) {
        const message = getErrorMessage(error, `Failed to delete ${entityName.toLowerCase()}`);
        showToast('error', message);
      } finally {
        setIsDeleting(false);
      }
    })();
  }, [deleteMutation, entityName, isDeleting, onSuccess, target]);

  const dialogProps: ConfirmDialogProps = useMemo(
    () => ({
      visible: !!target,
      title: `Delete ${entityName}`,
      message: target
        ? `Are you sure you want to delete ${target.displayName}?`
        : `Are you sure you want to delete this ${entityName.toLowerCase()}?`,
      confirmText: 'Delete',
      confirmVariant: 'danger',
      onConfirm: handleConfirm,
      onCancel: handleCancel,
      isLoading: isDeleting,
    }),
    [entityName, handleCancel, handleConfirm, isDeleting, target]
  );

  return {
    confirmDelete,
    dialogProps,
  };
}
