'use client';

import React, { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

export type ToastType = 'success' | 'warning' | 'info';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

const ENTER_DURATION = 200;
const HOLD_DURATION = 1800;
const EXIT_DURATION = 250;

const TOAST_BACKGROUNDS: Record<ToastType, string> = {
  success: 'var(--success-soft, rgba(120, 210, 160, 0.18))',
  warning: 'var(--accent-soft, rgba(244, 197, 114, 0.18))',
  info: 'var(--toast-bg-info, rgba(120, 160, 220, 0.18))',
};

const TOAST_TEXT_COLORS: Record<ToastType, string> = {
  success: 'var(--toast-text-success, rgba(120, 210, 160, 0.92))',
  warning: 'var(--accent, #f4c572)',
  info: 'var(--toast-text-info, rgba(160, 195, 240, 0.92))',
};

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

export function showToast(message: string, type: ToastType = 'success'): void {
  const id = nextId++;
  toastQueue = [...toastQueue, { id, message, type }];
  emitChange();
}

function removeToast(id: number): void {
  toastQueue = toastQueue.filter((t) => t.id !== id);
  emitChange();
}

export function useToast(): (message: string, type?: ToastType) => void {
  return useCallback((message: string, type: ToastType = 'success') => {
    showToast(message, type);
  }, []);
}

const ToastBubble: React.FC<{ item: ToastItem }> = ({ item }) => {
  const [phase, setPhase] = useState<'enter' | 'hold' | 'exit'>('enter');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setPhase('hold');

      timerRef.current = setTimeout(() => {
        setPhase('exit');

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
      className={`toast-bubble ${phase === 'exit' ? 'toast-exit' : 'toast-enter'}`}
      style={{
        background: TOAST_BACKGROUNDS[item.type],
        color: TOAST_TEXT_COLORS[item.type],
      }}
    >
      {item.message}
    </div>
  );
};

const ToastContainer: React.FC = () => {
  const toasts = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  if (toasts.length === 0) return null;

  return (
    <div aria-label="Notifications" className="toast-container">
      {toasts.map((toast) => (
        <ToastBubble key={toast.id} item={toast} />
      ))}
    </div>
  );
};

export default ToastContainer;
