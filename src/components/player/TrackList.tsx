import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Track, User, Playlist, DanceStyle, PlayerState, TrainingSettings } from '../../types';
import {
    PlayIcon, PauseIcon, PlusIcon, HeartIcon,
    PlaylistIcon, TrashIcon, PencilIcon, DownloadIcon, Spinner
} from '../Icons';
import { STYLE_COLORS } from '../../constants';

interface TrackListProps {
    tracks: Track[];
    filteredTracks: Track[];
    activeStyle: DanceStyle | 'All' | 'Favorites' | string;
    setActiveStyle: (style: DanceStyle | 'All' | 'Favorites' | string) => void;
    playlists: Playlist[];
    setPlaylists: React.Dispatch<React.SetStateAction<Playlist[]>>;
    user: User | null;
    player: PlayerState;
    training: TrainingSettings;
    isMetronomeVisualActive: boolean;
    togglePlay: () => void;
    selectTrack: (track: Track) => void;
    setShowAuth: (show: boolean) => void;
    setShowPlaylistCreator: (show: boolean) => void;
    setPlaylistModalTrackId: (id: string | null) => void;
    toggleFavorite: (id: string) => void;
    setTrackToEdit: (track: Track | null) => void;
    toggleDownload: (track: Track) => Promise<void>;
    downloadedTracks: Set<string>;
    downloadingTracks: Set<string>;
    token: string | null;
}

const TrackList: React.FC<TrackListProps> = ({
    filteredTracks,
    activeStyle,
    setActiveStyle,
    playlists,
    setPlaylists,
    user,
    player,
    training,
    isMetronomeVisualActive,
    togglePlay,
    selectTrack,
    setShowAuth,
    setShowPlaylistCreator,
    setPlaylistModalTrackId,
    toggleFavorite,
    setTrackToEdit,
    toggleDownload,
    downloadedTracks,
    downloadingTracks,
    token
}) => {
    const { t } = useTranslation();

    return (
        <>
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
                        <button onClick={(e) => { e.stopPropagation(); if (token) { fetch(`/api/playlists/${pl.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } }).then(() => { setPlaylists(prev => prev.filter(p => p.id !== pl.id)); if (activeStyle === pl.id) setActiveStyle('All'); }).catch(console.error); } }} className="absolute -top-1 -right-1 bg-red-500 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition shadow-lg scale-75">
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
                        <div key={track.id} onClick={() => isThisCurrent ? togglePlay() : selectTrack(track)} className={`group relative overflow-hidden bg-[#141414] border border-white/10 rounded-2xl p-3 hover:border-yellow-500/50 transition-all duration-300 cursor-pointer ${isThisCurrent ? 'border-yellow-500 ring-1 ring-yellow-500 shadow-[0_0_25px_rgba(234,179,8,0.15)] bg-yellow-500/5' : ''}`}>
                            <div className="flex justify-between items-start mb-2">
                                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded shadow-sm ${STYLE_COLORS[track.style]}`}>{t(`styles.${track.style}`)}</span>
                                <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                                    <button onClick={(e) => { e.stopPropagation(); toggleDownload(track); }} className={`transition-all p-1 rounded-full ${downloadedTracks.has(track.id) ? 'text-green-500 bg-green-500/10' : downloadingTracks.has(track.id) ? 'text-yellow-500 bg-yellow-500/10' : 'text-gray-600 hover:text-white hover:bg-white/10'}`}>
                                        {downloadingTracks.has(track.id) ? <Spinner size={14} /> : <DownloadIcon downloaded={downloadedTracks.has(track.id)} />}
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); if (user) setPlaylistModalTrackId(track.id); else setShowAuth(true); }} className="text-gray-600 hover:text-indigo-400 p-1"><PlusIcon /></button>
                                    <button onClick={(e) => { e.stopPropagation(); toggleFavorite(track.id); }} className={`transition-transform hover:scale-110 p-1 ${user?.favorites.includes(track.id) ? 'text-rose-500' : 'text-gray-600 hover:text-rose-400'}`}><HeartIcon filled={user?.favorites.includes(track.id)} /></button>
                                </div>
                            </div>
                            <div className="flex justify-between items-end relative">
                                <div className="min-w-0 pr-8 flex-1">
                                    <h3 className="text-base font-bold text-white mb-0.5 group-hover:text-yellow-500 transition truncate leading-tight">{track.title}</h3>
                                    <p className="text-gray-400 text-sm truncate">{track.artist}</p>
                                </div>
                                <div className="flex items-center gap-2 mb-0.5" onClick={e => e.stopPropagation()}>
                                    <div className="flex items-center gap-1 bg-black/30 px-2 py-0.5 rounded-md">
                                        <span className="text-gray-300 text-[10px] font-mono">{track.bpm} BPM</span>
                                    </div>
                                    {(user?.isAdmin || user?.id === track.ownerId) && (
                                        <button onClick={(e) => { e.stopPropagation(); setTrackToEdit(track); }} className="p-1.5 bg-black/60 hover:bg-yellow-500 text-gray-400 hover:text-black rounded-lg transition-all backdrop-blur-sm opacity-0 group-hover:opacity-100">
                                            <PencilIcon />
                                        </button>
                                    )}
                                </div>
                                {isThisCurrent && training.metronomeEnabled && (
                                    <div className={`w-2 h-2 rounded-full absolute -right-2 top-0 transition-all duration-75 flex-shrink-0 ${isMetronomeVisualActive ? 'bg-yellow-500 scale-150 shadow-[0_0_10px_#eab308]' : 'bg-yellow-500/20'}`}></div>
                                )}
                            </div>
                            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 pointer-events-none ${isThisCurrent && player.isPlaying ? 'bg-yellow-500/80 text-black scale-100 backdrop-blur-sm' : 'bg-black/60 text-white scale-0 group-hover:scale-100'}`}>
                                {isThisCurrent && player.isPlaying ? <PauseIcon /> : <PlayIcon />}
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
};

export default TrackList;
