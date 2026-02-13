import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PlayerUI from './PlayerUI';
import AdminPage from './components/admin/AdminPage';

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/admin/*" element={<AdminPage />} />
      <Route path="/" element={<PlayerUI />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
