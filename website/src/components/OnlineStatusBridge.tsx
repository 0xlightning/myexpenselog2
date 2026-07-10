import * as React from 'react';
import { setOnline } from '../app/uiSlice';
import { store } from '../app/store';
import type { AppDispatch } from '../app/store';

export function OnlineStatusBridge(): null {
  React.useEffect(() => {
    const dispatch = store.dispatch as AppDispatch;
    const onOnline = (): void => {
      dispatch(setOnline(true));
    };
    const onOffline = (): void => {
      dispatch(setOnline(false));
    };
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);
  return null;
}
