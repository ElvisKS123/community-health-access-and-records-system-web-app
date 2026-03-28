import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { apiFetch, clearAuthToken, setAuthToken } from './api';

export type AuthUser = {
  id: number;
  fullName?: string | null;
  email: string;
  role: 'admin' | 'doctor' | 'receptionist';
  department?: string | null;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
  hydrate: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const loadStoredAuth = () => {
  try {
    const token = localStorage.getItem('chars_token');
    const userRaw = localStorage.getItem('chars_user');
    const user = userRaw ? (JSON.parse(userRaw) as AuthUser) : null;
    return { token, user };
  } catch {
    return { token: null, user: null };
  }
};

const saveStoredUser = (user: AuthUser | null) => {
  try {
    if (user) {
      localStorage.setItem('chars_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('chars_user');
    }
  } catch {
    // Ignore storage errors
  }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { token: initialToken, user: initialUser } = loadStoredAuth();
  const [token, setToken] = useState<string | null>(initialToken);
  const [user, setUser] = useState<AuthUser | null>(initialUser);

  const hydrate = useCallback(() => {
    const stored = loadStoredAuth();
    setToken(stored.token);
    setUser(stored.user);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await apiFetch<{ token: string; user: AuthUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setAuthToken(result.token);
    saveStoredUser(result.user);
    setToken(result.token);
    setUser(result.user);
    return result.user;
  }, []);

  const logout = useCallback(() => {
    clearAuthToken();
    saveStoredUser(null);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, token, login, logout, hydrate }),
    [user, token, login, logout, hydrate]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
