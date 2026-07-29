'use client';

import { useState } from 'react';

export default function CopyLink({
  url,
  label = 'Copy Link',
  size = 'sm',
}: {
  url: string;
  label?: string;
  /** 'sm' fits table rows; 'md' matches regular buttons for card CTAs. */
  size?: 'sm' | 'md';
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
