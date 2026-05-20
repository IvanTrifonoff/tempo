import React, { useEffect, useState } from 'react';
import { useAdmin } from './AdminContext';
import { Search, Filter, Calendar, User, Activity, Clock, ExternalLink } from 'lucide-react';

const ActivityLogsList: React.FC = () => {
    const { logs, isLoading, fetchActivityLogs } = useAdmin();
    const [filters, setFilters] = useState({
        user: '',
        action: '',
        startDate: '',
        endDate: ''
    });

    useEffect(() => {
        const timer = setTimeout(() => fetchActivityLogs(filters), 300);
        return () => clearTimeout(timer);
    }, [filters, fetchActivityLogs]);

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case 'LOGIN': return 'text-green-500 bg-green-500/10';
            case 'PLAY_TRACK': return 'text-indigo-500 bg-indigo-500/10';
            case 'DELETE_USER':
            case 'DELETE_TRACK': return 'text-red-500 bg-red-500/10';
            case 'UPDATE_USER':
            case 'UPDATE_TRACK': return 'text-yellow-500 bg-yellow-500/10';
            default: return 'text-gray-500 bg-gray-500/10';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-serif font-bold tracking-tight">Activity Logs</h1>
                    <div className="flex items-center gap-2 text-xs text-gray-500 font-bold uppercase tracking-widest bg-white/5 px-4 py-2 rounded-full">
                        <Activity size={14} className="text-yellow-500" />
                        Live Feed
                    </div>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-[#1a1a1a] p-4 rounded-2xl border border-white/5">
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                        <input
                            type="text"
                            placeholder="User email or ID..."
                            className="bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 w-full focus:border-yellow-500 outline-none transition text-sm text-white"
                            value={filters.user}
                            onChange={e => handleFilterChange('user', e.target.value)}
                        />
                    </div>
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                        <select
                            className="bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 w-full focus:border-yellow-500 outline-none transition text-sm text-white appearance-none"
                            value={filters.action}
                            onChange={e => handleFilterChange('action', e.target.value)}
                        >
                            <option value="">All Actions</option>
                            <option value="LOGIN">Logins</option>
                            <option value="PLAY_TRACK">Track Plays</option>
                            <option value="TOGGLE_FAVORITE">Like/Favorite</option>
                            <option value="DOWNLOAD">Downloads</option>
                            <option value="UPDATE_USER">User Updates</option>
                            <option value="DELETE_USER">User Deletions</option>
                            <option value="UPDATE_TRACK">Track Updates</option>
                            <option value="DELETE_TRACK">Track Deletions</option>
                        </select>
                    </div>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                        <input
                            type="date"
                            className="bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 w-full focus:border-yellow-500 outline-none transition text-sm text-white"
                            value={filters.startDate}
                            onChange={e => handleFilterChange('startDate', e.target.value)}
                        />
                    </div>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                        <input
                            type="date"
                            className="bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 w-full focus:border-yellow-500 outline-none transition text-sm text-white"
                            value={filters.endDate}
                            onChange={e => handleFilterChange('endDate', e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="bg-[#1a1a1a] border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl">
                <table className="w-full text-left border-collapse text-sm">
                    <thead>
                        <tr className="bg-white/5 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                            <th className="px-6 py-5">Time</th>
                            <th className="px-6 py-5">User</th>
                            <th className="px-6 py-5">Action</th>
                            <th className="px-6 py-5">Entity Details</th>
                            <th className="px-6 py-5">Context</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {logs.map(log => (
                            <tr key={log.id} className="hover:bg-white/2 transition group">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-2 text-gray-300">
                                        <Clock size={14} className="text-gray-500" />
                                        {new Date(log.created_at).toLocaleString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: '2-digit' })}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {log.user_email ? (
                                        <div className="flex flex-col">
                                            <span className="font-bold text-white">{log.user_email.split('@')[0]}</span>
                                            <span className="text-[10px] text-gray-500 font-mono">{log.user_email}</span>
                                        </div>
                                    ) : (
                                        <span className="text-gray-600 italic">Anonymous</span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${getActionColor(log.action)}`}>
                                        {log.action.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {log.action === 'PLAY_TRACK' && log.track_title && (
                                        <div className="flex items-center gap-2 text-indigo-400 font-medium">
                                            <Music size={14} />
                                            <span className="truncate max-w-[150px]">{log.track_title}</span>
                                        </div>
                                    )}
                                    {(log.action === 'UPDATE_USER' || log.action === 'DELETE_USER') && (
                                        <div className="text-xs text-gray-400 font-mono">
                                            ID: {log.target_id?.slice(0, 8)}...
                                        </div>
                                    )}
                                    {log.action === 'LOGIN' && (
                                        <div className="text-[10px] text-gray-500 italic">Session Start</div>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col text-[10px] text-gray-500 font-mono leading-tight">
                                        <span title={log.user_agent} className="truncate max-w-[120px]">{log.user_agent.split(' ')[0]}</span>
                                        <span>IP: {log.ip_address}</span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {isLoading && (
                    <div className="p-10 text-center text-gray-500 animate-pulse flex flex-col items-center gap-2">
                        <div className="w-6 h-6 border-2 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin" />
                        <span className="text-xs uppercase tracking-widest font-black">Syncing activity...</span>
                    </div>
                )}

                {!isLoading && logs.length === 0 && (
                    <div className="p-16 text-center text-gray-500 italic flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-gray-700">
                            <Activity size={32} />
                        </div>
                        No activities matches your current filters.
                    </div>
                )}
            </div>
        </div>
    );
};

const Music: React.FC<{ size?: number }> = ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
    </svg>
);

export default ActivityLogsList;
