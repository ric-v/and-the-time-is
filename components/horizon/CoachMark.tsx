'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/store';
import { dismissCoachMark } from '../../store/settingsSlice';

/**
 * CoachMark — a one-time floating card anchored above the ScrubControl handle.
 *
 * Displays a two-sentence explanation for first-time visitors:
 *   "Drag the scrubber to see any moment in time. Click an orb for details."
 *
 * Dismissible with a [Dismiss] button. Dismissal is persisted to
 * settingsSlice.coachMarkDismissed (which auto-persists to localStorage
 * via the persistence manager).
 *
 * Shows only once — checks coachMarkDismissed from the Redux store
 * (restored from localStorage on mount by useFirstRunSeeding).
 *
 * Requirements: 9.3, 9.4
 * UI-UX-Spec: Section 11 — Empty state / Coach-mark
 */
const CoachMark: React.FC = () => {
  const dispatch = useAppDispatch();
  const coachMarkDismissed = useAppSelector(
    (s) => s.settings.coachMarkDismissed,
  );

  // Local state for the fade-out animation
  const [isExiting, setIsExiting] = useState(false);
  // Local state to fully remove from DOM after exit animation
  const [isRemoved, setIsRemoved] = useState(false);

  // If already dismissed (from persisted state), don't render at all
  useEffect(() => {
    if (coachMarkDismissed) {
      setIsRemoved(true);
    }
  }, [coachMarkDismissed]);

  const handleDismiss = useCallback(() => {
    // Start exit animation
    setIsExiting(true);
    // After animation completes, dispatch to Redux (persists to localStorage)
    setTimeout(() => {
      dispatch(dismissCoachMark());
      setIsRemoved(true);
    }, 200);
  }, [dispatch]);

  if (isRemoved) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-auto"
      style={{
        position: 'absolute',
        bottom: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        marginBottom: 12,
        zIndex: 20,
        opacity: isExiting ? 0 : 1,
        transition: 'opacity 200ms ease-out',
      }}
    >
      <div
        style={{
          background: 'var(--chrome-glass, rgba(12, 14, 28, 0.35))',
          backdropFilter: 'blur(20px) saturate(140%)',
          WebkitBackdropFilter: 'blur(20px) saturate(140%)',
          border: '1px solid var(--chrome-border, rgba(255,255,255,0.10))',
          borderRadius: 20,
          padding: '20px 24px 16px',
          maxWidth: 340,
          textAlign: 'center',
        }}
      >
        {/* Coach-mark text */}
        <p
          style={{
            margin: 0,
            fontSize: 15,
            lineHeight: 1.6,
            fontWeight: 400,
            color: 'var(--chrome-text-primary, rgba(255,255,255,0.92))',
            letterSpacing: '0.01em',
          }}
        >
          Drag the ruler below to travel through time.
          <br />
          <span style={{ color: 'var(--chrome-text-secondary, rgba(255,255,255,0.62))' }}>
            Tap <strong style={{ color: 'var(--accent)' }}>+ Add zone</strong> in the bottom bar to pin more cities.
          </span>
        </p>

        {/* Dismiss button */}
        <button
          type="button"
          onClick={handleDismiss}
          style={{
            marginTop: 12,
            padding: '6px 16px',
            fontSize: 13,
            fontWeight: 500,
            lineHeight: 1.45,
            color: 'var(--accent, #f4c572)',
            background: 'transparent',
            border: '1px solid var(--chrome-border, rgba(255,255,255,0.10))',
            borderRadius: 18,
            cursor: 'pointer',
            transition: 'background 100ms ease-out',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background =
              'var(--accent-soft, rgba(244,197,114,0.18))';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'transparent';
          }}
          aria-label="Dismiss coach mark"
        >
          Dismiss
        </button>
      </div>

      {/* Downward-pointing arrow anchoring to the ScrubControl */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: -1,
        }}
      >
        <div
          style={{
            width: 0,
            height: 0,
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: '8px solid var(--chrome-border, rgba(255,255,255,0.10))',
          }}
        />
      </div>
    </div>
  );
};

export default CoachMark;
