import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { usePlayerLogic } from './hooks/usePlayerLogic';
import UploadTrackModal from './components/UploadTrackModal';
import AdminPage from './components/admin/AdminPage';
import AuthModal from './components/AuthModal';
import AddToPlaylistModal from './components/AddToPlaylistModal';
import UserManagementModal from './components/UserManagementModal';
import ReloadPrompt from './components/ReloadPrompt';
import EditTrackModal from './components/EditTrackModal';
import UpdateNotification from './components/UpdateNotification';
import Header from './components/player/Header';
import TrackList from './components/player/TrackList';
import PlayerControls from './components/player/PlayerControls';
import TrainingModal from './components/player/TrainingModal';
import SettingsModal from './components/player/SettingsModal';
import ReviewModal from './components/ReviewModal';
import { PlusIcon, TrashIcon, CloudOffIcon } from './components/Icons'; // Assuming these might be needed if they were used directly, but they seem to be in subcomponents now

const PlayerUI: React.FC = () => {
  const { t } = useTranslation();
  const {
    tracks, setTracks,
    user, setUser,
    token, setToken,
    activeStyle, setActiveStyle,
    playlists, setPlaylists,
    showAdmin, setShowAdmin,
    showAuth, setShowAuth,
    showSettings, setShowSettings,
    showUserManagement, setShowUserManagement,
    showPlaylistCreator, setShowPlaylistCreator,
    showTrainingPanel, setShowTrainingPanel,
    showReview, setShowReview,
    hasReviewed, existingReview,
    handleReviewSubmit,
    toggleDownload,
    downloadedTracks,
    downloadingTracks,
    isOnline,
    trackToEdit, setTrackToEdit,
    isPlayerVisible, setIsPlayerVisible,
    playlistModalTrackId, setPlaylistModalTrackId,
    notificationPermission,
    training, setTraining,
    player, setPlayer,
    audioRef,
    isMetronomeVisualActive,
    filteredTracks,
    handleRequestNotification,
    handleLogin,
    handleLogout,
    copyInviteLink,
    handleAddTrack,
    togglePlay,
    selectTrack,
    skip,
    toggleTrackInPlaylist,
    toggleFavorite,
    handleSaveTrack,
    deleteTrack,
    currentEffectiveBpm,
    adjustBpmInPlayer
  } = usePlayerLogic();

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0a0a0a]">
      <Header
        user={user}
        training={training}
        setTraining={setTraining}
        setShowTrainingPanel={setShowTrainingPanel}
        setShowSettings={setShowSettings}
        setShowUserManagement={setShowUserManagement}
        setShowAdmin={setShowAdmin}
        setShowAuth={setShowAuth}
        setShowReview={setShowReview}
        isOnline={isOnline}
        handleLogout={handleLogout}
      />

      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <div className={`max-w-7xl mx-auto px-4 pt-4 transition-all duration-300 ${player.currentTrack && isPlayerVisible ? 'pb-48 lg:pb-64' : 'pb-8'}`}>
          <TrackList
            tracks={tracks}
            filteredTracks={filteredTracks}
            activeStyle={activeStyle}
            setActiveStyle={setActiveStyle}
            playlists={playlists}
            setPlaylists={setPlaylists}
            user={user}
            player={player}
            training={training}
            isMetronomeVisualActive={isMetronomeVisualActive}
            togglePlay={togglePlay}
            selectTrack={selectTrack}
            setShowAuth={setShowAuth}
            setShowPlaylistCreator={setShowPlaylistCreator}
            setPlaylistModalTrackId={setPlaylistModalTrackId}
            toggleFavorite={toggleFavorite}
            setTrackToEdit={setTrackToEdit}
            toggleDownload={toggleDownload}
            downloadedTracks={downloadedTracks}
            downloadingTracks={downloadingTracks}
            token={token}
          />
        </div>
      </main>

      <PlayerControls
        player={player}
        setPlayer={setPlayer}
        togglePlay={togglePlay}
        skip={skip}
        audioRef={audioRef}
        training={training}
        setTraining={setTraining}
        adjustBpmInPlayer={adjustBpmInPlayer}
        currentEffectiveBpm={currentEffectiveBpm}
        isPlayerVisible={isPlayerVisible}
        setIsPlayerVisible={setIsPlayerVisible}
      />

      <audio
        ref={audioRef}
        crossOrigin="anonymous"
        src={player.currentTrack?.url}
        preload="auto"
        playsInline={true}
        onTimeUpdate={() => {
          if (audioRef.current) setPlayer(p => ({ ...p, currentTime: audioRef.current?.currentTime || 0, duration: audioRef.current?.duration || 0 }));
        }}
        onEnded={() => {
          if (player.isRepeat) {
            if (audioRef.current) {
              audioRef.current.currentTime = 0;
              audioRef.current.play().catch(console.error);
            }
          } else {
            skip('next');
          }
        }}
      />

      <TrainingModal
        show={showTrainingPanel}
        onClose={() => setShowTrainingPanel(false)}
        training={training}
        setTraining={setTraining}
      />

      <SettingsModal
        show={showSettings}
        onClose={() => setShowSettings(false)}
        user={user}
        notificationPermission={notificationPermission}
        handleRequestNotification={handleRequestNotification}
        copyInviteLink={copyInviteLink}
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
      {showAuth && <AuthModal onLogin={handleLogin} onClose={() => setShowAuth(false)} />}
      {playlistModalTrackId && <AddToPlaylistModal playlists={playlists} trackId={playlistModalTrackId} onClose={() => setPlaylistModalTrackId(null)} onToggle={toggleTrackInPlaylist} />}
      {trackToEdit && (
        <EditTrackModal track={trackToEdit} user={user} onClose={() => setTrackToEdit(null)} onSave={handleSaveTrack} onDelete={(user?.role === 'admin' || user?.id === trackToEdit.ownerId) ? () => { deleteTrack(trackToEdit.id); setTrackToEdit(null); } : undefined} />
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
