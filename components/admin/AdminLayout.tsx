import React from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { LayoutDashboard, Users, Music, Settings, LogOut, ShieldAlert } from 'lucide-react';

const AdminLayout: React.FC = () => {
    return (
        <div className="flex h-screen bg-[#0a0a0a] text-white">
            {/* Sidebar */}
            <aside className="w-64 border-r border-white/5 bg-[#111] flex flex-col">
                <div className="p-6 border-b border-white/5">
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center text-black font-black group-hover:bg-yellow-400 transition">T</div>
                        <span className="font-serif font-bold text-xl tracking-tight">Tempo <span className="text-yellow-500">Admin</span></span>
                    </Link>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <AdminNavLink to="/admin" end icon={<LayoutDashboard size={20} />} label="Dashboard" />
                    <AdminNavLink to="/admin/users" icon={<Users size={20} />} label="Users" />
                    <AdminNavLink to="/admin/tracks" icon={<Music size={20} />} label="Tracks" />
                    <AdminNavLink to="/admin/logs" icon={<ShieldAlert size={20} />} label="Audit Logs" />
                </nav>

                <div className="p-4 border-t border-white/5">
                    <button className="flex items-center gap-3 px-4 py-3 w-full rounded-xl hover:bg-red-500/10 text-red-500 transition font-bold text-sm">
                        <LogOut size={20} />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-8">
                <Outlet />
            </main>
        </div>
    );
};

const AdminNavLink: React.FC<{ to: string; icon: React.ReactNode; label: string; end?: boolean }> = ({ to, icon, label, end }) => (
    <NavLink 
        to={to} 
        end={end}
        className={({ isActive }) => `
            flex items-center gap-3 px-4 py-3 rounded-xl transition font-bold text-sm
            ${isActive ? 'bg-yellow-500 text-black' : 'text-gray-400 hover:bg-white/5 hover:text-white'}
        `}
    >
        {icon}
        {label}
    </NavLink>
);

export default AdminLayout;
