import * as React from 'react';
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from '@/lib/api';

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<'pending' | 'ok' | 'no'>('pending');

  useEffect(() => {
    api.auth
      .me()
      .then(() => setStatus('ok'))
      .catch(() => setStatus('no'));
  }, []);

  if (status === 'pending') {
    return (
      <div className="ef-surface-light flex min-h-[100dvh] items-center justify-center text-ink-soft">
        Завантаження…
      </div>
    );
  }
  if (status === 'no') return <Navigate to="/login" replace />;
  return <>{children}</>;
}
