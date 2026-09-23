/**
 * BulkUploadModal — shared types + response-parsing helpers.
 */

export interface BulkUploadError {
  row: number;
  error: string;
  data?: Record<string, unknown> | null;
}

export interface BulkUploadResult {
  success?: boolean;
  created_count?: number;
  successful_count?: number;
  failed_count: number;
  total_rows?: number;
  errors: BulkUploadError[];
}

export interface BulkUploadResponse {
  success: boolean;
  message: string;
  data: BulkUploadResult;
  code: number;
}

export function transformErrors(errors: unknown): BulkUploadError[] {
  if (!errors) return [];

  if (typeof errors === 'object' && !Array.isArray(errors)) {
    return Object.entries(errors).map(
      ([rowKey, errorData]: [string, unknown]) => {
        const rowRegex = /Row (\d+)/i;
        const rowMatch = rowRegex.exec(rowKey);
        const rowNumber = rowMatch ? Number.parseInt(rowMatch[1], 10) : 0;

        let errorMessage = 'Validation error';
        let data: Record<string, unknown> | null = null;
        if (typeof errorData === 'object' && errorData !== null) {
          data = errorData as Record<string, unknown>;
          const firstKey = Object.keys(data)[0];
          errorMessage =
            typeof data[firstKey] === 'string' ? data[firstKey] : errorMessage;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }

        return { row: rowNumber, error: errorMessage, data };
      },
    );
  }

  if (Array.isArray(errors)) {
    return errors.map((err: unknown) => {
      const error = err as Record<string, unknown>;
      const rowNum = (error.row_number ?? error.row) as number | undefined;
      const errorErrors = error.errors as Record<string, string> | undefined;
      if (
        rowNum !== undefined &&
        errorErrors &&
        typeof errorErrors === 'object'
      ) {
        if (rowNum === 0 && errorErrors.file) {
          return { row: 0, error: errorErrors.file, data: {} };
        }
        const errorKeys = Object.keys(errorErrors);
        const firstErrorKey = errorKeys[0];
        const errorMessage =
          errorKeys.length > 1
            ? `${errorKeys.length} validation errors`
            : errorErrors[firstErrorKey] || 'Validation error';

        return { row: rowNum, error: errorMessage, data: errorErrors };
      }
      return {
        row: (error.row as number) || 0,
        error: (error.error as string) || 'Unknown error',
        data: (error.data as Record<string, unknown>) || {},
      };
    });
  }

  return [];
}

export function extractUploadErrorResult(
  error: unknown,
): BulkUploadResult | null {
  const err = error as {
    data?: { data?: BulkUploadResult; error?: string };
    response?: { data?: { data?: BulkUploadResult; error?: string } };
  };

  let rawResult = err?.data || err?.response?.data;
  if (rawResult && 'data' in rawResult && typeof rawResult.data === 'object') {
    rawResult = rawResult.data as { data?: BulkUploadResult; error?: string };
  }
  if (!rawResult) return null;

  const topLevelError = (rawResult as { error?: string }).error;
  if (topLevelError) {
    return {
      created_count: 0,
      failed_count: 1,
      total_rows: 0,
      errors: [{ row: 0, error: topLevelError, data: null }],
    };
  }

  const data = rawResult as unknown as BulkUploadResult;
  const successCount = data.successful_count ?? 0;
  const createdCount = data.created_count ?? successCount;
  const failedCount = data.failed_count ?? 0;
  return {
    created_count: createdCount,
    failed_count: failedCount,
    total_rows: data.total_rows ?? createdCount + failedCount,
    errors: data.errors ? transformErrors(data.errors) : [],
  };
}
