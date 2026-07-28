/**
 * Toast utility — event-based bridge to the ToastProvider.
 * Used in non-component code (hooks, services) where React context isn't available.
 */

type ToastType = 'success' | 'error' | 'info' | 'warning';
type ToastListener = (type: ToastType, message: string) => void;

const listeners: Set<ToastListener> = new Set();

// Deduplication: prevent same toast showing twice within 1 second
let lastToastKey = '';
let lastToastTime = 0;

export function showToast(type: ToastType, message: string): void {
  const key = `${type}:${message}`;
  const now = Date.now();
  if (key === lastToastKey && now - lastToastTime < 1000) {
    return; // Duplicate — skip
  }
  lastToastKey = key;
  lastToastTime = now;

  if (listeners.size > 0) {
    listeners.forEach(listener => listener(type, message));
  } else if (__DEV__) {
    // Fallback if ToastProvider hasn't mounted yet
    console.log(`[Toast:${type}] ${message}`);
  }
}

export function subscribeToToasts(listener: ToastListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
