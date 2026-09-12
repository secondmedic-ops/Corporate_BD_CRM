import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserDto } from '../types/api';
import { authApi } from '../api/endpoints';
import { mockAdapter, db } from '../api/mock/adapter';

interface AuthContextType {
  user: UserDto | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  switchUser: (email: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const initAuth = async () => {
    setIsLoading(true);
    try {
      const storedEmail = localStorage.getItem('sm_crm_user_email') || 'ravi@secondmedic.com';
      const found = db.users.find((u) => u.email === storedEmail) || db.users[0];
      mockAdapter.setCurrentUser(found);
      setUser(found);
      localStorage.setItem('sm_crm_user_email', found.email);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const login = async (email: string, password?: string) => {
    const res = await authApi.login(email, password);
    setUser(res.user);
    mockAdapter.setCurrentUser(res.user);
    localStorage.setItem('sm_crm_user_email', res.user.email);
  };

  const logout = async () => {
    await authApi.logout();
    localStorage.removeItem('sm_crm_user_email');
    setUser(null);
  };

  const switchUser = async (email: string) => {
    await login(email, 'DummyPass@123');
  };

  const refreshUser = async () => {
    if (!user) return;
    const refreshed = await authApi.getMe();
    setUser(refreshed);
    mockAdapter.setCurrentUser(refreshed);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, switchUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
