import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
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
    const ctx = await result.current.initAudioCtx(null);

    expect(global.AudioContext).toHaveBeenCalled();
    expect(resumeSpy).toHaveBeenCalled();
    expect(ctx).toBe(mockCtx);
  });
});
