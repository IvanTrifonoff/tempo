import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { User } from '../types';
import { authApi } from '../services/api/authApi';
import { handleApiError } from '../services/api/errors';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  handleLogin: (user: User, token: string) => void;
  handleLogout: () => void;
  copyInviteLink: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  // Sync token to localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  // Fetch current user when token changes
  useEffect(() => {
    if (token) {
      authApi.fetchCurrentUser(token)
        .then(setUser)
        .catch(() => {
          handleApiError(new Error('Failed to load user — invalid token'), {
            operation: 'fetchCurrentUser',
          });
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        });
    }
  }, [token]);

  const handleLogin = useCallback((newUser: User, newToken: string) => {
    setToken(newToken);
    setUser(newUser);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }, []);

  const copyInviteLink = useCallback(() => {
    if (!user) return;
    const link = `${window.location.origin}/?invite=${user.id}`;
    navigator.clipboard.writeText(link);
    alert(t('app.inviteCopied') || 'Invite link copied to clipboard!');
  }, [user, t]);

  const refreshUser = useCallback(async () => {
    if (!token) return;
    try {
      const updatedUser = await authApi.fetchCurrentUser(token);
      setUser(updatedUser);
    } catch (e) {
      handleApiError(e, { operation: 'refreshUser' });
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!user,
      handleLogin,
      handleLogout,
      copyInviteLink,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
