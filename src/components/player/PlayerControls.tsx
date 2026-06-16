import React from 'react';
import { useTranslation } from 'react-i18next';
import { usePlayerContext } from '../../context/PlayerContext';
import {
    PlayIcon, PauseIcon, SkipForward, SkipBack,
    RepeatIcon, ShuffleIcon, MetronomeIcon
} from '../Icons';
import { STYLE_COLORS } from '../../constants';

const PlayerControls: React.FC = () => {
    const { t } = useTranslation();
    const {
        player, setPlayer,
        togglePlay, skip,
        audioRef,
        training, setTraining,
        adjustBpmInPlayer, currentEffectiveBpm,
        isPlayerVisible, setIsPlayerVisible
    } = usePlayerContext();

    if (!player.currentTrack) return null;

    if (!isPlayerVisible) {
        return (
            <button onClick={() => setIsPlayerVisible(true)} className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-yellow-500 text-black rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all animate-bounce">
                <PlayIcon />
            </button>
        );
    }

    return (
        <div className="fixed bottom-0 inset-x-0 z-50 bg-black/90 backdrop-blur-2xl border-t border-white/10 px-6 py-4 lg:py-6 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom duration-300">
            <div className="max-w-7xl mx-auto relative">
                <button onClick={() => setIsPlayerVisible(false)} className="absolute -top-12 right-0 bg-black/80 text-gray-400 hover:text-white p-2 rounded-t-xl border-t border-x border-white/10 flex items-center gap-2 text-xs font-bold transition-all">
                    {t('player.hide')} <span>▼</span>
                </button>
                <div className="flex flex-col gap-4">
                    {player.isPauseCountdown && (
                        <div className="flex items-center justify-center gap-4 py-3 bg-yellow-500/20 border border-yellow-500/40 rounded-2xl animate-pulse shadow-lg">
                            <div className="text-yellow-500 font-black text-3xl font-mono">{player.countdownValue}</div>
                            <div className="flex flex-col leading-none text-left">
                                <span className="text-yellow-500 font-bold uppercase tracking-widest text-xs">{t('player.pauseCoach')}</span>
                                <span className="text-white/60 text-[10px] font-medium">{t('player.nextDance')}</span>
                            </div>
                        </div>
                    )}
                    <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[auto_auto_1fr_auto] lg:items-center">
                        {/* 1. Track Info */}
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                            <div className={`w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center ${STYLE_COLORS[player.currentTrack.style]} text-white shadow-2xl relative overflow-hidden`}>
                                <div className="absolute inset-0 bg-black/20"></div>
                                <MetronomeIcon />
                            </div>
                            <div className="min-w-0 text-left flex-1">
                                <h4 className="text-white font-bold truncate text-lg leading-tight">{player.currentTrack.title}</h4>
                                <p className="text-gray-400 text-sm truncate">{player.currentTrack.artist} • {t(`styles.${player.currentTrack.style}`)}</p>
                            </div>
                        </div>

                        {/* 2. Controls */}
                        <div className="flex flex-col items-center gap-3 w-full lg:col-start-3 lg:px-6">
                            <div className="flex items-center justify-center gap-6 w-full">
                                <button onClick={() => setPlayer(p => ({ ...p, isShuffle: !p.isShuffle }))} className="text-gray-500 hover:text-white transition-all"><ShuffleIcon active={player.isShuffle} /></button>
                                <button onClick={() => skip('prev')} className="text-gray-500 hover:text-white transition-all hover:scale-110"><SkipBack /></button>
                                <button onClick={togglePlay} className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-black hover:scale-110 active:scale-95 transition-all shadow-xl">
                                    {player.isPlaying ? <PauseIcon /> : <PlayIcon />}
                                </button>
                                <button onClick={() => skip('next')} className="text-gray-500 hover:text-white transition-all hover:scale-110"><SkipForward /></button>
                                <button onClick={() => setPlayer(p => ({ ...p, isRepeat: !p.isRepeat }))} className="text-gray-500 hover:text-white transition-all"><RepeatIcon active={player.isRepeat} /></button>
                            </div>
                            <div className="w-full flex items-center gap-3 text-[11px] font-mono text-gray-500 font-bold px-2">
                                <span>{Math.floor(player.currentTime / 60)}:{(Math.floor(player.currentTime % 60)).toString().padStart(2, '0')}</span>
                                <div className="relative flex-1 h-2 rounded-full bg-white/5 overflow-hidden group">
                                    <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-yellow-600 to-yellow-400 transition-all duration-100 shadow-[0_0_10px_rgba(234,179,8,0.3)]" style={{ width: `${(player.currentTime / (player.duration || 1)) * 100}%` }} />
                                    <input type="range" min="0" max={player.duration || 0} value={player.currentTime} onChange={e => { if (audioRef.current) audioRef.current.currentTime = Number(e.target.value); }} className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                </div>
                                <span>{Math.floor(player.duration / 60)}:{(Math.floor(player.duration % 60)).toString().padStart(2, '0')}</span>
                            </div>
                        </div>

                        {/* 3. Bottom Row: BPM + Speed */}
                        <div className="flex items-stretch gap-3 w-full lg:contents">
                            <div className="flex-1 lg:flex-none flex flex-col items-center justify-center bg-white/5 rounded-xl p-2 border border-white/10 shadow-inner lg:col-start-2 lg:ml-8 lg:mr-4">
                                <div className="flex items-center justify-between w-full mb-1 px-1">
                                    <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{t('player.bpm')}</span>
                                    <button onClick={() => setTraining(t => ({ ...t, metronomeEnabled: !t.metronomeEnabled }))} className={`transition-colors ${training.metronomeEnabled ? 'text-yellow-500' : 'text-gray-600'}`}>
                                        <MetronomeIcon />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between gap-2 w-full">
                                    <button onClick={() => adjustBpmInPlayer(-1)} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold transition flex items-center justify-center shadow-md">-</button>
                                    <div className="flex flex-col items-center">
                                        <span className="text-yellow-500 font-black text-xl leading-none">{currentEffectiveBpm}</span>
                                        <span className="text-[8px] text-gray-500 font-bold hidden sm:inline">{t('player.base')}: {player.currentTrack.bpm}</span>
                                    </div>
                                    <button onClick={() => adjustBpmInPlayer(1)} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold transition flex items-center justify-center shadow-md">+</button>
                                </div>
                            </div>

                            <div className="flex-1 lg:flex-none flex flex-col justify-center gap-2 bg-white/5 rounded-xl p-3 lg:p-0 lg:bg-transparent lg:col-start-4 lg:w-48 lg:border-none lg:shadow-none border border-white/10 shadow-inner">
                                <div className="flex justify-between text-[10px] text-gray-400 font-black uppercase tracking-tighter">
                                    <span>{t('player.speed')}</span>
                                    <span className="text-yellow-500">{(player.playbackRate * 100).toFixed(0)}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0.5"
                                    max="1.1"
                                    step="0.05"
                                    value={player.playbackRate}
                                    onChange={e => setPlayer(p => ({ ...p, playbackRate: Number(e.target.value) }))}
                                    className="w-full h-2 bg-white/10 rounded-full appearance-none accent-yellow-500 cursor-pointer hover:bg-white/20 transition"
                                />
                                <div className="flex justify-between gap-2">
                                    <button onClick={() => setPlayer(p => ({ ...p, playbackRate: 0.8 }))} className={`flex-1 py-1 rounded-md text-[10px] font-bold uppercase transition ${player.playbackRate === 0.8 ? 'bg-yellow-500 text-black' : 'bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white'}`}>80%</button>
                                    <button onClick={() => setPlayer(p => ({ ...p, playbackRate: 1.0 }))} className={`flex-1 py-1 rounded-md text-[10px] font-bold uppercase transition ${player.playbackRate === 1.0 ? 'bg-yellow-500 text-black' : 'bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white'}`}>Normal</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlayerControls;
