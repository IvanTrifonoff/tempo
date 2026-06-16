import { describe, it, expect, vi, beforeEach } from 'vitest';
import { playlistsApi } from '../playlistsApi';

const mockToken = 'test-token';

function mockFetch(ok: boolean, data: unknown) {
  return vi.fn().mockResolvedValue({
    ok,
    json: vi.fn().mockResolvedValue(data),
  });
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('playlistsApi.fetchPlaylists', () => {
  it('делает GET /api/playlists и возвращает массив', async () => {
    const playlists = [{ id: 'pl1', name: 'Favorites' }];
    globalThis.fetch = mockFetch(true, playlists);

    const result = await playlistsApi.fetchPlaylists(mockToken);
    expect(result).toEqual(playlists);
    expect(globalThis.fetch).toHaveBeenCalledWith('/api/playlists', {
      headers: { Authorization: 'Bearer test-token' },
    });
  });

  it('возвращает пустой массив если ответ не массив', async () => {
    globalThis.fetch = mockFetch(true, { id: 1 });

    const result = await playlistsApi.fetchPlaylists(mockToken);
    expect(result).toEqual([]);
  });

  it('пробрасывает ошибку сети', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    await expect(playlistsApi.fetchPlaylists(mockToken)).rejects.toThrow('Network error');
  });
});

describe('playlistsApi.addTrackToPlaylist', () => {
  it('делает POST /api/playlists/:id/tracks', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    globalThis.fetch = fetchMock;

    await playlistsApi.addTrackToPlaylist(mockToken, 'pl1', 'track-1');
    expect(fetchMock).toHaveBeenCalledWith('/api/playlists/pl1/tracks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token',
      },
      body: JSON.stringify({ trackId: 'track-1' }),
    });
  });
});

describe('playlistsApi.removeTrackFromPlaylist', () => {
  it('делает DELETE /api/playlists/:id/tracks/:trackId', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    globalThis.fetch = fetchMock;

    await playlistsApi.removeTrackFromPlaylist(mockToken, 'pl1', 'track-1');
    expect(fetchMock).toHaveBeenCalledWith('/api/playlists/pl1/tracks/track-1', {
      method: 'DELETE',
      headers: { Authorization: 'Bearer test-token' },
    });
  });
});
