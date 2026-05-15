import { useRef, useCallback, useState } from 'react';

export const useAudioContext = () => {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [isReady, setIsReady] = useState(false);

  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
      audioCtxRef.current = new AudioContextClass({
        sampleRate: 44100,
        latencyHint: 'playback'
      });
    }
    return audioCtxRef.current;
  }, []);

  const resumeAudioContext = useCallback(async () => {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
        setIsReady(true);
      } catch (e) {
        console.error("Failed to resume AudioContext:", e);
      }
    } else {
      setIsReady(true);
    }
  }, [getAudioContext]);

  // No-op to keep interface compatible but disable the piping
  const connectAudioElement = useCallback((audioElement: HTMLAudioElement) => {
    return;
  }, []);

  return {
    audioCtxRef,
    getAudioContext,
    resumeAudioContext,
    connectAudioElement,
    isReady
  };
};
