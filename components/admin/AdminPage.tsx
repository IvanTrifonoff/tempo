import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminProvider } from './AdminContext';
import AdminLayout from './AdminLayout';
import Dashboard from './Dashboard';
import UsersList from './UsersList';

const AdminPage: React.FC = () => {
    return (
        <AdminProvider>
            <Routes>
                <Route element={<AdminLayout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="users" element={<UsersList />} />
                    <Route path="tracks" element={<div className="p-8 text-center text-gray-500 italic">Tracks management coming soon...</div>} />
                    <Route path="logs" element={<div className="p-8 text-center text-gray-500 italic">Audit logs coming soon...</div>} />
                    <Route path="*" element={<Navigate to="" replace />} />
                </Route>
            </Routes>
        </AdminProvider>
    );
};

export default AdminPage;
