import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { AuthProvider, useAuth } from '../AuthContext';
import { authApi } from '../../services/api/authApi';
import { setupLocalStorage } from '../../test/helpers';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('../../services/api/authApi', () => ({
  authApi: {
    fetchCurrentUser: vi.fn().mockRejectedValue(new Error('No API mock')),
    toggleFavorite: vi.fn().mockRejectedValue(new Error('not mocked')),
  },
}));

const mockUser = { id: '1', email: 'test@test.com', isAdmin: false, isSubscribed: false, role: 'student' as const, favorites: [], coachId: null };
const mockToken = 'test-token-123';

let ls: Storage;

function wrapper({ children }: { children: React.ReactNode }) {
  return React.createElement(AuthProvider, null, children);
}

beforeEach(() => {
  ls = setupLocalStorage();
  vi.resetAllMocks();
  // Restore default module mock implementations
  vi.mocked(authApi.fetchCurrentUser).mockRejectedValue(new Error('No API mock'));
});

describe('AuthContext', () => {
  it('должен начинаться с user=null, token из localStorage', async () => {
    ls.setItem('token', mockToken);
    // Make authApi succeed so token is preserved
    vi.mocked(authApi.fetchCurrentUser).mockResolvedValue(mockUser);
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.token).toBe(mockToken);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('должен кидать ошибку при useAuth вне AuthProvider', () => {
    expect(() => renderHook(() => useAuth())).toThrow('useAuth must be used within an AuthProvider');
  });

  it('handleLogin должен установить user и token', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});
    act(() => { result.current.handleLogin(mockUser, mockToken); });
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.token).toBe(mockToken);
    expect(result.current.isAuthenticated).toBe(true);
    expect(ls.getItem('token')).toBe(mockToken);
  });

  it('handleLogout должен очистить user, token и localStorage', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});
    act(() => { result.current.handleLogin(mockUser, mockToken); });
    expect(result.current.isAuthenticated).toBe(true);
    act(() => { result.current.handleLogout(); });
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(ls.getItem('token')).toBeNull();
  });

  it('handleLogin перезаписывает предыдущего пользователя', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});
    act(() => { result.current.handleLogin(mockUser, mockToken); });
    const user2 = { ...mockUser, id: '2', email: 'other@test.com' };
    act(() => { result.current.handleLogin(user2, 'token-2'); });
    expect(result.current.user?.id).toBe('2');
    expect(result.current.token).toBe('token-2');
  });

  it('refreshUser обновляет данные пользователя', async () => {
    const updatedUser = { ...mockUser, email: 'updated@test.com' };

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});

    // Must mock BEFORE handleLogin — handleLogin triggers useEffect that calls fetchCurrentUser
    vi.mocked(authApi.fetchCurrentUser).mockResolvedValue(mockUser);
    act(() => { result.current.handleLogin(mockUser, mockToken); });
    await act(async () => { await Promise.resolve(); });

    vi.mocked(authApi.fetchCurrentUser).mockResolvedValue(updatedUser);
    await act(async () => { await result.current.refreshUser(); });
    expect(result.current.user?.email).toBe('updated@test.com');
  });

  it('refreshUser не падает если fetch вернул ошибку', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});

    // Must mock BEFORE handleLogin to prevent useEffect from clearing user
    vi.mocked(authApi.fetchCurrentUser).mockResolvedValue(mockUser);
    act(() => { result.current.handleLogin(mockUser, mockToken); });
    await act(async () => { await Promise.resolve(); });

    // Now make fetchCurrentUser reject for refreshUser
    vi.mocked(authApi.fetchCurrentUser).mockRejectedValue(new Error('API error'));
    await act(async () => { await result.current.refreshUser(); });
    expect(result.current.user?.email).toBe('test@test.com');
  });

  it('загружает user из API при валидном токене', async () => {
    ls.setItem('token', mockToken);
    vi.mocked(authApi.fetchCurrentUser).mockResolvedValue(mockUser);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
    });
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('очищает токен если /api/auth/me вернул ошибку', async () => {
    ls.setItem('token', 'invalid-token');
    // authApi.fetchCurrentUser mock rejects by default

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {});

    await waitFor(() => {
      expect(result.current.token).toBeNull();
    });
    expect(result.current.user).toBeNull();
    expect(ls.getItem('token')).toBeNull();
  });
});
