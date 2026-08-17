import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { ensureAnonymousSession } from '@/lib/supabase';
import { trackEvent } from '@/lib/analytics';

type BackendStatus = 'connecting' | 'connected' | 'error';
type BackendContextValue = { status: BackendStatus; userId: string | null; error: string | null };

const BackendContext = createContext<BackendContextValue>({ status: 'connecting', userId: null, error: null });

export function BackendProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<BackendStatus>('connecting');
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    ensureAnonymousSession()
      .then((session) => {
        if (!active) return;
        setUserId(session.user.id);
        setStatus('connected');
        trackEvent('app_opened');
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setError(cause instanceof Error ? cause.message : 'Could not connect to Reset services.');
        setStatus('error');
      });
    return () => { active = false; };
  }, []);

  const value = useMemo(() => ({ status, userId, error }), [status, userId, error]);
  return <BackendContext.Provider value={value}>{children}</BackendContext.Provider>;
}

export function useBackend() {
  return useContext(BackendContext);
}
