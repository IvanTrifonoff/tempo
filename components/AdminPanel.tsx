import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DanceStyle } from '../types';
import { TrashIcon } from './Icons';

interface AdminPanelProps {
  onAddTrack: (formData: FormData) => Promise<void>;
  onClose: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onAddTrack, onClose }) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [style, setStyle] = useState<DanceStyle>(DanceStyle.CHA_CHA);
  const [bpm, setBpm] = useState(30);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !artist || !file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('artist', artist);
    formData.append('style', style);
    formData.append('bpm', bpm.toString());
    formData.append('file', file);

    try {
      await onAddTrack(formData);
      onClose();
    } catch (error) {
      console.error(error);
      alert('Failed to upload track');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#1a1a1a] border border-white/10 p-8 rounded-[2.5rem] w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-serif text-white font-bold">{t('admin.title')}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-white text-3xl font-light">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1 ml-1">{t('admin.trackTitle')}</label>
            <input 
              type="text" 
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:border-yellow-500 outline-none transition"
              placeholder="e.g. Elegant Waltz"
              disabled={isUploading}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1 ml-1">{t('admin.artist')}</label>
            <input 
              type="text" 
              required
              value={artist}
              onChange={e => setArtist(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:border-yellow-500 outline-none transition"
              placeholder="e.g. Master Beats"
              disabled={isUploading}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1 ml-1">{t('admin.style')}</label>
              <select 
                value={style}
                onChange={e => setStyle(e.target.value as DanceStyle)}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:border-yellow-500 outline-none transition"
                disabled={isUploading}
              >
                {Object.values(DanceStyle).map(s => (
                  <option key={s} value={s}>{t(`styles.${s}`)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1 ml-1">{t('admin.bpm')}</label>
              <input 
                type="number" 
                required
                value={bpm}
                onChange={e => setBpm(Number(e.target.value))}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:border-yellow-500 outline-none transition"
                disabled={isUploading}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1 ml-1">{t('admin.file')}</label>
            <input 
              type="file" 
              accept="audio/*"
              required
              onChange={e => setFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-gray-400 file:mr-4 file:py-2.5 file:px-6 file:rounded-xl file:border-0 file:text-xs file:font-black file:uppercase file:bg-yellow-500 file:text-black hover:file:bg-yellow-400 disabled:opacity-50"
              disabled={isUploading}
            />
          </div>
          <div className="flex gap-4 pt-4">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-4 px-4 rounded-xl border border-white/10 hover:bg-white/5 transition font-bold uppercase text-xs tracking-wider"
              disabled={isUploading}
            >
              {t('admin.cancel')}
            </button>
            <button 
              type="submit" 
              className="flex-1 py-4 px-4 rounded-xl bg-yellow-500 text-black font-black hover:bg-yellow-400 transition flex items-center justify-center gap-2 uppercase text-xs tracking-wider"
              disabled={isUploading}
            >
              {isUploading ? t('admin.uploading') : t('admin.upload')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminPanel;