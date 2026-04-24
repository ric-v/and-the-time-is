import { useCallback, useRef, useState } from 'react';

/**
 * useAriaAnnouncer — provides an `announce(message)` function that updates
 * a visually hidden ARIA live region so screen readers can announce state changes.
 *
 * The hook uses a simple text queue: each call to `announce` replaces the
 * current message. A brief clear-then-set cycle ensures the screen reader
 * picks up repeated identical messages.
 *
 * Requirements: 13.4, 13.5
 * UI-UX-Spec: Section 14 — ARIA live region
 */
export function useAriaAnnouncer() {
  const [message, setMessage] = useState('');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const announce = useCallback((text: string) => {
    // Clear any pending announcement
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Clear the message first so the screen reader re-announces
    // even if the same text is sent twice in a row.
    setMessage('');

    // Set the new message on the next tick so the DOM update is two-step
    timeoutRef.current = setTimeout(() => {
      setMessage(text);
    }, 50);
  }, []);

  return { message, announce } as const;
}
