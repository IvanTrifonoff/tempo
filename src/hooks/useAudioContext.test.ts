import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAudioContext } from './useAudioContext';

describe('useAudioContext', () => {
  it('should initialize AudioContext and call resume', async () => {
    const resumeSpy = vi.fn().mockResolvedValue(undefined);
    const mockCtx = {
      state: 'suspended',
      resume: resumeSpy,
      createMediaElementSource: vi.fn().mockReturnValue({ connect: vi.fn() }),
      destination: {}
    };
    
    // Mocking as a class constructor
    global.AudioContext = vi.fn().mockImplementation(function() {
      return mockCtx;
    }) as any;

    const { result } = renderHook(() => useAudioContext());
    await act(async () => {});

    await act(async () => {
      await result.current.resumeAudioContext();
    });

    expect(global.AudioContext).toHaveBeenCalled();
    expect(resumeSpy).toHaveBeenCalled();
    expect(result.current.getAudioContext()).toBe(mockCtx);
  });
});
