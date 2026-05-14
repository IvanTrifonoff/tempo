import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DanceStyle, Track, User, PlayerState, Playlist, TrainingSettings } from '../types';
import { APP_VERSION } from '../constants';
import { useAudioContext } from './useAudioContext';
import { useMetronome } from './useMetronome';
import { offlineStorage } from '../services/offlineStorage';

export const usePlayerLogic = () => {
    const { t } = useTranslation();

    // --- Audio Hooks ---
    const { audioCtxRef, resumeAudioContext, connectAudioElement } = useAudioContext();

    // --- Состояние ---
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
    const [showReview, setShowReview] = useState(false);
    const [hasReviewed, setHasReviewed] = useState<boolean | null>(null);
    const [existingReview, setExistingReview] = useState<{ rating: number, comment: string } | null>(null);
    const [downloadedTracks, setDownloadedTracks] = useState<Set<string>>(new Set());
    const [downloadingTracks, setDownloadingTracks] = useState<Set<string>>(new Set());

    const [trackToEdit, setTrackToEdit] = useState<Track | null>(null);
    const [isPlayerVisible, setIsPlayerVisible] = useState(true);
    const [playlistModalTrackId, setPlaylistModalTrackId] = useState<string | null>(null);

    const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
        'Notification' in window ? Notification.permission : 'default'
    );

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

    const [isOnline, setIsOnline] = useState(navigator.onLine);

    const audioRef = useRef<HTMLAudioElement | null>(null);

    // --- Metronome Hook ---
    const { isMetronomeVisualActive } = useMetronome({
        audioCtxRef,
        training,
        player
    });

    // --- Logic ---

    const handleRequestNotification = async () => {
        if (!('Notification' in window)) return;
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
    };

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

        const goOnline = () => setIsOnline(true);
        const goOffline = () => setIsOnline(false);
        window.addEventListener('online', goOnline);
        window.addEventListener('offline', goOffline);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('online', goOnline);
            window.removeEventListener('offline', goOffline);
            if (wakeLock) wakeLock.release();
        };
    }, []);

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

    useEffect(() => {
        if (token && user) {
            fetch(`/api/reviews/status?version=${APP_VERSION}`, { headers: { 'Authorization': `Bearer ${token}` } })
                .then(res => res.json())
                .then(data => {
                    setHasReviewed(data.hasReviewed);
                    setExistingReview(data.existingReview);
                })
                .catch(() => {
                    setHasReviewed(null);
                    setExistingReview(null);
                });
        } else {
            setHasReviewed(null);
            setExistingReview(null);
        }
    }, [token, user]);

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

    const filteredTracks = useMemo(() => {
        if (activeStyle === 'All') return tracks;
        if (activeStyle === 'Favorites') return tracks.filter(t => user?.favorites.includes(t.id));
        const playlist = playlists.find(p => p.id === activeStyle);
        if (playlist) return tracks.filter(t => playlist.trackIds.includes(t.id));
        return tracks.filter(t => t.style === activeStyle);
    }, [activeStyle, tracks, user?.favorites, playlists]);

    // Handle Audio Context connection when audioRef is ready
    useEffect(() => {
        if (audioRef.current) {
            connectAudioElement(audioRef.current);
        }
    }, [connectAudioElement, audioRef.current]);

    const logPlay = useCallback(async (trackId: string) => {
        if (!token) return;
        try {
            fetch('/api/tracks/log-play', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ trackId })
            }).catch(console.error);
        } catch (e) { }
    }, [token]);

    const togglePlay = useCallback(async () => {
        await resumeAudioContext();
        setPlayer(p => {
            const newIsPlaying = !p.isPlaying;
            if (newIsPlaying && p.currentTrack) {
                logPlay(p.currentTrack.id);
            }
            return { ...p, isPlaying: newIsPlaying, isPauseCountdown: false };
        });
    }, [resumeAudioContext, logPlay]);

    const selectTrack = useCallback(async (track: Track) => {
        await resumeAudioContext();

        let finalUrl = track.url;
        if (await offlineStorage.isTrackDownloaded(track.url)) {
            finalUrl = await offlineStorage.getTrackUrl(track.url);
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
    }, [player.currentTrack, togglePlay, skip, t, resumeAudioContext]);

    const fetchTracks = useCallback(() => {
        const headers: any = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        fetch(`/api/tracks?t=${Date.now()}`, { headers })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setTracks(data);
                else console.error("Invalid tracks data:", data);
            })
            .catch(console.error);
    }, [token]);

    useEffect(() => {
        const checkOffline = async () => {
            const downloaded = new Set<string>();
            for (const track of tracks) {
                if (await offlineStorage.isTrackDownloaded(track.url)) {
                    downloaded.add(track.id);
                }
            }
            setDownloadedTracks(downloaded);
        };
        if (tracks.length > 0) checkOffline();
    }, [tracks]);

    useEffect(() => {
        fetchTracks();
        const interval = setInterval(fetchTracks, 30000);
        return () => clearInterval(interval);
    }, [fetchTracks]);

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

    const toggleTrackInPlaylist = async (playlistId: string, isAdding: boolean) => {
        if (!token || !playlistModalTrackId) return;
        setPlaylists(prev => prev.map(p => {
            if (p.id !== playlistId) return p;
            return {
                ...p,
                trackIds: isAdding ? [...p.trackIds, playlistModalTrackId] : p.trackIds.filter(id => id !== playlistModalTrackId)
            };
        }));
        try {
            const method = isAdding ? 'POST' : 'DELETE';
            const url = isAdding ? `/api/playlists/${playlistId}/tracks` : `/api/playlists/${playlistId}/tracks/${playlistModalTrackId}`;
            const body = isAdding ? JSON.stringify({ trackId: playlistModalTrackId }) : undefined;
            await fetch(url, { method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body });
        } catch (e) { console.error(e); }
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
        setTracks(prev => prev.map(t => t.id === trackId ? { ...t, ...data } : t));
        try {
            await fetch(`/api/tracks/${trackId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(data) });
        } catch (e) { console.error(e); }
    };

    const deleteTrack = (trackId: string) => {
        if (!token) return;
        if (confirm(t('confirm.deleteTrack'))) {
            setTracks(prev => prev.filter(t => t.id !== trackId));
            if (player.currentTrack?.id === trackId) setPlayer(p => ({ ...p, currentTrack: null, isPlaying: false }));
            fetch(`/api/tracks/${trackId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } }).catch(console.error);
        }
    };

    const handleReviewSubmit = async (rating: number, comment: string) => {
        if (!token) return;
        const res = await fetch('/api/reviews', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ rating, comment, version: APP_VERSION })
        });
        if (res.ok) {
            setHasReviewed(true);
            setExistingReview({ rating, comment });
        } else {
            throw new Error('Failed to submit review');
        }
    };

    const toggleDownload = async (track: Track) => {
        if (!user || (!user.isAdmin && user.role !== 'coach' && !(user as any).can_download)) {
            alert(t('app.premiumRequired') || 'This is a premium feature');
            return;
        }

        const isDownloaded = downloadedTracks.has(track.id);
        if (isDownloaded) {
            await offlineStorage.deleteTrack(track.url);
            setDownloadedTracks(prev => {
                const next = new Set(prev);
                next.delete(track.id);
                return next;
            });
        } else {
            setDownloadingTracks(prev => new Set(prev).add(track.id));
            try {
                await offlineStorage.downloadTrack(track.id, track.url);
                setDownloadedTracks(prev => new Set(prev).add(track.id));
            } catch (err) {
                console.error('Download failed:', err);
                alert(t('app.downloadFailed') || 'Download failed');
            } finally {
                setDownloadingTracks(prev => {
                    const next = new Set(prev);
                    next.delete(track.id);
                    return next;
                });
            }
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
        // Step is now more granular (5%) but adjustment here is by BPM. 
        // User requested 5% step when clicking +/-, which might correspond to playbackRate change, 
        // OR the user meant the speed slider logic.
        // Let's support both. Here delta is usually +/- 1 BPM.
        // If we want to change speed by %, we can do another function or overload this.
        setPlayer(p => ({ ...p, playbackRate: Math.max(0.5, Math.min(1.5, newRate)) }));
    };

    const setPlaybackRate = (rate: number) => {
        setPlayer(p => ({ ...p, playbackRate: Math.max(0.5, Math.min(1.5, rate)) }));
    };

    return {
        tracks, setTracks,
        user, setUser,
        token, setToken,
        activeStyle, setActiveStyle,
        playlists, setPlaylists,
        showAdmin, setShowAdmin,
        showAuth, setShowAuth,
        showSettings, setShowSettings,
        showUserManagement, setShowUserManagement,
        showPlaylistCreator, setShowPlaylistCreator,
        showTrainingPanel, setShowTrainingPanel,
        showReview, setShowReview,
        hasReviewed, existingReview,
        trackToEdit, setTrackToEdit,
        isPlayerVisible, setIsPlayerVisible,
        playlistModalTrackId, setPlaylistModalTrackId,
        notificationPermission, setNotificationPermission,
        training, setTraining,
        player, setPlayer,
        audioRef,
        isMetronomeVisualActive,
        filteredTracks,
        handleRequestNotification,
        handleLogin,
        handleLogout,
        copyInviteLink,
        handleAddTrack,
        togglePlay,
        selectTrack,
        skip,
        toggleTrackInPlaylist,
        toggleFavorite,
        handleSaveTrack,
        deleteTrack,
        handleReviewSubmit,
        toggleDownload,
        downloadedTracks,
        downloadingTracks,
        isOnline,
        currentEffectiveBpm,
        adjustBpmInPlayer,
        setPlaybackRate // Export this for direct rate setting
    };
};
