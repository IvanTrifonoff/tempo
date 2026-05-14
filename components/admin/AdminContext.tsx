import React, { createContext, useContext, useState, useCallback } from 'react';

interface AdminStats {
    totalUsers: number;
    totalTracks: number;
    newUsers24h: number;
    onlineUsers: number;
    popularTracks: Array<{ id: string; title: string; plays: number }>;
}

interface UserAdmin {
    id: string;
    email: string;
    role: string;
    isVerified: boolean;
    trackLimit: number;
    subscriptionTier: string;
    isBanned: boolean;
    createdAt: string;
    lastLogin: string | null;
}

interface TrackAdmin {
    id: string;
    title: string;
    artist: string;
    style: string;
    bpm: number;
    url: string;
    ownerId: string;
    ownerEmail: string;
    fileSize: number;
    createdAt: string;
}

interface ActivityLog {
    id: string;
    user_id: string | null;
    user_email?: string;
    action: string;
    target_id: string | null;
    track_title?: string;
    details: any;
    ip_address: string;
    user_agent: string;
    created_at: string;
}

interface AdminContextType {
    stats: AdminStats | null;
    users: UserAdmin[];
    tracks: TrackAdmin[];
    logs: ActivityLog[];
    isLoading: boolean;
    fetchStats: () => Promise<void>;
    fetchUsers: (query?: string) => Promise<void>;
    updateUser: (id: string, data: Partial<UserAdmin>) => Promise<void>;
    deleteUser: (id: string) => Promise<void>;
    fetchAdminTracks: (query?: string) => Promise<void>;
    deleteTrack: (id: string) => Promise<void>;
    fetchActivityLogs: (filters?: { user?: string; action?: string; startDate?: string; endDate?: string }) => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [users, setUsers] = useState<UserAdmin[]>([]);
    const [tracks, setTracks] = useState<TrackAdmin[]>([]);
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const getAuthHeader = () => ({
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
    });

    const fetchStats = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/stats', { headers: getAuthHeader() });
            if (res.ok) setStats(await res.json());
        } catch (e) { console.error(e); }
    }, []);

    const fetchUsers = useCallback(async (search?: string) => {
        setIsLoading(true);
        try {
            const url = search ? `/api/admin/users?search=${encodeURIComponent(search)}` : '/api/admin/users';
            const res = await fetch(url, { headers: getAuthHeader() });
            if (res.ok) setUsers(await res.json());
        } catch (e) { console.error(e); } finally { setIsLoading(false); }
    }, []);

    const updateUser = useCallback(async (id: string, data: Partial<UserAdmin>) => {
        try {
            const res = await fetch(`/api/admin/users/${id}`, {
                method: 'PATCH',
                headers: getAuthHeader(),
                body: JSON.stringify(data)
            });
            if (res.ok) {
                const updated = await res.json();
                setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updated } : u));
            }
        } catch (e) { console.error(e); }
    }, []);

    const deleteUser = useCallback(async (id: string) => {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
        try {
            const res = await fetch(`/api/admin/users/${id}`, {
                method: 'DELETE',
                headers: getAuthHeader()
            });
            if (res.ok) {
                setUsers(prev => prev.filter(u => u.id !== id));
            }
        } catch (e) { console.error(e); }
    }, []);

    const fetchAdminTracks = useCallback(async (search?: string) => {
        setIsLoading(true);
        try {
            const url = search ? `/api/admin/tracks?search=${encodeURIComponent(search)}` : '/api/admin/tracks';
            const res = await fetch(url, { headers: getAuthHeader() });
            if (res.ok) setTracks(await res.json());
        } catch (e) { console.error(e); } finally { setIsLoading(false); }
    }, []);

    const fetchActivityLogs = useCallback(async (filters?: { user?: string; action?: string; startDate?: string; endDate?: string }) => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters?.user) params.append('user', filters.user);
            if (filters?.action) params.append('action', filters.action);
            if (filters?.startDate) params.append('startDate', filters.startDate);
            if (filters?.endDate) params.append('endDate', filters.endDate);

            const res = await fetch(`/api/admin/logs?${params.toString()}`, { headers: getAuthHeader() });
            if (res.ok) setLogs(await res.json());
        } catch (e) { console.error(e); } finally { setIsLoading(false); }
    }, []);

    const deleteTrack = useCallback(async (id: string) => {
        if (!confirm('Delete this track?')) return;
        try {
            const res = await fetch(`/api/admin/tracks/${id}`, {
                method: 'DELETE',
                headers: getAuthHeader()
            });
            if (res.ok) {
                setTracks(prev => prev.filter(t => t.id !== id));
            }
        } catch (e) { console.error(e); }
    }, []);

    return (
        <AdminContext.Provider value={{
            stats, users, tracks, logs, isLoading,
            fetchStats, fetchUsers, updateUser, deleteUser,
            fetchAdminTracks, deleteTrack, fetchActivityLogs
        }}>
            {children}
        </AdminContext.Provider>
    );
};

export const useAdmin = () => {
    const context = useContext(AdminContext);
    if (!context) throw new Error('useAdmin must be used within AdminProvider');
    return context;
};
