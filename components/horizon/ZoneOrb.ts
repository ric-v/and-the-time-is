/**
 * ZoneOrb Renderer
 *
 * A plain TypeScript class (not a React component) that creates and manages
 * the Three.js objects for a single Zone Orb on the Horizon Ring:
 *
 * - SphereGeometry(0.22, 24, 24) with gradient texture from 6-state palette
 * - Glass shell: second sphere at radius × 1.02, MeshPhysicalMaterial,
 *   transmission 0.3, roughness 0.4, opacity 0.9
 * - Per-orb gradient texture (64×64) cached per sky-state transition
 * - Celestial icon sprite (sun/moon) positioned inside the orb based on local hour
 * - Local Orb distinction: 2px accent ring
 * - Density scaling: radius decreases linearly when >15 orbs
 *
 * Coordinate system (from UI-UX-Spec Section 19.1):
 *   orb.position.x = ringRadius * sin(θ)
 *   orb.position.y = ringRadius * cos(θ)
 *   orb.position.z = 0
 *
 * Requirements: 4.1, 4.2, 4.3, 4.6, 4.9, 4.10, 3.8
 */

import {
  Group,
  Mesh,
  Sprite,
  SphereGeometry,
  RingGeometry,
  MeshPhongMaterial,
  MeshPhysicalMaterial,
  MeshBasicMaterial,
  SpriteMaterial,
  CanvasTexture,
  Color,
  DoubleSide,
} from '../../utils/three-imports';
import {
  SIX_STATE_PALETTE,
  getSkyState,
  getSkyPaletteForHour,
} from '../../utils/skyPaletteEngine';
import type { SkyStateName, SkyPaletteColors, CelestialIcon } from '../../utils/skyPaletteEngine';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default orb radius in world units (design spec: 0.22). */
const DEFAULT_ORB_RADIUS = 0.22;

/** Sphere geometry segments. */
const SPHERE_SEGMENTS = 24;

/** Glass shell scale factor (radius × 1.02). */
const GLASS_SHELL_SCALE = 1.02;

/** Gradient texture size (64×64). */
const GRADIENT_TEXTURE_SIZE = 64;

/** Celestial icon size as fraction of orb diameter. */
const CELESTIAL_ICON_SIZE_RATIO = 0.4;

/** Celestial icon opacity. */
const CELESTIAL_ICON_OPACITY = 0.8;

/** Accent color for Local Orb ring. */
const ACCENT_COLOR = '#f4c572';

/** Accent ring width in world units (approximately 2px at default scale). */
const ACCENT_RING_INNER_RATIO = 0.92;

/** Minimum orb count before density scaling kicks in. */
const DENSITY_SCALE_MIN_COUNT = 15;

/** Maximum orb count for density scaling calculation. */
const DENSITY_SCALE_MAX_COUNT = 40;

/** Minimum radius as fraction of default (40%). */
const DENSITY_SCALE_MIN_RATIO = 0.4;

// ---------------------------------------------------------------------------
// Gradient texture cache
// ---------------------------------------------------------------------------

/**
 * Cache for gradient textures keyed by sky state name.
 * Since there are only 6 states, we cache at most 6 textures.
 */
const gradientTextureCache = new Map<SkyStateName, CanvasTexture>();

/**
 * Generate a 64×64 vertical linear gradient texture from zenith to horizon color.
 * Cached per sky state — only regenerated when the orb transitions between states.
 */
function getGradientTexture(skyState: SkyStateName): CanvasTexture {
  const cached = gradientTextureCache.get(skyState);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = GRADIENT_TEXTURE_SIZE;
  canvas.height = GRADIENT_TEXTURE_SIZE;
  const ctx = canvas.getContext('2d')!;

  const palette = SIX_STATE_PALETTE[skyState];
  const gradient = ctx.createLinearGradient(0, 0, 0, GRADIENT_TEXTURE_SIZE);
  gradient.addColorStop(0, palette.zenith);
  gradient.addColorStop(1, palette.horizon);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, GRADIENT_TEXTURE_SIZE, GRADIENT_TEXTURE_SIZE);

  const texture = new CanvasTexture(canvas);
  texture.needsUpdate = true;
  gradientTextureCache.set(skyState, texture);

  return texture;
}

// ---------------------------------------------------------------------------
// Celestial icon sprite texture generation
// ---------------------------------------------------------------------------

/**
 * Cache for celestial icon textures keyed by icon name.
 */
const celestialIconCache = new Map<CelestialIcon, CanvasTexture>();

/**
 * Draw a celestial icon (sun or moon variant) onto a canvas and return as texture.
 */
