import type { User } from '../../types';

export const authApi = {
  async fetchCurrentUser(token: string): Promise<User> {
    const res = await fetch('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Invalid token');
    return res.json();
  },

  async toggleFavorite(token: string, trackId: string): Promise<void> {
    await fetch('/api/user/favorites', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ trackId }),
    });
  },
};
