/**
 * useCameraOrbit — React hook implementing hold-to-orbit camera control.
 *
 * Desktop only. Disabled on touch viewports (<768px).
 *
 * Behavior:
 * - On pointer-down on empty Scene Canvas area (not on an orb button):
 *   enables camera orbit mode.
 * - On pointer-move while orbiting: rotates camera around scene center.
 *   Horizontal drag → azimuth (±180° range).
 *   Vertical drag → elevation (0°–60°, clamped).
 *   Rate: 0.005 radians per pixel.
 * - On pointer-up: eases camera back to default position
 *   (azimuth 0°, elevation 12°) over 600ms with cubic ease-out.
 * - On double-click empty area: instant camera reset.
 * - While orbiting: dispatches setCameraOrbiting(true) to sessionSlice.
 * - On release: dispatches setCameraOrbiting(false).
 * - Dispatches setCameraAngle to settingsSlice for persistence.
 *
 * Camera position is computed from azimuth and elevation:
 *   x = distance * sin(azimuth) * cos(elevation)
 *   y = distance * sin(elevation) + BASE_Y_OFFSET
 *   z = distance * cos(azimuth) * cos(elevation)
 *
 * Requirements: 18.1, 18.2, 18.3, 18.4, 18.5
 * UI-UX-Spec: Section 6.9 — Camera orbit (hold-to-orbit)
 */

import { useEffect, useRef, useCallback } from 'react';
import type { RefObject } from 'react';
import { useAppDispatch } from '../store/store';
import { store } from '../store/store';
import { setCameraOrbiting } from '../store/sessionSlice';
import { setCameraAngle } from '../store/settingsSlice';
import { useIsMobile } from './useIsMobile';
import { useReducedMotion } from './useReducedMotion';
import { computeCameraPosition } from '../utils/cameraSpherical';
import type { PerspectiveCamera } from '../utils/three-imports';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default camera azimuth in radians (0°). */
const DEFAULT_AZIMUTH = 0;

/** Default camera elevation in radians (12° converted). */
const DEFAULT_ELEVATION = (12 * Math.PI) / 180;

/** Minimum elevation in radians (0°). */
const MIN_ELEVATION = 0;

/** Maximum elevation in radians (60°). */
const MAX_ELEVATION = (60 * Math.PI) / 180;

/** Maximum azimuth magnitude in radians (±180°). */
const MAX_AZIMUTH = Math.PI;

/** Rotation speed: radians per pixel of mouse movement. */
const ROTATION_RATE = 0.005;

/** Duration of the ease-back animation in milliseconds. */
const EASE_BACK_DURATION = 600;

// ---------------------------------------------------------------------------
// Easing
// ---------------------------------------------------------------------------

/**
 * Cubic ease-out: decelerating to zero velocity.
 * t is normalized [0, 1].
 */
function cubicEaseOut(t: number): number {
  const t1 = t - 1;
  return t1 * t1 * t1 + 1;
}

// ---------------------------------------------------------------------------
// Camera position computation
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Hook return type
// ---------------------------------------------------------------------------

