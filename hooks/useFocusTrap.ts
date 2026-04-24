import { useEffect, useRef, RefObject } from 'react';

/**
 * useFocusTrap — Traps keyboard focus within a container element.
 *
 * When active:
 *   - Finds all focusable elements within the container
 *   - Traps Tab / Shift+Tab to cycle through them
 *   - Focuses the first focusable element on activation
 *   - Saves the previously focused element before activation
 *
 * When deactivating:
 *   - Restores focus to the element that was focused before the trap activated
 *
 * Requirements: 7.8, 13.1
 */

/** Selector for all natively focusable elements */
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * Returns all focusable elements within a container, filtered to only
 * those that are visible (not hidden via display:none or visibility:hidden).
 */
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const elements = Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  );
  return elements.filter((el) => {
    // Exclude elements that are not visible
    if (el.offsetParent === null && el.tagName !== 'BODY') return false;
    const style = window.getComputedStyle(el);
    if (style.visibility === 'hidden' || style.display === 'none') return false;
    return true;
  });
}

export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  isActive: boolean,
): void {
  /** Stores the element that had focus before the trap activated */
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  // Save the previously focused element when the trap activates
  useEffect(() => {
    if (isActive) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    }
  }, [isActive]);

  // Focus the first focusable element when the trap activates
  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    // Small delay to ensure the DOM is fully rendered (overlay animations)
    const timer = setTimeout(() => {
      if (!containerRef.current) return;
      const focusable = getFocusableElements(containerRef.current);
      if (focusable.length > 0) {
        focusable[0].focus();
      } else {
        // If no focusable children, focus the container itself
        containerRef.current.focus();
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [isActive, containerRef]);

  // Set up the keydown listener for Tab trapping
  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusable = getFocusableElements(container);
      if (focusable.length === 0) return;

      const firstElement = focusable[0];
      const lastElement = focusable[focusable.length - 1];

      if (e.shiftKey) {
        // Shift+Tab: if focus is on the first element, wrap to the last
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: if focus is on the last element, wrap to the first
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [isActive, containerRef]);

  // Restore focus when the trap deactivates
  useEffect(() => {
    if (isActive) return;

    // When isActive transitions from true to false, restore focus
    const elementToRestore = previouslyFocusedRef.current;
    if (elementToRestore && typeof elementToRestore.focus === 'function') {
      // Small delay to let the closing animation start
      const timer = setTimeout(() => {
        elementToRestore.focus();
        previouslyFocusedRef.current = null;
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isActive]);
}
