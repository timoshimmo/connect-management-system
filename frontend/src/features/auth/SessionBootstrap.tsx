import { ReactNode, useEffect, useState } from 'react';
import { refreshAccessToken } from '@/lib/apiClient';
import { useAppDispatch } from '@/hooks';
import { sessionEstablished, sessionEnded } from '@/store/slices/authSlice';

/**
 * On first load, silently exchanges the httpOnly refresh cookie (if any) for
 * a fresh in-memory access token — the access token itself is never
 * persisted, so a hard reload would otherwise look logged-out until this
 * runs. Renders nothing until the one-time check settles, so
 * ProtectedLayout doesn't redirect to /login based on stale state.
 */
export function SessionBootstrap({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    refreshAccessToken()
      .then((ok) => dispatch(ok ? sessionEstablished() : sessionEnded()))
      .finally(() => setChecked(true));
  }, [dispatch]);

  if (!checked) return null;
  return <>{children}</>;
}
