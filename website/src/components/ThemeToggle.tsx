import * as React from 'react';

type Theme = 'light' | 'dark';
const STORAGE_KEY = 'myexpense-log.theme';

function readInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
  if (stored === 'light' || stored === 'dark') return stored;
  if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  root.style.colorScheme = theme;
}

export function ThemeToggle(): JSX.Element {
  const [theme, setTheme] = React.useState<Theme>(readInitialTheme);

  React.useEffect(() => {
    applyTheme(theme);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, theme);
    }
  }, [theme]);

  return (
    <button
      type="button"
      aria-label="Toggle dark mode"
      title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
      onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-sm hover:bg-accent hover:text-accent-foreground"
    >
      {theme === 'dark' ? '☾' : '☀'}
    </button>
  );
}
