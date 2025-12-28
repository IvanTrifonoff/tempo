import React from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { useTranslation } from 'react-i18next'

function ReloadPrompt() {
  const { t } = useTranslation();
  
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered');
      if (r) {
        // Check for updates every minute
        setInterval(() => {
          r.update();
        }, 60000);
      }
    },
    onRegisterError(error) {
      console.log('SW registration error', error)
    },
  })

  const close = () => {
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-xs">
      { (offlineReady || needRefresh) && (
        <div className="bg-yellow-500 border border-black/10 rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col gap-3 animate-in slide-in-from-top duration-500">
          <div className="text-black text-sm font-bold text-center">
            {offlineReady
              ? t('pwa.offlineReady')
              : t('pwa.updateAvailable')}
          </div>
          <div className="flex gap-2">
            {needRefresh && (
              <button 
                className="flex-1 bg-black text-white px-3 py-2 rounded-lg text-xs font-black uppercase"
                onClick={() => updateServiceWorker(true)}
              >
                {t('pwa.reload')}
              </button>
            )}
            <button 
              className="flex-1 bg-black/10 text-black px-3 py-2 rounded-lg text-xs font-bold uppercase hover:bg-black/20"
              onClick={close}
            >
              {t('pwa.close')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReloadPrompt
