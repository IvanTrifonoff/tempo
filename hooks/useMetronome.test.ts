import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMetronome } from './useMetronome';

describe('useMetronome', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createMockAudioCtx = () => ({
    state: 'running',
    currentTime: 0,
    createOscillator: vi.fn().mockReturnValue({
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      type: 'sine'
    }),
    createGain: vi.fn().mockReturnValue({
      connect: vi.fn(),
      gain: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }
    }),
    destination: {}
  });

  it('should start metronome when enabled and playing', async () => {
    const mockAudioCtx = createMockAudioCtx();
    const initAudioCtx = vi.fn().mockResolvedValue(mockAudioCtx);
    const props = {
      audioCtxRef: { current: mockAudioCtx as any },
      initAudioCtx,
      training: { metronomeEnabled: true, metronomeVolume: 0.5 },
      player: { isPlaying: true, currentTrack: { bpm: 120 }, playbackRate: 1.0 }
    };

    renderHook(() => useMetronome(props as any));
    
    // Ждем разрешения промисов внутри useEffect
    await vi.waitFor(() => {
        expect(initAudioCtx).toHaveBeenCalled();
    });

    expect(mockAudioCtx.createOscillator).toHaveBeenCalled();
  });

  it('should not start metronome when disabled', async () => {
    const mockAudioCtx = createMockAudioCtx();
    const initAudioCtx = vi.fn().mockResolvedValue(mockAudioCtx);
    const props = {
      audioCtxRef: { current: mockAudioCtx as any },
      initAudioCtx,
      training: { metronomeEnabled: false, metronomeVolume: 0.5 },
      player: { isPlaying: true, currentTrack: { bpm: 120 }, playbackRate: 1.0 }
    };

    renderHook(() => useMetronome(props as any));
    
    vi.advanceTimersByTime(1000);
    expect(mockAudioCtx.createOscillator).not.toHaveBeenCalled();
  });
});
