'use client';

import { useState } from 'react';
import { CheckIcon, LinkIcon } from './icons';

export default function CopyLink({
  url,
  label = 'Copy Link',
  size = 'sm',
}: {
  url: string;
  label?: string;
  /** 'icon' matches the square table-row actions; 'sm' is a compact text
   *  button; 'md' matches regular buttons for card CTAs. */
  size?: 'icon' | 'sm' | 'md';
}) {
  const [done, setDone] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Clipboard API needs a secure context; on plain-HTTP LAN it may refuse.
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setDone(true);
    setTimeout(() => setDone(false), 2000);
  }

  if (size === 'icon') {
    return (
      <button
        type="button"
        className="ghost btn-icon-only"
        style={done ? { color: 'var(--ok)', borderColor: 'var(--ok)' } : undefined}
        onClick={copy}
        aria-label={done ? 'Copied' : label}
        title={done ? 'Copied' : label}
      >
        {done ? <CheckIcon /> : <LinkIcon />}
        <span className="sr-only" aria-live="polite">{done ? 'Copied' : ''}</span>
      </button>
    );
  }

  return (
    <button
      className={size === 'sm' ? 'ghost btn-sm' : 'ghost'}
      onClick={copy}
      aria-live="polite"
    >
      {done ? 'Copied ✓' : label}
    </button>
  );
}
