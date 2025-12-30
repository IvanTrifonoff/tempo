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
  const [tab, setTab] = useState<'music' | 'users'>('music');
  
  // Music State
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [style, setStyle] = useState<DanceStyle>(DanceStyle.CHA_CHA);
  const [bpm, setBpm] = useState(30);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Users State
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    if (tab === 'users') {
        loadUsers();
    }
  }, [tab]);

  const loadUsers = async () => {
    try {
        const res = await fetch('/api/admin/users', { 
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } 
        });
        const data = await res.json();
        setUsers(data);
    } catch (e) { console.error(e); }
  };

  const deleteUser = async (id: string) => {
      if (!confirm('Delete user?')) return;
      await fetch(`/api/admin/users/${id}`, { 
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } 
      });
      loadUsers();
  };

  const toggleVerify = async (id: string, current: boolean) => {
      await fetch(`/api/admin/users/${id}`, { 
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
          body: JSON.stringify({ isVerified: !current })
      });
      loadUsers();
  };

  const changeRole = async (id: string, role: string) => {
      await fetch(`/api/admin/users/${id}`, { 
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
          body: JSON.stringify({ role })
      });
      loadUsers();
  };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#1a1a1a] border border-white/10 p-6 rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-6">
            <div className="flex gap-4">
                <button 
                    onClick={() => setTab('music')} 
                    className={`text-xl font-serif font-bold transition ${tab === 'music' ? 'text-yellow-500' : 'text-gray-500 hover:text-white'}`}
                >
                    {t('admin.title')}
                </button>
                <button 
                    onClick={() => setTab('users')} 
                    className={`text-xl font-serif font-bold transition ${tab === 'users' ? 'text-yellow-500' : 'text-gray-500 hover:text-white'}`}
                >
                    {t('admin.users') || 'Users'}
                </button>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-white text-2xl">&times;</button>
        </div>

        <div className="overflow-y-auto flex-1 pr-2 custom-scrollbar">
            {tab === 'music' ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">{t('admin.trackTitle')}</label>
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
                    <label className="block text-sm font-medium text-gray-400 mb-1">{t('admin.artist')}</label>
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
                      <label className="block text-sm font-medium text-gray-400 mb-1">{t('admin.style')}</label>
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
                      <label className="block text-sm font-medium text-gray-400 mb-1">{t('admin.bpm')}</label>
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
                    <label className="block text-sm font-medium text-gray-400 mb-1">{t('admin.file')}</label>
                    <input 
                      type="file" 
                      accept="audio/*"
                      required
                      onChange={e => setFile(e.target.files?.[0] || null)}
                      className="w-full text-sm text-gray-400 file:mr-4 file:py-2.5 file:px-6 file:rounded-xl file:border-0 file:text-xs file:font-black file:uppercase file:bg-yellow-500 file:text-black hover:file:bg-yellow-400 disabled:opacity-50"
                      disabled={isUploading}
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="w-full mt-4 py-4 bg-yellow-500 text-black font-black uppercase rounded-xl hover:bg-yellow-400 transition flex items-center justify-center gap-2"
                    disabled={isUploading}
                  >
                    {isUploading ? t('admin.uploading') : t('admin.upload')}
                  </button>
                </form>
            ) : (
                <div className="space-y-3">
                    {users.map(u => (
                        <div key={u.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between gap-4">
                            <div className="min-w-0 flex-1">
                                <p className="text-white font-bold truncate">{u.email}</p>
                                <div className="flex gap-2 mt-1">
                                    <span className="text-[10px] uppercase font-black px-1.5 py-0.5 bg-yellow-500/10 text-yellow-500 rounded border border-yellow-500/20">{u.role}</span>
                                    {u.isVerified && <span className="text-[10px] uppercase font-black px-1.5 py-0.5 bg-green-500/10 text-green-500 rounded border border-green-500/20">Verified</span>}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <select 
                                    value={u.role} 
                                    onChange={e => changeRole(u.id, e.target.value)}
                                    className="bg-black/50 border border-white/10 rounded-lg text-[10px] px-2 py-1 text-gray-400 outline-none"
                                >
                                    <option value="admin">Admin</option>
                                    <option value="coach">Coach</option>
                                    <option value="student">Student</option>
                                </select>
                                <button 
                                    onClick={() => toggleVerify(u.id, u.isVerified)}
                                    className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase transition ${u.isVerified ? 'bg-green-500 text-black' : 'bg-white/10 text-white'}`}
                                >
                                    {u.isVerified ? 'Verified' : 'Verify'}
                                </button>
                                <button 
                                    onClick={() => deleteUser(u.id)}
                                    className="p-2 text-gray-500 hover:text-red-500 transition"
                                >
                                    <TrashIcon />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;