import React, { useEffect } from 'react';
import { useAdmin } from './AdminContext';
import { Users, Music, UserPlus } from 'lucide-react';

const Dashboard: React.FC = () => {
    const { stats, fetchStats } = useAdmin();

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    if (!stats) return <div className="animate-pulse">Loading stats...</div>;

    return (
        <div>
            <h1 className="text-3xl font-serif font-bold mb-8">Dashboard</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                    icon={<Users className="text-blue-500" />} 
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
