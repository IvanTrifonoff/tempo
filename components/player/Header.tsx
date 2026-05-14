import React from 'react';
import { useTranslation } from 'react-i18next';
import { User, TrainingSettings } from '../../types';
import {
    MetronomeIcon, WhistleIcon, SettingsIcon,
    ShieldCheckIcon, PlusIcon, UserIcon, StarIcon, CloudOffIcon
} from '../Icons';

interface HeaderProps {
    user: User | null;
    training: TrainingSettings;
    setTraining: React.Dispatch<React.SetStateAction<TrainingSettings>>;
    setShowTrainingPanel: (show: boolean) => void;
    setShowSettings: (show: boolean) => void;
    setShowUserManagement: (show: boolean) => void;
    setShowAdmin: (show: boolean) => void;
    setShowAuth: (show: boolean) => void;
    setShowReview: (show: boolean) => void;
    isOnline: boolean;
    handleLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({
    user,
    training,
    setTraining,
    setShowTrainingPanel,
    setShowSettings,
    setShowUserManagement,
    setShowAdmin,
    setShowAuth,
    setShowReview,
    isOnline,
    handleLogout
}) => {
    const { t } = useTranslation();

    return (
        <header className="flex-shrink-0 z-40 bg-black/80 backdrop-blur-md border-b border-white/10 px-4 py-2 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <h1 className="text-xl font-serif font-bold tracking-tight text-white hidden sm:block">{t('app.title')}</h1>
                {!isOnline && (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/5 border border-white/10 rounded-md text-gray-500 text-[10px] uppercase font-black tracking-widest">
                        <CloudOffIcon />
                        <span className="hidden xs:inline">{t('app.offline') || 'Offline'}</span>
                    </div>
                )}
            </div>
            <div className="flex items-center gap-2 md:gap-4">
                {user && (
                    <button onClick={() => setShowReview(true)} className="flex items-center gap-2 p-2 md:px-3 md:py-1.5 rounded-full border border-white/10 bg-white/5 text-yellow-500 hover:bg-yellow-500/10 transition-all">
                        <StarIcon /> <span className="hidden md:inline font-bold text-sm tracking-tight">{t('app.review') || 'Review'}</span>
                    </button>
                )}
                <button onClick={() => setTraining(t => ({ ...t, metronomeEnabled: !t.metronomeEnabled }))} className={`p-1.5 md:px-3 md:py-1.5 rounded-full border transition-all duration-300 flex items-center gap-2 ${training.metronomeEnabled ? 'bg-yellow-500 text-black border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.4)]' : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'}`}>
                    <MetronomeIcon /> <span className="hidden md:inline font-bold text-sm">{t('app.metronome')}</span>
                </button>
                <button onClick={() => setShowTrainingPanel(true)} className={`flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-1.5 rounded-full border transition-all duration-300 ${training.isActive ? 'bg-yellow-500 text-black border-yellow-500 shadow-lg' : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'}`}>
                    <WhistleIcon /> <span className="hidden md:inline font-bold text-sm tracking-tight">{t('app.coachMode')}</span>
                </button>
                <button onClick={() => setShowSettings(true)} className="flex items-center gap-2 p-2 md:px-3 md:py-1.5 rounded-full border border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 transition-all">
                    <SettingsIcon /> <span className="hidden md:inline font-bold text-sm tracking-tight">{t('app.settings')}</span>
                </button>
                {user?.role === 'admin' && (
                    <button onClick={() => setShowUserManagement(true)} className="flex items-center gap-2 p-2 md:px-3 md:py-1.5 rounded-full border border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 transition-all">
                        <ShieldCheckIcon /> <span className="hidden md:inline font-bold text-sm tracking-tight">{t('app.adminUsers')}</span>
                    </button>
                )}
                {(user?.role === 'admin' || user?.role === 'coach' || user?.isAdmin) && (
                    <button onClick={() => setShowAdmin(true)} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full border border-white/10 transition text-sm">
                        <PlusIcon /> <span className="hidden md:inline">{t('app.upload')}</span>
                    </button>
                )}
                <button onClick={() => user ? handleLogout() : setShowAuth(true)} className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black px-3 py-1.5 md:px-4 md:py-1.5 rounded-full font-bold transition shadow-md text-sm">
                    <UserIcon /> <span className="hidden xs:inline">{user ? t('app.logout') : t('app.login')}</span>
                </button>
            </div>
        </header>
    );
};

export default Header;
