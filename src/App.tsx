import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { TrackProvider } from './context/TrackContext';
import { PlayerProvider } from './context/PlayerContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import PlayerUI from './PlayerUI';
import AdminPage from './components/admin/AdminPage';
import { useHeartbeat } from './hooks/useHeartbeat';

// Version 1.0.81 - Deployment fix
const App: React.FC = () => {
  useHeartbeat();

  return (
    <ErrorBoundary>
      <AuthProvider>
        <TrackProvider>
          <PlayerProvider>
            <div className="h-screen w-full overflow-hidden bg-[#0a0a0a] text-white selection:bg-rose-500/30 flex flex-col">
              <Routes>
                <Route path="/admin/*" element={<AdminPage />} />
                <Route path="/" element={<PlayerUI />} />
              </Routes>
            </div>
          </PlayerProvider>
        </TrackProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
