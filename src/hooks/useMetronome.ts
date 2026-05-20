import { useRef, useState, useCallback, useEffect } from 'react';
import { TrainingSettings, PlayerState } from '../types';

interface UseMetronomeProps {
  audioCtxRef: React.MutableRefObject<AudioContext | null>;
  training: TrainingSettings;
  player: PlayerState;
}

export const useMetronome = ({ audioCtxRef, training, player }: UseMetronomeProps) => {
  const metronomeIntervalRef = useRef<number | null>(null);
  const [isMetronomeVisualActive, setIsMetronomeVisualActive] = useState(false);

  const playMetronomeTick = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx || ctx.state !== 'running') return;

    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    // Woodblock-like sound settings
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.02);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(training.metronomeVolume, now + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.start(now);
    osc.stop(now + 0.06);

    // Visual feedback
    setIsMetronomeVisualActive(true);
    setTimeout(() => setIsMetronomeVisualActive(false), 50);
  }, [audioCtxRef, training.metronomeVolume]);

  useEffect(() => {
    if (training.metronomeEnabled && player.isPlaying && player.currentTrack) {
      // Calculate interval: 60000ms / BPM / PlaybackRate
      const intervalMs = (60 / (player.currentTrack.bpm * player.playbackRate)) * 1000;

      if (metronomeIntervalRef.current) window.clearInterval(metronomeIntervalRef.current);
      metronomeIntervalRef.current = window.setInterval(playMetronomeTick, intervalMs);

      playMetronomeTick(); // Play first tick immediately
    } else {
      if (metronomeIntervalRef.current) {
        window.clearInterval(metronomeIntervalRef.current);
        metronomeIntervalRef.current = null;
      }
    }
    return () => {
      if (metronomeIntervalRef.current) window.clearInterval(metronomeIntervalRef.current);
    };
  }, [training.metronomeEnabled, player.isPlaying, player.currentTrack, player.playbackRate, playMetronomeTick]);

  return { isMetronomeVisualActive };
};
