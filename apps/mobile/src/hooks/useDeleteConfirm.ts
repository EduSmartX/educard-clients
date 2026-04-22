/**
 * useDeleteConfirm — Shared delete-with-confirmation pattern
 * Wraps Alert.alert + mutation so every list screen doesn't rewrite it.
 */

import { useCallback } from 'react';
import { Alert } from 'react-native';

interface UseDeleteConfirmOptions {
  /** e.g. "Teacher", "Student" */
  entityName: string;
  /** React-Query mutation object – must have `.mutate(id, { onSuccess, onError })` */
  deleteMutation: {
    mutate: (id: string, cbs: { onSuccess: () => void; onError: () => void }) => void;
  };
}

export function useDeleteConfirm({ entityName, deleteMutation }: UseDeleteConfirmOptions) {
  const confirmDelete = useCallback(
    (id: string, displayName: string) => {
      Alert.alert(
        `Delete ${entityName}`,
        `Are you sure you want to delete ${displayName}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              deleteMutation.mutate(id, {
                onSuccess: () => Alert.alert('Success', `${entityName} deleted successfully`),
                onError: () => Alert.alert('Error', `Failed to delete ${entityName.toLowerCase()}`),
              });
            },
          },
        ],
      );
    },
    [entityName, deleteMutation],
  );

  return confirmDelete;
}
