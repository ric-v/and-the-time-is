/**
 * useClusterHover — React hook for cluster hover-expand behavior.
 *
 * When the cursor is within 48px (screen space) of a clustered orb group:
 * - Expand the cluster to 16° spread
 * - Lift each orb 0.08 units off the ring
 * - Animate over 200ms (expand) / 300ms (collapse)
 *
 * Works in screen space using projected coordinates from the Three.js camera.
 *
 * Requirements: 3.5
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { OrbPosition, ClusterInfo, OrbPositionsResult } from './useOrbPositions';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Hover proximity threshold in screen-space pixels. */
const HOVER_PROXIMITY_PX = 48;

/** Expanded cluster angular spread in degrees. */
const EXPANDED_SPREAD_DEG = 16;

/** Lift offset in world units when cluster is hover-expanded. */
const HOVER_LIFT_OFFSET = 0.08;

/** Expand animation duration in milliseconds. */
const EXPAND_DURATION_MS = 200;

/** Collapse animation duration in milliseconds. */
const COLLAPSE_DURATION_MS = 300;

/** Minimum angular separation for cluster detection (degrees). */
const CLUSTER_THRESHOLD_DEG = 8;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ScreenPosition {
  x: number;
  y: number;
}

export interface HoverExpandedPosition {
  /** The orb's ID. */
  id: string;
  /** Final ring angle in degrees (may be expanded from cluster separation). */
  finalAngle: number;
  /** Final lift offset in world units. */
  finalLiftOffset: number;
}

