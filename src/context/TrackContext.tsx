import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DanceStyle, Track, Playlist } from '../types';
import { useAuth } from './AuthContext';
import { offlineStorage } from '../services/offlineStorage';
import { tracksApi } from '../services/api/tracksApi';
import { playlistsApi } from '../services/api/playlistsApi';
import { authApi } from '../services/api/authApi';
import { handleApiError } from '../services/api/errors';

interface TrackContextValue {
  tracks: Track[];
  setTracks: React.Dispatch<React.SetStateAction<Track[]>>;
  activeStyle: DanceStyle | 'All' | 'Favorites' | string;
  setActiveStyle: (style: DanceStyle | 'All' | 'Favorites' | string) => void;
  playlists: Playlist[];
  setPlaylists: React.Dispatch<React.SetStateAction<Playlist[]>>;
  filteredTracks: Track[];
  handleAddTrack: (formData: FormData) => Promise<void>;
  handleSaveTrack: (trackId: string, data: Partial<Track>) => Promise<void>;
  deleteTrack: (trackId: string) => void;
  toggleFavorite: (trackId: string) => void;
  toggleTrackInPlaylist: (playlistId: string, trackId: string, isAdding: boolean) => Promise<void>;
  toggleDownload: (track: Track) => Promise<void>;
  downloadedTracks: Set<string>;
  downloadingTracks: Set<string>;
}

const TrackContext = createContext<TrackContextValue | null>(null);

export const TrackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation();
  const { user, token, refreshUser } = useAuth();

  const [tracks, setTracks] = useState<Track[]>([]);
  const [activeStyle, setActiveStyle] = useState<DanceStyle | 'All' | 'Favorites' | string>('All');
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [downloadedTracks, setDownloadedTracks] = useState<Set<string>>(new Set());
  const [downloadingTracks, setDownloadingTracks] = useState<Set<string>>(new Set());

  // Fetch tracks on interval
  const fetchTracks = useCallback(() => {
    tracksApi.fetchTracks(token)
      .then(setTracks)
      .catch(e => handleApiError(e, { operation: 'fetchTracks' }));
  }, [token]);

  useEffect(() => {
    fetchTracks();
    const interval = setInterval(fetchTracks, 30000);
    return () => clearInterval(interval);
  }, [fetchTracks]);

  // Fetch playlists
  useEffect(() => {
    if (token) {
      playlistsApi.fetchPlaylists(token)
        .then(setPlaylists)
        .catch(e => handleApiError(e, { operation: 'fetchPlaylists' }));
    } else {
      setPlaylists([]);
    }
  }, [token]);

  // Check offline status for each track
  useEffect(() => {
    const checkOffline = async () => {
      const downloaded = new Set<string>();
      for (const track of tracks) {
        if (!track?.url) continue;
        try {
          if (await offlineStorage.isTrackDownloaded(track.url)) {
            downloaded.add(track.id);
          }
        } catch (e) {
          console.warn("Offline check failed for track:", track.id, e);
        }
      }
      setDownloadedTracks(downloaded);
    };
    if (tracks.length > 0) checkOffline();
  }, [tracks]);

  // Filtered tracks
  const filteredTracks = useMemo(() => {
    if (activeStyle === 'All') return tracks;
    if (activeStyle === 'Favorites') return tracks.filter(t => user?.favorites.includes(t.id));
    const playlist = playlists.find(p => p.id === activeStyle);
    if (playlist) return tracks.filter(t => playlist.trackIds.includes(t.id));
    return tracks.filter(t => t.style === activeStyle);
  }, [activeStyle, tracks, user?.favorites, playlists]);

  const handleAddTrack = async (formData: FormData) => {
    if (!token) return;
    try {
      const newTrack = await tracksApi.addTrack(token, formData);
      setTracks(prev => [newTrack, ...prev]);
    } catch (e) {
      handleApiError(e, { operation: 'addTrack', showAlert: true });
    }
  };

  const handleSaveTrack = async (trackId: string, data: Partial<Track>) => {
    if (!token) return;
    setTracks(prev => prev.map(t => t.id === trackId ? { ...t, ...data } : t));
    try {
      await tracksApi.saveTrack(token, trackId, data);
    } catch (e) {
      handleApiError(e, { operation: 'saveTrack', showAlert: true });
    }
  };

  const deleteTrack = (trackId: string) => {
    if (!token) return;
    if (confirm(t('confirm.deleteTrack'))) {
      setTracks(prev => prev.filter(t => t.id !== trackId));
      tracksApi.deleteTrack(token, trackId).catch(e =>
        handleApiError(e, { operation: 'deleteTrack', showAlert: true }),
      );
    }
  };

  const toggleFavorite = async (trackId: string) => {
    if (!token) return;
    try {
      await authApi.toggleFavorite(token, trackId);
      await refreshUser();
    } catch (e) {
      handleApiError(e, { operation: 'toggleFavorite' });
    }
  };

  const toggleTrackInPlaylist = async (playlistId: string, trackId: string, isAdding: boolean) => {
    if (!token) return;
    setPlaylists(prev => prev.map(p => {
      if (p.id !== playlistId) return p;
      return {
        ...p,
        trackIds: isAdding ? [...p.trackIds, trackId] : p.trackIds.filter(id => id !== trackId)
      };
    }));
    try {
      if (isAdding) {
        await playlistsApi.addTrackToPlaylist(token, playlistId, trackId);
      } else {
        await playlistsApi.removeTrackFromPlaylist(token, playlistId, trackId);
      }
    } catch (e) {
      handleApiError(e, { operation: 'toggleTrackInPlaylist' });
    }
  };

  const toggleDownload = async (track: Track) => {
    if (!user || (!user.isAdmin && user.role !== 'coach' && !(user as any).can_download)) {
      alert(t('app.premiumRequired') || 'This is a premium feature');
      return;
    }

    const isDownloaded = downloadedTracks.has(track?.id);
    if (isDownloaded) {
      await offlineStorage.deleteTrack(track?.url);
      setDownloadedTracks(prev => {
        const next = new Set(prev);
        next.delete(track?.id);
        return next;
      });
    } else {
      setDownloadingTracks(prev => new Set(prev).add(track?.id));
      try {
        await offlineStorage.downloadTrack(track?.id, track?.url);
        setDownloadedTracks(prev => new Set(prev).add(track?.id));
      } catch (err) {
        console.error('Download failed:', err);
        alert(t('app.downloadFailed') || 'Download failed');
      } finally {
        setDownloadingTracks(prev => {
          const next = new Set(prev);
          next.delete(track?.id);
          return next;
        });
      }
    }
  };

  return (
    <TrackContext.Provider value={{
      tracks, setTracks,
      activeStyle, setActiveStyle,
      playlists, setPlaylists,
      filteredTracks,
      handleAddTrack,
      handleSaveTrack,
      deleteTrack,
      toggleFavorite,
      toggleTrackInPlaylist,
      toggleDownload,
      downloadedTracks,
      downloadingTracks,
    }}>
      {children}
    </TrackContext.Provider>
  );
};

export const useTrackContext = (): TrackContextValue => {
  const context = useContext(TrackContext);
  if (!context) {
    throw new Error('useTrackContext must be used within a TrackProvider');
  }
  return context;
};
