/**
 * useDeletedDuplicateHandler — State management for deleted duplicate dialogs.
 * Mirrors the web app's useDeletedDuplicateHandler hook.
 */

import { useState, useCallback } from 'react';

export function useDeletedDuplicateHandler<T = unknown>() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [pendingData, setPendingData] = useState<T | null>(null);

  const openDialog = useCallback((msg: string, data: T) => {
    setMessage(msg);
    setPendingData(data);
    setIsOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setIsOpen(false);
    setMessage('');
    setPendingData(null);
  }, []);

  return { isOpen, message, pendingData, openDialog, closeDialog };
}