function getCelestialIconTexture(icon: CelestialIcon): CanvasTexture {
  const cached = celestialIconCache.get(icon);
  if (cached) return cached;

  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const cx = size / 2;
  const cy = size / 2;

  if (icon.startsWith('sun')) {
    // Sun variants — warm circle with rays
    const sunColor = icon === 'sun-bright' ? '#ffe066' : '#ffcc44';
    const rayColor = icon === 'sun-rising' || icon === 'sun-setting'
      ? '#ff9944'
      : '#ffdd66';

    // Glow
    const glow = ctx.createRadialGradient(cx, cy, 6, cx, cy, 24);
    glow.addColorStop(0, sunColor);
    glow.addColorStop(0.6, rayColor + '88');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, size, size);

    // Core circle
    ctx.beginPath();
    ctx.arc(cx, cy, 10, 0, Math.PI * 2);
    ctx.fillStyle = sunColor;
    ctx.fill();

    // Rays
    ctx.strokeStyle = rayColor;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    const rayCount = 8;
    const innerR = 14;
    const outerR = 22;
    for (let i = 0; i < rayCount; i++) {
      const angle = (i / rayCount) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR);
      ctx.lineTo(cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR);
      ctx.stroke();
    }
  } else {
    // Moon variants — crescent
    const moonColor = icon === 'moon-full' ? '#e8eaff' : '#c8d0e8';

    // Full moon circle
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.fillStyle = moonColor;
    ctx.fill();

    if (icon !== 'moon-full') {
      // Crescent cutout
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(cx + 8, cy - 2, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }

    // Subtle glow
    const glow = ctx.createRadialGradient(cx, cy, 10, cx, cy, 24);
    glow.addColorStop(0, moonColor + '44');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, size, size);
  }

  const texture = new CanvasTexture(canvas);
  texture.needsUpdate = true;
  celestialIconCache.set(icon, texture);

  return texture;
}

// ---------------------------------------------------------------------------
// Density scaling
// ---------------------------------------------------------------------------

/**
 * Compute the orb radius based on the total number of orbs.
 *
 * Below 15 orbs: always DEFAULT_ORB_RADIUS (0.22).
 * 15–40 orbs: linearly decreases to 40% of default (0.09).
 * Above 40: clamped at minimum.
 */
export function computeOrbRadius(totalOrbs: number): number {
  if (totalOrbs <= DENSITY_SCALE_MIN_COUNT) {
    return DEFAULT_ORB_RADIUS;
  }
  if (totalOrbs >= DENSITY_SCALE_MAX_COUNT) {
    return DEFAULT_ORB_RADIUS * DENSITY_SCALE_MIN_RATIO;
  }
  // Linear interpolation
  const t = (totalOrbs - DENSITY_SCALE_MIN_COUNT) /
    (DENSITY_SCALE_MAX_COUNT - DENSITY_SCALE_MIN_COUNT);
  return DEFAULT_ORB_RADIUS * (1 - t * (1 - DENSITY_SCALE_MIN_RATIO));
}

// ---------------------------------------------------------------------------
// ZoneOrb class
// ---------------------------------------------------------------------------

export class ZoneOrb {
  /** The root group — add this to the parent Scene. */
  public readonly group: Group;

  /** The orb ID (matches Orb.id from the store). */
  public readonly orbId: string;

  /** Whether this is the Local Orb. */
  public readonly isLocal: boolean;

  // Internal meshes
  private orbMesh: Mesh;
  private orbMaterial: MeshPhongMaterial;
  private shellMesh: Mesh;
  private shellMaterial: MeshPhysicalMaterial;
  private accentRingMesh: Mesh | null = null;
  private accentRingMaterial: MeshBasicMaterial | null = null;
  private celestialSprite: Sprite;
  private celestialMaterial: SpriteMaterial;

  // State tracking
  private currentSkyState: SkyStateName = 'midnight';
  private currentRadius: number = DEFAULT_ORB_RADIUS;
  private currentCelestialIcon: CelestialIcon = 'moon-full';

