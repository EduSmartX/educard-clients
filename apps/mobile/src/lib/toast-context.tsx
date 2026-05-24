/**
 * Toast Context
 * Global toast notification system.
 * Usage: const { showToast } = useToast();
 *        showToast({ type: 'success', title: 'Created!', message: 'Exam created successfully' });
 */

import React, { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react';

import { ToastContainer, type ToastData, type ToastType } from '@/components/common/Toast';
import { subscribeToToasts } from '@/utils/toast';

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

  // Bridge: listen to showToast() calls from non-component code (hooks/services)
  useEffect(() => {
    const unsubscribe = subscribeToToasts((type, message) => {
      const titles: Record<string, string> = {
        success: 'Success',
        error: 'Error',
        warning: 'Warning',
        info: 'Info',
      };
      showToast({ type, title: titles[type] || 'Notice', message });
    });
    return unsubscribe;
  }, [showToast]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const contextValue = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}
