/**
 * Toast Context
 * Global toast notification system.
 * Usage: const { showToast } = useToast();
 *        showToast({ type: 'success', title: 'Created!', message: 'Exam created successfully' });
 */

import React, { createContext, useContext, useCallback, useState } from 'react';

import { ToastContainer, type ToastData, type ToastType } from '@/components/common/Toast';

interface ToastInput {
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (input: ToastInput) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

let toastCounter = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const showToast = useCallback((input: ToastInput) => {
    const id = `toast-${++toastCounter}-${Date.now()}`;
    const toast: ToastData = { id, ...input };
    setToasts((prev) => [...prev.slice(-2), toast]); // Keep max 3
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}
