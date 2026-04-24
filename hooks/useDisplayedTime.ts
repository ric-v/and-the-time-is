/**
 * useDisplayedTime — React hook that returns the current Displayed Time.
 *
 * Displayed Time = real time (Date.now()) + scrub offset (in minutes).
 *
 * Update behavior:
 * - When live (scrub offset === 0): updates once per second via setInterval.
 * - When scrubbed (scrub offset !== 0): updates immediately on scrub change,
 *   then holds steady (no ticking) since the user is viewing a fixed moment.
 *
 * Requirements: 4.4, 5.3
 */

import { useState, useEffect, useRef } from 'react';
import { useAppSelector } from '../store/store';
import { getDisplayedTime } from '../utils/timeEngine';

/**
 * Returns the current Displayed Time, updating once per second when live
 * or immediately on scrub offset change.
 */
export function useDisplayedTime(): Date {
  const scrubOffset = useAppSelector((s) => s.scrub.offset);
  const [displayedTime, setDisplayedTime] = useState<Date>(() =>
    getDisplayedTime(scrubOffset),
  );
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Always compute immediately when scrub offset changes
    setDisplayedTime(getDisplayedTime(scrubOffset));

    // Clear any existing interval
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (scrubOffset === 0) {
      // Live mode: tick once per second
      intervalRef.current = setInterval(() => {
        setDisplayedTime(getDisplayedTime(0));
      }, 1000);
    }
    // When scrubbed (offset !== 0), no interval — the displayed time is
    // a fixed moment that only changes when the user adjusts the scrub.

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [scrubOffset]);

  return displayedTime;
}
