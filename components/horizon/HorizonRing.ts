/**
 * HorizonRing Renderer
 *
 * A plain TypeScript class (not a React component) that creates and manages
 * the Three.js objects for the Horizon Ring:
 *
 * - TubeGeometry along a CatmullRomCurve3 circle at radius 1.19, tube radius 0.004
 * - MeshBasicMaterial with emissive-like appearance (color + transparent + opacity)
 * - Opacity at rest: 0.08, on hover/scrub: 0.25
 * - Four cardinal tick points (12, 3, 6, 9 o'clock) as slightly larger segments
 *   at 0.18 opacity
 *
 * The ring sits in the XY plane at Z=0 (equatorial plane of the globe).
 *
 * Coordinate system (from UI-UX-Spec Section 19.1):
 *   Ring Angle 0° (midnight):  position (0, 1.19, 0)   — 12 o'clock
 *   Ring Angle 90° (06:00):    position (1.19, 0, 0)    — 3 o'clock
 *   Ring Angle 180° (noon):    position (0, -1.19, 0)   — 6 o'clock
 *   Ring Angle 270° (18:00):   position (-1.19, 0, 0)   — 9 o'clock
 *
 * Requirements: 3.1
 */

import {
  Group,
  Mesh,
  TubeGeometry,
  MeshBasicMaterial,
  CatmullRomCurve3,
  Vector3,
  Color,
} from '../../utils/three-imports';
import { SIX_STATE_PALETTE } from '../../utils/skyPaletteEngine';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Ring radius in world units (design spec: 1.19). */
const RING_RADIUS = 1.19;

/** Tube radius for the main ring (visually ~1px on screen). */
const TUBE_RADIUS = 0.004;

/** Number of sample points for the CatmullRomCurve3 circle. */
const CURVE_SEGMENTS = 128;

/** Number of radial segments for the TubeGeometry cross-section. */
const TUBE_RADIAL_SEGMENTS = 8;

/** Ring opacity at rest. */
const OPACITY_REST = 0.08;

/** Ring opacity during hover or scrub. */
const OPACITY_ACTIVE = 0.25;

/** Cardinal tick opacity. */
const TICK_OPACITY = 0.18;

/** Cardinal tick tube radius (slightly larger, ~3px visual). */
const TICK_TUBE_RADIUS = 0.008;

/** Angular extent of each cardinal tick in degrees. */
const TICK_ARC_DEGREES = 4;

/** Number of curve points used to generate the circle path. */
const CIRCLE_POINT_COUNT = 64;

// ---------------------------------------------------------------------------
// Helper: generate circle points in the XY plane
// ---------------------------------------------------------------------------

/**
 * Generate points along a circle in the XY plane (Z=0).
 *
 * Uses the Ring Angle coordinate system:
 *   x = radius * sin(θ)
 *   y = radius * cos(θ)
 *   z = 0
 *
 * where θ goes from 0 to 2π.
 */
function generateCirclePoints(
  radius: number,
  count: number,
): Vector3[] {
  const points: Vector3[] = [];
  for (let i = 0; i <= count; i++) {
    const theta = (i / count) * Math.PI * 2;
    points.push(
      new Vector3(
        radius * Math.sin(theta),
        radius * Math.cos(theta),
        0,
      ),
    );
  }
  return points;
}

/**
 * Generate points along an arc in the XY plane (Z=0).
 *
 * @param radius - Circle radius
 * @param centerAngleDeg - Center angle of the arc in degrees (Ring Angle convention)
 * @param arcDeg - Total arc extent in degrees
 * @param count - Number of sample points
 */
function generateArcPoints(
  radius: number,
  centerAngleDeg: number,
  arcDeg: number,
  count: number,
): Vector3[] {
  const points: Vector3[] = [];
  const centerRad = (centerAngleDeg * Math.PI) / 180;
  const halfArcRad = ((arcDeg / 2) * Math.PI) / 180;
  const startRad = centerRad - halfArcRad;
  const endRad = centerRad + halfArcRad;

  for (let i = 0; i <= count; i++) {
    const theta = startRad + (i / count) * (endRad - startRad);
    points.push(
      new Vector3(
        radius * Math.sin(theta),
        radius * Math.cos(theta),
        0,
      ),
    );
  }
  return points;
}

// ---------------------------------------------------------------------------
// HorizonRing class
// ---------------------------------------------------------------------------

export class HorizonRing {
  /** The root group — add this to the parent Scene. */
  public readonly group: Group;

  /** The main ring mesh. */
  private ringMesh: Mesh;

  /** The main ring material. */
  private ringMaterial: MeshBasicMaterial;

  /** Cardinal tick meshes (12, 3, 6, 9 o'clock). */
  private tickMeshes: Mesh[] = [];

  /** Cardinal tick materials. */
  private tickMaterials: MeshBasicMaterial[] = [];

  /** Current ring color (updated from sky palette). */
  private ringColor: Color;

  /** Current target opacity (for smooth transitions). */
  private targetOpacity: number = OPACITY_REST;

  /** Current actual opacity. */
  private currentOpacity: number = OPACITY_REST;

