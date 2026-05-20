import React from 'react';
import { useTranslation } from 'react-i18next';
import { Playlist } from '../types';
import { PlaylistIcon } from './Icons';

interface AddToPlaylistModalProps {
  playlists: Playlist[];
  trackId: string;
  onToggle: (playlistId: string, isAdding: boolean) => void;
  onClose: () => void;
}

const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({ playlists, trackId, onToggle, onClose }) => {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-[#1a1a1a] border border-white/10 p-6 rounded-2xl w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-serif text-white flex items-center gap-2">
                <PlaylistIcon /> {t('app.selectPlaylist')}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
        </div>
        
        {playlists.length === 0 ? (
            <p className="text-gray-500 text-center py-4">{t('app.noPlaylists')}</p>
        ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {playlists.map(pl => {
                const isAdded = pl.trackIds.includes(trackId);
                return (
                    <button 
                        key={pl.id}
                        onClick={() => onToggle(pl.id, !isAdded)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${isAdded ? 'bg-indigo-500/20 border-indigo-500 text-white' : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'}`}
                    >
                        <span className="font-medium truncate max-w-[80%] text-left">{pl.name}</span>
                        {isAdded && <span className="text-xs bg-indigo-500 text-white px-2 py-0.5 rounded-full">✓</span>}
                    </button>
                );
            })}
            </div>
        )}
        
        <button onClick={onClose} className="w-full mt-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition font-bold">
            {t('app.cancel')}
        </button>
      </div>
    </div>
  );
};

export default AddToPlaylistModal;