interface AnimationState {
  /** The cluster ID currently being animated. */
  clusterId: number;
  /** Animation progress 0→1 (expand) or 1→0 (collapse). */
  progress: number;
  /** Whether we're expanding (true) or collapsing (false). */
  expanding: boolean;
  /** Timestamp when the animation started. */
  startTime: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Normalise an angle to the range [0, 360).
 */
function normaliseAngle(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/**
 * Cubic ease-out for smooth animation.
 */
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Compute the screen-space distance from a point to the nearest orb
 * in a cluster.
 */
function distanceToCluster(
  cursorX: number,
  cursorY: number,
  clusterOrbIds: string[],
  screenPositions: Map<string, ScreenPosition>,
): number {
  let minDist = Infinity;
  for (const orbId of clusterOrbIds) {
    const pos = screenPositions.get(orbId);
    if (!pos) continue;
    const dx = cursorX - pos.x;
    const dy = cursorY - pos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < minDist) {
      minDist = dist;
    }
  }
  return minDist;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Manage cluster hover-expand behavior.
 *
 * @param orbPositions   The result from useOrbPositions (positions + clusters).
 * @param screenPositions Map of orb ID → screen-space {x, y} coordinates.
 *                        Updated each frame by the scene renderer via projection.
 * @param options.hoverExpandEnabled  When false, cluster hover-expand is disabled (reduced motion).
 * @returns              Object with:
 *                       - expandedPositions: Map of orb ID → final angle + lift
 *                       - hoveredClusterId: the currently hovered cluster ID or null
 *                       - onMouseMove: handler to attach to the scene container
 *                       - onMouseLeave: handler to attach to the scene container
 */
export function useClusterHover(
  orbPositions: OrbPositionsResult,
  screenPositions: Map<string, ScreenPosition>,
  options?: { hoverExpandEnabled?: boolean },
) {
  const hoverExpandEnabled = options?.hoverExpandEnabled !== false;
  const [hoveredClusterId, setHoveredClusterId] = useState<number | null>(null);
  const animationsRef = useRef<Map<number, AnimationState>>(new Map());
  const [animationTick, setAnimationTick] = useState(0);
  const rafRef = useRef<number>(0);
  const isAnimatingRef = useRef(false);

  // Track the current cursor position
  const cursorRef = useRef<{ x: number; y: number } | null>(null);

  // Animation loop
  const runAnimationLoop = useCallback(() => {
    const now = performance.now();
    let anyActive = false;

    for (const [clusterId, anim] of animationsRef.current.entries()) {
      const duration = anim.expanding ? EXPAND_DURATION_MS : COLLAPSE_DURATION_MS;
      const elapsed = now - anim.startTime;
      const rawProgress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(rawProgress);

      if (anim.expanding) {
        anim.progress = easedProgress;
      } else {
        // Collapsing: progress goes from 1 → 0
        anim.progress = 1 - easedProgress;
      }

      if (rawProgress < 1) {
        anyActive = true;
      } else if (!anim.expanding) {
        // Collapse complete — remove the animation entry
        animationsRef.current.delete(clusterId);
      }
    }

    // Trigger a re-render to update positions
    setAnimationTick((t) => t + 1);

    if (anyActive || animationsRef.current.size > 0) {
      rafRef.current = requestAnimationFrame(runAnimationLoop);
    } else {
      isAnimatingRef.current = false;
    }
  }, []);

  const startAnimation = useCallback(
    (clusterId: number, expanding: boolean) => {
      const existing = animationsRef.current.get(clusterId);
      const currentProgress = existing?.progress ?? (expanding ? 0 : 1);

      animationsRef.current.set(clusterId, {
        clusterId,
        progress: currentProgress,
        expanding,
        startTime: performance.now(),
      });

      if (!isAnimatingRef.current) {
        isAnimatingRef.current = true;
        rafRef.current = requestAnimationFrame(runAnimationLoop);
      }
    },
    [runAnimationLoop],
  );

  // Determine which cluster (if any) the cursor is near
  const updateHoveredCluster = useCallback(
    (cursorX: number, cursorY: number) => {
      if (!hoverExpandEnabled) return;
      const { clusters } = orbPositions;
      let nearestClusterId: number | null = null;
      let nearestDist = Infinity;

      for (const cluster of clusters) {
        const dist = distanceToCluster(
          cursorX,
          cursorY,
          cluster.orbIds,
          screenPositions,
        );
        if (dist < HOVER_PROXIMITY_PX && dist < nearestDist) {
          nearestDist = dist;
          nearestClusterId = cluster.clusterId;
        }
      }

      if (nearestClusterId !== hoveredClusterId) {
        // Start collapse animation for the old cluster
        if (hoveredClusterId !== null) {
          startAnimation(hoveredClusterId, false);
        }
        // Start expand animation for the new cluster
        if (nearestClusterId !== null) {
          startAnimation(nearestClusterId, true);
        }
        setHoveredClusterId(nearestClusterId);
      }
    },
    [hoverExpandEnabled, orbPositions, screenPositions, hoveredClusterId, startAnimation],
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (!hoverExpandEnabled) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      cursorRef.current = { x, y };
      updateHoveredCluster(x, y);
    },
    [hoverExpandEnabled, updateHoveredCluster],
  );

  const onMouseLeave = useCallback(() => {
    if (!hoverExpandEnabled) return;
    cursorRef.current = null;
    if (hoveredClusterId !== null) {
      startAnimation(hoveredClusterId, false);
      setHoveredClusterId(null);
    }
  }, [hoverExpandEnabled, hoveredClusterId, startAnimation]);

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  // Compute expanded positions based on current animation state
  const expandedPositions = new Map<string, HoverExpandedPosition>();

  for (const [orbId, pos] of orbPositions.positions.entries()) {
    let finalAngle = pos.adjustedAngle;
    let finalLiftOffset = 0;

    if (pos.isClustered && hoverExpandEnabled) {
      const anim = animationsRef.current.get(pos.clusterId);
      if (anim && anim.progress > 0) {
        // Find the cluster info
        const cluster = orbPositions.clusters.find(
          (c) => c.clusterId === pos.clusterId,
        );
        if (cluster) {
          const progress = anim.progress;

          // Compute expanded angle: fan out to EXPANDED_SPREAD_DEG
          const clusterSize = cluster.orbIds.length;
          const expandedTotalArc = EXPANDED_SPREAD_DEG * (clusterSize - 1);
          const normalTotalArc = CLUSTER_THRESHOLD_DEG * (clusterSize - 1);

          // Find this orb's index within the cluster (sorted by displayOrder)
          const orbIndex = cluster.orbIds.indexOf(orbId);
          if (orbIndex >= 0 && clusterSize > 1) {
            // Normal separated angle (from separateClusters)
            const normalAngle = pos.adjustedAngle;

            // Expanded angle: distribute evenly across the expanded arc
            const expandedStartAngle =
              cluster.meanAngle - expandedTotalArc / 2;
            const expandedAngle = normaliseAngle(
              expandedStartAngle + orbIndex * EXPANDED_SPREAD_DEG,
            );

            // Interpolate between normal and expanded based on animation progress
            // Use shortest-path angular interpolation
            let angleDiff = expandedAngle - normalAngle;
            if (angleDiff > 180) angleDiff -= 360;
            if (angleDiff < -180) angleDiff += 360;

            finalAngle = normaliseAngle(normalAngle + angleDiff * progress);
            finalLiftOffset = HOVER_LIFT_OFFSET * progress;
          }
        }
      }
    }

    expandedPositions.set(orbId, {
      id: orbId,
      finalAngle,
      finalLiftOffset,
    });
  }

  return {
    /** Map of orb ID → final expanded position (angle + lift). */
    expandedPositions,
    /** The currently hovered cluster ID, or null. */
    hoveredClusterId,
    /** Attach to the scene container's onMouseMove. */
    onMouseMove,
    /** Attach to the scene container's onMouseLeave. */
    onMouseLeave,
    /** Internal animation tick (for reactivity). */
    _animationTick: animationTick,
  };
}
