import React from 'react';
import { usePlayerContext } from '../../context/PlayerContext';

const AudioPlayer: React.FC = () => {
  const { audioRef, player, setPlayer, skip } = usePlayerContext();

  return (
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
  );
};

export default AudioPlayer;
