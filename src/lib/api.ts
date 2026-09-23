import {
  User,
  AuthMeResponse,
  PaginatedResponse,
  ApiErrorPayload,
} from '../types/api';
import {
  Email,
  ScheduleEmailPayload,
  ScheduleEmailResponse,
} from '../types/email';

/**
 * Standard normalized error thrown by the API client.
 * Guarantees consistent shape across network errors, 401s, 400 validations, and 500s.
 */
export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly fieldErrors?: Record<string, string>;

  constructor(
    status: number,
    code: string,
    message: string,
    fieldErrors?: Record<string, string>
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

/**
 * Global 401 callback listener so unauthenticated responses
 * seamlessly redirect the user to /login without tight coupling.
 */
type UnauthorizedHandler = () => void;
let onUnauthorizedCallback: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  onUnauthorizedCallback = handler;
}

/**
 * Base fetch wrapper enforcing credentials: 'include' and error normalization.
 */
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Guarantees same-origin httpOnly session cookie is forwarded
  };

  let response: Response;
  try {
    response = await fetch(endpoint, config);
  } catch (err) {
    throw new ApiError(
      0,
      'NETWORK_ERROR',
      'Unable to connect to the server. Please check your internet connection or backend status.'
    );
  }

  // Handle 401 Unauthorized globally for authenticated endpoints
  if (response.status === 401) {
    if (endpoint !== '/api/auth/me' && onUnauthorizedCallback) {
      onUnauthorizedCallback();
    }
    throw new ApiError(401, 'UNAUTHORIZED', 'Session expired. Please sign in again.');
  }

  // Handle empty 204 responses
  if (response.status === 204) {
    return {} as T;
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const errorPayload = data as ApiErrorPayload | null;
    const code = errorPayload?.error?.code || `HTTP_${response.status}`;
    const message =
      errorPayload?.error?.message ||
      response.statusText ||
      'An unexpected error occurred.';
    const fieldErrors = errorPayload?.error?.fieldErrors;

    throw new ApiError(response.status, code, message, fieldErrors);
  }

  return data as T;
}

/**
 * Typed API Client
 */
export const api = {
  /**
   * Fetch current authenticated user session
   */
  async getMe(): Promise<User> {
    const res = await request<AuthMeResponse | User>('/api/auth/me');
    // Normalize both { user: User } and direct User payloads
    if ('user' in res) {
      return res.user;
    }
    return res;
  },

  /**
   * Log out the current user session
   */
  async logout(): Promise<void> {
    await request<{ success: boolean }>('/api/auth/logout', {
      method: 'POST',
    });
  },

  /**
   * Get paginated scheduled emails
   */
  async getScheduledEmails(
    page: number = 1,
    pageSize: number = 10
  ): Promise<PaginatedResponse<Email>> {
    return request<PaginatedResponse<Email>>(
      `/api/emails/scheduled?page=${page}&pageSize=${pageSize}`
    );
  },

  /**
   * Get paginated sent emails
   */
  async getSentEmails(
    page: number = 1,
    pageSize: number = 10
  ): Promise<PaginatedResponse<Email>> {
    return request<PaginatedResponse<Email>>(
      `/api/emails/sent?page=${page}&pageSize=${pageSize}`
    );
  },

  /**
   * Schedule a batch of emails
   */
  async scheduleEmails(
    payload: ScheduleEmailPayload
  ): Promise<ScheduleEmailResponse> {
    return request<ScheduleEmailResponse>('/api/emails/schedule', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
