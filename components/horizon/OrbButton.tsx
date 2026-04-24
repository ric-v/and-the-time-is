/**
 * OrbButton — Transparent focusable `<button>` element positioned over the canvas
 * for each Zone Orb, enabling keyboard navigation and accessibility.
 *
 * Each orb is rendered as a native `<button>` element absolutely positioned
 * over the Three.js canvas using screen coordinates from the scene orchestrator.
 * The button is visually transparent but fully focusable and clickable.
 *
 * Desktop behavior:
 * - Click: opens Orb Detail View (dispatches setExpandedOrb)
 *
 * Mobile behavior (viewport < 768px):
 * - Short tap: flashes the orb's time readout larger for 1.5s
 * - Tap-and-hold (350ms): activates Orb Detail View as full-screen overlay
 *
 * Keyboard behavior (both desktop and mobile):
 * - Enter/Space: opens Orb Detail View (dispatches setExpandedOrb)
 * - Delete/Backspace: prompts removal (suppressed for Local Orb)
 * - Left/Right arrows: move focus to adjacent orbs (sorted clockwise by ring angle)
 *
 * Requirements: 13.1, 13.2, 13.3, 4.8, 13.9, 14.3
 * UI-UX-Spec: Section 12.2 — Mobile layout, Section 14 — Accessibility specifics
 */

