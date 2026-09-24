import { PaginatedEmails, ScheduleRequest, ScheduleResponse, User } from '../types/email';

const API_BASE_URL =
  typeof import.meta.env.VITE_API_URL === 'string' && import.meta.env.VITE_API_URL !== ''
    ? import.meta.env.VITE_API_URL
    : (import.meta.env.PROD ? '' : 'http://localhost:4000');

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, {
    ...options,
    credentials: 'include', // Always send cookies for session auth
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const errorMessage = isJson && data?.error ? data.error : response.statusText || 'An unexpected error occurred';
    throw new ApiError(errorMessage, response.status, isJson ? data : undefined);
  }

  return data as T;
}

export const api = {
  // Authentication
  getMe: () => request<{ user: User }>('/api/auth/me'),
  logout: () => request<{ success: boolean }>('/api/auth/logout', { method: 'POST' }),
  devLogin: (email: string = 'saisathwik@gmail.com', name: string = 'Sai Sathwik') =>
    request<{ success: boolean; user: User }>('/api/auth/dev-login', {
      method: 'POST',
      body: JSON.stringify({ email, name }),
    }),

  // Email endpoints
  scheduleEmails: (data: ScheduleRequest) =>
    request<ScheduleResponse>('/api/emails/schedule', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getScheduledEmails: (page: number = 1, limit: number = 10) =>
    request<PaginatedEmails>(`/api/emails/scheduled?page=${page}&limit=${limit}`),

  getSentEmails: (page: number = 1, limit: number = 10) =>
    request<PaginatedEmails>(`/api/emails/sent?page=${page}&limit=${limit}`),
};
