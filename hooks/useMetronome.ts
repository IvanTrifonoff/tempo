import { useRef, useState, useCallback, useEffect } from 'react';
import { TrainingSettings, PlayerState } from '../types';

interface UseMetronomeProps {
  audioCtxRef: React.MutableRefObject<AudioContext | null>;
  initAudioCtx: () => Promise<AudioContext | null>;
  training: TrainingSettings;
  player: PlayerState;
}

export const useMetronome = ({ audioCtxRef, initAudioCtx, training, player }: UseMetronomeProps) => {
  const metronomeIntervalRef = useRef<number | null>(null);
  const [isMetronomeVisualActive, setIsMetronomeVisualActive] = useState(false);

  const playMetronomeTick = useCallback(async () => {
    const ctx = await initAudioCtx();
    if (!ctx || ctx.state !== 'running') return;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    const now = ctx.currentTime;
    
    // Woodblock-like sound
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.02);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(training.metronomeVolume, now + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    
    osc.start(now);
    osc.stop(now + 0.06);
    
    setIsMetronomeVisualActive(true);
    setTimeout(() => setIsMetronomeVisualActive(false), 50);
  }, [initAudioCtx, training.metronomeVolume]);

  useEffect(() => {
    if (training.metronomeEnabled && player.isPlaying && player.currentTrack) {
      const intervalMs = (60 / (player.currentTrack.bpm * player.playbackRate)) * 1000;
      if (metronomeIntervalRef.current) window.clearInterval(metronomeIntervalRef.current);
      metronomeIntervalRef.current = window.setInterval(playMetronomeTick, intervalMs);
      playMetronomeTick(); // First tick immediately
    } else {
      if (metronomeIntervalRef.current) {
        window.clearInterval(metronomeIntervalRef.current);
        metronomeIntervalRef.current = null;
      }
    }
    return () => { if (metronomeIntervalRef.current) window.clearInterval(metronomeIntervalRef.current); };
  }, [training.metronomeEnabled, player.isPlaying, player.currentTrack, player.playbackRate, playMetronomeTick]);

  return { isMetronomeVisualActive };
};
