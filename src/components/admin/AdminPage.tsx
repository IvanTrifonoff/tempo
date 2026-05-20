import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminProvider } from './AdminContext';
import AdminLayout from './AdminLayout';
import Dashboard from './Dashboard';
import UsersList from './UsersList';
import AdminTracksList from './AdminTracksList';
import ActivityLogsList from './ActivityLogsList';
import ReviewsList from './ReviewsList';

const AdminPage: React.FC = () => {
    return (
        <AdminProvider>
            <Routes>
                <Route element={<AdminLayout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="users" element={<UsersList />} />
                    <Route path="tracks" element={<AdminTracksList />} />
                    <Route path="reviews" element={<ReviewsList />} />
                    <Route path="logs" element={<ActivityLogsList />} />
                    <Route path="*" element={<Navigate to="" replace />} />
                </Route>
            </Routes>
        </AdminProvider>
    );
};

export default AdminPage;
