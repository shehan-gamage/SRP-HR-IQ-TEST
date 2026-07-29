'use client';

import { useEffect, useState } from 'react';
import { MonitorIcon, MoonIcon, SunIcon } from './icons';

type Mode = 'system' | 'light' | 'dark';

const ORDER: Mode[] = ['system', 'light', 'dark'];
const LABEL: Record<Mode, string> = {
  system: 'System Theme',
  light: 'Light Theme',
  dark: 'Dark Theme',
};

/**
 * Cycles System → Light → Dark. The explicit choice is stored in
 * localStorage('theme') and stamped on <html data-theme="...">; "system"
 * clears both so the prefers-color-scheme media query decides. The inline
 * script in layout.tsx replays the stored choice before first paint.
 */
export default function ThemeToggle() {
  const [mode, setMode] = useState<Mode>('system');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('theme');
      if (stored === 'light' || stored === 'dark') setMode(stored);
    } catch {
      /* storage unavailable (private mode); the toggle still works per-page */
    }
  }, []);

  function cycle() {
    const next = ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length];
    setMode(next);
    try {
      if (next === 'system') localStorage.removeItem('theme');
      else localStorage.setItem('theme', next);
    } catch {
      /* ignore */
    }
    if (next === 'system') delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = next;
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={cycle}
      aria-label={`Theme: ${LABEL[mode]}. Activate to change.`}
      title={LABEL[mode]}
      aria-live="polite"
    >
      {mode === 'light' ? <SunIcon /> : mode === 'dark' ? <MoonIcon /> : <MonitorIcon />}
    </button>
  );
}