  constructor() {
    this.group = new Group();

    // Default color from the sky palette's horizon color
    this.ringColor = new Color(SIX_STATE_PALETTE.noon.horizon);

    // --- Main ring ---
    this.ringMaterial = this.createRingMaterial(this.ringColor, OPACITY_REST);
    const ringCurve = this.createCircleCurve(RING_RADIUS);
    const ringGeometry = new TubeGeometry(
      ringCurve,
      CURVE_SEGMENTS,
      TUBE_RADIUS,
      TUBE_RADIAL_SEGMENTS,
      true, // closed
    );
    this.ringMesh = new Mesh(ringGeometry, this.ringMaterial);
    this.group.add(this.ringMesh);

    // --- Cardinal tick marks at 0° (12 o'clock), 90° (3), 180° (6), 270° (9) ---
    const cardinalAngles = [0, 90, 180, 270];
    for (const angle of cardinalAngles) {
      const tickMaterial = this.createRingMaterial(this.ringColor, TICK_OPACITY);
      const tickCurve = this.createArcCurve(RING_RADIUS, angle, TICK_ARC_DEGREES);
      const tickGeometry = new TubeGeometry(
        tickCurve,
        16, // fewer segments needed for short arcs
        TICK_TUBE_RADIUS,
        TUBE_RADIAL_SEGMENTS,
        false, // not closed
      );
      const tickMesh = new Mesh(tickGeometry, tickMaterial);
      this.group.add(tickMesh);
      this.tickMeshes.push(tickMesh);
      this.tickMaterials.push(tickMaterial);
    }
  }

  // -------------------------------------------------------------------------
  // Geometry helpers
  // -------------------------------------------------------------------------

  /**
   * Create a CatmullRomCurve3 forming a closed circle in the XY plane.
   */
  private createCircleCurve(radius: number): CatmullRomCurve3 {
    const points = generateCirclePoints(radius, CIRCLE_POINT_COUNT);
    return new CatmullRomCurve3(points, true, 'catmullrom', 0);
  }

  /**
   * Create a CatmullRomCurve3 forming a short arc in the XY plane.
   */
  private createArcCurve(
    radius: number,
    centerAngleDeg: number,
    arcDeg: number,
  ): CatmullRomCurve3 {
    const points = generateArcPoints(radius, centerAngleDeg, arcDeg, 12);
    return new CatmullRomCurve3(points, false, 'catmullrom', 0);
  }

  // -------------------------------------------------------------------------
  // Material helpers
  // -------------------------------------------------------------------------

  /**
   * Create a MeshBasicMaterial with emissive-like appearance.
   * Since MeshBasicMaterial doesn't have an emissive property, we use
   * color + transparent + opacity to achieve the "breath of light" look.
   */
  private createRingMaterial(color: Color, opacity: number): MeshBasicMaterial {
    return new MeshBasicMaterial({
      color: color.clone(),
      transparent: true,
      opacity,
      depthWrite: false,
    });
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /**
   * Update the ring color to match the current sky's horizon color.
   *
   * @param horizonColor - Hex color string from the sky palette (e.g. '#e8e0c8')
   */
  public setColor(horizonColor: string): void {
    this.ringColor.set(horizonColor);
    this.ringMaterial.color.copy(this.ringColor);
    for (const tickMaterial of this.tickMaterials) {
      tickMaterial.color.copy(this.ringColor);
    }
  }

  /**
   * Set the ring to its active (hover/scrub) opacity.
   * Call this when the user is hovering near the ring or scrubbing.
   */
  public setActive(active: boolean): void {
    this.targetOpacity = active ? OPACITY_ACTIVE : OPACITY_REST;
  }

  /**
   * Update the ring state for the current frame.
   * Smoothly interpolates opacity toward the target.
   *
   * @param deltaTime - Time elapsed since last frame in seconds
   */
  public update(deltaTime: number): void {
    // Smoothly interpolate opacity toward target
    if (this.currentOpacity !== this.targetOpacity) {
      const speed = 5; // opacity units per second — fast enough for 200ms transition
      const diff = this.targetOpacity - this.currentOpacity;
      const step = speed * deltaTime;

      if (Math.abs(diff) <= step) {
        this.currentOpacity = this.targetOpacity;
      } else {
        this.currentOpacity += Math.sign(diff) * step;
      }

      this.ringMaterial.opacity = this.currentOpacity;
      // Tick opacity scales proportionally but stays at or above TICK_OPACITY
      const tickOpacityScale = this.currentOpacity / OPACITY_REST;
      for (const tickMaterial of this.tickMaterials) {
        tickMaterial.opacity = TICK_OPACITY * tickOpacityScale;
      }
    }
  }

  // -------------------------------------------------------------------------
  // Cleanup
  // -------------------------------------------------------------------------

  /**
   * Dispose of all Three.js resources. Call when removing the ring from the scene.
   */
  public dispose(): void {
    this.ringMesh.geometry.dispose();
    this.ringMaterial.dispose();
    for (let i = 0; i < this.tickMeshes.length; i++) {
      this.tickMeshes[i].geometry.dispose();
      this.tickMaterials[i].dispose();
    }
    this.tickMeshes = [];
    this.tickMaterials = [];
  }
}
