import React, { createContext, useContext, useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Track, PlayerState, TrainingSettings } from '../types';
import { useAuth } from './AuthContext';
import { useTrackContext } from './TrackContext';
import { useAudioContext } from '../hooks/useAudioContext';
import { useMetronome } from '../hooks/useMetronome';
import { offlineStorage } from '../services/offlineStorage';
import { tracksApi } from '../services/api/tracksApi';
import { handleApiError } from '../services/api/errors';

interface PlayerContextValue {
  player: PlayerState;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerState>>;
  training: TrainingSettings;
  setTraining: React.Dispatch<React.SetStateAction<TrainingSettings>>;
  audioRef: React.RefObject<HTMLAudioElement>;
  isMetronomeVisualActive: boolean;
  isPlayerVisible: boolean;
  setIsPlayerVisible: (visible: boolean) => void;
  togglePlay: () => Promise<void>;
  selectTrack: (track: Track) => Promise<void>;
  skip: (direction: 'next' | 'prev') => void;
  adjustBpmInPlayer: (delta: number) => void;
  currentEffectiveBpm: number;
  setPlaybackRate: (rate: number) => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation();
  const { token } = useAuth();
  const { filteredTracks } = useTrackContext();

  // --- Audio Hooks ---
  const { audioCtxRef, resumeAudioContext, connectAudioElement } = useAudioContext();

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isPlayerVisible, setIsPlayerVisible] = useState(true);

  const [training, setTraining] = useState<TrainingSettings>({
    isActive: false,
    trackDurationLimit: 90,
    pauseDuration: 15,
    metronomeEnabled: false,
    metronomeVolume: 0.9
  });

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

  // --- Metronome Hook ---
  const { isMetronomeVisualActive } = useMetronome({
    audioCtxRef,
    training,
    player
  });

  // --- Connect audio element ---
  useEffect(() => {
    if (audioRef.current) {
      connectAudioElement(audioRef.current);
    }
  }, [connectAudioElement, audioRef.current]);

  // --- logPlay helper ---
  const logPlay = useCallback(async (trackId: string) => {
    try {
      await tracksApi.logPlay(token, trackId);
    } catch (e) {
      handleApiError(e, { operation: 'logPlay' });
    }
  }, [token]);

  // --- Player actions ---
  const togglePlay = useCallback(async () => {
    await resumeAudioContext();
    const willStartPlaying = !player.isPlaying;
    if (willStartPlaying && player.currentTrack) {
      logPlay(player.currentTrack.id);
    }
    setPlayer(p => ({ ...p, isPlaying: !p.isPlaying, isPauseCountdown: false }));
  }, [resumeAudioContext, logPlay, player.isPlaying, player.currentTrack]);

  const selectTrack = useCallback(async (track: Track) => {
    await resumeAudioContext();

    if (!track?.url) return;

    let finalUrl = track.url;
    try {
      if (await offlineStorage.isTrackDownloaded(track.url)) {
        finalUrl = await offlineStorage.getTrackUrl(track.url);
      }
    } catch (e) {
      console.warn("Offline URL resolution failed", e);
    }

    setPlayer(prev => ({
      ...prev,
      currentTrack: { ...track, url: finalUrl },
      isPlaying: true,
      playbackRate: 1.0,
      currentTime: 0,
      duration: 0,
      isPauseCountdown: false
    }));
    setIsPlayerVisible(true);
    logPlay(track.id);
  }, [resumeAudioContext, logPlay]);

  const skip = useCallback(async (direction: 'next' | 'prev') => {
    if (filteredTracks.length === 0) return;
    const currentIndex = filteredTracks.findIndex(t => t.id === player.currentTrack?.id);
    let nextIndex = currentIndex;

    if (player.isShuffle) {
      do {
        nextIndex = Math.floor(Math.random() * filteredTracks.length);
      } while (nextIndex === currentIndex && filteredTracks.length > 1);
    } else {
      nextIndex = direction === 'next'
        ? (currentIndex + 1) % filteredTracks.length
        : (currentIndex - 1 + filteredTracks.length) % filteredTracks.length;
    }
    await selectTrack(filteredTracks[nextIndex]);
  }, [player.currentTrack, filteredTracks, selectTrack, player.isShuffle]);

  const currentEffectiveBpm = useMemo(() => {
    if (!player.currentTrack) return 0;
    return Math.round(player.currentTrack.bpm * player.playbackRate * 10) / 10;
  }, [player.currentTrack, player.playbackRate]);

  const adjustBpmInPlayer = useCallback((delta: number) => {
    if (!player.currentTrack) return;
    const targetBpm = currentEffectiveBpm + delta;
    const newRate = targetBpm / player.currentTrack.bpm;
    setPlayer(p => ({ ...p, playbackRate: Math.max(0.5, Math.min(1.5, newRate)) }));
  }, [player.currentTrack, currentEffectiveBpm]);

  const setPlaybackRate = useCallback((rate: number) => {
    setPlayer(p => ({ ...p, playbackRate: Math.max(0.5, Math.min(1.5, rate)) }));
  }, []);

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
          await resumeAudioContext();
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
  }, [player.currentTrack, t, resumeAudioContext, skip]);

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

  // --- Training pause ---
  useEffect(() => {
    if (training.isActive && player.isPlaying && training.trackDurationLimit > 0) {
      if (player.currentTime >= training.trackDurationLimit) {
        setPlayer(p => ({ ...p, isPlaying: false, isPauseCountdown: true, countdownValue: training.pauseDuration }));
      }
    }
  }, [player.currentTime, training.isActive, training.trackDurationLimit, player.isPlaying]);

  // --- Training countdown timer ---
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (player.isPauseCountdown && player.countdownValue > 0) {
      timer = setTimeout(() => {
        setPlayer(p => ({ ...p, countdownValue: p.countdownValue - 1 }));
      }, 1000);
    } else if (player.isPauseCountdown && player.countdownValue === 0) {
      if (player.isRepeat) {
        setPlayer(p => ({ ...p, isPlaying: true, isPauseCountdown: false, currentTime: 0 }));
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

  return (
    <PlayerContext.Provider value={{
      player, setPlayer,
      training, setTraining,
      audioRef,
      isMetronomeVisualActive,
      isPlayerVisible, setIsPlayerVisible,
      togglePlay, selectTrack, skip,
      adjustBpmInPlayer, currentEffectiveBpm, setPlaybackRate
    }}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayerContext = (): PlayerContextValue => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayerContext must be used within a PlayerProvider');
  }
  return context;
};