import React, { useCallback, useRef, useState } from 'react';
import { useIsMobile } from '../../hooks/useIsMobile';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OrbButtonProps {
  /** Unique orb ID. */
  orbId: string;
  /** Screen-space X coordinate of the orb center. */
  screenX: number;
  /** Screen-space Y coordinate of the orb center. */
  screenY: number;
  /** City label text (used in accessible name). */
  cityLabel: string;
  /** Formatted local time string (used in accessible name). */
  formattedTime: string;
  /** Whether this is the Local Orb (suppresses Delete/Backspace removal). */
  isLocal: boolean;
  /** Whether the orb is visible (not faded for Detail View). */
  visible: boolean;
  /** Tab index for controlling tab order. */
  tabIndex: number;
  /** Callback when Enter/Space is pressed or button is clicked — opens Detail View. */
  onActivate: (orbId: string) => void;
  /** Callback when Delete/Backspace is pressed — prompts removal. */
  onRemove: (orbId: string) => void;
  /**
   * Callback for Left/Right arrow navigation.
   * Direction: -1 for Left (counter-clockwise), +1 for Right (clockwise).
   */
  onArrowNav: (orbId: string, direction: -1 | 1) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Hit area size in pixels (matches orb visual diameter). */
const HIT_SIZE = 56;

/** Duration in ms the user must hold before activating Detail View on mobile. */
const LONG_PRESS_DURATION = 350;

/** Duration in ms the time readout flashes larger on short tap (mobile). */
const FLASH_DURATION = 1500;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const OrbButton: React.FC<OrbButtonProps> = ({
  orbId,
  screenX,
  screenY,
  cityLabel,
  formattedTime,
  isLocal,
  visible,
  tabIndex,
  onActivate,
  onRemove,
  onArrowNav,
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isMobile = useIsMobile();

  // --- Long-press / short-tap state for mobile ---
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFiredRef = useRef(false);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Desktop click handler ---
  const handleClick = useCallback(() => {
    // On mobile, click is handled via touch events (long-press / short-tap).
    // We still allow click for keyboard Enter/Space which fires click events.
    if (isMobile) return;
    onActivate(orbId);
  }, [orbId, onActivate, isMobile]);

  // --- Mobile touch handlers ---

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLButtonElement>) => {
      if (!isMobile) return;

      const touch = e.touches[0];
      touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
      longPressFiredRef.current = false;

      // Start long-press timer (350ms)
      longPressTimerRef.current = setTimeout(() => {
        longPressFiredRef.current = true;
        longPressTimerRef.current = null;
        onActivate(orbId);
      }, LONG_PRESS_DURATION);
    },
    [isMobile, orbId, onActivate],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLButtonElement>) => {
      if (!isMobile || !touchStartPosRef.current) return;

      // Cancel long-press if the user moves their finger more than 10px
      const touch = e.touches[0];
      const dx = touch.clientX - touchStartPosRef.current.x;
      const dy = touch.clientY - touchStartPosRef.current.y;
      if (Math.sqrt(dx * dx + dy * dy) > 10) {
        clearLongPressTimer();
      }
    },
    [isMobile, clearLongPressTimer],
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLButtonElement>) => {
      if (!isMobile) return;

      clearLongPressTimer();
      touchStartPosRef.current = null;

      // If long-press already fired, do nothing on touch end
      if (longPressFiredRef.current) {
        e.preventDefault();
        return;
      }

      // Short tap: flash the time readout larger for 1.5s
      e.preventDefault();

      // Clear any existing flash timer
      if (flashTimerRef.current) {
        clearTimeout(flashTimerRef.current);
      }

      setIsFlashing(true);
      flashTimerRef.current = setTimeout(() => {
        setIsFlashing(false);
        flashTimerRef.current = null;
      }, FLASH_DURATION);
    },
    [isMobile, clearLongPressTimer],
  );

  const handleTouchCancel = useCallback(() => {
    clearLongPressTimer();
    touchStartPosRef.current = null;
  }, [clearLongPressTimer]);

  // --- Keyboard handler (works on both desktop and mobile) ---
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      switch (e.key) {
        case 'Enter':
        case ' ':
          e.preventDefault();
          onActivate(orbId);
          break;

        case 'Delete':
        case 'Backspace':
          if (!isLocal) {
            e.preventDefault();
            onRemove(orbId);
          }
          break;

        case 'ArrowLeft':
          e.preventDefault();
          onArrowNav(orbId, -1);
          break;

        case 'ArrowRight':
          e.preventDefault();
          onArrowNav(orbId, 1);
          break;

        default:
          break;
      }
    },
    [orbId, isLocal, onActivate, onRemove, onArrowNav],
  );

  if (!visible) return null;

  // Accessible name: "{city label}, {displayed local time}"
  const accessibleName = `${cityLabel}, ${formattedTime}`;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        data-orb-button={orbId}
        tabIndex={tabIndex}
        aria-label={accessibleName}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        onKeyDown={handleKeyDown}
        style={{
          position: 'absolute',
          left: screenX - HIT_SIZE / 2,
          top: screenY - HIT_SIZE / 2,
          width: HIT_SIZE,
          height: HIT_SIZE,
          borderRadius: '50%',
          background: 'transparent',
          border: 'none',
          padding: 0,
          margin: 0,
          cursor: 'pointer',
          outline: 'none',
          pointerEvents: 'auto',
          zIndex: 2,
          // Prevent text selection on long-press (mobile)
          WebkitUserSelect: 'none',
          userSelect: 'none',
          // Prevent context menu on long-press (mobile)
          WebkitTouchCallout: 'none',
        }}
        className="orb-button-focus"
        onContextMenu={(e) => {
          if (isMobile) e.preventDefault();
        }}
      />

      {/* Flash overlay: shows the time readout larger for 1.5s on short tap (mobile) */}
      {isFlashing && (
        <div
          className="orb-time-flash"
          style={{
            position: 'absolute',
            left: screenX,
            top: screenY - HIT_SIZE / 2 - 8,
            transform: 'translate(-50%, -100%)',
            pointerEvents: 'none',
            zIndex: 10,
            background: 'var(--chrome-glass, rgba(12, 14, 28, 0.35))',
            backdropFilter: 'blur(16px) saturate(140%)',
            WebkitBackdropFilter: 'blur(16px) saturate(140%)',
            border: '1px solid var(--chrome-border, rgba(255,255,255,0.10))',
            borderRadius: 16,
            padding: '6px 12px',
            whiteSpace: 'nowrap',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: 22,
              lineHeight: 1.35,
              fontWeight: 400,
              fontFeatureSettings: '"tnum" 1',
              letterSpacing: '0.02em',
              color: 'var(--chrome-text-primary, rgba(255,255,255,0.92))',
            }}
          >
            {formattedTime}
          </div>
          <div
            style={{
              fontSize: 11,
              lineHeight: 1.4,
              fontWeight: 500,
              color: 'var(--chrome-text-secondary, rgba(255,255,255,0.62))',
            }}
          >
            {cityLabel}
          </div>
        </div>
      )}
    </>
  );
};

export default React.memo(OrbButton);
