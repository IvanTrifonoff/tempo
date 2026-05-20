import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Track, PlayerState, TrainingSettings } from '../types';

interface UsePlayerProps {
  tracks: Track[];
  training: TrainingSettings;
  setTraining: React.Dispatch<React.SetStateAction<TrainingSettings>>;
  initAudioCtx: () => Promise<AudioContext | null>;
  t: (key: string) => string;
  audioRef: React.RefObject<HTMLAudioElement>;
}

export const usePlayer = ({ tracks, training, setTraining, initAudioCtx, t, audioRef }: UsePlayerProps) => {
  const [player, setPlayer] = useState<PlayerState>({
    currentTrack: null,
    isPlaying: false,
    playbackRate: 1.0,
    currentTime: 0,
    duration: 0,
    volume: 0.8,
    isPauseCountdown: false,
    countdownValue: 0,
    isRepeat: false,
    isShuffle: false
  });

  const togglePlay = useCallback(async () => {
    if (training.metronomeEnabled || training.clapDetectionEnabled) {
        await initAudioCtx();
    }
    setPlayer(p => ({ ...p, isPlaying: !p.isPlaying, isPauseCountdown: false }));
  }, [initAudioCtx, training.metronomeEnabled, training.clapDetectionEnabled]);

  const selectTrack = useCallback(async (track: Track) => {
    if (training.metronomeEnabled || training.clapDetectionEnabled) {
        await initAudioCtx();
    }
    setPlayer(prev => ({ 
      ...prev, 
      currentTrack: track, 
      isPlaying: true,
      playbackRate: 1.0,
      currentTime: 0,
      duration: 0,
      isPauseCountdown: false 
    }));
  }, [initAudioCtx, training.metronomeEnabled, training.clapDetectionEnabled]);

  const skip = useCallback((direction: 'next' | 'prev') => {
    if (tracks.length === 0) return;
    const currentIndex = tracks.findIndex(t => t.id === player.currentTrack?.id);
    let nextIndex = currentIndex;

    if (player.isShuffle) {
        do {
            nextIndex = Math.floor(Math.random() * tracks.length);
        } while (nextIndex === currentIndex && tracks.length > 1);
    } else {
        nextIndex = direction === 'next' 
          ? (currentIndex + 1) % tracks.length 
          : (currentIndex - 1 + tracks.length) % tracks.length;
    }
    selectTrack(tracks[nextIndex]);
  }, [player.currentTrack, tracks, selectTrack, player.isShuffle]);

  const currentEffectiveBpm = useMemo(() => {
    if (!player.currentTrack) return 0;
    return Math.round(player.currentTrack.bpm * player.playbackRate * 10) / 10;
  }, [player.currentTrack, player.playbackRate]);

  const adjustBpmInPlayer = (delta: number) => {
    if (!player.currentTrack) return;
    const targetBpm = currentEffectiveBpm + delta;
    const newRate = targetBpm / player.currentTrack.bpm;
    setPlayer(p => ({ ...p, playbackRate: Math.max(0.5, Math.min(1.5, newRate)) }));
  };

  // --- Media Session API ---
  useEffect(() => {
    if ('mediaSession' in navigator && player.currentTrack) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: player.currentTrack.title || 'Unknown Title',
          artist: player.currentTrack.artist || 'Unknown Artist',
          album: t(`styles.${player.currentTrack.style}`) || 'Tempo',
          artwork: [
            { src: `${window.location.origin}/icon.svg`, sizes: '96x96', type: 'image/svg+xml' },
            { src: `${window.location.origin}/icon.svg`, sizes: '512x512', type: 'image/svg+xml' },
          ]
        });

        navigator.mediaSession.setActionHandler('play', async () => {
          await initAudioCtx();
          setPlayer(p => ({ ...p, isPlaying: true, isPauseCountdown: false }));
        });
        navigator.mediaSession.setActionHandler('pause', () => {
          setPlayer(p => ({ ...p, isPlaying: false }));
        });
        navigator.mediaSession.setActionHandler('previoustrack', () => skip('prev'));
        navigator.mediaSession.setActionHandler('nexttrack', () => skip('next'));
      } catch (e) {
        console.warn("Media Session API error:", e);
      }
    }
  }, [player.currentTrack, togglePlay, skip, t, initAudioCtx]);

  // --- Audio Element Control ---
  useEffect(() => {
    if (!audioRef.current || !player.currentTrack) return;
    audioRef.current.volume = player.volume;
    audioRef.current.playbackRate = player.playbackRate;
    if (player.isPlaying) {
      audioRef.current.play().catch(() => setPlayer(p => ({ ...p, isPlaying: false })));
    } else {
      audioRef.current.pause();
    }
  }, [player.isPlaying, player.currentTrack?.id, player.playbackRate, player.volume]);

  // --- Autopilot / Coach Pause ---
  useEffect(() => {
    if (training.isActive && player.isPlaying && training.trackDurationLimit > 0) {
      if (player.currentTime >= training.trackDurationLimit) {
        setPlayer(p => ({ ...p, isPlaying: false, isPauseCountdown: true, countdownValue: training.pauseDuration }));
      }
    }
  }, [player.currentTime, training.isActive, training.trackDurationLimit, player.isPlaying]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (player.isPauseCountdown && player.countdownValue > 0) {
      timer = setTimeout(() => {
        setPlayer(p => ({ ...p, countdownValue: p.countdownValue - 1 }));
      }, 1000);
    } else if (player.isPauseCountdown && player.countdownValue === 0) {
      if (player.isRepeat) {
        setPlayer(p => ({ 
            ...p, 
            isPlaying: true, 
            isPauseCountdown: false,
            currentTime: 0 
        }));
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(console.error);
        }
      } else {
        skip('next');
      }
    }
    return () => { if (timer) clearTimeout(timer); };
  }, [player.isPauseCountdown, player.countdownValue, skip, player.isRepeat]);

  return { player, setPlayer, togglePlay, selectTrack, skip, adjustBpmInPlayer, currentEffectiveBpm };
};
