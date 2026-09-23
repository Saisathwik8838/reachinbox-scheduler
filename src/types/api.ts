/**
 * User profile returned by GET /api/auth/me
 */
export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
}

export interface AuthMeResponse {
  user: User;
}

/**
 * Standard error shape from the API envelope
 */
export interface ApiErrorPayload {
  error: {
    code: string;
    message: string;
    fieldErrors?: Record<string, string>;
  };
}

/**
 * Generic paginated list response
 */
export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}
