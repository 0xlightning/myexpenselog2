import * as React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../app/hooks';
import type { RootState } from '../../app/store';

export function AuthGate({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  const status = useAppSelector((s: RootState) => s.auth.status);
  const location = useLocation();

  if (status === 'idle' || status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }
  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <>{children}</>;
}
