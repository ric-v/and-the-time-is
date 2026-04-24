/**
 * useOrbPositions — React hook that computes final ring positions for all orbs.
 *
 * Pipeline:
 * 1. For each orb, compute the raw Ring Angle via `computeRingAngle`.
 * 2. Apply cluster separation via `separateClusters` (8° threshold).
 * 3. Return a map of orb ID → { adjustedAngle, ringRadius, liftOffset, clusterId }.
 *
 * Requirements: 3.2, 3.3, 3.4, 3.5
 */

import { useMemo } from 'react';
import type { Orb } from '../store/orbSlice';
import { computeRingAngle } from '../utils/timeEngine';
import { separateClusters, type OrbAngleInput } from '../utils/ringAngleCalculator';
import { RING_RADIUS } from '../components/horizon/SceneContainer';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Minimum angular separation for cluster detection (degrees). */
const CLUSTER_THRESHOLD_DEG = 8;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OrbPosition {
  /** The orb's ID. */
  id: string;
  /** Adjusted ring angle in degrees (0–360), after cluster separation. */
  adjustedAngle: number;
  /** Raw ring angle before cluster separation. */
  rawAngle: number;
  /** Ring radius in world units. */
  ringRadius: number;
  /** Radial lift offset in world units (0 at rest, 0.08 when hover-expanded). */
  liftOffset: number;
  /** Cluster ID — orbs sharing the same clusterId are in the same cluster. */
  clusterId: number;
  /** Whether this orb is part of a multi-orb cluster. */
  isClustered: boolean;
}

export interface ClusterInfo {
  /** Unique cluster ID. */
  clusterId: number;
  /** Orb IDs in this cluster. */
  orbIds: string[];
  /** Mean angle of the cluster (degrees). */
  meanAngle: number;
}

export interface OrbPositionsResult {
  /** Map of orb ID → position data. */
  positions: Map<string, OrbPosition>;
  /** List of clusters (only those with 2+ orbs). */
  clusters: ClusterInfo[];
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
 * Compute the shortest angular distance between two angles on a circle.
 */
function angularDistance(a: number, b: number): number {
  const diff = Math.abs(normaliseAngle(a) - normaliseAngle(b));
  return diff > 180 ? 360 - diff : diff;
}

/**
 * Identify clusters from a sorted list of orbs with their raw angles.
 * Returns a cluster ID for each orb (same ID = same cluster).
 */
function identifyClusters(
  sortedOrbs: Array<{ id: string; angle: number }>,
  threshold: number,
): Map<string, number> {
  const clusterMap = new Map<string, number>();
  if (sortedOrbs.length === 0) return clusterMap;

  let currentCluster = 0;
  clusterMap.set(sortedOrbs[0].id, currentCluster);

  for (let i = 1; i < sortedOrbs.length; i++) {
    const dist = angularDistance(sortedOrbs[i].angle, sortedOrbs[i - 1].angle);
    if (dist < threshold) {
      clusterMap.set(sortedOrbs[i].id, currentCluster);
    } else {
      currentCluster++;
      clusterMap.set(sortedOrbs[i].id, currentCluster);
    }
  }

  // Check wrap-around: if the last and first orbs are within threshold,
  // merge their clusters.
  if (sortedOrbs.length > 1) {
    const wrapDist = angularDistance(
      sortedOrbs[sortedOrbs.length - 1].angle,
      sortedOrbs[0].angle,
    );
    if (wrapDist < threshold) {
      const lastClusterId = clusterMap.get(sortedOrbs[sortedOrbs.length - 1].id)!;
      const firstClusterId = clusterMap.get(sortedOrbs[0].id)!;
      if (lastClusterId !== firstClusterId) {
        // Merge: reassign all members of the last cluster to the first cluster
        for (const [id, cid] of clusterMap.entries()) {
          if (cid === lastClusterId) {
            clusterMap.set(id, firstClusterId);
          }
        }
      }
    }
  }

  return clusterMap;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Compute final ring positions for all orbs.
 *
 * @param orbs          The list of orbs from the Redux store.
 * @param displayedTime The current Displayed Time (real time + scrub offset).
 * @returns             Position data for each orb and cluster information.
 */
export function useOrbPositions(
  orbs: Orb[],
  displayedTime: Date,
): OrbPositionsResult {
  return useMemo(() => {
    if (orbs.length === 0) {
      return { positions: new Map(), clusters: [] };
    }

    // 1. Compute raw ring angles for each orb
    const rawAngles: Array<{ id: string; angle: number; displayOrder: number }> = orbs.map(
      (orb) => ({
        id: orb.id,
        angle: computeRingAngle(orb.ianaName, displayedTime),
        displayOrder: orb.displayOrder,
      }),
    );

    // 2. Apply cluster separation
    const inputs: OrbAngleInput[] = rawAngles.map((o) => ({
      id: o.id,
      angle: o.angle,
      displayOrder: o.displayOrder,
    }));

    const separated = separateClusters(inputs, CLUSTER_THRESHOLD_DEG);

    // Build a lookup for adjusted angles
    const adjustedAngleMap = new Map<string, number>();
    for (const s of separated) {
      adjustedAngleMap.set(s.id, s.adjustedAngle);
    }

    // 3. Identify clusters for hover-expand grouping
    const sortedForClustering = [...rawAngles]
      .map((o) => ({ id: o.id, angle: normaliseAngle(o.angle) }))
      .sort((a, b) => a.angle - b.angle);

    const clusterIdMap = identifyClusters(sortedForClustering, CLUSTER_THRESHOLD_DEG);

    // Group clusters
    const clusterGroups = new Map<number, string[]>();
    for (const [id, cid] of clusterIdMap.entries()) {
      if (!clusterGroups.has(cid)) {
        clusterGroups.set(cid, []);
      }
      clusterGroups.get(cid)!.push(id);
    }

    // Build cluster info (only multi-orb clusters)
    const clusters: ClusterInfo[] = [];
    for (const [clusterId, orbIds] of clusterGroups.entries()) {
      if (orbIds.length >= 2) {
        // Compute circular mean angle for the cluster
        let sinSum = 0;
        let cosSum = 0;
        for (const id of orbIds) {
          const rawAngle = rawAngles.find((o) => o.id === id)?.angle ?? 0;
          const rad = (rawAngle * Math.PI) / 180;
          sinSum += Math.sin(rad);
          cosSum += Math.cos(rad);
        }
        const meanRad = Math.atan2(sinSum / orbIds.length, cosSum / orbIds.length);
        const meanAngle = normaliseAngle((meanRad * 180) / Math.PI);

        clusters.push({ clusterId, orbIds, meanAngle });
      }
    }

    // 4. Build position map
    const positions = new Map<string, OrbPosition>();
    for (const orb of orbs) {
      const rawAngle = rawAngles.find((o) => o.id === orb.id)?.angle ?? 0;
      const adjustedAngle = adjustedAngleMap.get(orb.id) ?? rawAngle;
      const clusterId = clusterIdMap.get(orb.id) ?? -1;
      const clusterGroup = clusterGroups.get(clusterId);
      const isClustered = (clusterGroup?.length ?? 0) >= 2;

      positions.set(orb.id, {
        id: orb.id,
        adjustedAngle,
        rawAngle,
        ringRadius: RING_RADIUS,
        liftOffset: 0, // Will be modified by useClusterHover
        clusterId,
        isClustered,
      });
    }

    return { positions, clusters };
  }, [orbs, displayedTime]);
}
