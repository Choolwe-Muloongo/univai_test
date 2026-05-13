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

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const nextSession = await getSession();
      setSession(nextSession);
    } catch (error) {
      console.error('Failed to load session', error);
      setSession({ user: null });
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
