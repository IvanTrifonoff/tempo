import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from './context/AuthContext';
import { useTrackContext } from './context/TrackContext';
import { usePlayerContext } from './context/PlayerContext';
import { useUIState } from './hooks/useUIState';
import UploadTrackModal from './components/UploadTrackModal';
import AuthModal from './components/AuthModal';
import AddToPlaylistModal from './components/AddToPlaylistModal';
import UserManagementModal from './components/UserManagementModal';
import ReloadPrompt from './components/ReloadPrompt';
import EditTrackModal from './components/EditTrackModal';
import UpdateNotification from './components/UpdateNotification';
import Header from './components/player/Header';
import TrackList from './components/player/TrackList';
import AudioPlayer from './components/player/AudioPlayer';
import PlayerControls from './components/player/PlayerControls';
import TrainingModal from './components/player/TrainingModal';
import SettingsModal from './components/player/SettingsModal';
import ReviewModal from './components/ReviewModal';

const PlayerUI: React.FC = () => {
  const { t } = useTranslation();
  const { user, token } = useAuth();
  const {
    playlists, setPlaylists,
    handleAddTrack,
    handleSaveTrack,
    deleteTrack,
    toggleTrackInPlaylist,
  } = useTrackContext();
  const {
    showAdmin, setShowAdmin,
    showAuth, setShowAuth,
    showSettings, setShowSettings,
    showUserManagement, setShowUserManagement,
    showPlaylistCreator, setShowPlaylistCreator,
    showTrainingPanel, setShowTrainingPanel,
    showReview, setShowReview,
    trackToEdit, setTrackToEdit,
    playlistModalTrackId, setPlaylistModalTrackId,
    notificationPermission,
    handleRequestNotification,
    hasReviewed, existingReview,
    handleReviewSubmit,
    isOnline,
  } = useUIState();

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0a0a0a]">
      <Header
        setShowTrainingPanel={setShowTrainingPanel}
        setShowSettings={setShowSettings}
        setShowUserManagement={setShowUserManagement}
        setShowAdmin={setShowAdmin}
        setShowAuth={setShowAuth}
        setShowReview={setShowReview}
        isOnline={isOnline}
      />

      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-7xl mx-auto px-4 pt-4 transition-all duration-300 pb-8">
          <TrackList
            setShowAuth={setShowAuth}
            setShowPlaylistCreator={setShowPlaylistCreator}
            setPlaylistModalTrackId={setPlaylistModalTrackId}
            setTrackToEdit={setTrackToEdit}
          />
        </div>
      </main>

      <AudioPlayer />
      <PlayerControls />

      <TrainingModal
        show={showTrainingPanel}
        onClose={() => setShowTrainingPanel(false)}
      />

      <SettingsModal
        show={showSettings}
        onClose={() => setShowSettings(false)}
        notificationPermission={notificationPermission}
        handleRequestNotification={handleRequestNotification}
      />

      {showPlaylistCreator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4 animate-in fade-in duration-200">
          <div className="bg-[#1a1a1a] border border-white/10 p-8 rounded-[2rem] w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-serif text-white mb-6 text-center">{t('app.newPlaylist')}</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              const name = (e.target as any).playlistName.value;
              if (name && token) {
                fetch('/api/playlists', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ name }) }).then(res => res.json()).then(newPl => setPlaylists(prev => [...prev, newPl])).catch(console.error);
                setShowPlaylistCreator(false);
              }
            }}>
              <input name="playlistName" type="text" autoFocus required className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white mb-8 outline-none focus:border-yellow-500 transition select-text placeholder:text-gray-600" placeholder={t('app.playlistName')} />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowPlaylistCreator(false)} className="flex-1 py-3.5 rounded-xl text-gray-400 font-bold hover:bg-white/5 hover:text-white transition uppercase text-xs tracking-wider">
                  {t('app.cancel')}
                </button>
                <button type="submit" className="flex-1 py-3.5 bg-yellow-500 text-black font-bold rounded-xl hover:bg-yellow-400 transition uppercase text-xs tracking-wider shadow-lg">
                  {t('app.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAdmin && <UploadTrackModal onAddTrack={handleAddTrack} onClose={() => setShowAdmin(false)} />}
      {showUserManagement && <UserManagementModal onClose={() => setShowUserManagement(false)} />}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      {playlistModalTrackId && (
        <AddToPlaylistModal
          playlists={playlists}
          trackId={playlistModalTrackId}
          onClose={() => setPlaylistModalTrackId(null)}
          onToggle={(playlistId, isAdding) => toggleTrackInPlaylist(playlistId, playlistModalTrackId, isAdding)}
        />
      )}
      {trackToEdit && (
        <EditTrackModal
          track={trackToEdit}
          onClose={() => setTrackToEdit(null)}
          onSave={(id, data) => handleSaveTrack(id, data)}
          onDelete={(user?.role === 'admin' || user?.id === trackToEdit.ownerId) ? () => { deleteTrack(trackToEdit.id); setTrackToEdit(null); } : undefined}
        />
      )}
      <UpdateNotification hasReviewed={hasReviewed} setShowReview={setShowReview} />
      <ReloadPrompt />
      <ReviewModal
        isOpen={showReview}
        onClose={() => setShowReview(false)}
        onSubmit={handleReviewSubmit}
        initialRating={existingReview?.rating}
        initialComment={existingReview?.comment}
      />
    </div>
  );
};

export default PlayerUI;