  constructor(orbId: string, isLocal: boolean) {
    this.orbId = orbId;
    this.isLocal = isLocal;
    this.group = new Group();

    // --- Orb body with gradient texture ---
    const orbGeometry = new SphereGeometry(DEFAULT_ORB_RADIUS, SPHERE_SEGMENTS, SPHERE_SEGMENTS);
    const initialTexture = getGradientTexture('midnight');
    this.orbMaterial = new MeshPhongMaterial({
      map: initialTexture,
      transparent: false,
      shininess: 10,
    });
    this.orbMesh = new Mesh(orbGeometry, this.orbMaterial);
    this.group.add(this.orbMesh);

    // --- Glass shell ---
    const shellRadius = DEFAULT_ORB_RADIUS * GLASS_SHELL_SCALE;
    const shellGeometry = new SphereGeometry(shellRadius, SPHERE_SEGMENTS, SPHERE_SEGMENTS);
    this.shellMaterial = new MeshPhysicalMaterial({
      transmission: 0.3,
      roughness: 0.4,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    });
    this.shellMesh = new Mesh(shellGeometry, this.shellMaterial);
    this.group.add(this.shellMesh);

    // --- Celestial icon sprite ---
    this.celestialMaterial = new SpriteMaterial({
      map: getCelestialIconTexture('moon-full'),
      transparent: true,
      opacity: CELESTIAL_ICON_OPACITY,
      depthWrite: false,
    });
    this.celestialSprite = new Sprite(this.celestialMaterial);
    const iconSize = DEFAULT_ORB_RADIUS * 2 * CELESTIAL_ICON_SIZE_RATIO;
    this.celestialSprite.scale.set(iconSize, iconSize, 1);
    this.group.add(this.celestialSprite);

    // --- Local Orb accent ring ---
    if (isLocal) {
      this.createAccentRing(DEFAULT_ORB_RADIUS);
    }
  }

  // -------------------------------------------------------------------------
  // Accent ring for Local Orb
  // -------------------------------------------------------------------------

  /**
   * Create the 2px accent ring around the Local Orb.
   */
  private createAccentRing(radius: number): void {
    const innerRadius = radius * ACCENT_RING_INNER_RATIO;
    const outerRadius = radius * GLASS_SHELL_SCALE * 1.04;
    const ringGeometry = new RingGeometry(innerRadius, outerRadius, 48);
    this.accentRingMaterial = new MeshBasicMaterial({
      color: new Color(ACCENT_COLOR),
      transparent: true,
      opacity: 0.9,
      side: DoubleSide,
      depthWrite: false,
    });
    this.accentRingMesh = new Mesh(ringGeometry, this.accentRingMaterial);
    // Position the ring slightly in front of the orb so it's visible
    this.accentRingMesh.position.z = radius * 0.01;
    this.group.add(this.accentRingMesh);
  }

  // -------------------------------------------------------------------------
  // Celestial icon positioning
  // -------------------------------------------------------------------------

