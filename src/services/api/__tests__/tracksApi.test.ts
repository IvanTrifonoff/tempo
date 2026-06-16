import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tracksApi } from '../tracksApi';

const mockToken = 'test-token';

function mockFetch(
  ok: boolean,
  data: unknown,
  options?: { throwOnJson?: boolean },
) {
  return vi.fn().mockResolvedValue({
    ok,
    json: options?.throwOnJson
      ? vi.fn().mockRejectedValue(new Error('JSON parse failed'))
      : vi.fn().mockResolvedValue(data),
  });
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('tracksApi.fetchTracks', () => {
  it('делает GET /api/tracks с Bearer-токеном', async () => {
    const fetchMock = mockFetch(true, [{ id: '1' }]);
    globalThis.fetch = fetchMock;

    const result = await tracksApi.fetchTracks(mockToken);
    expect(result).toEqual([{ id: '1' }]);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/tracks?t='),
      { headers: { Authorization: 'Bearer test-token' } },
    );
  });

  it('делает запрос без токена', async () => {
    const fetchMock = mockFetch(true, []);
    globalThis.fetch = fetchMock;

    await tracksApi.fetchTracks(null);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/tracks?t='),
      { headers: {} },
    );
  });

  it('кидает ошибку если ответ не массив', async () => {
    globalThis.fetch = mockFetch(true, { id: 1 });
    await expect(tracksApi.fetchTracks(mockToken)).rejects.toThrow('Invalid tracks data');
  });

  it('пробрасывает ошибку сети', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    await expect(tracksApi.fetchTracks(mockToken)).rejects.toThrow('Network error');
  });
});

describe('tracksApi.addTrack', () => {
  it('делает POST /api/tracks с formData', async () => {
    const fetchMock = mockFetch(true, { id: 'new-track' });
    globalThis.fetch = fetchMock;
    const formData = new FormData();
    formData.append('title', 'New Track');

    const result = await tracksApi.addTrack(mockToken, formData);
    expect(result).toEqual({ id: 'new-track' });
    expect(fetchMock).toHaveBeenCalledWith('/api/tracks', {
      method: 'POST',
      headers: { Authorization: 'Bearer test-token' },
      body: formData,
    });
  });

  it('кидает ошибку при !res.ok', async () => {
    globalThis.fetch = mockFetch(false, { message: 'Forbidden' });
    await expect(tracksApi.addTrack(mockToken, new FormData())).rejects.toThrow('Upload failed');
  });
});

describe('tracksApi.saveTrack', () => {
  it('делает PATCH /api/tracks/:id', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: vi.fn() });
    globalThis.fetch = fetchMock;

    await tracksApi.saveTrack(mockToken, 'track-1', { title: 'Updated' });
    expect(fetchMock).toHaveBeenCalledWith('/api/tracks/track-1', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token',
      },
      body: JSON.stringify({ title: 'Updated' }),
    });
  });
});

describe('tracksApi.deleteTrack', () => {
  it('делает DELETE /api/tracks/:id', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    globalThis.fetch = fetchMock;

    await tracksApi.deleteTrack(mockToken, 'track-1');
    expect(fetchMock).toHaveBeenCalledWith('/api/tracks/track-1', {
      method: 'DELETE',
      headers: { Authorization: 'Bearer test-token' },
    });
  });
});

describe('tracksApi.logPlay', () => {
  it('делает POST /api/tracks/log-play с токеном', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    globalThis.fetch = fetchMock;

    await tracksApi.logPlay(mockToken, 'track-1');
    expect(fetchMock).toHaveBeenCalledWith('/api/tracks/log-play', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token',
      },
      body: JSON.stringify({ trackId: 'track-1' }),
    });
  });

  it('ничего не делает без токена', async () => {
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock;

    await tracksApi.logPlay(null, 'track-1');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
