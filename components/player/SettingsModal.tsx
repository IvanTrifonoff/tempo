import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { User } from '../../types';
import { ShieldCheckIcon } from '../Icons';
import { APP_VERSION } from '../../constants';

interface SettingsModalProps {
    show: boolean;
    onClose: () => void;
    user: User | null;
    notificationPermission: NotificationPermission;
    handleRequestNotification: () => void;
    copyInviteLink: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
    show,
    onClose,
    user,
    notificationPermission,
    handleRequestNotification,
    copyInviteLink
}) => {
    const { t, i18n } = useTranslation();

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4 transition-all overflow-hidden">
            <div className="bg-[#1a1a1a] border border-white/10 p-6 md:p-8 rounded-[2.5rem] w-full max-w-lg shadow-2xl relative flex flex-col max-h-[90dvh]">
                <div className="flex justify-between items-start mb-6 shrink-0">
                    <div>
                        <h2 className="text-2xl font-serif text-white font-bold mb-1">{t('app.settings')}</h2>
                        <p className="text-gray-500 text-sm font-medium">Preferences & About</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl font-light">&times;</button>
                </div>
                
                <div className="space-y-4 overflow-y-auto custom-scrollbar flex-1 pr-1 pb-4 -mr-2">
                    <div className="p-5 bg-white/5 rounded-3xl border border-white/10 flex flex-col xs:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3 w-full xs:w-auto">
                            <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500 font-bold text-sm uppercase shrink-0">
                                {i18n.language ? i18n.language.slice(0, 2) : 'EN'}
                            </div>
                            <div>
                                <h4 className="text-white font-bold text-lg leading-tight">{t('app.language')}</h4>
                                <p className="text-xs text-gray-500 mt-1">{t('app.languageDesc')}</p>
                            </div>
                        </div>
                        <div className="flex gap-1 bg-black/40 rounded-xl p-1 border border-white/5 w-full xs:w-auto justify-center shrink-0">
                            {['en', 'es', 'ru'].map(lang => (
                                <button key={lang} onClick={() => i18n.changeLanguage(lang)} className={`px-3 py-2 rounded-lg text-xs font-bold uppercase transition flex-1 xs:flex-none text-center ${i18n.language.startsWith(lang) ? 'bg-yellow-500 text-black shadow-md' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
                                    {lang}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="p-5 bg-white/5 rounded-3xl border border-white/10 flex flex-col xs:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3 w-full xs:w-auto">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${notificationPermission === 'granted' ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-500'}`}>
                                🔔
                            </div>
                            <div>
                                <h4 className="text-white font-bold text-lg leading-tight">{t('app.notifications')}</h4>
                                <p className="text-xs text-gray-500 mt-1">
                                    {notificationPermission === 'granted' ? t('app.notificationsOn') : t('app.notificationsOff')}
                                </p>
                            </div>
                        </div>
                        {notificationPermission !== 'granted' && (
                            <button onClick={handleRequestNotification} className="w-full xs:w-auto px-4 py-2 bg-yellow-500 text-black font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-yellow-400 transition whitespace-nowrap shrink-0">
                                {t('app.enable')}
                            </button>
                        )}
                    </div>
                    
                    {user?.role === 'coach' && (
                        <div className="p-5 bg-yellow-500/10 rounded-3xl border border-yellow-500/20 flex flex-col xs:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-3 w-full xs:w-auto text-left">
                                <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center text-black text-xl shrink-0">👥</div>
                                <div>
                                    <h4 className="text-white font-bold text-lg leading-tight">{t('app.inviteTitle') || 'Invite Students'}</h4>
                                    <p className="text-xs text-gray-500 mt-1">{t('app.inviteDesc') || 'Students register via your link'}</p>
                                </div>
                            </div>
                            <button onClick={copyInviteLink} className="w-full xs:w-auto px-6 py-2.5 bg-yellow-500 text-black font-black rounded-xl text-xs uppercase tracking-widest hover:bg-yellow-400 transition whitespace-nowrap shadow-lg shadow-yellow-500/20 shrink-0">
                                {t('app.copyLink') || 'Copy Link'}
                            </button>
                        </div>
                    )}
                    
                    {user?.role === 'admin' && (
                        <div className="pt-2">
                            <Link to="/admin" onClick={onClose} className="w-full py-4 bg-yellow-500/10 text-yellow-500 font-bold uppercase rounded-xl hover:bg-yellow-500/20 transition-all border border-yellow-500/20 flex items-center justify-center gap-3">
                                <ShieldCheckIcon size={20} /> {t('admin.title') || 'Admin Panel'}
                            </Link>
                        </div>
                    )}
                </div>

                <div className="pt-4 shrink-0">
                    <button onClick={onClose} className="w-full py-5 bg-yellow-500 text-black font-black uppercase rounded-[1.5rem] hover:bg-yellow-400 transition-all shadow-lg active:scale-95">
                        {t('coach.close') || 'Close'}
                    </button>
                    <div className="mt-4 text-[10px] text-gray-600 text-center uppercase tracking-widest font-bold">v{APP_VERSION} • tempo.TRFNV</div>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
