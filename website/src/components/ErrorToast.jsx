
import * as React from 'react';
import { AlertTriangle, WifiOff, X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { clearError } from '../app/uiSlice';
import { Button } from './ui/button';

const AUTO_DISMISS_MS = 5000;

export function ErrorToast() {
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
        className="fixed bottom-4 right-4 z-50 max-w-sm animate-slide-up rounded-xl border border-border bg-popover p-4 shadow-lg"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-chart-3/15 text-chart-3">
            <WifiOff className="h-4 w-4" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">Offline</p>
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                no sync
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Changes will sync when your connection returns.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!visible || !lastError) return null;
  return (
    <div
      role="alert"
      className="fixed bottom-4 right-4 z-50 max-w-sm animate-slide-up rounded-xl border border-destructive/30 bg-popover p-4 shadow-lg"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-destructive/15 text-destructive">
          <AlertTriangle className="h-4 w-4" />
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Error</p>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={() => {
                setVisible(false);
                dispatch(clearError());
              }}
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">{lastError}</p>
        </div>
      </div>
    </div>
  );
}
