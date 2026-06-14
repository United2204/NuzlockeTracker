import { useState, useEffect } from 'react';

const SCHEME_KEY = 'nuzlocke_color_scheme';

function systemIsDark() {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

export function useTheme() {
  const [scheme, setScheme] = useState<'light' | 'dark' | null>(
    () => (localStorage.getItem(SCHEME_KEY) as 'light' | 'dark') ?? null,
  );

  useEffect(() => {
    const html = document.documentElement;
    if (scheme) {
      html.setAttribute('data-color-scheme', scheme);
      localStorage.setItem(SCHEME_KEY, scheme);
    } else {
      html.removeAttribute('data-color-scheme');
      localStorage.removeItem(SCHEME_KEY);
    }
    const isDark = scheme === 'dark' || (scheme === null && systemIsDark());
    document.querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', isDark ? '#0E1118' : '#1A5DAE');
  }, [scheme]);

  const isDark = scheme === 'dark' || (scheme === null && systemIsDark());

  function toggle() {
    setScheme(isDark ? 'light' : 'dark');
  }

  return { isDark, toggle };
}
