/** Short haptic pulse — guarded for API availability and reduced motion. */
export function hapticPulse(durationMs = 10): void {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
    return;
  }
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }
  navigator.vibrate(durationMs);
}
