import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

// Эту версию мы будем менять руками при важных обновлениях
const CURRENT_VERSION = '1.0.4';

const UpdateNotification: React.FC = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const savedVersion = localStorage.getItem('app_version');
    // Показываем, если сохраненная версия отличается от текущей
    if (savedVersion !== CURRENT_VERSION) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('app_version', CURRENT_VERSION);
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div 
        className="bg-[#1a1a1a] border border-yellow-500/30 w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-500"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <span className="inline-block px-2 py-1 bg-yellow-500/10 text-yellow-500 text-[10px] font-black uppercase tracking-wider rounded-md mb-2">
              v{CURRENT_VERSION}
            </span>
            <h2 className="text-xl font-serif text-white">{t('update.title')}</h2>
          </div>
          <button 
            onClick={handleClose}
            className="p-2 text-gray-500 hover:text-white transition"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 text-gray-300 text-sm mb-6 font-light leading-relaxed">
          <p>
            {t('update.desc')}
          </p>
          <p className="text-[10px] text-gray-600 mt-4 border-t border-white/5 pt-2 uppercase tracking-wide">
             tempo.TRFNV • dance coach PRO
          </p>
        </div>

        <button 
          onClick={handleClose}
          className="w-full py-4 bg-yellow-500 text-black font-bold uppercase text-sm tracking-wider rounded-xl hover:bg-yellow-400 transition transform active:scale-95"
        >
          {t('update.action')}
        </button>
      </div>
    </div>
  );
};

export default UpdateNotification;
