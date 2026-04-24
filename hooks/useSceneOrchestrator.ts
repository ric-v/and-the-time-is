/**
 * useSceneOrchestrator — React hook that orchestrates the entire Horizon scene
 * update loop, connecting the Redux scrub offset to all visual elements.
 *
 * Each frame (driven by the SceneContainer's requestAnimationFrame loop):
 * 1. Reads scrub offset from Redux store
 * 2. Computes Displayed Time via getDisplayedTime(scrubOffset)
 * 3. Updates Globe (rotation, terminator, hemisphere tint)
 * 4. Updates SceneLighting (sun position, ambient tint, rim light)
 * 5. Updates HorizonRing (opacity based on scrub state)
 * 6. Updates each ZoneOrb (sky state fill, celestial icon, ring position)
 * 7. Handles orb drift (continuous ring angle update when drift ON and offset 0)
 *
 * Returns the data needed by OrbLabel components:
 * - Screen positions (from 3D projection)
 * - Formatted times
 * - Sky states
 * - Relative offsets
 *
 * Requirements: 5.3, 3.6, 3.7, 4.4
 */

import { useCallback, useRef, useMemo } from 'react';
import { useAppSelector } from '../store/store';
import {
  getDisplayedTime,
  getLocalHour,
  getLocalMinute,
  formatTime,
} from '../utils/timeEngine';
import {
  getSkyState,
  getSkyPaletteForHour,
} from '../utils/skyPaletteEngine';
import type { SkyStateName } from '../utils/skyPaletteEngine';
import { useOrbPositions } from './useOrbPositions';
import { useClusterHover } from './useClusterHover';
import type { ScreenPosition } from './useClusterHover';
import { useDisplayedTime } from './useDisplayedTime';
import { useReducedMotion } from './useReducedMotion';

import type { WireframeGlobe } from '../components/horizon/WireframeGlobe';
import type { HorizonRing } from '../components/horizon/HorizonRing';
import type { SceneLighting } from '../components/horizon/SceneLighting';
import type { ZoneOrb } from '../components/horizon/ZoneOrb';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Ring radius in world units (design spec: 1.19). */
const RING_RADIUS = 1.19;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Data for a single orb label, consumed by OrbLabel components. */
export interface OrbLabelData {
  orbId: string;
  screenX: number;
  screenY: number;
  cityLabel: string;
  formattedTime: string;
  displayFormat: import('../store/settingsSlice').DisplayFormat;
  relativeOffset: string;
  skyState: SkyStateName;
  isLocal: boolean;
  isAnchor: boolean;
  ringAngleDeg: number;
  visible: boolean;
}

/** The 3D renderer instances that the orchestrator drives. */
export interface SceneRenderers {
  globe: WireframeGlobe | null;
  horizonRing: HorizonRing | null;
  sceneLighting: SceneLighting | null;
  /** Map of orb ID → ZoneOrb Three.js instance. */
  zoneOrbs: Map<string, ZoneOrb>;
}

