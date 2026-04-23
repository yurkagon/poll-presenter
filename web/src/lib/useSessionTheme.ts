import { useEffect } from 'react';
import { onThemeChanged } from './socket';
import type { Theme, Session } from '@shared/types';

export function applyTheme(theme: Theme) {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

/** Apply theme from session on load and update it on WS events. */
export function useSessionTheme(session: Session | null) {
  // Apply theme whenever session changes (initial load, question change, etc.)
  useEffect(() => {
    if (session) applyTheme(session.theme);
  }, [session?.theme]);

  // Listen for live theme broadcasts
  useEffect(() => {
    const unsub = onThemeChanged(({ session: s }) => applyTheme(s.theme));
    return unsub;
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => document.documentElement.classList.remove('dark');
  }, []);
}
