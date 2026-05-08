import { useState } from 'react';

interface UseDeletedViewOptions {
  onPageChange?: (page: number) => void;
}

export function useDeletedView({ onPageChange }: UseDeletedViewOptions = {}) {
  const [showDeleted, setShowDeleted] = useState(false);

  const toggleDeletedView = () => {
    setShowDeleted(!showDeleted);
    onPageChange?.(1);
  };

  return {
    showDeleted,
    setShowDeleted,
    toggleDeletedView,
  };
}
