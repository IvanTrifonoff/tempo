import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { Track, DanceStyle } from '../../types';
import { AuthProvider } from '../AuthContext';
import { TrackProvider, useTrackContext } from '../TrackContext';
import { tracksApi } from '../../services/api/tracksApi';
import { playlistsApi } from '../../services/api/playlistsApi';
import { setupLocalStorage } from '../../test/helpers';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('../../services/offlineStorage', () => ({
  offlineStorage: {
    isTrackDownloaded: vi.fn().mockResolvedValue(false),
    deleteTrack: vi.fn().mockResolvedValue(undefined),
    downloadTrack: vi.fn().mockResolvedValue(undefined),
    getTrackUrl: vi.fn().mockResolvedValue('blob:test'),
  },
}));

vi.mock('../../services/api/tracksApi', () => ({
  tracksApi: {
    fetchTracks: vi.fn().mockResolvedValue([]),
    addTrack: vi.fn().mockRejectedValue(new Error('not mocked')),
    saveTrack: vi.fn().mockRejectedValue(new Error('not mocked')),
    deleteTrack: vi.fn().mockRejectedValue(new Error('not mocked')),
    logPlay: vi.fn().mockRejectedValue(new Error('not mocked')),
  },
}));

vi.mock('../../services/api/playlistsApi', () => ({
  playlistsApi: {
    fetchPlaylists: vi.fn().mockResolvedValue([]),
    addTrackToPlaylist: vi.fn().mockRejectedValue(new Error('not mocked')),
    removeTrackFromPlaylist: vi.fn().mockRejectedValue(new Error('not mocked')),
  },
}));

const mockUser = { id: 'u1', email: 'admin@test.com', isAdmin: true, isSubscribed: true, role: 'admin' as const, favorites: ['track1'], coachId: null };
const mockToken = 'test-token';
const mockTrack: Track = { id: 'track1', title: 'Test Track', artist: 'Artist', style: DanceStyle.SAMBA, bpm: 100, url: '/uploads/test.mp3', ownerId: 'u1', isPublic: true };
const mockTrack2: Track = { id: 'track2', title: 'Track 2', artist: 'Artist2', style: DanceStyle.WALTZ, bpm: 60, url: '/uploads/test2.mp3', ownerId: 'u1', isPublic: true };

function wrapper({ children }: { children: React.ReactNode }) {
  return React.createElement(AuthProvider, null,
    React.createElement(TrackProvider, null, children)
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  setupLocalStorage();
  globalThis.confirm = vi.fn(() => true) as any;
  // Restore default module mock implementations
  vi.mocked(tracksApi.fetchTracks).mockResolvedValue([]);
  vi.mocked(playlistsApi.fetchPlaylists).mockResolvedValue([]);
});

describe('TrackContext', () => {
  it('начинается с пустыми треками и плейлистами', async () => {
    const { result } = renderHook(() => useTrackContext(), { wrapper });
    await act(async () => {});
    expect(result.current.tracks).toEqual([]);
    expect(result.current.playlists).toEqual([]);
    expect(result.current.filteredTracks).toEqual([]);
    expect(result.current.activeStyle).toBe('All');
  });

  it('filteredTracks = все треки при activeStyle = All', async () => {
    const { result } = renderHook(() => useTrackContext(), { wrapper });
    await act(async () => {});
    act(() => { result.current.setTracks([mockTrack, mockTrack2]); });
    expect(result.current.filteredTracks).toHaveLength(2);
  });

  it('filteredTracks фильтрует по стилю', async () => {
    const { result } = renderHook(() => useTrackContext(), { wrapper });
    await act(async () => {});
    act(() => {
      result.current.setTracks([mockTrack, mockTrack2]);
      result.current.setActiveStyle(DanceStyle.WALTZ);
    });
    expect(result.current.filteredTracks).toHaveLength(1);
    expect(result.current.filteredTracks[0].id).toBe('track2');
  });

  it('handleSaveTrack обновляет трек оптимистично (список пустой - токена нет)', async () => {
    const { result } = renderHook(() => useTrackContext(), { wrapper });
    await act(async () => {});
    act(() => { result.current.setTracks([mockTrack]); });
    act(() => {
      result.current.setTracks(prev => prev.map(t =>
        t.id === 'track1' ? { ...t, title: 'Updated Title' } : t
      ));
    });
    expect(result.current.tracks[0].title).toBe('Updated Title');
  });

  it('deleteTrack удаляет трек оптимистично без токена', async () => {
    const { result } = renderHook(() => useTrackContext(), { wrapper });
    await act(async () => {});
    act(() => { result.current.setTracks([mockTrack, mockTrack2]); });
    act(() => {
      result.current.setTracks(prev => prev.filter(t => t.id !== 'track1'));
    });
    expect(result.current.tracks).toHaveLength(1);
    expect(result.current.tracks[0].id).toBe('track2');
  });
});
