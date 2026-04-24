/**
 * Scene Lighting
 *
 * A plain TypeScript class (not a React component) that creates and manages
 * the Three.js lights for the Horizon scene:
 *
 * - Directional "sun" light positioned relative to Displayed Time
 *   (elevation 80° at local noon, −80° at midnight)
 * - Ambient light at 0.35 intensity tinted to the current sky's horizon color
 * - Subtle rim light at 0.15 intensity on the far side of the globe
 * - NO shadows (performance + readability)
 *
 * Requirements: 2.1 (lighting from UI-UX-Spec Section 6.2)
 */

import {
  Group,
  AmbientLight,
  DirectionalLight,
  Color,
} from '../../utils/three-imports';
import { getSkyPaletteForHour } from '../../utils/skyPaletteEngine';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Sun light intensity. */
const SUN_INTENSITY = 1.0;

/** Ambient light intensity (UI-UX-Spec Section 6.2). */
const AMBIENT_INTENSITY = 0.35;

/** Rim light intensity (UI-UX-Spec Section 6.2). */
const RIM_INTENSITY = 0.15;

/**
 * Maximum sun elevation in degrees.
 * At displayed local noon the sun sits at 80°; at midnight at −80°.
 */
const MAX_SUN_ELEVATION_DEG = 80;

/**
 * Distance of the directional lights from the scene origin.
 * Far enough that the light direction is effectively parallel.
 */
const LIGHT_DISTANCE = 5;

// ---------------------------------------------------------------------------
// SceneLighting class
// ---------------------------------------------------------------------------

export class SceneLighting {
  /** The root group — add this to the parent Scene. */
  public readonly group: Group;

  /** Directional "sun" light that tracks the Displayed Time. */
  private sunLight: DirectionalLight;

  /** Ambient light tinted to the current sky's horizon color. */
  private ambientLight: AmbientLight;

  /** Rim light on the far side of the globe. */
  private rimLight: DirectionalLight;

  constructor() {
    this.group = new Group();

    // --- Sun light ---
    this.sunLight = new DirectionalLight(0xffffff, SUN_INTENSITY);
    this.sunLight.castShadow = false;
    this.group.add(this.sunLight);

    // --- Ambient light ---
    this.ambientLight = new AmbientLight(0xffffff, AMBIENT_INTENSITY);
    this.group.add(this.ambientLight);

    // --- Rim light (far side of globe) ---
    this.rimLight = new DirectionalLight(0xffffff, RIM_INTENSITY);
    this.rimLight.castShadow = false;
    this.group.add(this.rimLight);
  }

  // -------------------------------------------------------------------------
  // Public update method — called every frame from the animation loop
  // -------------------------------------------------------------------------

  /**
   * Update all lights for the current frame.
   *
   * @param displayedTime - The current Displayed Time (real time + scrub offset)
   * @param localHour - The local hour (0–23) at the user's timezone for the Displayed Time
   * @param localMinute - The local minute (0–59) at the user's timezone for the Displayed Time
   * @param skyHorizonColor - Hex color string of the current sky's horizon color
   *                          (from the sky palette engine). If not provided, it
   *                          will be derived from the local hour.
   */
  public update(
    displayedTime: Date,
    localHour: number,
    localMinute: number,
    skyHorizonColor?: string,
  ): void {
    this.updateSunPosition(localHour, localMinute);
    this.updateAmbientTint(localHour, skyHorizonColor);
    this.updateRimLight(localHour, localMinute);
  }

  // -------------------------------------------------------------------------
  // Sun light position
  // -------------------------------------------------------------------------

  /**
   * Position the directional sun light based on the Displayed Time.
   *
   * The sun elevation maps linearly from the local time of day:
   * - Noon (12:00) → +80° elevation (nearly overhead)
   * - Midnight (00:00) → −80° elevation (below the scene)
   *
   * The mapping uses a sinusoidal curve so the sun smoothly tracks
   * through the day, including fractional minutes.
   */
  private updateSunPosition(localHour: number, localMinute: number): void {
    // Convert local time to a fraction of the day (0 = midnight, 0.5 = noon)
    const totalMinutes = localHour * 60 + localMinute;
    const dayFraction = totalMinutes / 1440; // 1440 = 24 * 60

    // Map day fraction to elevation angle using a sinusoidal curve:
    // At noon (dayFraction = 0.5) → elevation = +80°
    // At midnight (dayFraction = 0.0 or 1.0) → elevation = −80°
    // sin(2π * dayFraction - π/2) gives -1 at 0.0, +1 at 0.5, -1 at 1.0
    const elevationRad =
      Math.sin(2 * Math.PI * dayFraction - Math.PI / 2) *
      (MAX_SUN_ELEVATION_DEG * Math.PI) / 180;

    // Position the sun light at the computed elevation.
    // The sun comes from the "front" of the scene (positive Z toward camera)
    // and its Y position varies with elevation.
    const y = Math.sin(elevationRad) * LIGHT_DISTANCE;
    const z = Math.cos(elevationRad) * LIGHT_DISTANCE;

    this.sunLight.position.set(0, y, z);
  }

  // -------------------------------------------------------------------------
  // Ambient light tint
  // -------------------------------------------------------------------------

  /**
   * Tint the ambient light to the current sky's horizon color.
   * This creates a cohesive color atmosphere that matches the sky state.
   */
  private updateAmbientTint(localHour: number, skyHorizonColor?: string): void {
    if (skyHorizonColor) {
      this.ambientLight.color.set(skyHorizonColor);
    } else {
      // Derive from the 6-state palette based on local hour
      const palette = getSkyPaletteForHour(localHour);
      this.ambientLight.color.set(palette.horizon);
    }
  }

  // -------------------------------------------------------------------------
  // Rim light
  // -------------------------------------------------------------------------

  /**
   * Position the rim light on the far side of the globe (opposite the sun).
   * This defines the globe's silhouette during dark hours.
   */
  private updateRimLight(localHour: number, localMinute: number): void {
    // The rim light sits opposite the sun — negative of the sun's position
    const totalMinutes = localHour * 60 + localMinute;
    const dayFraction = totalMinutes / 1440;

    const elevationRad =
      Math.sin(2 * Math.PI * dayFraction - Math.PI / 2) *
      (MAX_SUN_ELEVATION_DEG * Math.PI) / 180;

    // Opposite side: negate Y and Z
    const y = -Math.sin(elevationRad) * LIGHT_DISTANCE;
    const z = -Math.cos(elevationRad) * LIGHT_DISTANCE;

    this.rimLight.position.set(0, y, z);
  }

  // -------------------------------------------------------------------------
  // Cleanup
  // -------------------------------------------------------------------------

  /**
   * Dispose of all Three.js resources. Call when removing lighting from the scene.
   */
  public dispose(): void {
    this.sunLight.dispose();
    this.ambientLight.dispose();
    this.rimLight.dispose();
  }
}
