import React from 'react';
import { Routes, Route } from 'react-router-dom';
import PlayerUI from './PlayerUI';
import AdminPage from './components/admin/AdminPage';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-rose-500/30">
      <Routes>
        <Route path="/admin/*" element={<AdminPage />} />
        <Route path="/" element={<PlayerUI />} />
      </Routes>
    </div>
  );
};

export default App;
