import React, { useState, useEffect, useRef } from 'react';
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
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Небольшая задержка перед фокусом для корректной отработки анимации iOS
    const timer = setTimeout(() => {
      emailRef.current?.focus();
    }, 500);
    return () => clearTimeout(timer);
  }, [isLogin]);

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
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95" 
      style={{ touchAction: 'none' }} // Предотвращаем прокрутку фона
    >
      <div 
        className="bg-[#1a1a1a] border border-white/10 p-6 rounded-[2rem] w-[90%] max-w-sm shadow-2xl text-center"
        style={{ touchAction: 'auto' }} // Разрешаем тачи внутри формы
      >
        <h2 className="text-2xl font-serif text-white mb-2">{isLogin ? t('auth.welcomeBack') : t('auth.createAccount')}</h2>
        <p className="text-gray-400 mb-6 text-xs">{isLogin ? t('auth.signInDesc') : t('auth.joinDesc')}</p>
        
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1 ml-1" htmlFor="email">{t('auth.email')}</label>
            <input 
              ref={emailRef}
              type="email" 
              name="email"
              id="email"
              autoComplete={isLogin ? "username email" : "email"}
              inputMode="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              // Шрифт 16px критичен для iOS!
              className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-[16px] text-white outline-none focus:border-yellow-500 transition"
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