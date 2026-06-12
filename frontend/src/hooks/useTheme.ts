import { useState, useEffect } from 'react';

export type Theme = 'firered' | 'emerald';
const THEME_KEY = 'nuzlocke_theme';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(THEME_KEY) as Theme) ?? 'firered',
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'firered' ? '#CC0000' : '#1B6B2E');
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  function toggle() {
    setTheme(t => (t === 'firered' ? 'emerald' : 'firered'));
  }

  return { theme, toggle };
}