  /**
   * Position the celestial icon sprite inside the orb based on local hour.
   *
   * Sun rises from the east (right) at dawn, peaks at center-top at noon,
   * sets to the west (left) at dusk. Moon behaves inversely.
   *
   * The icon moves along a semicircular arc inside the orb:
   * - Dawn (5-7): right side → rising
   * - Day (7-12): upper arc → climbing
   * - Noon (12-14): top center → peak
   * - Day (14-18): upper arc → descending
   * - Dusk (18-20): left side → setting
   * - Night/Midnight: lower arc (moon path)
   */
  private positionCelestialIcon(localHour: number, localMinute: number): void {
    const radius = this.currentRadius;
    const iconOffset = radius * 0.4; // Position within the orb

    // Map hour to a 0–1 progress through the day
    const hourFraction = (localHour + localMinute / 60) / 24;

    // Sun path: maps 6AM (0.25) to right, noon (0.5) to top, 6PM (0.75) to left
    // Moon path: maps midnight (0) to top, 6AM (0.25) to left, 6PM (0.75) to right
    const isSun = this.currentCelestialIcon.startsWith('sun');

    let angle: number;
    if (isSun) {
      // Sun arc: 6AM = 0° (right), noon = 90° (top), 6PM = 180° (left)
      // Map the daytime hours (5-20) to a 0-π arc
      const dayProgress = Math.max(0, Math.min(1, (hourFraction - 5 / 24) / (15 / 24)));
      angle = dayProgress * Math.PI;
    } else {
      // Moon arc: 6PM = 0° (right), midnight = 90° (top), 6AM = 180° (left)
      const nightProgress = hourFraction >= 0.75
        ? (hourFraction - 0.75) / 0.5
        : hourFraction < 0.25
          ? (hourFraction + 0.25) / 0.5
          : 0.5;
      angle = Math.max(0, Math.min(1, nightProgress)) * Math.PI;
    }

    // Convert angle to x,y position within the orb
    const x = Math.cos(angle) * iconOffset;
    const y = Math.sin(angle) * iconOffset * 0.6; // Slightly flattened arc

    this.celestialSprite.position.set(x, y, radius * 0.5);
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /**
   * Update the orb's visual state for the current frame.
   *
   * @param localHour - The local hour (0–23) at the Displayed Time
   * @param localMinute - The local minute (0–59) at the Displayed Time
   * @param totalOrbs - Total number of orbs on the ring (for density scaling)
   */
  public update(localHour: number, localMinute: number, totalOrbs: number): void {
    // Update sky state and gradient texture
    const newSkyState = getSkyState(localHour);
    if (newSkyState !== this.currentSkyState) {
      this.currentSkyState = newSkyState;
      const texture = getGradientTexture(newSkyState);
      this.orbMaterial.map = texture;
      this.orbMaterial.needsUpdate = true;
    }

    // Update celestial icon
    const palette = getSkyPaletteForHour(localHour);
    if (palette.celestialIcon !== this.currentCelestialIcon) {
      this.currentCelestialIcon = palette.celestialIcon;
      const iconTexture = getCelestialIconTexture(palette.celestialIcon);
      this.celestialMaterial.map = iconTexture;
      this.celestialMaterial.needsUpdate = true;
    }

    // Position celestial icon based on local hour
    this.positionCelestialIcon(localHour, localMinute);

    // Density scaling
    const newRadius = computeOrbRadius(totalOrbs);
    if (Math.abs(newRadius - this.currentRadius) > 0.001) {
      this.setRadius(newRadius);
    }
  }

  /**
   * Set the orb's position on the ring.
   *
   * @param ringAngleDeg - Ring angle in degrees (0° = midnight/12 o'clock)
   * @param ringRadius - Ring radius in world units (default 1.19)
   * @param liftOffset - Additional radial offset (for cluster hover lift)
   */
  public setRingPosition(
    ringAngleDeg: number,
    ringRadius: number = 1.19,
    liftOffset: number = 0,
  ): void {
    const theta = (ringAngleDeg * Math.PI) / 180;
    const r = ringRadius + liftOffset;
    this.group.position.x = r * Math.sin(theta);
    this.group.position.y = r * Math.cos(theta);
    this.group.position.z = 0;
  }

  /**
   * Get the current sky state name for this orb.
   */
  public getSkyState(): SkyStateName {
    return this.currentSkyState;
  }

  /**
   * Get the current sky palette colors for this orb.
   */
  public getPaletteColors(): SkyPaletteColors {
    return SIX_STATE_PALETTE[this.currentSkyState];
  }

  /**
   * Set the orb's overall opacity (used for Detail View fade).
   */
  public setOpacity(opacity: number): void {
    this.orbMaterial.transparent = opacity < 1;
    this.orbMaterial.opacity = opacity;
    this.shellMaterial.opacity = 0.9 * opacity;
    this.celestialMaterial.opacity = CELESTIAL_ICON_OPACITY * opacity;
    if (this.accentRingMaterial) {
      this.accentRingMaterial.opacity = 0.9 * opacity;
    }
  }

  /**
   * Set the orb's scale (used for Detail View expand animation).
   */
  public setScale(scale: number): void {
    this.group.scale.set(scale, scale, scale);
  }

  // -------------------------------------------------------------------------
  // Radius management (density scaling)
  // -------------------------------------------------------------------------

  /**
   * Update the orb radius for density scaling.
   * Recreates geometry when the radius changes significantly.
   */
  private setRadius(newRadius: number): void {
    this.currentRadius = newRadius;

    // Recreate orb geometry
    this.orbMesh.geometry.dispose();
    this.orbMesh.geometry = new SphereGeometry(newRadius, SPHERE_SEGMENTS, SPHERE_SEGMENTS);

    // Recreate shell geometry
    this.shellMesh.geometry.dispose();
    this.shellMesh.geometry = new SphereGeometry(
      newRadius * GLASS_SHELL_SCALE,
      SPHERE_SEGMENTS,
      SPHERE_SEGMENTS,
    );

    // Update celestial icon size
    const iconSize = newRadius * 2 * CELESTIAL_ICON_SIZE_RATIO;
    this.celestialSprite.scale.set(iconSize, iconSize, 1);

    // Recreate accent ring if Local Orb
    if (this.isLocal && this.accentRingMesh) {
      this.group.remove(this.accentRingMesh);
      this.accentRingMesh.geometry.dispose();
      this.accentRingMaterial?.dispose();
      this.accentRingMesh = null;
      this.accentRingMaterial = null;
      this.createAccentRing(newRadius);
    }
  }

  // -------------------------------------------------------------------------
  // Cleanup
  // -------------------------------------------------------------------------

  /**
   * Dispose of all Three.js resources. Call when removing the orb from the scene.
   * Note: gradient textures are shared/cached and NOT disposed here.
   */
  public dispose(): void {
    this.orbMesh.geometry.dispose();
    this.orbMaterial.dispose();
    this.shellMesh.geometry.dispose();
    this.shellMaterial.dispose();
    this.celestialMaterial.dispose();

    if (this.accentRingMesh) {
      this.accentRingMesh.geometry.dispose();
      this.accentRingMaterial?.dispose();
    }
  }
}
