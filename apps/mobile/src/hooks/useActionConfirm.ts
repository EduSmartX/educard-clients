/**
 * useActionConfirm — Shared confirmation pattern for non-delete actions
 * Example: reactivate, submit, reset, etc.
 */

import { getErrorMessage } from '@educard/shared';
import { useCallback, useMemo, useState } from 'react';

import type { ConfirmDialogProps } from '@/components/common/ConfirmDialog';
import { showToast } from '@/utils/toast';

interface UseActionConfirmOptions<T = string> {
  title: string;
  confirmText?: string;
  confirmVariant?: ConfirmDialogProps['confirmVariant'];
  makeMessage: (displayName: string) => string;
  runAction: (data: T) => Promise<unknown>;
  successMessage?: (displayName: string) => string;
  errorMessage: string;
  onSuccess?: () => void;
}

export function useActionConfirm<T = string>({
  title,
  confirmText = 'Confirm',
  confirmVariant = 'warning',
  makeMessage,
  runAction,
  successMessage,
  errorMessage,
  onSuccess,
}: UseActionConfirmOptions<T>) {
  const [target, setTarget] = useState<{ data: T; displayName: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const confirmAction = useCallback((data: T, displayName: string) => {
    setTarget({ data, displayName });
  }, []);

  const onCancel = useCallback(() => {
    if (!isLoading) setTarget(null);
  }, [isLoading]);

  const onConfirm = useCallback(() => {
    if (!target || isLoading) return;

    setIsLoading(true);
    void (async () => {
      try {
        await runAction(target.data);
        if (successMessage) {
          showToast('success', successMessage(target.displayName));
        }
        onSuccess?.();
        setTarget(null);
      } catch (error) {
        showToast('error', getErrorMessage(error, errorMessage));
      } finally {
        setIsLoading(false);
      }
    })();
  }, [target, isLoading, runAction, successMessage, onSuccess, errorMessage]);

  const dialogProps: ConfirmDialogProps = useMemo(
    () => ({
      visible: !!target,
      title,
      message: target ? makeMessage(target.displayName) : '',
      confirmText,
      confirmVariant,
      onConfirm,
      onCancel,
      isLoading,
    }),
    [target, title, makeMessage, confirmText, confirmVariant, onConfirm, onCancel, isLoading]
  );

  return {
    confirmAction,
    dialogProps,
  };
}
