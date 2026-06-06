import { useState, useEffect } from 'react';

/**
 * Mobile breakpoint in pixels.
 * Below this width, the app switches to mobile layout:
 * - Locked isometric view (no camera orbit)
 * - Globe diameter ≈ 22% of viewport width, Ring radius = 44%
 * - Compressed chrome bars (TopBar 48px, BottomBar 52px, ScrubControl 64px)
 * - Tap-and-hold for Orb Detail View, short tap flashes time readout
 * - Full-screen overlays
 * - No ambient particles
 *
 * Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7
 * UI-UX-Spec: Section 12 — Responsive behavior
 */
export const MOBILE_BREAKPOINT = 768;

/**
 * useIsMobile — returns true when the viewport width is below 768px.
 *
 * Uses `window.matchMedia` for efficient, event-driven detection rather
 * than polling or resize listeners. Falls back to false during SSR.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    // Set initial value
    setIsMobile(mql.matches);

    // Listen for changes
    const handler = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
    };

    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return isMobile;
}

export default useIsMobile;
