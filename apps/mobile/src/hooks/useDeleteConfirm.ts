/**
 * useDeleteConfirm — Shared delete-with-confirmation pattern
 * Wraps Alert.alert + mutation so every list screen doesn't rewrite it.
 */

import { getErrorMessage } from '@educard/shared';
import { useCallback } from 'react';
import { Alert } from 'react-native';

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
  const confirmDelete = useCallback(
    (data: T, displayName: string) => {
      Alert.alert(`Delete ${entityName}`, `Are you sure you want to delete ${displayName}?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await deleteMutation.mutateAsync(data);
                onSuccess?.();
                Alert.alert('Success', `${entityName} deleted successfully`);
              } catch (error) {
                Alert.alert(
                  'Error',
                  getErrorMessage(error, `Failed to delete ${entityName.toLowerCase()}`)
                );
              }
            })();
          },
        },
      ]);
    },
    [entityName, deleteMutation, onSuccess]
  );

  return confirmDelete;
}
