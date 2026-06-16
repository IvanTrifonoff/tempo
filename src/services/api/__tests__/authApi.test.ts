import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authApi } from '../authApi';
import type { User } from '../../../types';

const mockToken = 'test-token';
const mockUser: User = {
  id: '1',
  email: 'test@test.com',
  isAdmin: false,
  isSubscribed: false,
  role: 'student',
  favorites: [],
  coachId: null,
};

function mockFetch(ok: boolean, data: unknown) {
  return vi.fn().mockResolvedValue({
    ok,
    json: vi.fn().mockResolvedValue(data),
  });
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('authApi.fetchCurrentUser', () => {
  it('делает GET /api/auth/me и возвращает пользователя', async () => {
    globalThis.fetch = mockFetch(true, mockUser);

    const result = await authApi.fetchCurrentUser(mockToken);
    expect(result).toEqual(mockUser);
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/auth/me', {
      headers: { Authorization: 'Bearer test-token' },
    });
  });

  it('кидает ошибку если ответ не ok', async () => {
    globalThis.fetch = mockFetch(false, { message: 'Unauthorized' });

    await expect(authApi.fetchCurrentUser(mockToken)).rejects.toThrow('Invalid token');
  });

  it('пробрасывает ошибку сети', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    await expect(authApi.fetchCurrentUser(mockToken)).rejects.toThrow('Network error');
  });
});

describe('authApi.toggleFavorite', () => {
  it('делает POST /api/user/favorites', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    globalThis.fetch = fetchMock;

    await authApi.toggleFavorite(mockToken, 'track-1');
    expect(fetchMock).toHaveBeenCalledWith('/api/user/favorites', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token',
      },
      body: JSON.stringify({ trackId: 'track-1' }),
    });
  });
});
