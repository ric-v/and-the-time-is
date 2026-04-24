'use client';

import React, { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

/* ---------------------------------------------------------------------------
 * Toast types and configuration
 * -------------------------------------------------------------------------- */

export type ToastType = 'success' | 'warning' | 'info';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

/** Timing constants from UI-UX-Spec Section 10.4 */
const ENTER_DURATION = 200; // ms — slide-up 8px + fade-in
const HOLD_DURATION = 1800; // ms — visible hold
const EXIT_DURATION = 250; // ms — fade-out

/** Background colors per toast type */
const TOAST_BACKGROUNDS: Record<ToastType, string> = {
  success: 'var(--success-soft, rgba(120, 210, 160, 0.18))',
  warning: 'var(--accent-soft, rgba(244, 197, 114, 0.18))',
  info: 'var(--toast-bg-info, rgba(120, 160, 220, 0.18))',
};

/** Text colors per toast type */
const TOAST_TEXT_COLORS: Record<ToastType, string> = {
  success: 'var(--toast-text-success, rgba(120, 210, 160, 0.92))',
  warning: 'var(--accent, #f4c572)',
  info: 'var(--toast-text-info, rgba(160, 195, 240, 0.92))',
};

/* ---------------------------------------------------------------------------
 * Toast store — a simple external store for cross-component toast triggering
 * -------------------------------------------------------------------------- */

type Listener = () => void;

let toastQueue: ToastItem[] = [];
let nextId = 0;
const listeners = new Set<Listener>();

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function getSnapshot(): ToastItem[] {
  return toastQueue;
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Show a toast message. Can be called from anywhere — no hook required.
 *
 * @param message - The text to display
 * @param type - Toast variant: 'success' (default), 'warning', 'info'
 */
export function showToast(message: string, type: ToastType = 'success'): void {
  const id = nextId++;
  toastQueue = [...toastQueue, { id, message, type }];
  emitChange();
}

function removeToast(id: number): void {
  toastQueue = toastQueue.filter((t) => t.id !== id);
  emitChange();
}

/* ---------------------------------------------------------------------------
 * useToast hook — convenience wrapper for components
 * -------------------------------------------------------------------------- */

/**
 * Hook that returns a `toast` function for showing toasts.
 *
 * Usage:
 *   const toast = useToast();
 *   toast('Copied to clipboard');
 *   toast('localStorage unavailable', 'warning');
 */
export function useToast(): (message: string, type?: ToastType) => void {
  return useCallback((message: string, type: ToastType = 'success') => {
    showToast(message, type);
  }, []);
}

/* ---------------------------------------------------------------------------
 * Individual toast item renderer
 * -------------------------------------------------------------------------- */

const ToastBubble: React.FC<{ item: ToastItem }> = ({ item }) => {
  const [phase, setPhase] = useState<'enter' | 'hold' | 'exit'>('enter');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // After enter animation completes, move to hold phase
    timerRef.current = setTimeout(() => {
      setPhase('hold');

      // After hold duration, move to exit phase
      timerRef.current = setTimeout(() => {
        setPhase('exit');

        // After exit animation completes, remove from queue
        timerRef.current = setTimeout(() => {
          removeToast(item.id);
        }, EXIT_DURATION);
      }, HOLD_DURATION);
    }, ENTER_DURATION);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [item.id]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={phase === 'exit' ? 'toast-exit' : 'toast-enter'}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: 44,
        padding: '0 20px',
        borderRadius: 22, // pill shape (half of height)
        background: TOAST_BACKGROUNDS[item.type],
        backdropFilter: 'blur(12px) saturate(140%)',
        WebkitBackdropFilter: 'blur(12px) saturate(140%)',
        border: '1px solid var(--toast-border, rgba(255, 255, 255, 0.08))',
        color: TOAST_TEXT_COLORS[item.type],
        fontSize: 13,
        lineHeight: 1.45,
        fontWeight: 500,
        letterSpacing: '0.01em',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      {item.message}
    </div>
  );
};

/* ---------------------------------------------------------------------------
 * ToastContainer — renders at the app level, bottom-center of viewport
 *
 * Requirements: 12.3, 11.4
 * UI-UX-Spec: Section 10.4 — Copy-confirmation toast
 *   - Appears bottom-center of viewport
 *   - 44px tall, pill shape
 *   - --success-soft background
 *   - Slides up 8px and fades in over 200ms
 *   - Holds for 1800ms
 *   - Fades out over 250ms
 * -------------------------------------------------------------------------- */
const ToastContainer: React.FC = () => {
  const toasts = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-label="Notifications"
      style={{
        position: 'fixed',
        bottom: 120, // above the BottomBar (56px) + some breathing room
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        pointerEvents: 'none',
      }}
    >
      {toasts.map((toast) => (
        <ToastBubble key={toast.id} item={toast} />
      ))}
    </div>
  );
};

export default ToastContainer;
