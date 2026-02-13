import React, { createContext, useContext, useState, useCallback } from 'react';

interface AdminStats {
    totalUsers: number;
    totalTracks: number;
    newUsers24h: number;
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

interface AdminContextType {
    stats: AdminStats | null;
    users: UserAdmin[];
    isLoading: boolean;
    fetchStats: () => Promise<void>;
    fetchUsers: (query?: string) => Promise<void>;
    updateUser: (id: string, data: Partial<UserAdmin>) => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [users, setUsers] = useState<UserAdmin[]>([]);
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

    return (
        <AdminContext.Provider value={{ stats, users, isLoading, fetchStats, fetchUsers, updateUser }}>
            {children}
        </AdminContext.Provider>
    );
};

export const useAdmin = () => {
    const context = useContext(AdminContext);
    if (!context) throw new Error('useAdmin must be used within AdminProvider');
    return context;
};
