import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User } from '../types';

interface AuthModalProps {
  onLogin: (user: User, token: string) => void;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onLogin, onClose }) => {
  const { t } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');
      
      onLogin(data.user, data.token);
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#1a1a1a] border border-white/10 p-8 rounded-2xl w-full max-w-sm shadow-2xl text-center">
        <h2 className="text-3xl font-serif text-white mb-2">
            {isLogin ? t('auth.welcomeBack') : t('auth.createAccount')}
        </h2>
        <p className="text-gray-400 mb-6">
            {isLogin ? t('auth.signInDesc') : t('auth.joinDesc')}
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">{t('auth.email')}</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 focus:border-yellow-500 outline-none transition"
              placeholder="coach@dancepro.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">{t('auth.password')}</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 focus:border-yellow-500 outline-none transition"
              placeholder="••••••••"
            />
          </div>
          <button 
            type="submit" 
            className="w-full py-3 rounded-lg bg-yellow-500 text-black font-bold hover:bg-yellow-400 transition"
          >
            {isLogin ? t('auth.signIn') : t('auth.signUp')}
          </button>
        </form>

        <button 
          onClick={() => setIsLogin(!isLogin)}
          className="mt-6 text-sm text-yellow-500 hover:text-yellow-400 underline"
        >
          {isLogin ? t('auth.noAccount') : t('auth.hasAccount')}
        </button>

        <button 
          onClick={onClose}
          className="block w-full mt-4 text-sm text-gray-500 hover:text-gray-400"
        >
          {t('auth.close')}
        </button>
      </div>
    </div>
  );
};

export default AuthModal;