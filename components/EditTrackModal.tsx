import React, { useState, useEffect } from 'react';
import { Track, DanceStyle } from '../types';
import { useTranslation } from 'react-i18next';

interface EditTrackModalProps {
  track: Track;
  onClose: () => void;
  onSave: (id: string, data: Partial<Track>) => Promise<void>;
}

const EditTrackModal: React.FC<EditTrackModalProps> = ({ track, onClose, onSave }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    title: track.title,
    artist: track.artist,
    bpm: track.bpm,
    style: track.style
  });
  const [isSaving, setIsSaving] = useState(false);

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(track.id, {
        title: formData.title,
        artist: formData.artist,
        bpm: Number(formData.bpm),
        style: formData.style
      });
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 animate-in fade-in duration-200">
      <div 
        className="bg-[#1a1a1a] border border-white/10 p-6 rounded-[2rem] w-[90%] max-w-sm shadow-2xl animate-in zoom-in-95 duration-200 relative"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-2xl font-serif text-white font-bold mb-6 text-center">{t('edit.title')}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1 ml-1">
              {t('edit.trackTitle')}
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-[16px] text-white outline-none focus:border-yellow-500 transition select-text"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1 ml-1">
              {t('edit.artist')}
            </label>
            <input
              type="text"
              value={formData.artist}
              onChange={e => setFormData({...formData, artist: e.target.value})}
              className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-[16px] text-white outline-none focus:border-yellow-500 transition select-text"
              required
            />
          </div>

          <div className="flex gap-3">
            <div className="w-24 flex-shrink-0">
                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1 ml-1">
                {t('edit.bpm')}
                </label>
                <input
                type="number"
                value={formData.bpm}
                onChange={e => setFormData({...formData, bpm: Number(e.target.value)})}
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-[16px] text-white outline-none focus:border-yellow-500 transition font-mono text-center"
                required
                />
            </div>
            <div className="flex-1 min-w-0">
                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1 ml-1">
                {t('edit.style')}
                </label>
                <div className="relative">
                    <select
                        value={formData.style}
                        onChange={e => setFormData({...formData, style: e.target.value as DanceStyle})}
                        className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-[16px] text-white outline-none focus:border-yellow-500 transition appearance-none truncate pr-8"
                    >
                        {Object.values(DanceStyle).map(style => (
                            <option key={style} value={style} className="bg-[#1a1a1a]">
                                {t(`styles.${style}`)}
                            </option>
                        ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 text-[10px]">▼</div>
                </div>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl text-gray-400 font-bold hover:bg-white/5 hover:text-white transition uppercase text-xs tracking-wider border border-transparent hover:border-white/10"
            >
              {t('edit.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-3 bg-yellow-500 text-black font-bold rounded-xl hover:bg-yellow-400 transition uppercase text-xs tracking-wider shadow-lg disabled:opacity-50"
            >
              {isSaving ? '...' : t('edit.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTrackModal;