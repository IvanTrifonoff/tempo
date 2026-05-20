import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TrashIcon } from './Icons';

interface UserManagementModalProps {
  onClose: () => void;
}

const UserManagementModal: React.FC<UserManagementModalProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
        const res = await fetch('/api/admin/users', { 
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } 
        });
        const data = await res.json();
        if (Array.isArray(data)) setUsers(data);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#1a1a1a] border border-white/10 p-6 rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-serif text-yellow-500 font-bold">
                {t('app.adminUsers')}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-white text-3xl font-light">&times;</button>
        </div>

        <div className="overflow-y-auto flex-1 pr-2 custom-scrollbar space-y-3">
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
        <button onClick={onClose} className="w-full mt-6 py-4 bg-white/5 text-white font-bold uppercase rounded-xl hover:bg-white/10 transition border border-white/10 text-xs">
            {t('auth.close')}
        </button>
      </div>
    </div>
  );
};

export default UserManagementModal;
