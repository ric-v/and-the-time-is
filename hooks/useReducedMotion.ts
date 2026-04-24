/**
 * useReducedMotion — React hook that determines whether reduced motion
 * should be active, combining the OS `prefers-reduced-motion` media query
 * with the user's override from settingsSlice.
 *
 * Behavior:
 * - 'auto' (default): respects the OS `prefers-reduced-motion: reduce` setting
 * - 'on': forces reduced motion regardless of OS setting
 * - 'off': forces full motion regardless of OS setting
 *
 * When reduced motion is active, consumers should:
 * - Disable globe auto-rotation (hold position statically)
 * - Disable orb drift
 * - Replace all animations with opacity-only 100ms transitions
 * - Disable cluster hover expand
 * - Disable globe tint crossfade
 * - Degrade SceneContainer to static rendering (no animation loop,
 *   update only on state changes)
 *
 * Requirements: 1.5, 13.7
 */

import { useState, useEffect } from 'react';
import { useAppSelector } from '../store/store';

/** The media query string for prefers-reduced-motion. */
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/**
 * Read the current OS preference for reduced motion.
 * Returns `true` if the OS prefers reduced motion, `false` otherwise.
 * Returns `false` in SSR environments where `window` is not available.
 */
function getOsPreference(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/**
 * Hook that returns whether reduced motion should be active.
 *
 * Combines the OS `prefers-reduced-motion: reduce` media query with
 * the user's `reducedMotionOverride` setting from the Redux store.
 *
 * @returns `true` if reduced motion is active, `false` otherwise.
 */
export function useReducedMotion(): boolean {
  const reducedMotionOverride = useAppSelector(
    (s) => s.settings.reducedMotionOverride,
  );

  const [osPreference, setOsPreference] = useState<boolean>(getOsPreference);

  useEffect(() => {
    // SSR guard
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);

    // Sync initial state (in case it changed between SSR and hydration)
    setOsPreference(mediaQuery.matches);

    // Listen for OS preference changes
    const handleChange = (event: MediaQueryListEvent) => {
      setOsPreference(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  // Combine OS preference with user override
  switch (reducedMotionOverride) {
    case 'on':
      return true;
    case 'off':
      return false;
    case 'auto':
    default:
      return osPreference;
  }
}
