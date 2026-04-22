/**
 * Utilities for detecting and parsing "deleted duplicate" errors from the backend.
 * When creating an entity and a soft-deleted record with the same unique key exists,
 * the backend returns a 400 with has_deleted_duplicate, deleted_record_id, and a message.
 */

interface ApiErrorData {
  errors?: Record<string, any>;
  non_field_errors?: string[];
  has_deleted_duplicate?: string | string[];
  deleted_record_id?: string | string[];
  detail?: string;
}

/**
 * Check if an API error is a "deleted duplicate" error
 */
export function isDeletedDuplicateError(error: any): boolean {
  const data: ApiErrorData | undefined = error?.response?.data?.errors || error?.response?.data;

  if (!data) return false;

  const flag = data.has_deleted_duplicate;
  if (flag === 'true' || flag === 'True') return true;
  if (Array.isArray(flag) && flag.length > 0 && (flag[0] === 'True' || flag[0] === 'true'))
    return true;

  return false;
}

/**
 * Extract user-friendly message from deleted duplicate error
 */
export function getDeletedDuplicateMessage(error: any): string {
  const data: ApiErrorData | undefined = error?.response?.data?.errors || error?.response?.data;

  const fallback =
    'A deleted record with the same details already exists. Would you like to restore it or create a new one?';

  if (!data) return fallback;

  // Check non_field_errors
  if (Array.isArray(data.non_field_errors) && data.non_field_errors.length > 0) {
    return cleanMessage(data.non_field_errors[0]);
  }
  if (typeof data.non_field_errors === 'string') {
    return cleanMessage(data.non_field_errors);
  }
  if (typeof data.detail === 'string') {
    return cleanMessage(data.detail);
  }

  return fallback;
}

/**
 * Extract the deleted record's public_id
 */
export function getDeletedRecordId(error: any): string | null {
  const data: ApiErrorData | undefined = error?.response?.data?.errors || error?.response?.data;

  if (!data) return null;

  if (typeof data.deleted_record_id === 'string') return data.deleted_record_id;
  if (Array.isArray(data.deleted_record_id) && data.deleted_record_id.length > 0) {
    return data.deleted_record_id[0];
  }

  return null;
}

/** Clean backend message to be mobile-friendly */
function cleanMessage(msg: string): string {
  return msg
    .replace(
      /Please navigate to 'View Deleted' to restore it, or do you need to create a new ([^?]+)\?/i,
      'Would you like to restore the existing record or create a new $1?'
    )
    .replace(
      /Please navigate to 'View Deleted' to restore it\.?/i,
      'Would you like to restore it?'
    );
}