/** Return type of the hook. */
export interface SceneOrchestratorResult {
  /** The current Displayed Time. */
  displayedTime: Date;
  /** Label data for each orb, keyed by orb ID. */
  orbLabelData: Map<string, OrbLabelData>;
  /** Cluster hover handlers to attach to the scene container. */
  clusterHover: {
    onMouseMove: (e: React.MouseEvent<HTMLElement>) => void;
    onMouseLeave: () => void;
    hoveredClusterId: number | null;
  };
  /**
   * The per-frame update function. Call this from the SceneContainer's
   * requestAnimationFrame loop.
   *
   * @param deltaTime - Seconds since last frame
   * @param renderers - The 3D renderer instances
   * @param canvasWidth - Canvas width in pixels (for projection)
   * @param canvasHeight - Canvas height in pixels (for projection)
   * @param camera - The Three.js PerspectiveCamera (for projection)
   */
  updateScene: (
    deltaTime: number,
    renderers: SceneRenderers,
    canvasWidth: number,
    canvasHeight: number,
    camera: { position: { x: number; y: number; z: number }; matrixWorldInverse: any; projectionMatrix: any },
  ) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Compute a human-readable relative offset string between two timezones.
 * E.g. "+4h 30m" or "-2h".
 */
function computeRelativeOffset(
  orbIanaName: string,
  anchorIanaName: string,
  displayedTime: Date,
): string {
  const orbHour = getLocalHour(orbIanaName, displayedTime);
  const orbMinute = getLocalMinute(orbIanaName, displayedTime);
  const anchorHour = getLocalHour(anchorIanaName, displayedTime);
  const anchorMinute = getLocalMinute(anchorIanaName, displayedTime);

  let diffMinutes =
    (orbHour * 60 + orbMinute) - (anchorHour * 60 + anchorMinute);

  // Normalize to [-720, +720] (half a day in each direction)
  if (diffMinutes > 720) diffMinutes -= 1440;
  if (diffMinutes < -720) diffMinutes += 1440;

  if (diffMinutes === 0) return '';

  const sign = diffMinutes > 0 ? '+' : '-';
  const abs = Math.abs(diffMinutes);
  const hours = Math.floor(abs / 60);
  const mins = abs % 60;

  if (mins === 0) return `${sign}${hours}h`;
  if (hours === 0) return `${sign}${mins}m`;
  return `${sign}${hours}h ${mins}m`;
}

/**
 * Project a 3D position to screen coordinates.
 * Simplified version that works with Three.js Vector3.project() pattern.
 */
function projectToScreen(
  worldX: number,
  worldY: number,
  worldZ: number,
  camera: { matrixWorldInverse: any; projectionMatrix: any },
  canvasWidth: number,
  canvasHeight: number,
): { x: number; y: number } {
  // We need to multiply the world position by the camera's view-projection matrix.
  // This is equivalent to what Three.js Vector3.project(camera) does.
  const mvi = camera.matrixWorldInverse.elements;
  const pm = camera.projectionMatrix.elements;

  // Apply view matrix (matrixWorldInverse)
  const vx = mvi[0] * worldX + mvi[4] * worldY + mvi[8] * worldZ + mvi[12];
  const vy = mvi[1] * worldX + mvi[5] * worldY + mvi[9] * worldZ + mvi[13];
  const vz = mvi[2] * worldX + mvi[6] * worldY + mvi[10] * worldZ + mvi[14];
  const vw = mvi[3] * worldX + mvi[7] * worldY + mvi[11] * worldZ + mvi[15];

  // Apply projection matrix
  const px = pm[0] * vx + pm[4] * vy + pm[8] * vz + pm[12] * vw;
  const py = pm[1] * vx + pm[5] * vy + pm[9] * vz + pm[13] * vw;
  const pw = pm[3] * vx + pm[7] * vy + pm[11] * vz + pm[15] * vw;

  // Perspective divide → NDC [-1, 1]
  const ndcX = px / pw;
  const ndcY = py / pw;

  // Convert NDC to screen coordinates
  const screenX = (ndcX * 0.5 + 0.5) * canvasWidth;
  const screenY = (-ndcY * 0.5 + 0.5) * canvasHeight;

  return { x: screenX, y: screenY };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSceneOrchestrator(): SceneOrchestratorResult {
  // --- Redux state ---
  const orbs = useAppSelector((s) => s.orbs.list);
  const scrubOffset = useAppSelector((s) => s.scrub.offset);
  const scrubbingInProgress = useAppSelector((s) => s.scrub.scrubbingInProgress);
  const displayFormat = useAppSelector((s) => s.settings.displayFormat);
  const orbDrift = useAppSelector((s) => s.settings.orbDrift);
  const globeAutoRotation = useAppSelector((s) => s.settings.globeAutoRotation);
  const anchorOrbId = useAppSelector((s) => s.settings.anchorOrbId);
  const expandedOrbId = useAppSelector((s) => s.session.expandedOrbId);
  const cameraIsOrbiting = useAppSelector((s) => s.session.cameraIsOrbiting);
  const reducedMotion = useReducedMotion();

  // --- Displayed Time (ticks once/sec when live, immediate on scrub) ---
  const displayedTime = useDisplayedTime();

  // --- Orb drift handling ---
  // When drift is ON and offset is 0: orb positions update continuously
  //   as real time advances (1 revolution per 24 hours).
  // When drift is OFF: orb positions freeze and only update when the
  //   Displayed Time changes via scrub or date jump.
  //
  // We achieve this by computing a "position time" that freezes when
  // drift is OFF and offset is 0. The position time is used for ring
  // angle calculation, while the full displayedTime is used for
  // time readouts and visual state (fills, labels, etc.).
  const frozenTimeRef = useRef<Date>(displayedTime);

  // Track whether the scrub offset has changed (user interaction)
  const prevScrubOffsetRef = useRef(scrubOffset);

  const positionTime = useMemo(() => {
    const scrubChanged = scrubOffset !== prevScrubOffsetRef.current;
    prevScrubOffsetRef.current = scrubOffset;

    if (orbDrift || scrubOffset !== 0 || scrubChanged) {
      // Drift is ON, or we're scrubbed, or the user just changed the scrub:
      // use the live displayed time for positions
      frozenTimeRef.current = displayedTime;
      return displayedTime;
    }

    // Drift is OFF and offset is 0 and no scrub change:
    // keep using the frozen time so positions don't update
    return frozenTimeRef.current;
  }, [displayedTime, orbDrift, scrubOffset]);

  // --- Orb positions (ring angles + cluster separation) ---
  const orbPositions = useOrbPositions(orbs, positionTime);

  // --- Screen positions ref (updated each frame by updateScene) ---
  const screenPositionsRef = useRef<Map<string, ScreenPosition>>(new Map());

  // --- Cluster hover ---
  const clusterHover = useClusterHover(orbPositions, screenPositionsRef.current, {
    hoverExpandEnabled: !reducedMotion,
  });

  // --- Determine anchor orb's IANA name ---
  const anchorIanaName = useMemo(() => {
    if (anchorOrbId) {
      const anchorOrb = orbs.find((o) => o.id === anchorOrbId);
      if (anchorOrb) return anchorOrb.ianaName;
    }
    // Default to Local Orb
    const localOrb = orbs.find((o) => o.isLocal);
    return localOrb?.ianaName ?? 'UTC';
  }, [orbs, anchorOrbId]);

  // --- Keep mutable refs for values the animation loop reads ---
  const stateRef = useRef({
    scrubOffset,
    scrubbingInProgress,
    displayFormat,
    orbDrift,
    globeAutoRotation,
    reducedMotion,
    cameraIsOrbiting,
    orbs,
    anchorIanaName,
    expandedOrbId,
    displayedTime,
  });
  stateRef.current = {
    scrubOffset,
    scrubbingInProgress,
    displayFormat,
    orbDrift,
    globeAutoRotation,
    reducedMotion,
    cameraIsOrbiting,
    orbs,
    anchorIanaName,
    expandedOrbId,
    displayedTime,
  };

  // --- Compute orb label data (React-side, for rendering) ---
  const orbLabelData = useMemo(() => {
    const data = new Map<string, OrbLabelData>();
    const totalOrbs = orbs.length;

    for (const orb of orbs) {
      const localHour = getLocalHour(orb.ianaName, displayedTime);
      const skyState = getSkyState(localHour);
      const formattedTime = formatTime(orb.ianaName, displayedTime, displayFormat);

      const relativeOffset = orb.isLocal
        ? ''
        : computeRelativeOffset(orb.ianaName, anchorIanaName, displayedTime);

      const isAnchor = anchorOrbId
        ? orb.id === anchorOrbId
        : orb.isLocal;

      // Get screen position from the ref (updated each frame)
      const screenPos = screenPositionsRef.current.get(orb.id);

      // Get the final angle from cluster hover expansion
      const expandedPos = clusterHover.expandedPositions.get(orb.id);
      const ringAngleDeg = expandedPos?.finalAngle
        ?? orbPositions.positions.get(orb.id)?.adjustedAngle
        ?? 0;

      // Visibility: hide if another orb is expanded (detail view)
      const visible = expandedOrbId === null || expandedOrbId === orb.id;

      data.set(orb.id, {
        orbId: orb.id,
        screenX: screenPos?.x ?? 0,
        screenY: screenPos?.y ?? 0,
        cityLabel: orb.label,
        formattedTime,
        displayFormat,
        relativeOffset,
        skyState,
        isLocal: orb.isLocal,
        isAnchor,
        ringAngleDeg,
        visible,
      });
    }

    return data;
  }, [
    orbs,
    displayedTime,
    displayFormat,
    anchorIanaName,
    anchorOrbId,
    expandedOrbId,
    orbPositions.positions,
    clusterHover.expandedPositions,
  ]);

  // --- Per-frame update function (called from the animation loop) ---
  const updateScene = useCallback(
    (
      deltaTime: number,
      renderers: SceneRenderers,
      canvasWidth: number,
      canvasHeight: number,
      camera: { position: { x: number; y: number; z: number }; matrixWorldInverse: any; projectionMatrix: any },
    ) => {
      const {
        scrubOffset: offset,
        scrubbingInProgress: scrubbing,
        displayFormat: format,
        orbDrift: drift,
        globeAutoRotation: autoRot,
        reducedMotion: lowMotion,
        cameraIsOrbiting: orbitingCam,
        orbs: currentOrbs,
        anchorIanaName: anchor,
        expandedOrbId: expanded,
      } = stateRef.current;

      // Compute the real-time displayed time for this frame
      // (more precise than the React-side displayedTime which ticks per second)
      const frameDisplayedTime = getDisplayedTime(offset);

      // Determine the local hour/minute for the user's local timezone (for lighting)
      const localOrb = currentOrbs.find((o) => o.isLocal);
      const localIana = localOrb?.ianaName ?? 'UTC';
      const localHour = getLocalHour(localIana, frameDisplayedTime);
      const localMinute = getLocalMinute(localIana, frameDisplayedTime);
      const skyPalette = getSkyPaletteForHour(localHour);

      // --- 1. Update Globe ---
      if (renderers.globe) {
        const liveSpinEnabled = offset === 0 && autoRot && !lowMotion;
        renderers.globe.update(frameDisplayedTime, deltaTime, offset, liveSpinEnabled);
      }

      // --- 2. Update Scene Lighting ---
      if (renderers.sceneLighting) {
        renderers.sceneLighting.update(
          frameDisplayedTime,
          localHour,
          localMinute,
          skyPalette.horizon,
        );
      }

      // --- 3. Update Horizon Ring ---
      if (renderers.horizonRing) {
        renderers.horizonRing.setActive(scrubbing || orbitingCam);
        renderers.horizonRing.setColor(skyPalette.horizon);
        renderers.horizonRing.update(deltaTime);
      }

      // --- 4. Update each Zone Orb ---
      const totalOrbs = currentOrbs.length;
      const newScreenPositions = new Map<string, ScreenPosition>();

      for (const orb of currentOrbs) {
        const zoneOrb = renderers.zoneOrbs.get(orb.id);
        if (!zoneOrb) continue;

        // Compute local time for this orb
        const orbLocalHour = getLocalHour(orb.ianaName, frameDisplayedTime);
        const orbLocalMinute = getLocalMinute(orb.ianaName, frameDisplayedTime);

        // Update orb visual state (sky fill, celestial icon, density scaling)
        zoneOrb.update(orbLocalHour, orbLocalMinute, totalOrbs);

        // Get the final position from cluster hover expansion
        const expandedPos = clusterHover.expandedPositions.get(orb.id);
        const orbPosition = orbPositions.positions.get(orb.id);

        const finalAngle = expandedPos?.finalAngle
          ?? orbPosition?.adjustedAngle
          ?? 0;
        const liftOffset = expandedPos?.finalLiftOffset ?? 0;

        // Set the orb's 3D position on the ring
        zoneOrb.setRingPosition(finalAngle, RING_RADIUS, liftOffset);

        // Handle detail view opacity
        if (expanded !== null) {
          if (orb.id === expanded) {
            // The expanded orb stays visible
            zoneOrb.setOpacity(1);
          } else {
            // Other orbs fade to 15%
            zoneOrb.setOpacity(0.15);
          }
        } else {
          // Subtle 3D spheres — Observatory HTML discs carry primary chrome (horizon-observatory.html).
          zoneOrb.setOpacity(0.16);
        }

        // Project orb 3D position to screen coordinates
        const theta = (finalAngle * Math.PI) / 180;
        const r = RING_RADIUS + liftOffset;
        const worldX = r * Math.sin(theta);
        const worldY = r * Math.cos(theta);
        const worldZ = 0;

        const screenPos = projectToScreen(
          worldX,
          worldY,
          worldZ,
          camera,
          canvasWidth,
          canvasHeight,
        );
        newScreenPositions.set(orb.id, screenPos);
      }

      // Update the screen positions ref for cluster hover and label rendering
      screenPositionsRef.current = newScreenPositions;
    },
    [orbPositions.positions, clusterHover.expandedPositions],
  );

  return {
    displayedTime,
    orbLabelData,
    clusterHover: {
      onMouseMove: clusterHover.onMouseMove,
      onMouseLeave: clusterHover.onMouseLeave,
      hoveredClusterId: clusterHover.hoveredClusterId,
    },
    updateScene,
  };
}
