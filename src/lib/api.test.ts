import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api, ApiError, setUnauthorizedHandler } from './api';

describe('API Client & ApiError', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    setUnauthorizedHandler(null);
  });

  it('normalizes 401 response and invokes setUnauthorizedHandler on protected endpoint', async () => {
    const unauthorizedMock = vi.fn();
    setUnauthorizedHandler(unauthorizedMock);

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ error: { code: 'UNAUTHORIZED', message: 'Session expired' } }),
    } as unknown as Response);

    await expect(api.getScheduledEmails()).rejects.toThrow(ApiError);
    expect(unauthorizedMock).toHaveBeenCalledTimes(1);
  });

  it('normalizes network errors into status 0 with NETWORK_ERROR code', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'));

    try {
      await api.getMe();
      expect.fail('Should have thrown an ApiError');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      const apiErr = err as ApiError;
      expect(apiErr.status).toBe(0);
      expect(apiErr.code).toBe('NETWORK_ERROR');
      expect(apiErr.message).toContain('Unable to connect to the server');
    }
  });

  it('parses structured backend fieldErrors correctly', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Invalid request data',
          fieldErrors: {
            subject: 'Subject cannot be empty',
          },
        },
      }),
    } as unknown as Response);

    try {
      await api.scheduleEmails({
        subject: '',
        body: 'test',
        recipients: ['a@b.com'],
        startAt: new Date().toISOString(),
        delaySeconds: 5,
        hourlyLimit: 100,
      });
      expect.fail('Should have thrown ApiError');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      const apiErr = err as ApiError;
      expect(apiErr.status).toBe(400);
      expect(apiErr.code).toBe('VALIDATION_FAILED');
      expect(apiErr.fieldErrors).toEqual({ subject: 'Subject cannot be empty' });
    }
  });

  it('returns data on successful 200 response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        user: {
          id: 'user_123',
          name: 'Aarav Sharma',
          email: 'aarav.sharma@gmail.com',
        },
      }),
    } as unknown as Response);

    const user = await api.getMe();
    expect(user.id).toBe('user_123');
    expect(user.name).toBe('Aarav Sharma');
  });
});
