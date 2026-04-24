/**
 * Ring Angle Calculator — Cluster Separation Algorithm
 *
 * When multiple orbs occupy nearby Ring Angles (within minSeparation°),
 * this algorithm fans them outward so no two orb centers are closer than
 * minSeparation° in angular distance, while preserving the cluster's
 * mean angle at the original shared position.
 *
 * Requirements: 3.4, 3.5
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OrbAngleInput {
  id: string;
  angle: number;        // degrees, 0–360
  displayOrder: number; // tiebreaker for stable sort within clusters
}

export interface OrbAngleOutput {
  id: string;
  adjustedAngle: number; // degrees, may wrap around 0/360
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
 * Always returns a non-negative value in [0, 180].
 */
function angularDistance(a: number, b: number): number {
  const diff = Math.abs(normaliseAngle(a) - normaliseAngle(b));
  return diff > 180 ? 360 - diff : diff;
}

// ---------------------------------------------------------------------------
// Cluster Separation
// ---------------------------------------------------------------------------

/**
 * Separate orbs that are too close together on the ring.
 *
 * Algorithm:
 * 1. Sort orbs by angle.
 * 2. Identify clusters: groups where consecutive orbs are within
 *    `minSeparation` degrees of each other.
 * 3. For each cluster:
 *    a. Compute the circular mean angle of the cluster.
 *    b. Sort cluster members by displayOrder for stability.
 *    c. Distribute orbs evenly across a ±(minSeparation/2 × clusterSize)
 *       arc centered on the mean.
 * 4. Return adjusted angles for all orbs.
 *
 * @param orbs           Array of orbs with their raw ring angles.
 * @param minSeparation  Minimum angular separation in degrees (default 8).
 * @returns              Array of orbs with adjusted angles.
 */
export function separateClusters(
  orbs: OrbAngleInput[],
  minSeparation: number = 8,
): OrbAngleOutput[] {
  if (orbs.length <= 1) {
    return orbs.map((o) => ({ id: o.id, adjustedAngle: normaliseAngle(o.angle) }));
  }

  // 1. Sort by normalised angle
  const sorted = [...orbs]
    .map((o) => ({ ...o, angle: normaliseAngle(o.angle) }))
    .sort((a, b) => a.angle - b.angle);

  // 2. Identify clusters using a union-find-like sweep
  const clusterIds = new Array<number>(sorted.length);
  let currentCluster = 0;
  clusterIds[0] = currentCluster;

  for (let i = 1; i < sorted.length; i++) {
    const dist = angularDistance(sorted[i].angle, sorted[i - 1].angle);
    if (dist < minSeparation) {
      clusterIds[i] = currentCluster;
    } else {
      currentCluster++;
      clusterIds[i] = currentCluster;
    }
  }

  // Check wrap-around: if the last and first orbs are within minSeparation,
  // merge their clusters.
  if (sorted.length > 1) {
    const wrapDist = angularDistance(sorted[sorted.length - 1].angle, sorted[0].angle);
    if (wrapDist < minSeparation) {
      const lastClusterId = clusterIds[sorted.length - 1];
      const firstClusterId = clusterIds[0];
      if (lastClusterId !== firstClusterId) {
        // Merge: reassign all members of the last cluster to the first cluster
        const mergeFrom = lastClusterId;
        const mergeTo = firstClusterId;
        for (let i = 0; i < clusterIds.length; i++) {
          if (clusterIds[i] === mergeFrom) {
            clusterIds[i] = mergeTo;
          }
        }
      }
    }
  }

  // 3. Group by cluster
  const clusters = new Map<number, Array<{ index: number; orb: OrbAngleInput }>>();
  for (let i = 0; i < sorted.length; i++) {
    const cid = clusterIds[i];
    if (!clusters.has(cid)) {
      clusters.set(cid, []);
    }
    clusters.get(cid)!.push({ index: i, orb: sorted[i] });
  }

  // 4. Distribute each cluster
  const result = new Map<string, number>();

  for (const members of clusters.values()) {
    if (members.length === 1) {
      // Single orb — no adjustment needed
      result.set(members[0].orb.id, members[0].orb.angle);
      continue;
    }

    // Compute circular mean angle
    let sinSum = 0;
    let cosSum = 0;
    for (const m of members) {
      const rad = (m.orb.angle * Math.PI) / 180;
      sinSum += Math.sin(rad);
      cosSum += Math.cos(rad);
    }
    const meanRad = Math.atan2(sinSum / members.length, cosSum / members.length);
    const meanAngle = normaliseAngle((meanRad * 180) / Math.PI);

    // Sort by displayOrder for stable distribution
    const byOrder = [...members].sort((a, b) => a.orb.displayOrder - b.orb.displayOrder);

    // Distribute evenly across the arc
    const clusterSize = byOrder.length;
    const totalArc = minSeparation * (clusterSize - 1);
    const startAngle = meanAngle - totalArc / 2;

    for (let i = 0; i < clusterSize; i++) {
      const adjustedAngle = normaliseAngle(startAngle + i * minSeparation);
      result.set(byOrder[i].orb.id, adjustedAngle);
    }
  }

  // Return in the original input order
  return orbs.map((o) => ({
    id: o.id,
    adjustedAngle: result.get(o.id) ?? normaliseAngle(o.angle),
  }));
}
