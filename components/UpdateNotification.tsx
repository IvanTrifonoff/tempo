import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { APP_VERSION } from '../constants';
import { StarIcon } from './Icons';

interface UpdateNotificationProps {
  hasReviewed: boolean | null;
  setShowReview: (show: boolean) => void;
}

const UpdateNotification: React.FC<UpdateNotificationProps> = ({ hasReviewed, setShowReview }) => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [changelogText, setChangelogText] = useState<string>('');

  useEffect(() => {
    const checkUpdate = async () => {
        const savedVersion = localStorage.getItem('app_version');
        const token = localStorage.getItem('token');
        
        // Silently save version for new devices/users or guests
        if (!savedVersion || !token) {
            localStorage.setItem('app_version', APP_VERSION);
            return;
        }
        
        if (savedVersion !== APP_VERSION) {
            // Fetch changelog from API
            try {
                const res = await fetch('/api/changelog/latest');
                if (res.ok) {
                    const data = await res.json();
                    if (data) {
                        const desc = i18n.language.startsWith('ru') ? data.description_ru : data.description_en;
                        setChangelogText(desc || t('update.desc'));
                    } else {
                        setChangelogText(t('update.desc'));
                    }
                } else {
                    setChangelogText(t('update.desc'));
                }
            } catch (e) {
                setChangelogText(t('update.desc'));
            }
            
            setIsOpen(true);
            
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(`Tempo Updated: v${APP_VERSION}`, {
                body: t('update.available'),
                icon: '/icon.svg'
                });
            }
        }
    };
    
    checkUpdate();
  }, [t, i18n.language]);

  const handleClose = () => {
    localStorage.setItem('app_version', APP_VERSION);
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div 
        className="bg-[#1a1a1a] border border-yellow-500/30 w-full max-w-md rounded-[2rem] p-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-500 flex flex-col items-center text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex flex-col items-center">
          <span className="inline-block px-2 py-1 bg-yellow-500/10 text-yellow-500 text-[10px] font-black uppercase tracking-wider rounded-md mb-2">
            v{APP_VERSION}
          </span>
          <h2 className="text-xl font-serif text-white font-bold">{t('update.title')}</h2>
        </div>

        <div className="space-y-3 text-gray-300 text-sm mb-6 font-light leading-relaxed w-full">
          <p className="whitespace-pre-line text-left">
            {changelogText}
          </p>
          <div className="mt-4 pt-4 border-t border-white/5">
            <p className="text-[10px] uppercase font-bold text-gray-500 mb-1 text-center">{t('app.support') || 'Support'}:</p>
            <div className="text-center">
                <a href="mailto:support@trfnv.ru" className="text-yellow-500 hover:text-yellow-400 font-medium transition text-xs">
                support@trfnv.ru
                </a>
            </div>
          </div>
        </div>

        {hasReviewed === false && (
          <button 
            onClick={() => {
              handleClose();
              setShowReview(true);
            }}
            className="w-full py-4 mb-3 bg-white/5 border border-white/10 text-yellow-500 font-bold uppercase text-xs tracking-wider rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2"
          >
            <StarIcon />
            {t('update.review') || 'Leave a Review'}
          </button>
        )}

        <button 
          onClick={handleClose}
          className="w-full py-4 bg-yellow-500 text-black font-bold uppercase text-xs tracking-wider rounded-xl hover:bg-yellow-400 transition transform active:scale-95 shadow-lg"
        >
          {t('update.action')}
        </button>
      </div>
    </div>
  );
};

export default UpdateNotification;
