
import * as React from 'react';
import { setOnline } from '../app/uiSlice';
import { store } from '../app/store';

export function OnlineStatusBridge() {
  React.useEffect(() => {
    const dispatch = store.dispatch;
    const onOnline = () => {
      dispatch(setOnline(true));
    };
    const onOffline = () => {
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
