'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getSession } from '@/lib/api';
import type { Session } from '@/lib/api/types';

type SessionContextValue = {
  session: Session | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | undefined>(undefined);
const SESSION_CACHE_KEY = 'univai.session.bootstrap.v1';

function canUseSessionStorage() {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
}

function readCachedSession(): Session | null {
  if (!canUseSessionStorage()) return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Session | null;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function writeCachedSession(session: Session | null) {
  if (!canUseSessionStorage()) return;
  try {
    if (!session?.user) {
      window.sessionStorage.removeItem(SESSION_CACHE_KEY);
      return;
    }
    window.sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(session));
  } catch {
    // Cache is only a speed boost. Ignore storage failures.
  }
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const cached = readCachedSession();
    if (cached?.user) {
      setSession(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      const nextSession = await getSession();
      setSession(nextSession);
      writeCachedSession(nextSession);
    } catch (error) {
      console.error('Failed to load session', error);
      setSession({ user: null });
      writeCachedSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(() => ({ session, loading, refresh }), [session, loading, refresh]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
