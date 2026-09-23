/**
 * useDebouncedCallback - defers a callback until invocations stop for `delayMs`.
 *
 * `flush` runs a pending invocation immediately (e.g. on blur or Enter) and
 * `cancel` drops it (e.g. when another control applies the change first).
 */

import { useCallback, useEffect, useRef } from 'react';

interface DebouncedCallback<TArgs extends unknown[]> {
  schedule: (...args: TArgs) => void;
  flush: () => void;
  cancel: () => void;
}

export function useDebouncedCallback<TArgs extends unknown[]>(
  callback: (...args: TArgs) => void,
  delayMs: number
): DebouncedCallback<TArgs> {
  const callbackRef = useRef(callback);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingArgsRef = useRef<TArgs | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const cancel = useCallback(() => {
    clearTimer();
    pendingArgsRef.current = null;
  }, [clearTimer]);

  const flush = useCallback(() => {
    const args = pendingArgsRef.current;
    if (args === null) {
      return;
    }
    cancel();
    callbackRef.current(...args);
  }, [cancel]);

  const schedule = useCallback(
    (...args: TArgs) => {
      pendingArgsRef.current = args;
      clearTimer();
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        pendingArgsRef.current = null;
        callbackRef.current(...args);
      }, delayMs);
    },
    [clearTimer, delayMs]
  );

  useEffect(() => cancel, [cancel]);

  return { schedule, flush, cancel };
}
