'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

/* ---------------------------------------------------------------------------
 * OverlayBackdrop — shared overlay container for all Horizon overlays
 *
 * Requirements: 17.1 (overlay chrome styling from UI-UX-Spec Section 9)
 *
 * Provides:
 *   - Full-screen backdrop: rgba(8, 10, 22, 0.55) + backdrop-filter: blur(12px)
 *   - Entry animation: backdrop 200ms fade, panel 250ms scale 0.96→1.0 + fade
 *   - Exit animation: reverse, 150ms
 *   - Escape key dismissal
 *   - Backdrop click dismissal (clicks on the panel are not propagated)
 *   - Animation lifecycle management (enter → visible → exit → hidden)
 * -------------------------------------------------------------------------- */

type OverlayPhase = 'hidden' | 'entering' | 'visible' | 'exiting';

interface OverlayBackdropProps {
  /** Whether the overlay should be shown */
  isOpen: boolean;
  /** Called when the user dismisses the overlay (Escape or backdrop click) */
  onClose: () => void;
  /** The panel content to render centered on the backdrop */
  children: React.ReactNode;
  /** Optional additional className for the panel wrapper */
  panelClassName?: string;
  /** Optional aria-label for the backdrop container */
  ariaLabel?: string;
}

/** Timing constants from UI-UX-Spec Section 9 */
const BACKDROP_ENTER_MS = 200;
const PANEL_ENTER_MS = 250;
const EXIT_MS = 150;

const OverlayBackdrop: React.FC<OverlayBackdropProps> = ({
  isOpen,
  onClose,
  children,
  panelClassName,
  ariaLabel,
}) => {
  const [phase, setPhase] = useState<OverlayPhase>('hidden');
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  /* -----------------------------------------------------------------------
   * Phase transitions driven by isOpen prop
   * --------------------------------------------------------------------- */
  useEffect(() => {
    if (isOpen) {
      // Clear any pending exit timer
      if (exitTimerRef.current) {
        clearTimeout(exitTimerRef.current);
        exitTimerRef.current = null;
      }

      // Start entering
      setPhase('entering');

      // Transition to visible after the panel enter animation completes
      enterTimerRef.current = setTimeout(() => {
        setPhase('visible');
        enterTimerRef.current = null;
      }, PANEL_ENTER_MS);
    } else {
      // Clear any pending enter timer
      if (enterTimerRef.current) {
        clearTimeout(enterTimerRef.current);
        enterTimerRef.current = null;
      }

      if (phase === 'entering' || phase === 'visible') {
        // Start exit animation
        setPhase('exiting');

        exitTimerRef.current = setTimeout(() => {
          setPhase('hidden');
          exitTimerRef.current = null;
        }, EXIT_MS);
      }
    }

    return () => {
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
      if (enterTimerRef.current) clearTimeout(enterTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  /* -----------------------------------------------------------------------
   * Escape key handler
   * --------------------------------------------------------------------- */
  useEffect(() => {
    if (phase === 'hidden') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [phase, onClose]);

  /* -----------------------------------------------------------------------
   * Backdrop click handler — dismiss only when clicking the backdrop itself
   * --------------------------------------------------------------------- */
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Only close if the click target is the backdrop itself, not the panel
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose],
  );

  /* -----------------------------------------------------------------------
   * Stop propagation on panel clicks so they don't reach the backdrop
   * --------------------------------------------------------------------- */
  const handlePanelClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
  }, []);

  // Don't render anything when fully hidden
  if (phase === 'hidden') return null;

  /* -----------------------------------------------------------------------
   * Compute animation styles based on current phase
   * --------------------------------------------------------------------- */
  const isEntering = phase === 'entering';
  const isExiting = phase === 'exiting';

  // Backdrop opacity animation
  const backdropStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    // Observatory: parchment blur; legacy fallback for non-observatory shells
    background: 'var(--obs-backdrop-bg, rgba(8, 10, 22, 0.55))',
    backdropFilter: 'var(--obs-backdrop-filter, blur(12px))',
    WebkitBackdropFilter: 'var(--obs-backdrop-filter, blur(12px))',
    // Fade animation
    opacity: isExiting ? 0 : 1,
    transition: isExiting
      ? `opacity ${EXIT_MS}ms ease-out`
      : `opacity ${BACKDROP_ENTER_MS}ms ease-out`,
  };

  // Panel animation class — uses the CSS keyframe animations from globals.css
  const panelAnimationClass = isExiting
    ? 'overlay-panel-exit'
    : isEntering
      ? 'overlay-panel-enter'
      : '';

  return (
    <div
      style={backdropStyle}
      onClick={handleBackdropClick}
      aria-label={ariaLabel}
      role="presentation"
    >
      <div
        ref={panelRef}
        className={`${panelAnimationClass} ${panelClassName ?? ''}`.trim()}
        onClick={handlePanelClick}
      >
        {children}
      </div>
    </div>
  );
};

export default OverlayBackdrop;
