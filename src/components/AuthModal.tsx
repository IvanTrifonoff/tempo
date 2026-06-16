import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const { handleLogin } = useAuth();
  const { t } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [verifySent, setVerifySent] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const invite = params.get('invite');
    if (invite) {
      setInviteCode(invite);
      setIsLogin(false);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, inviteCode })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');
      
      if (!isLogin && !inviteCode && !email.includes('admin@trfnv.ru')) {
          setVerifySent(true);
      } else {
          handleLogin(data.user, data.token);
          onClose();
      }
    } catch (error: any) {
      alert(error.message);
    }
  };

  if (verifySent) {
      return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95">
          <div className="bg-[#1a1a1a] border border-white/10 p-8 rounded-[2rem] w-[90%] max-w-sm text-center">
            <div className="w-16 h-16 bg-yellow-500/20 text-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">✉️</div>
            <h2 className="text-2xl font-serif text-white mb-2">{t('auth.verifyTitle')}</h2>
            <p className="text-gray-400 mb-6 text-sm">{t('auth.verifyDesc')}</p>
            <button onClick={onClose} className="w-full py-3 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition">{t('auth.close')}</button>
          </div>
        </div>
      )
  }

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95" 
    >
      <div 
        className="bg-[#1a1a1a] border border-white/10 p-6 rounded-[2rem] w-[90%] max-w-sm shadow-2xl text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-serif text-white mb-2">
            {inviteCode ? t('auth.studentReg') : (isLogin ? t('auth.welcomeBack') : t('auth.createAccount'))}
        </h2>
        <p className="text-gray-400 mb-6 text-xs">{isLogin ? t('auth.signInDesc') : t('auth.joinDesc')}</p>
        
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1 ml-1" htmlFor="email">{t('auth.email')}</label>
            <input 
              type="email" 
              name="email"
              id="email"
              autoComplete={isLogin ? "username email" : "email"}
              inputMode="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              // Шрифт 16px критичен для iOS!
              className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-[16px] text-white outline-none focus:border-yellow-500 transition select-text"
              placeholder="email@example.com"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1 ml-1" htmlFor="password">{t('auth.password')}</label>
            <input 
              type="password" 
              name="password"
              id="password"
              autoComplete={isLogin ? "current-password" : "new-password"}
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-[16px] text-white outline-none focus:border-yellow-500 transition"
              placeholder="••••••••"
            />
          </div>
          <button 
            type="submit" 
            className="w-full py-4 mt-2 rounded-xl bg-yellow-500 text-black font-bold uppercase hover:bg-yellow-400 transition"
          >
            {isLogin ? t('auth.signIn') : t('auth.signUp')}
          </button>
        </form>

        <button 
          onClick={() => setIsLogin(!isLogin)}
          className="mt-6 text-xs text-yellow-500 font-bold uppercase underline"
        >
          {isLogin ? t('auth.noAccount') : t('auth.hasAccount')}
        </button>

        <button 
          onClick={onClose}
          className="block w-full mt-4 text-[10px] text-gray-600 uppercase font-bold"
        >
          {t('auth.close')}
        </button>
      </div>
    </div>
  );
};

export default AuthModal;