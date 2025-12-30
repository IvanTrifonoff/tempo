import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DanceStyle, Track, User, PlayerState, Playlist, TrainingSettings } from './types';
import { 
  PlayIcon, PauseIcon, SkipForward, SkipBack, SettingsIcon, 
  PlusIcon, UserIcon, HeartIcon, PlaylistIcon, 
  MetronomeIcon, TrashIcon, RepeatIcon, ShuffleIcon, WhistleIcon,
  ShieldCheckIcon, PencilIcon
} from './components/Icons';
import { STYLE_COLORS, APP_VERSION } from './constants';
import AdminPanel from './components/AdminPanel';
import AuthModal from './components/AuthModal';
import AddToPlaylistModal from './components/AddToPlaylistModal';
import UserManagementModal from './components/UserManagementModal';
import ClapDetector from './components/ClapDetector';
import ReloadPrompt from './components/ReloadPrompt';
import EditTrackModal from './components/EditTrackModal';

import UpdateNotification from './components/UpdateNotification';

const App: React.FC = () => {
  const { t, i18n } = useTranslation();
  
  // --- Состояние приложения ---
  const [tracks, setTracks] = useState<Track[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [activeStyle, setActiveStyle] = useState<DanceStyle | 'All' | 'Favorites' | string>('All');
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  
  const [showAdmin, setShowAdmin] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showPlaylistCreator, setShowPlaylistCreator] = useState(false);
  const [showTrainingPanel, setShowTrainingPanel] = useState(false);
  
  const [trackToEdit, setTrackToEdit] = useState<Track | null>(null);

  const [isPlayerVisible, setIsPlayerVisible] = useState(true);
  const [playlistModalTrackId, setPlaylistModalTrackId] = useState<string | null>(null);
  const [micLevel, setMicLevel] = useState(0);
  const [showFlash, setShowFlash] = useState(false);
  
  const [audioInputs, setAudioInputs] = useState<MediaDeviceInfo[]>([]);
  const [audioOutputs, setAudioOutputs] = useState<MediaDeviceInfo[]>([]);
  const [selectedInputId, setSelectedInputId] = useState<string>('');
  const [selectedOutputId, setSelectedOutputId] = useState<string>('');
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    'Notification' in window ? Notification.permission : 'default'
  );
  
  const [training, setTraining] = useState<TrainingSettings>({
    isActive: false,
    trackDurationLimit: 90,
    pauseDuration: 15,
    metronomeEnabled: false,
    metronomeVolume: 0.9,
    clapDetectionEnabled: false,
    clapSensitivity: 60
  });

  // --- Notification Permission ---
  const handleRequestNotification = async () => {
    if (!('Notification' in window)) return;
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
  };

  // --- Wake Lock ---
  useEffect(() => {
    let wakeLock: any = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err) { console.error(err); }
    };
    
    const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') requestWakeLock();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    requestWakeLock();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLock) wakeLock.release();
    };
  }, []);

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

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const metronomeIntervalRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const musicSourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const [isMetronomeVisualActive, setIsMetronomeVisualActive] = useState(false);

  // --- Check Auth on Load ---
  useEffect(() => {
    if (token) {
        fetch('/api/auth/me', { headers: { 'Authorization': `Bearer ${token}` } })
            .then(res => {
                if (res.ok) return res.json();
                throw new Error('Invalid token');
            })
            .then(u => setUser(u))
            .catch(() => {
                localStorage.removeItem('token');
                setToken(null);
                setUser(null);
            });
    }
  }, [token]);

  const handleLogin = (newUser: User, newToken: string) => {
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(newUser);
      setShowAuth(false);
  };

  const handleLogout = () => {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
  };

  const copyInviteLink = () => {
    if (!user) return;
    const link = `${window.location.origin}/?invite=${user.id}`;
    navigator.clipboard.writeText(link);
    alert(t('app.inviteCopied') || 'Invite link copied to clipboard!');
  };

  // --- Data Loading ---
  useEffect(() => {
    fetch('/api/tracks')
      .then(res => res.json())
      .then(data => setTracks(data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (token) {
      fetch('/api/playlists', { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => Array.isArray(data) ? setPlaylists(data) : setPlaylists([]))
        .catch(console.error);
    } else {
      setPlaylists([]);
    }
  }, [token]);

  const handleAddTrack = async (formData: FormData) => {
    if (!token) return;
    const res = await fetch('/api/tracks', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
    });
    if (!res.ok) throw new Error('Upload failed');
    const newTrack = await res.json();
    setTracks(prev => [newTrack, ...prev]);
  };

  // --- Audio Context ---
  const initAudioCtx = useCallback(async () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 44100,
        latencyHint: 'playback'
      });
    }
    
    if (audioCtxRef.current.state === 'suspended') {
      await audioCtxRef.current.resume();
    }

    if (audioRef.current && !musicSourceNodeRef.current && audioCtxRef.current) {
        try {
            const source = audioCtxRef.current.createMediaElementSource(audioRef.current);
            source.connect(audioCtxRef.current.destination);
            musicSourceNodeRef.current = source;
            console.log("Music routed through unified AudioContext");
        } catch (e) {
            console.warn("Music routing issue:", e);
        }
    }
    
    return audioCtxRef.current;
  }, []);

  useEffect(() => {
    const manageMic = async () => {
        if (training.clapDetectionEnabled) {
            if (!micStreamRef.current) {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ 
                        audio: { 
                            echoCancellation: false, 
                            noiseSuppression: false, 
                            autoGainControl: false,
                            sampleRate: 44100,
                            deviceId: selectedInputId ? { exact: selectedInputId } : undefined
                        } 
                    });
                    micStreamRef.current = stream;
                    setMicLevel(0.00001);
                    // Ensure audio context is ready when enabling clap detection
                    await initAudioCtx();
                } catch (err) {
                    setTraining(t => ({ ...t, clapDetectionEnabled: false }));
                }
            }
        } else {
            if (micStreamRef.current) {
                micStreamRef.current.getTracks().forEach(track => {
                    track.stop();
                    track.enabled = false;
                });
                micStreamRef.current = null;
                setMicLevel(0);
            }
        }
    };
    manageMic();
  }, [training.clapDetectionEnabled, selectedInputId, initAudioCtx]);

  const filteredTracks = useMemo(() => {
    if (activeStyle === 'All') return tracks;
    if (activeStyle === 'Favorites') return tracks.filter(t => user?.favorites.includes(t.id));
    const playlist = playlists.find(p => p.id === activeStyle);
    if (playlist) return tracks.filter(t => playlist.trackIds.includes(t.id));
    return tracks.filter(t => t.style === activeStyle);
  }, [activeStyle, tracks, user?.favorites, playlists]);

  // --- Metronome ---
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
    // Start slightly high and drop pitch quickly for percussive effect
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.02);
    
    // Short, sharp envelope
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(training.metronomeVolume, now + 0.002); // Fast attack
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05); // Fast decay
    
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
      playMetronomeTick();
    } else {
      if (metronomeIntervalRef.current) {
        window.clearInterval(metronomeIntervalRef.current);
        metronomeIntervalRef.current = null;
      }
    }
    return () => { if (metronomeIntervalRef.current) window.clearInterval(metronomeIntervalRef.current); };
  }, [training.metronomeEnabled, player.isPlaying, player.currentTrack, player.playbackRate, playMetronomeTick]);

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
    setIsPlayerVisible(true);
  }, [initAudioCtx]);

  const skip = useCallback((direction: 'next' | 'prev') => {
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
    selectTrack(filteredTracks[nextIndex]);
  }, [player.currentTrack, filteredTracks, selectTrack, player.isShuffle]);

  // --- Media Session API (Background Play) ---
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

  // --- Data Loading ---
  useEffect(() => {
    const headers: any = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    fetch('/api/tracks', { headers })
      .then(res => res.json())
      .then(data => {
          if (Array.isArray(data)) setTracks(data);
          else console.error("Invalid tracks data:", data);
      })
      .catch(console.error);
  }, [token]);

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

  const toggleTrackInPlaylist = async (playlistId: string, isAdding: boolean) => {
    if (!token || !playlistModalTrackId) return;
    
    setPlaylists(prev => prev.map(p => {
        if (p.id !== playlistId) return p;
        return {
            ...p,
            trackIds: isAdding 
                ? [...p.trackIds, playlistModalTrackId] 
                : p.trackIds.filter(id => id !== playlistModalTrackId)
        };
    }));

    try {
        const method = isAdding ? 'POST' : 'DELETE';
        const url = isAdding 
            ? `/api/playlists/${playlistId}/tracks`
            : `/api/playlists/${playlistId}/tracks/${playlistModalTrackId}`;
            
        const body = isAdding ? JSON.stringify({ trackId: playlistModalTrackId }) : undefined;

        await fetch(url, {
            method,
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body
        });
    } catch (e) {
        console.error(e);
    }
  };

  const toggleFavorite = async (trackId: string) => {
    if (!token) { setShowAuth(true); return; }
    try {
        const res = await fetch('/api/user/favorites', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ trackId })
        });
        const newFavs = await res.json();
        setUser(u => u ? { ...u, favorites: newFavs } : null);
    } catch (err) { console.error(err); }
  };

  const handleSaveTrack = async (trackId: string, data: Partial<Track>) => {
      if (!token) return;
      
      // Optimistic update
      setTracks(prev => prev.map(t => t.id === trackId ? { ...t, ...data } : t));

      try {
          await fetch(`/api/tracks/${trackId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify(data)
          });
      } catch (e) { console.error(e); }
  };

  const deleteTrack = (trackId: string) => {
    if (!token) return;
    if (confirm(t('confirm.deleteTrack'))) {
      setTracks(prev => prev.filter(t => t.id !== trackId));
      if (player.currentTrack?.id === trackId) {
        setPlayer(p => ({ ...p, currentTrack: null, isPlaying: false }));
      }
      fetch(`/api/tracks/${trackId}`, { 
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
      }).catch(console.error);
    }
  };

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

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const loadDevices = useCallback(async () => {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        setAudioInputs(devices.filter(d => d.kind === 'audioinput'));
        setAudioOutputs(devices.filter(d => d.kind === 'audiooutput'));
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    if (showTrainingPanel) {
      loadDevices();
    }
    navigator.mediaDevices.addEventListener('devicechange', loadDevices);
    return () => navigator.mediaDevices.removeEventListener('devicechange', loadDevices);
  }, [loadDevices, showTrainingPanel]);

  useEffect(() => {
      if (training.clapDetectionEnabled) {
          // Wait for permission grant in ClapDetector
          const timer = setTimeout(loadDevices, 2000);
          return () => clearTimeout(timer);
      }
  }, [training.clapDetectionEnabled, loadDevices]);

  useEffect(() => {
    if (audioRef.current && selectedOutputId && (audioRef.current as any).setSinkId) {
        (audioRef.current as any).setSinkId(selectedOutputId).catch(console.error);
    }
  }, [selectedOutputId]);

  const handleClapAction = useCallback(() => {
      togglePlay();
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 200);
  }, [togglePlay]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-40">
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-white/10 px-4 py-2 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-serif font-bold tracking-tight text-white hidden sm:block">{t('app.title')}</h1>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <button 
            onClick={() => setTraining(t => ({...t, metronomeEnabled: !t.metronomeEnabled}))}
            className={`p-1.5 md:px-3 md:py-1.5 rounded-full border transition-all duration-300 flex items-center gap-2 ${training.metronomeEnabled ? 'bg-yellow-500 text-black border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.4)]' : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'}`}
          >
            <MetronomeIcon />
            <span className="hidden md:inline font-bold text-sm">{t('app.metronome')}</span>
          </button>

          <button 
            onClick={() => setShowTrainingPanel(true)}
            className={`flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-1.5 rounded-full border transition-all duration-300 ${training.isActive ? 'bg-yellow-500 text-black border-yellow-500 shadow-lg' : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'}`}
          >
            <WhistleIcon />
            <span className="hidden md:inline font-bold text-sm tracking-tight">{t('app.coachMode')}</span>
          </button>

          <button 
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2 p-2 md:px-3 md:py-1.5 rounded-full border border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 transition-all"
          >
            <SettingsIcon />
            <span className="hidden md:inline font-bold text-sm tracking-tight">{t('app.settings')}</span>
          </button>

          {user?.role === 'admin' && (
            <button 
              onClick={() => setShowUserManagement(true)}
              className="flex items-center gap-2 p-2 md:px-3 md:py-1.5 rounded-full border border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 transition-all"
            >
              <ShieldCheckIcon />
              <span className="hidden md:inline font-bold text-sm tracking-tight">{t('app.adminUsers')}</span>
            </button>
          )}
          
          {(user?.role === 'admin' || user?.role === 'coach' || user?.isAdmin) && (
            <button onClick={() => setShowAdmin(true)} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full border border-white/10 transition text-sm">
              <PlusIcon /> <span className="hidden md:inline">{t('app.upload')}</span>
            </button>
          )}
          
          <button onClick={() => user ? handleLogout() : setShowAuth(true)} className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black px-3 py-1.5 md:px-4 md:py-1.5 rounded-full font-bold transition shadow-md text-sm">
            <UserIcon /> <span className="hidden xs:inline">{user ? t('app.logout') : t('app.login')}</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 pt-4">
        <div className="mb-4 flex flex-wrap gap-1.5 items-center">
          <button onClick={() => setActiveStyle('All')} className={`px-3 py-1.5 text-sm rounded-full transition ${activeStyle === 'All' ? 'bg-yellow-500 text-black' : 'bg-white/5 text-gray-400 border border-white/10'}`}>{t('app.all')}</button>
          <button onClick={() => setActiveStyle('Favorites')} className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-full transition ${activeStyle === 'Favorites' ? 'bg-rose-500 text-white' : 'bg-white/5 text-gray-400 border border-white/10'}`}><HeartIcon filled={activeStyle === 'Favorites'} /> {t('app.favorites')}</button>
          <div className="h-4 w-[1px] bg-white/10 mx-1" />
          {Object.values(DanceStyle).map(style => (
            <button key={style} onClick={() => setActiveStyle(style)} className={`px-3 py-1.5 text-sm rounded-full transition ${activeStyle === style ? 'bg-yellow-500 text-black shadow-md' : 'bg-white/5 text-gray-400 border border-white/10'}`}>{t(`styles.${style}`)}</button>
          ))}
          <div className="h-4 w-[1px] bg-white/10 mx-1" />
          {playlists.map(pl => (
            <div key={pl.id} className="relative group">
              <button onClick={() => setActiveStyle(pl.id)} className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-full transition ${activeStyle === pl.id ? 'bg-indigo-500 text-white shadow-md' : 'bg-white/5 text-gray-400 border border-white/10'}`}><PlaylistIcon /> {pl.name}</button>
              <button 
                onClick={(e) => { 
                    e.stopPropagation(); 
                    if (token) {
                        fetch(`/api/playlists/${pl.id}`, { 
                            method: 'DELETE', 
                            headers: { 'Authorization': `Bearer ${token}` } 
                        })
                        .then(() => {
                            setPlaylists(prev => prev.filter(p => p.id !== pl.id)); 
                            if (activeStyle === pl.id) setActiveStyle('All');
                        })
                        .catch(console.error);
                    }
                }} 
                className="absolute -top-1 -right-1 bg-red-500 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition shadow-lg scale-75"
              >
                <TrashIcon />
              </button>
            </div>
          ))}
          <button onClick={() => user ? setShowPlaylistCreator(true) : setShowAuth(true)} className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-full bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 transition border-dashed"><PlusIcon /> {t('app.playlist')}</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredTracks.map(track => {
            const isThisCurrent = player.currentTrack?.id === track.id;
            return (
              <div 
                key={track.id} 
                onClick={() => isThisCurrent ? togglePlay() : selectTrack(track)} 
                className={`group relative overflow-hidden bg-[#141414] border border-white/10 rounded-2xl p-3 hover:border-yellow-500/50 transition-all duration-300 cursor-pointer ${isThisCurrent ? 'border-yellow-500 ring-1 ring-yellow-500 shadow-[0_0_25px_rgba(234,179,8,0.15)] bg-yellow-500/5' : ''}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded shadow-sm ${STYLE_COLORS[track.style]}`}>{t(`styles.${track.style}`)}</span>
                  <div className="flex items-center gap-2">
                     {user?.isAdmin && (
                       <button 
                        onClick={(e) => { e.stopPropagation(); deleteTrack(track.id); }} 
                        className="text-gray-400 hover:text-red-500 transition-all p-1"
                       >
                         <TrashIcon />
                       </button>
                     )}
                     <button onClick={(e) => { e.stopPropagation(); if(user) setPlaylistModalTrackId(track.id); else setShowAuth(true); }} className="text-gray-600 hover:text-indigo-400 transition-transform hover:scale-110 p-1"><PlusIcon /></button>
                     <button onClick={(e) => { e.stopPropagation(); toggleFavorite(track.id); }} className={`transition-transform hover:scale-110 p-1 ${user?.favorites.includes(track.id) ? 'text-rose-500' : 'text-gray-600 hover:text-rose-400'}`}><HeartIcon filled={user?.favorites.includes(track.id)} /></button>
                    <div className="flex items-center gap-1 bg-black/30 px-2 py-0.5 rounded-md" onClick={e => e.stopPropagation()}>
                      <span className="text-gray-300 text-sm font-mono">{track.bpm} BPM</span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-end">
                  <div className="min-w-0 pr-8 flex-1">
                    <h3 className="text-base font-bold text-white mb-0.5 group-hover:text-yellow-500 transition truncate leading-tight">{track.title}</h3>
                    <p className="text-gray-400 text-sm truncate">{track.artist}</p>
                  </div>
                  {isThisCurrent && training.metronomeEnabled && (
                    <div className={`w-2 h-2 rounded-full transition-all duration-75 flex-shrink-0 ${isMetronomeVisualActive ? 'bg-yellow-500 scale-150 shadow-[0_0_10px_#eab308]' : 'bg-yellow-500/20'}`}></div>
                  )}
                </div>
                
                {/* Edit Button */}
                {(user?.isAdmin || user?.id === track.ownerId) && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); setTrackToEdit(track); }}
                        className="absolute bottom-2 right-2 p-1.5 bg-black/60 hover:bg-yellow-500 text-gray-400 hover:text-black rounded-lg transition-all backdrop-blur-sm opacity-0 group-hover:opacity-100 z-10"
                    >
                        <PencilIcon />
                    </button>
                )}

                {/* Play/Pause Overlay Icon */}
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 pointer-events-none 
                  ${isThisCurrent && player.isPlaying 
                    ? 'bg-yellow-500/80 text-black scale-100 backdrop-blur-sm' // Playing state
                    : 'bg-black/60 text-white scale-0 group-hover:scale-100' // Paused/Hover state
                  }`}
                >
                  {isThisCurrent && player.isPlaying ? <PauseIcon /> : <PlayIcon />}
                </div>

              </div>
            );
          })}
        </div>
      </main>

      {/* Floating Player */}
      {player.currentTrack && isPlayerVisible && (
        <div className="fixed bottom-0 inset-x-0 z-50 bg-black/90 backdrop-blur-2xl border-t border-white/10 px-6 py-4 lg:py-6 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom duration-300">
          <div className="max-w-7xl mx-auto relative">
            <button 
              onClick={() => setIsPlayerVisible(false)}
              className="absolute -top-12 right-0 bg-black/80 text-gray-400 hover:text-white p-2 rounded-t-xl border-t border-x border-white/10 flex items-center gap-2 text-xs font-bold transition-all"
            >
              {t('player.hide')} <span>▼</span>
            </button>

            <div className="flex flex-col gap-4">
              {player.isPauseCountdown && (
                <div className="flex items-center justify-center gap-4 py-3 bg-yellow-500/20 border border-yellow-500/40 rounded-2xl animate-pulse shadow-lg">
                  <div className="text-yellow-500 font-black text-3xl font-mono">{player.countdownValue}</div>
                  <div className="flex flex-col leading-none text-left">
                    <span className="text-yellow-500 font-bold uppercase tracking-widest text-xs">{t('player.pauseCoach')}</span>
                    <span className="text-white/60 text-[10px] font-medium">{t('player.nextDance')}</span>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 lg:grid-cols-3 items-center gap-6">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center ${STYLE_COLORS[player.currentTrack.style]} text-white shadow-2xl relative overflow-hidden`}>
                     <div className="absolute inset-0 bg-black/20"></div>
                     <MetronomeIcon />
                  </div>
                  <div className="min-w-0 text-left">
                    <h4 className="text-white font-bold truncate text-lg leading-tight">{player.currentTrack.title}</h4>
                    <p className="text-gray-400 text-sm truncate">{player.currentTrack.artist} • {t(`styles.${player.currentTrack.style}`)}</p>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center gap-4">
                    <button onClick={() => setPlayer(p => ({...p, isShuffle: !p.isShuffle}))} className="text-gray-500 hover:text-white transition-all"><ShuffleIcon active={player.isShuffle} /></button>
                    <button onClick={() => skip('prev')} className="text-gray-500 hover:text-white transition-all hover:scale-110"><SkipBack /></button>
                    <button onClick={togglePlay} className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-black hover:scale-110 active:scale-95 transition-all shadow-xl">
                      {player.isPlaying ? <PauseIcon /> : <PlayIcon />}
                    </button>
                    <button onClick={() => skip('next')} className="text-gray-500 hover:text-white transition-all hover:scale-110"><SkipForward /></button>
                    <button onClick={() => setPlayer(p => ({...p, isRepeat: !p.isRepeat}))} className="text-gray-500 hover:text-white transition-all"><RepeatIcon active={player.isRepeat} /></button>
                  </div>
                  
                  <div className="w-full flex items-center gap-3 text-[11px] font-mono text-gray-500 font-bold">
                    <span>{Math.floor(player.currentTime / 60)}:{(Math.floor(player.currentTime % 60)).toString().padStart(2, '0')}</span>
                    <div className="relative flex-1 h-2 rounded-full bg-white/5 overflow-hidden group">
                      <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-yellow-600 to-yellow-400 transition-all duration-100 shadow-[0_0_10px_rgba(234,179,8,0.3)]" style={{ width: `${(player.currentTime / (player.duration || 1)) * 100}%` }} />
                      <input type="range" min="0" max={player.duration || 0} value={player.currentTime} onChange={e => { if (audioRef.current) audioRef.current.currentTime = Number(e.target.value); }} className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    </div>
                    <span>{Math.floor(player.duration / 60)}:{(Math.floor(player.duration % 60)).toString().padStart(2, '0')}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-6">
                  <div className="flex flex-col items-center bg-white/5 rounded-xl p-2 border border-white/10 shadow-inner">
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{t('player.bpm')}</span>
                      <button 
                        onClick={() => setTraining(t => ({...t, metronomeEnabled: !t.metronomeEnabled}))}
                        className={`transition-colors ${training.metronomeEnabled ? 'text-yellow-500' : 'text-gray-600'}`}
                      >
                        <MetronomeIcon />
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => adjustBpmInPlayer(-1)} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold transition flex items-center justify-center shadow-md">-</button>
                      <div className="flex flex-col items-center min-w-[50px]">
                        <span className="text-yellow-500 font-black text-xl leading-none">{currentEffectiveBpm}</span>
                        <span className="text-[8px] text-gray-500 font-bold">{t('player.base')}: {player.currentTrack.bpm}</span>
                      </div>
                      <button onClick={() => adjustBpmInPlayer(1)} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold transition flex items-center justify-center shadow-md">+</button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 w-28">
                    <div className="flex justify-between text-[10px] text-gray-400 font-black uppercase tracking-tighter">
                      <span>{t('player.speed')}</span>
                      <span className="text-yellow-500">{(player.playbackRate * 100).toFixed(0)}%</span>
                    </div>
                    <input type="range" min="0.5" max="1.5" step="0.01" value={player.playbackRate} onChange={e => setPlayer(p => ({ ...p, playbackRate: Number(e.target.value) }))} className="w-full h-1.5 bg-white/10 rounded-full appearance-none accent-yellow-500 cursor-pointer" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mini Restore Button */}
      {player.currentTrack && !isPlayerVisible && (
        <button 
          onClick={() => setIsPlayerVisible(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-yellow-500 text-black rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all animate-bounce"
        >
          <PlayIcon />
        </button>
      )}

      <audio 
        ref={audioRef}
        crossOrigin="anonymous"
        src={player.currentTrack?.url}
        preload="metadata"
        onTimeUpdate={() => { if (audioRef.current) setPlayer(p => ({ ...p, currentTime: audioRef.current?.currentTime || 0, duration: audioRef.current?.duration || 0 })); }}
        onEnded={() => {
            if (player.isRepeat) {
                if (audioRef.current) {
                    audioRef.current.currentTime = 0;
                    audioRef.current.play().catch(console.error);
                }
            } else {
                skip('next');
            }
        }}
      />

      {/* TRAINING MODAL */}
      {showTrainingPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4 transition-all">
          <div className="bg-[#1a1a1a] border border-white/10 p-8 rounded-[2.5rem] w-full max-w-lg shadow-2xl relative overflow-hidden">
            <div className="flex justify-between items-start mb-10">
              <div>
                <h2 className="text-2xl font-serif text-white font-bold mb-1">{t('coach.title')}</h2>
                <p className="text-gray-500 text-sm font-medium">{t('coach.subtitle')}</p>
              </div>
              <button onClick={() => setShowTrainingPanel(false)} className="text-gray-400 hover:text-white text-3xl font-light">&times;</button>
            </div>
            <div className="space-y-6">
              {/* Autopilot Card */}
              <div className="p-6 bg-white/5 rounded-3xl border border-white/10 space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-white font-bold text-lg">{t('coach.autopilot')}</h4>
                    <p className="text-xs text-gray-500">{t('coach.autopilotDesc')}</p>
                  </div>
                  <button onClick={() => setTraining(t => ({ ...t, isActive: !t.isActive }))} className={`w-16 h-9 rounded-full transition-all p-1 flex items-center flex-shrink-0 ${training.isActive ? 'bg-yellow-500' : 'bg-white/10'}`}>
                    <div className={`w-7 h-7 rounded-full bg-black transition-all transform ${training.isActive ? 'translate-x-7' : 'translate-x-0'}`} />
                  </button>
                </div>
                
                {training.isActive && (
                  <div className="space-y-6 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div>
                      <div className="flex justify-between text-sm text-gray-300 mb-2"><span>{t('coach.danceDuration')}</span><span className="text-yellow-500">{training.trackDurationLimit}s</span></div>
                      <input type="range" min="30" max="300" step="15" value={training.trackDurationLimit} onChange={e => setTraining(t => ({ ...t, trackDurationLimit: Number(e.target.value) }))} className="w-full accent-yellow-500" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm text-gray-300 mb-2"><span>{t('coach.feedbackPause')}</span><span className="text-yellow-500">{training.pauseDuration}s</span></div>
                      <input type="range" min="5" max="60" step="5" value={training.pauseDuration} onChange={e => setTraining(t => ({ ...t, pauseDuration: Number(e.target.value) }))} className="w-full accent-yellow-500" />
                    </div>
                  </div>
                )}
              </div>

              {/* Clap Detection Card */}
              <div className="p-6 bg-white/5 rounded-3xl border border-white/10 space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-white font-bold text-lg">{t('coach.clapDetection')}</h4>
                    <p className="text-xs text-gray-500">{t('coach.clapDesc')}</p>
                  </div>
                  <button onClick={() => setTraining(t => ({ ...t, clapDetectionEnabled: !t.clapDetectionEnabled }))} className={`w-16 h-9 rounded-full transition-all p-1 flex items-center flex-shrink-0 ${training.clapDetectionEnabled ? 'bg-yellow-500' : 'bg-white/10'}`}>
                    <div className={`w-7 h-7 rounded-full bg-black transition-all transform ${training.clapDetectionEnabled ? 'translate-x-7' : 'translate-x-0'}`} />
                  </button>
                </div>
                {training.clapDetectionEnabled && (
                  <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex justify-between text-sm text-gray-300 mb-2"><span>{t('coach.sensitivity')}</span><span className="text-yellow-500">{training.clapSensitivity}%</span></div>
                      <input type="range" min="10" max="100" step="5" value={training.clapSensitivity} onChange={e => setTraining(t => ({ ...t, clapSensitivity: Number(e.target.value) }))} className="w-full accent-yellow-500" />
                      <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden mt-3">
                        <div className="h-full bg-green-500 transition-all duration-75" style={{ width: `${Math.min(100, micLevel * 100)}%` }} />
                      </div>
                      
                      <div className="pt-4 space-y-4 border-t border-white/10 mt-4">
                          <div className="relative">
                              <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1.5 ml-1">Microphone (Input)</label>
                              <select 
                                  value={selectedInputId} 
                                  onChange={e => setSelectedInputId(e.target.value)}
                                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-yellow-500 transition appearance-none"
                              >
                                  <option value="" className="bg-[#1a1a1a]">Auto / Default</option>
                                  {audioInputs.map(d => <option key={d.deviceId} value={d.deviceId} className="bg-[#1a1a1a]">{d.label || `Device ${d.deviceId.slice(0,5)}...`}</option>)}
                              </select>
                              <div className="absolute right-4 bottom-3.5 pointer-events-none text-gray-500 text-[10px]">▼</div>
                          </div>
                          
                          <div className="relative">
                              <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1.5 ml-1">Speakers (Output)</label>
                              <select 
                                  value={selectedOutputId} 
                                  onChange={e => setSelectedOutputId(e.target.value)}
                                  className={`w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-yellow-500 transition appearance-none ${audioOutputs.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                  disabled={audioOutputs.length === 0}
                              >
                                  {audioOutputs.length === 0 ? (
                                      <option>System Default (Not supported)</option>
                                  ) : (
                                      <>
                                        <option value="" className="bg-[#1a1a1a]">Default</option>
                                        {audioOutputs.map(d => <option key={d.deviceId} value={d.deviceId} className="bg-[#1a1a1a]">{d.label || `Device ${d.deviceId.slice(0,5)}...`}</option>)}
                                      </>
                                  )}
                              </select>
                              <div className="absolute right-4 bottom-3.5 pointer-events-none text-gray-500 text-[10px]">▼</div>
                          </div>
                      </div>
                  </div>
                )}
              </div>
            </div>
            <button onClick={() => setShowTrainingPanel(false)} className="w-full mt-12 py-5 bg-yellow-500 text-black font-black uppercase rounded-[1.5rem] hover:bg-yellow-400 transition-all">
              {t('coach.close')}
            </button>
          </div>
        </div>
      )}

      {/* SETTINGS MODAL */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4 transition-all">
          <div className="bg-[#1a1a1a] border border-white/10 p-8 rounded-[2.5rem] w-full max-w-lg shadow-2xl relative overflow-hidden">
            <div className="flex justify-between items-start mb-10">
              <div>
                <h2 className="text-2xl font-serif text-white font-bold mb-1">{t('app.settings')}</h2>
                <p className="text-gray-500 text-sm font-medium">Preferences & About</p>
              </div>
              <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-white text-3xl font-light">&times;</button>
            </div>
            <div className="space-y-6">
              {/* Language Selector */}
              <div className="p-6 bg-white/5 rounded-3xl border border-white/10 flex flex-col xs:flex-row items-center justify-between gap-4">
                 <div className="flex items-center gap-3 w-full xs:w-auto">
                   <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500 font-bold text-sm uppercase shrink-0">
                     {i18n.language ? i18n.language.slice(0,2) : 'EN'}
                   </div>
                   <div>
                     <h4 className="text-white font-bold text-lg">{t('app.language')}</h4>
                     <p className="text-xs text-gray-500">{t('app.languageDesc')}</p>
                   </div>
                 </div>
                 <div className="flex gap-1 bg-black/40 rounded-xl p-1 border border-white/5 w-full xs:w-auto justify-center">
                    {['en', 'es', 'ru'].map(lang => (
                        <button 
                           key={lang} 
                           onClick={() => i18n.changeLanguage(lang)}
                           className={`px-3 py-2 rounded-lg text-xs font-bold uppercase transition flex-1 xs:flex-none text-center ${i18n.language.startsWith(lang) ? 'bg-yellow-500 text-black shadow-md' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                        >
                            {lang}
                        </button>
                    ))}
                 </div>
              </div>

              {/* Notifications */}
              <div className="p-6 bg-white/5 rounded-3xl border border-white/10 flex flex-col xs:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 w-full xs:w-auto">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${notificationPermission === 'granted' ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-500'}`}>
                    🔔
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-lg">{t('app.notifications')}</h4>
                    <p className="text-xs text-gray-500">
                      {notificationPermission === 'granted' 
                        ? t('app.notificationsOn') 
                        : t('app.notificationsOff')}
                    </p>
                  </div>
                </div>
                {notificationPermission !== 'granted' && (
                  <button 
                    onClick={handleRequestNotification}
                    className="w-full xs:w-auto px-4 py-2 bg-yellow-500 text-black font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-yellow-400 transition whitespace-nowrap"
                  >
                    {t('app.enable')}
                  </button>
                )}
              </div>

              {/* Coach: Invite Student */}
              {user?.role === 'coach' && (
                <div className="p-6 bg-yellow-500/10 rounded-3xl border border-yellow-500/20 flex flex-col xs:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3 w-full xs:w-auto text-left">
                    <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center text-black text-xl shrink-0">
                      👥
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-lg">{t('app.inviteTitle') || 'Invite Students'}</h4>
                      <p className="text-xs text-gray-500">{t('app.inviteDesc') || 'Students register via your link'}</p>
                    </div>
                  </div>
                  <button 
                    onClick={copyInviteLink}
                    className="w-full xs:w-auto px-6 py-2.5 bg-yellow-500 text-black font-black rounded-xl text-xs uppercase tracking-widest hover:bg-yellow-400 transition whitespace-nowrap shadow-lg shadow-yellow-500/20"
                  >
                    {t('app.copyLink') || 'Copy Link'}
                  </button>
                </div>
              )}
            </div>
            <button onClick={() => setShowSettings(false)} className="w-full mt-12 py-5 bg-white/5 text-white font-bold uppercase rounded-[1.5rem] hover:bg-white/10 transition-all border border-white/10">
              {t('pwa.close')}
            </button>
            <div className="mt-8 text-[10px] text-gray-600 text-center uppercase tracking-widest font-bold">
                v{APP_VERSION} • tempo.TRFNV
            </div>
          </div>
        </div>
      )}

      {showPlaylistCreator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4 animate-in fade-in duration-200">
          <div className="bg-[#1a1a1a] border border-white/10 p-8 rounded-[2rem] w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-serif text-white mb-6 text-center">{t('app.newPlaylist')}</h2>
            <form onSubmit={(e) => { 
                e.preventDefault(); 
                const name = (e.target as any).playlistName.value; 
                if (name && token) { 
                    fetch('/api/playlists', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ name })
                    })
                    .then(res => res.json())
                    .then(newPl => setPlaylists(prev => [...prev, newPl]))
                    .catch(console.error);
                    setShowPlaylistCreator(false); 
                } 
            }}>
              <input 
                name="playlistName" 
                type="text" 
                autoFocus 
                required 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white mb-8 outline-none focus:border-yellow-500 transition select-text placeholder:text-gray-600" 
                placeholder={t('app.playlistName')} 
              />
              <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowPlaylistCreator(false)} 
                  className="flex-1 py-3.5 rounded-xl text-gray-400 font-bold hover:bg-white/5 hover:text-white transition uppercase text-xs tracking-wider"
                >
                  {t('app.cancel')}
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3.5 bg-yellow-500 text-black font-bold rounded-xl hover:bg-yellow-400 transition uppercase text-xs tracking-wider shadow-lg"
                >
                  {t('app.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className={`fixed inset-0 bg-white z-40 pointer-events-none transition-opacity duration-200 ease-out ${showFlash ? 'opacity-20' : 'opacity-0'}`} />
      
      {showAdmin && <AdminPanel onAddTrack={handleAddTrack} onClose={() => setShowAdmin(false)} />}
      {showUserManagement && <UserManagementModal onClose={() => setShowUserManagement(false)} />}
      {showAuth && <AuthModal onLogin={handleLogin} onClose={() => setShowAuth(false)} />}
      {playlistModalTrackId && (
        <AddToPlaylistModal 
            playlists={playlists} 
            trackId={playlistModalTrackId} 
            onClose={() => setPlaylistModalTrackId(null)} 
            onToggle={toggleTrackInPlaylist}
        />
      )}
      {trackToEdit && (
        <EditTrackModal
          track={trackToEdit}
          onClose={() => setTrackToEdit(null)}
          onSave={handleSaveTrack}
        />
      )}
      
      <UpdateNotification />
      <ReloadPrompt />

      <ClapDetector 
        isEnabled={training.clapDetectionEnabled} 
        sensitivity={training.clapSensitivity} 
        onClap={handleClapAction} 
        onLevelChange={setMicLevel}
        audioContext={audioCtxRef.current}
        stream={micStreamRef.current}
      />
    </div>
  );
};

export default App;
