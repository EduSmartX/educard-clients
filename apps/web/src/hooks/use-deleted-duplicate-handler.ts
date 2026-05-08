/**
 * Hook for handling deleted duplicate errors
 * Provides state management for deleted duplicate dialog
 */

import { useState } from 'react';

export function useDeletedDuplicateHandler<T = unknown>() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [pendingData, setPendingData] = useState<T | null>(null);

  const openDialog = (msg: string, data: T) => {
    setMessage(msg);
    setPendingData(data);
    setIsOpen(true);
  };

  const closeDialog = () => {
    setIsOpen(false);
    setMessage('');
    setPendingData(null);
  };

  return {
    isOpen,
    message,
    pendingData,
    openDialog,
    closeDialog,
  };
}