export interface UseCameraOrbitResult {
  /** Whether the camera is currently being orbited by the user. */
  isOrbiting: boolean;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useCameraOrbit(
  surfaceRef: RefObject<HTMLElement | null>,
  cameraRef: RefObject<PerspectiveCamera | null>,
): UseCameraOrbitResult {
  const dispatch = useAppDispatch();
  const isMobile = useIsMobile();
  const reducedMotion = useReducedMotion();

  // --- Mutable state refs (not triggering re-renders) ---
  const isOrbitingRef = useRef(false);
  const azimuthRef = useRef(DEFAULT_AZIMUTH);
  const elevationRef = useRef(DEFAULT_ELEVATION);
  const lastPointerXRef = useRef(0);
  const lastPointerYRef = useRef(0);

  // Ease-back animation state
  const easeBackRafRef = useRef<number>(0);
  const easeBackStartTimeRef = useRef(0);
  const easeBackStartAzimuthRef = useRef(0);
  const easeBackStartElevationRef = useRef(0);

  // Track isOrbiting for the return value (React state for consumers)
  const isOrbitingStateRef = useRef(false);

  // ---------------------------------------------------------------------------
  // Apply camera position
  // ---------------------------------------------------------------------------

  const applyCameraPosition = useCallback((azimuth: number, elevation: number) => {
    const camera = cameraRef.current;
    if (!camera) return;

    const pos = computeCameraPosition(azimuth, elevation);
    camera.position.set(pos.x, pos.y, pos.z);
    camera.lookAt(0, 0, 0);
  }, [cameraRef]);

  // ---------------------------------------------------------------------------
  // Cancel any running ease-back animation
  // ---------------------------------------------------------------------------

  const cancelEaseBack = useCallback(() => {
    if (easeBackRafRef.current) {
      cancelAnimationFrame(easeBackRafRef.current);
      easeBackRafRef.current = 0;
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Start ease-back animation to default position
  // ---------------------------------------------------------------------------

  const startEaseBack = useCallback(() => {
    cancelEaseBack();

    easeBackStartTimeRef.current = performance.now();
    easeBackStartAzimuthRef.current = azimuthRef.current;
    easeBackStartElevationRef.current = elevationRef.current;

    const animate = (now: number) => {
      const elapsed = now - easeBackStartTimeRef.current;
      const t = Math.min(elapsed / EASE_BACK_DURATION, 1);
      const eased = cubicEaseOut(t);

      const startAz = easeBackStartAzimuthRef.current;
      const startEl = easeBackStartElevationRef.current;

      const currentAz = startAz + (DEFAULT_AZIMUTH - startAz) * eased;
      const currentEl = startEl + (DEFAULT_ELEVATION - startEl) * eased;

      azimuthRef.current = currentAz;
      elevationRef.current = currentEl;
      applyCameraPosition(currentAz, currentEl);

      if (t < 1) {
        easeBackRafRef.current = requestAnimationFrame(animate);
      } else {
        // Animation complete — snap to exact defaults
        azimuthRef.current = DEFAULT_AZIMUTH;
        elevationRef.current = DEFAULT_ELEVATION;
        applyCameraPosition(DEFAULT_AZIMUTH, DEFAULT_ELEVATION);
        easeBackRafRef.current = 0;

        // Persist final camera angle
        dispatch(setCameraAngle({
          azimuth: DEFAULT_AZIMUTH * (180 / Math.PI),
          elevation: DEFAULT_ELEVATION * (180 / Math.PI),
        }));
      }
    };

    easeBackRafRef.current = requestAnimationFrame(animate);
  }, [applyCameraPosition, cancelEaseBack, dispatch]);

  // ---------------------------------------------------------------------------
  // Instant reset (double-click)
  // ---------------------------------------------------------------------------

  const instantReset = useCallback(() => {
    cancelEaseBack();

    azimuthRef.current = DEFAULT_AZIMUTH;
    elevationRef.current = DEFAULT_ELEVATION;
    applyCameraPosition(DEFAULT_AZIMUTH, DEFAULT_ELEVATION);

    // Persist
    dispatch(setCameraAngle({
      azimuth: DEFAULT_AZIMUTH * (180 / Math.PI),
      elevation: DEFAULT_ELEVATION * (180 / Math.PI),
    }));
  }, [applyCameraPosition, cancelEaseBack, dispatch]);

  // ---------------------------------------------------------------------------
  // Check if the pointer target is an orb button (should not trigger orbit)
  // ---------------------------------------------------------------------------

  const isOrbTarget = useCallback((target: EventTarget | null): boolean => {
    if (!target || !(target instanceof HTMLElement)) return false;
    // OrbButton components have data-orb-button attribute
    return !!target.closest('[data-orb-button]');
  }, []);

  // ---------------------------------------------------------------------------
  // Pointer event handlers
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (isMobile || reducedMotion) return;

    const container = surfaceRef.current;
    if (!container) return;

    const persisted = store.getState().settings.cameraAngle;
    azimuthRef.current = (persisted.azimuth * Math.PI) / 180;
    elevationRef.current = (persisted.elevation * Math.PI) / 180;
    applyCameraPosition(azimuthRef.current, elevationRef.current);

    const handlePointerDown = (e: PointerEvent) => {
      // Only respond to primary button (left click)
      if (e.button !== 0) return;

      // Don't orbit if clicking on an orb button or other interactive element
      if (isOrbTarget(e.target)) return;

      // Cancel any running ease-back
      cancelEaseBack();

      isOrbitingRef.current = true;
      isOrbitingStateRef.current = true;
      lastPointerXRef.current = e.clientX;
      lastPointerYRef.current = e.clientY;

      // Capture pointer for reliable tracking outside the container
      container.setPointerCapture(e.pointerId);

      // Dispatch orbiting state
      dispatch(setCameraOrbiting(true));
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isOrbitingRef.current) return;

      const deltaX = e.clientX - lastPointerXRef.current;
      const deltaY = e.clientY - lastPointerYRef.current;
      lastPointerXRef.current = e.clientX;
      lastPointerYRef.current = e.clientY;

      // Update azimuth (horizontal drag)
      let newAzimuth = azimuthRef.current + deltaX * ROTATION_RATE;
      // Clamp to ±180° (±π radians)
      newAzimuth = Math.max(-MAX_AZIMUTH, Math.min(MAX_AZIMUTH, newAzimuth));
      azimuthRef.current = newAzimuth;

      // Update elevation (vertical drag — inverted: drag up = increase elevation)
      let newElevation = elevationRef.current - deltaY * ROTATION_RATE;
      // Clamp to 0°–60°
      newElevation = Math.max(MIN_ELEVATION, Math.min(MAX_ELEVATION, newElevation));
      elevationRef.current = newElevation;

      applyCameraPosition(newAzimuth, newElevation);
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (!isOrbitingRef.current) return;

      isOrbitingRef.current = false;
      isOrbitingStateRef.current = false;

      // Release pointer capture
      try {
        container.releasePointerCapture(e.pointerId);
      } catch {
        // Pointer capture may already be released
      }

      // Dispatch orbiting state off
      dispatch(setCameraOrbiting(false));

      // Persist the held camera angle before easing back
      dispatch(setCameraAngle({
        azimuth: azimuthRef.current * (180 / Math.PI),
        elevation: elevationRef.current * (180 / Math.PI),
      }));

      // Start ease-back to default position
      startEaseBack();
    };

    const handleDoubleClick = (e: MouseEvent) => {
      // Only reset on double-click on empty area (not on orb buttons)
      if (isOrbTarget(e.target)) return;

      // Stop orbiting if active
      if (isOrbitingRef.current) {
        isOrbitingRef.current = false;
        isOrbitingStateRef.current = false;
        dispatch(setCameraOrbiting(false));
      }

      instantReset();
    };

    // Attach listeners
    container.addEventListener('pointerdown', handlePointerDown);
    container.addEventListener('pointermove', handlePointerMove);
    container.addEventListener('pointerup', handlePointerUp);
    container.addEventListener('pointercancel', handlePointerUp);
    container.addEventListener('dblclick', handleDoubleClick);

    return () => {
      container.removeEventListener('pointerdown', handlePointerDown);
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerup', handlePointerUp);
      container.removeEventListener('pointercancel', handlePointerUp);
      container.removeEventListener('dblclick', handleDoubleClick);

      // Clean up any running animation
      cancelEaseBack();
    };
  }, [
    isMobile,
    surfaceRef,
    reducedMotion,
    dispatch,
    applyCameraPosition,
    cancelEaseBack,
    startEaseBack,
    instantReset,
    isOrbTarget,
  ]);

  return {
    isOrbiting: isOrbitingStateRef.current,
  };
}

export default useCameraOrbit;
