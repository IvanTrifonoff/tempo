import { useRef, useCallback } from 'react';

export const useAudioContext = () => {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const musicSourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);

  const initAudioCtx = useCallback(async (audioElement: HTMLAudioElement | null) => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 44100,
        latencyHint: 'playback'
      });
    }
    
    if (audioCtxRef.current.state === 'suspended') {
      await audioCtxRef.current.resume();
    }

    if (audioElement && !musicSourceNodeRef.current && audioCtxRef.current) {
        try {
            const source = audioCtxRef.current.createMediaElementSource(audioElement);
            source.connect(audioCtxRef.current.destination);
            musicSourceNodeRef.current = source;
            console.log("Music routed through unified AudioContext");
        } catch (e) {
            console.warn("Music routing issue:", e);
        }
    }
    
    return audioCtxRef.current;
  }, []);

  return { audioCtxRef, initAudioCtx };
};
