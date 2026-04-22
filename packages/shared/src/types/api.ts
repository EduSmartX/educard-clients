/**
 * Shared Types - API
 */

// API response wrapper
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

// Paginated response
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// API error
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  field?: string;
  errors?: Record<string, string | string[]>;
}

// Query params
export interface PaginationParams {
  page?: number;
  page_size?: number;
  search?: string;
  ordering?: string;
}

// Generic query params (alias for mobile app)
export interface QueryParams extends PaginationParams {
  [key: string]: string | number | boolean | undefined;
}
