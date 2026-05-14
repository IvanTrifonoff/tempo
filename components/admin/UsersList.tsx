import React, { useEffect, useState } from 'react';
import { useAdmin } from './AdminContext';
import { Search, Shield, ShieldOff, CheckCircle, XCircle, Trash2 } from 'lucide-react';

const UsersList: React.FC = () => {
    const { users, isLoading, fetchUsers, updateUser, deleteUser } = useAdmin();
    const [search, setSearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => fetchUsers(search), 300);
        return () => clearTimeout(timer);
    }, [search, fetchUsers]);

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-serif font-bold">Users Management</h1>
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input
                        type="text"
                        placeholder="Search by email..."
                        className="bg-[#1a1a1a] border border-white/10 rounded-2xl pl-12 pr-6 py-3 w-80 focus:border-yellow-500 outline-none transition"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-[#1a1a1a] border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl text-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white/5 text-gray-400 font-bold uppercase tracking-wider">
                            <th className="px-6 py-4">User</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4">Subscription</th>
                            <th className="px-6 py-4">Limit</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {users.map(user => (
                            <tr key={user.id} className="hover:bg-white/2 transition group">
                                <td className="px-6 py-4">
                                    <div className="font-bold">{user.email}</div>
                                    <div className="text-xs text-gray-500 font-mono italic">{user.id}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${user.role === 'admin' ? 'bg-rose-500/20 text-rose-500' : 'bg-blue-500/20 text-blue-500'
                                        }`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase bg-white/5`}>
                                        {user.subscriptionTier}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <input
                                        type="number"
                                        className="bg-black/50 border border-white/10 rounded-lg px-2 py-1 w-16 text-center focus:border-yellow-500 outline-none transition"
                                        defaultValue={user.trackLimit}
                                        onBlur={(e) => updateUser(user.id, { trackLimit: parseInt(e.target.value) })}
                                    />
                                </td>
                                <td className="px-6 py-4">
                                    {user.isBanned ? (
                                        <div className="flex items-center gap-2 text-red-500 font-bold">
                                            <XCircle size={16} /> Banned
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-green-500 font-bold">
                                            <CheckCircle size={16} /> Active
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => deleteUser(user.id)}
                                        className="p-2 rounded-xl bg-red-600/10 text-red-600 hover:bg-red-600/20 transition ml-2"
                                        title="Delete User"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {isLoading && <div className="p-8 text-center text-gray-500 animate-pulse">Updating list...</div>}
                {!isLoading && users.length === 0 && <div className="p-12 text-center text-gray-500 italic">No users found.</div>}
            </div>
        </div>
    );
};

export default UsersList;
