import React, { useEffect, useState } from 'react';
import { useAdmin } from './AdminContext';
import { Search, Music, Trash2, HardDrive, User, Clock } from 'lucide-react';

const AdminTracksList: React.FC = () => {
    const { tracks, isLoading, fetchAdminTracks, deleteTrack } = useAdmin();
    const [search, setSearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => fetchAdminTracks(search), 300);
        return () => clearTimeout(timer);
    }, [search, fetchAdminTracks]);

    const formatSize = (bytes: any) => {
        const b = Number(bytes);
        if (!b || isNaN(b) || b <= 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(b) / Math.log(k));
        return parseFloat((b / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-serif font-bold tracking-tight">Tracks Management</h1>
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input
                        type="text"
                        placeholder="Search tracks or owners..."
                        className="bg-[#1a1a1a] border border-white/10 rounded-2xl pl-12 pr-6 py-3 w-80 focus:border-yellow-500 outline-none transition text-sm"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-[#1a1a1a] border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl">
                <table className="w-full text-left border-collapse text-sm">
                    <thead>
                        <tr className="bg-white/5 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                            <th className="px-6 py-5">Track Info</th>
                            <th className="px-6 py-5">Style & BPM</th>
                            <th className="px-6 py-5">Size</th>
                            <th className="px-6 py-5">Owner</th>
                            <th className="px-6 py-5">Added</th>
                            <th className="px-6 py-5 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {tracks.map(track => (
                            <tr key={track.id} className="hover:bg-white/2 transition group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-yellow-500 group-hover:bg-yellow-500/10 transition">
                                            <Music size={20} />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-bold text-white truncate max-w-[200px]">{track.title}</div>
                                            <div className="text-xs text-gray-500 truncate max-w-[200px]">{track.artist}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-xs font-medium text-white">{track.style}</div>
                                    <div className="text-[10px] text-gray-500 uppercase tracking-widest">{track.bpm} BPM</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-1.5 text-gray-400 font-mono text-xs">
                                        <HardDrive size={14} className="text-gray-600" />
                                        {formatSize(track.fileSize)}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-white/5 rounded-lg text-gray-500">
                                            <User size={12} />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-xs text-gray-300 truncate max-w-[150px]">{track.ownerEmail || 'System'}</div>
                                            <div className="text-[9px] text-gray-600 font-mono truncate">{track.ownerId}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                                        <Clock size={14} />
                                        {new Date(track.createdAt).toLocaleDateString()}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => deleteTrack(track.id)}
                                        className="p-2.5 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-all active:scale-90"
                                        title="Delete Track"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {isLoading && <div className="p-10 text-center text-gray-500 animate-pulse flex flex-col items-center gap-2">
                    <div className="w-6 h-6 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin" />
                    <span className="text-xs uppercase tracking-widest font-black">Updating library...</span>
                </div>}
                {!isLoading && tracks.length === 0 && <div className="p-16 text-center text-gray-500 italic flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-gray-700">
                        <Music size={32} />
                    </div>
                    No tracks found in the system.
                </div>}
            </div>
        </div>
    );
};

export default AdminTracksList;
