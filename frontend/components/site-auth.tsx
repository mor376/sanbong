'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type SiteUser = { hoTen: string; username: string; vaiTro: 'ADMIN' | 'MEMBER' };
type SiteAuth = { user: SiteUser | null; authChecked: boolean; logout: () => void };

const SiteAuthContext = createContext<SiteAuth | null>(null);

export function SiteAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SiteUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let active = true;

    const syncAuth = async () => {
      const token = localStorage.getItem('sb_token');
      if (!token) {
        if (active) {
          setUser(null);
          setAuthChecked(true);
        }
        return;
      }

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('sb_token');
          if (active) setUser(null);
          return;
        }
        if (!response.ok) {
          throw new Error(`Không thể xác thực tài khoản (HTTP ${response.status}).`);
        }
        const currentUser = await response.json() as SiteUser;
        if (active) setUser(currentUser);
      } catch (cause) {
        console.error('Không thể kiểm tra trạng thái đăng nhập:', cause);
        if (active) setUser(null);
      } finally {
        if (active) setAuthChecked(true);
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'sb_token') {
        setAuthChecked(false);
        void syncAuth();
      }
    };

    void syncAuth();
    window.addEventListener('storage', handleStorage);
    return () => {
      active = false;
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const logout = () => {
    localStorage.removeItem('sb_token');
    setUser(null);
  };

  return (
    <SiteAuthContext.Provider value={{ user, authChecked, logout }}>
      {children}
    </SiteAuthContext.Provider>
  );
}

export function useSiteAuth() {
  const auth = useContext(SiteAuthContext);
  if (!auth) {
    throw new Error('useSiteAuth must be used within SiteAuthProvider.');
  }
  return auth;
}
