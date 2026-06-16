import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React, { useEffect } from 'react';
import { Track, DanceStyle } from '../../types';
import { AuthProvider } from '../AuthContext';
import { TrackProvider, useTrackContext } from '../TrackContext';
import { PlayerProvider, usePlayerContext } from '../PlayerContext';
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
    logPlay: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../services/api/playlistsApi', () => ({
  playlistsApi: {
    fetchPlaylists: vi.fn().mockResolvedValue([]),
    addTrackToPlaylist: vi.fn().mockRejectedValue(new Error('not mocked')),
    removeTrackFromPlaylist: vi.fn().mockRejectedValue(new Error('not mocked')),
  },
}));

// Mock useAudioContext to avoid needing real AudioContext constructor
vi.mock('../../hooks/useAudioContext', () => ({
  useAudioContext: () => ({
    audioCtxRef: { current: {
      state: 'running',
      currentTime: 0,
      resume: vi.fn().mockResolvedValue(undefined),
    }},
    resumeAudioContext: vi.fn().mockResolvedValue(undefined),
    connectAudioElement: vi.fn(),
    getAudioContext: vi.fn(),
    isReady: true,
  }),
}));

// Mock useMetronome
vi.mock('../../hooks/useMetronome', () => ({
  useMetronome: () => ({ isMetronomeVisualActive: false }),
}));

const mockTrack: Track = { id: 'track1', title: 'Test', artist: 'A', style: DanceStyle.SAMBA, bpm: 100, url: '/test.mp3', ownerId: 'u1', isPublic: true };
const mockTrack2: Track = { id: 'track2', title: 'Track 2', artist: 'B', style: DanceStyle.WALTZ, bpm: 60, url: '/test2.mp3', ownerId: 'u1', isPublic: true };

function wrapper({ children }: { children: React.ReactNode }) {
  return React.createElement(AuthProvider, null,
    React.createElement(TrackProvider, null,
      React.createElement(PlayerProvider, null, children)
    )
  );
}

beforeEach(() => {
  setupLocalStorage();
  vi.resetAllMocks();
  // Restore default module mock implementations
  vi.mocked(tracksApi.fetchTracks).mockResolvedValue([]);
  vi.mocked(playlistsApi.fetchPlaylists).mockResolvedValue([]);
});

describe('PlayerContext', () => {
  it('начинается с начальным состоянием плеера', async () => {
    const { result } = renderHook(() => usePlayerContext(), { wrapper });
    await act(async () => {});
    expect(result.current.player.currentTrack).toBeNull();
    expect(result.current.player.isPlaying).toBe(false);
    expect(result.current.player.volume).toBe(0.8);
    expect(result.current.player.playbackRate).toBe(1.0);
    expect(result.current.isPlayerVisible).toBe(true);
    expect(result.current.training.isActive).toBe(false);
  });

  it('togglePlay переключает isPlaying', async () => {
    const { result } = renderHook(() => usePlayerContext(), { wrapper });
    await act(async () => {});
    await act(async () => { await result.current.togglePlay(); });
    expect(result.current.player.isPlaying).toBe(true);
    await act(async () => { await result.current.togglePlay(); });
    expect(result.current.player.isPlaying).toBe(false);
  });

  it('selectTrack устанавливает currentTrack', async () => {
    const { result } = renderHook(() => usePlayerContext(), { wrapper });
    await act(async () => {});
    await act(async () => { await result.current.selectTrack(mockTrack); });
    expect(result.current.player.currentTrack?.id).toBe('track1');
    expect(result.current.player.isPlaying).toBe(true);
    expect(result.current.isPlayerVisible).toBe(true);
  });

  it('selectTrack сбрасывает playbackRate', async () => {
    const { result } = renderHook(() => usePlayerContext(), { wrapper });
    await act(async () => {});
    act(() => { result.current.setPlaybackRate(1.2); });
    await act(async () => { await result.current.selectTrack(mockTrack); });
    expect(result.current.player.playbackRate).toBe(1.0);
  });

  it('selectTrack работает с любым треком', async () => {
    const { result } = renderHook(() => usePlayerContext(), { wrapper });
    await act(async () => {});

    await act(async () => { await result.current.selectTrack(mockTrack); });
    expect(result.current.player.currentTrack?.id).toBe('track1');

    await act(async () => { await result.current.selectTrack(mockTrack2); });
    expect(result.current.player.currentTrack?.id).toBe('track2');
  });

  it('skip("next") переходит к следующему треку', async () => {
    vi.mocked(tracksApi.fetchTracks).mockResolvedValue([mockTrack, mockTrack2]);

    const { result } = renderHook(() => {
      const pctx = usePlayerContext();
      const tctx = useTrackContext();
      return { pctx, tctx };
    }, { wrapper });

    await waitFor(() => {
      expect(result.current.tctx.filteredTracks).toHaveLength(2);
    });

    await act(async () => { await result.current.pctx.selectTrack(mockTrack); });
    await waitFor(() => {
      expect(result.current.pctx.player.currentTrack?.id).toBe('track1');
    });

    await act(async () => { await result.current.pctx.skip('next'); });
    await waitFor(() => {
      expect(result.current.pctx.player.currentTrack?.id).toBe('track2');
    });
  });

  it('skip("prev") переходит к предыдущему треку', async () => {
    vi.mocked(tracksApi.fetchTracks).mockResolvedValue([mockTrack, mockTrack2]);

    const { result } = renderHook(() => {
      const pctx = usePlayerContext();
      const tctx = useTrackContext();
      return { pctx, tctx };
    }, { wrapper });

    await waitFor(() => {
      expect(result.current.tctx.filteredTracks).toHaveLength(2);
    });

    await act(async () => { await result.current.pctx.selectTrack(mockTrack2); });
    await waitFor(() => {
      expect(result.current.pctx.player.currentTrack?.id).toBe('track2');
    });

    await act(async () => { await result.current.pctx.skip('prev'); });
    await waitFor(() => {
      expect(result.current.pctx.player.currentTrack?.id).toBe('track1');
    });
  });

  it('adjustBpmInPlayer увеличивает BPM', async () => {
    const { result } = renderHook(() => usePlayerContext(), { wrapper });
    await act(async () => {});
    await act(async () => { await result.current.selectTrack(mockTrack); });
    const initialBpm = result.current.currentEffectiveBpm;
    act(() => { result.current.adjustBpmInPlayer(5); });
    expect(result.current.currentEffectiveBpm).toBe(initialBpm + 5);
  });

  it('setPlaybackRate клиппируется', async () => {
    const { result } = renderHook(() => usePlayerContext(), { wrapper });
    await act(async () => {});
    act(() => { result.current.setPlaybackRate(0.1); });
    expect(result.current.player.playbackRate).toBe(0.5);
    act(() => { result.current.setPlaybackRate(2.0); });
    expect(result.current.player.playbackRate).toBe(1.5);
  });

  it('selectTrack без url не меняет состояние', async () => {
    const { result } = renderHook(() => usePlayerContext(), { wrapper });
    await act(async () => {});
    await act(async () => { await result.current.selectTrack({ ...mockTrack, url: '' }); });
    expect(result.current.player.currentTrack).toBeNull();
  });

  it('кидает ошибку вне PlayerProvider', () => {
    expect(() => renderHook(() => usePlayerContext())).toThrow('usePlayerContext must be used within a PlayerProvider');
  });
});
