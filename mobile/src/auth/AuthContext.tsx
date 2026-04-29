import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { storage } from './storage';

export type Role = 'DOCTOR' | 'CAREGIVER' | 'OWNER';
export type DoctorStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type SessionUser = {
  id: string;
  email: string;
  role: Role;
  doctor?: { fullName: string; title: string; specialty: string; status: DoctorStatus };
  caregiver?: { fullName: string; gender: string; birthDate: string };
};

type Ctx = {
  user: SessionUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<SessionUser>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthCtx = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await storage.getUser<SessionUser>();
        if (stored) setUser(stored);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    await storage.setSession(data.accessToken, data.refreshToken, data.user);
    setUser(data.user);
    return data.user as SessionUser;
  }, []);

  const logout = useCallback(async () => {
    await storage.clear();
    setUser(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    if (user.role === 'DOCTOR') {
      const { data } = await api.get('/doctor/me');
      const next: SessionUser = {
        ...user,
        doctor: { fullName: data.fullName, title: data.title, specialty: data.specialty, status: data.status },
      };
      setUser(next);
      await storage.setSession((await storage.getAccessToken()) ?? '', (await storage.getRefreshToken()) ?? '', next);
    } else if (user.role === 'CAREGIVER') {
      const { data } = await api.get('/me/profile');
      const next: SessionUser = {
        ...user,
        caregiver: { fullName: data.fullName, gender: data.gender, birthDate: data.birthDate },
      };
      setUser(next);
      await storage.setSession((await storage.getAccessToken()) ?? '', (await storage.getRefreshToken()) ?? '', next);
    }
  }, [user]);

  const value = useMemo(() => ({ user, loading, login, logout, refreshProfile }), [user, loading, login, logout, refreshProfile]);
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
