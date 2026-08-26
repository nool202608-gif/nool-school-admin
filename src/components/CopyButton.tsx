'use client';

import { useState } from 'react';

export function CopyButton({ value, label = 'Copy' }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard access can be denied by the browser - the value is still
      // shown on screen, so there's nothing further to recover here.
    }
  }

  return (
    <button type="button" className={`copy-btn${copied ? ' copied' : ''}`} onClick={() => void handleClick()}>
      {copied ? 'Copied ✓' : label}
    </button>
  );
}
