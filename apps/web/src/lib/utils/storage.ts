/**
 * Safe localStorage helpers
 * Centralizes JSON parsing and role extraction to avoid duplicate try/catch blocks.
 */

export function getParsedLocalStorageItem<T>(key: string): T | null {
  const rawValue = localStorage.getItem(key);
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as T;
  } catch {
    return null;
  }
}

export function getStoredUserRole(): string | null {
  const user = getParsedLocalStorageItem<{ role?: string }>('user');
  return typeof user?.role === 'string' ? user.role.toLowerCase() : null;
}

export const AUTH_STORAGE_EVENT = 'auth-user-changed';

export function updateStoredUser(updates: Record<string, unknown>): void {
  const current = getParsedLocalStorageItem<Record<string, unknown>>('user');
  if (!current) {
    return;
  }
  localStorage.setItem('user', JSON.stringify({ ...current, ...updates }));
  window.dispatchEvent(new Event(AUTH_STORAGE_EVENT));
}
