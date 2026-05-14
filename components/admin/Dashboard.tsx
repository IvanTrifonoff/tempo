import React, { useEffect } from 'react';
import { useAdmin } from './AdminContext';
import { Users, Music, UserPlus, BarChart2 } from 'lucide-react';

const Dashboard: React.FC = () => {
    const { stats, fetchStats } = useAdmin();

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    if (!stats) return <div className="animate-pulse">Loading stats...</div>;

    return (
        <div>
            <h1 className="text-3xl font-serif font-bold mb-8">Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                <StatCard
                    icon={<div className="relative"><Users className="text-blue-500" /><div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-ping" /></div>}
                    label="Online Now (5m)"
                    value={stats.onlineUsers}
                />
                <StatCard
                    icon={<Users className="text-blue-400" />}
                    label="Total Users"
                    value={stats.totalUsers}
                />
                <StatCard
                    icon={<Music className="text-yellow-500" />}
                    label="Total Tracks"
                    value={stats.totalTracks}
                />
                <StatCard
                    icon={<UserPlus className="text-green-500" />}
                    label="New Users (24h)"
                    value={stats.newUsers24h}
                />
            </div>

            <div className="bg-[#1a1a1a] border border-white/5 rounded-[2rem] p-8 shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-indigo-500/10 rounded-lg">
                        <BarChart2 className="text-indigo-500" size={20} />
                    </div>
                    <h2 className="text-xl font-bold">Popular Tracks (24h)</h2>
                </div>

                <div className="space-y-4">
                    {stats.popularTracks.length > 0 ? stats.popularTracks.map((track, idx) => (
                        <div key={track.id} className="flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                                <span className="text-xs font-black text-gray-600 w-4">{idx + 1}</span>
                                <span className="text-sm font-medium text-gray-200 group-hover:text-yellow-500 transition cursor-default truncate max-w-[200px] md:max-w-md" title={track.title}>
                                    {track.title}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-lg font-black text-white">{track.plays}</span>
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">plays</span>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-10 text-gray-500 italic">No track activity yet.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: number }> = ({ icon, label, value }) => (
    <div className="bg-[#1a1a1a] border border-white/5 p-6 rounded-[2rem] shadow-xl">
        <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-white/5 rounded-2xl">{icon}</div>
            <span className="text-gray-400 font-bold text-sm uppercase tracking-wider">{label}</span>
        </div>
        <div className="text-4xl font-black">{value}</div>
    </div>
);

export default Dashboard;
