import * as React from 'react';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { clearError } from '../app/uiSlice';

const AUTO_DISMISS_MS = 5000;

export function ErrorToast(): JSX.Element | null {
  const dispatch = useAppDispatch();
  const { lastError, lastErrorId, online } = useAppSelector((s) => s.ui);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    if (lastError === null) {
      setVisible(false);
      return;
    }
    setVisible(true);
    const t = window.setTimeout(() => {
      setVisible(false);
      dispatch(clearError());
    }, AUTO_DISMISS_MS);
    return () => window.clearTimeout(t);
  }, [lastError, lastErrorId, dispatch]);

  if (!online) {
    return (
      <div
        role="status"
        className="fixed bottom-4 right-4 z-50 max-w-sm rounded-md border border-border bg-card p-3 text-sm shadow-md"
      >
        <p className="font-medium">Offline</p>
        <p className="text-xs text-muted-foreground">
          Changes will sync when connection returns.
        </p>
      </div>
    );
  }

  if (!visible || !lastError) return null;
  return (
    <div
      role="alert"
      className="fixed bottom-4 right-4 z-50 max-w-sm rounded-md border border-destructive bg-card p-3 text-sm shadow-md"
    >
      <p className="font-medium text-destructive">Something went wrong</p>
      <p className="mt-1 text-foreground">{lastError}</p>
      <button
        type="button"
        className="mt-2 text-xs text-muted-foreground underline-offset-4 hover:underline"
        onClick={() => {
          setVisible(false);
          dispatch(clearError());
        }}
      >
        Dismiss
      </button>
    </div>
  );
}
