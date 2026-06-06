/**
 * Globe Renderer
 *
 * A plain TypeScript class (not a React component) that creates and manages
 * the Three.js objects for the Horizon globe:
 *
 * - Low-poly icosahedron (IcosahedronGeometry(0.63, 3), ~1280 triangles)
 * - Matte MeshPhongMaterial with no specular highlights
 * - 512×256 continent silhouette texture as additive overlay
 *   (70% opacity on lit hemisphere, 15% on dark)
 * - Terminator: 8°-wide soft gradient band using Dusk/Dawn horizon colors
 * - Atmospheric rim glow: second sphere at radius × 1.04, additive blending, 35% opacity
 * - Rotation: 1 revolution per 24 real seconds when live; hold position when scrubbed
 * - Hour-boundary crossfade: 200ms transition for lit-hemisphere tint
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7
 */

import {
  Group,
  Mesh,
  IcosahedronGeometry,
  SphereGeometry,
  MeshPhongMaterial,
  MeshBasicMaterial,
  ShaderMaterial,
  TextureLoader,
  Color,
  BackSide,
  AdditiveBlending,
} from '../../utils/three-imports';
import type { Texture } from '../../utils/three-imports';
import {
  SIX_STATE_PALETTE,
  TWENTY_FOUR_STATE_PALETTE,
  get24StatePaletteForHour,
} from '../../utils/skyPaletteEngine';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Globe radius in world units (design spec: 0.63). */
const GLOBE_RADIUS = 0.63;

/** Icosahedron subdivision level — ~1280 triangles, deliberately low-poly. */
const SUBDIVISION = 3;

/** Atmospheric rim sphere scale factor. */
const ATMOSPHERE_SCALE = 1.04;

/** Atmospheric rim opacity. */
const ATMOSPHERE_OPACITY = 0.35;

/** Rotation speed: 1 revolution per 24 real seconds = 2π / 24 rad/s. */
const ROTATION_SPEED = (2 * Math.PI) / 24;

/** Hour-boundary crossfade duration in milliseconds. */
const CROSSFADE_DURATION_MS = 200;

/** Terminator width in degrees. */
const TERMINATOR_WIDTH_DEG = 8;

/** Continent texture path. */
const CONTINENT_TEXTURE_PATH = '/textures/globe-continents.png';

// ---------------------------------------------------------------------------
// Custom shader for the globe with terminator + continent overlay
// ---------------------------------------------------------------------------

const globeVertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec2 vUv;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    vUv = uv;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const globeFragmentShader = /* glsl */ `
  uniform vec3 uLitColor;
  uniform vec3 uDarkColor;
  uniform vec3 uDuskHorizonColor;
  uniform vec3 uDawnHorizonColor;
  uniform vec3 uSunDirection;
  uniform float uTerminatorWidth;
  uniform sampler2D uContinentTexture;
  uniform float uHasContinentTexture;

  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec2 vUv;

  void main() {
    // Compute how much this fragment faces the sun
    vec3 normal = normalize(vNormal);
    float sunDot = dot(normal, normalize(uSunDirection));

    // Terminator band: smooth transition over uTerminatorWidth (in cosine space)
    // Convert degrees to a cosine-space width
    float halfWidthCos = sin(radians(uTerminatorWidth * 0.5));
    float litFactor = smoothstep(-halfWidthCos, halfWidthCos, sunDot);

    // Base color: interpolate between dark and lit hemisphere colors
    vec3 baseColor = mix(uDarkColor, uLitColor, litFactor);

    // Terminator band coloring: blend dusk/dawn colors in the transition zone
    float bandFactor = 1.0 - smoothstep(0.0, halfWidthCos * 2.0, abs(sunDot));
    // Sun-departing side (sunDot going negative) = dusk, sun-arriving side = dawn
    vec3 terminatorColor = mix(uDawnHorizonColor, uDuskHorizonColor, step(0.0, sunDot));
    baseColor = mix(baseColor, terminatorColor, bandFactor * 0.6);

    // Continent overlay texture
    if (uHasContinentTexture > 0.5) {
      vec4 continentSample = texture2D(uContinentTexture, vUv);
      // Additive overlay: 70% on lit hemisphere, 15% on dark
      float continentOpacity = mix(0.15, 0.70, litFactor);
      baseColor = baseColor + continentSample.rgb * continentSample.a * continentOpacity;
    }

    gl_FragColor = vec4(baseColor, 1.0);
  }
`;

// ---------------------------------------------------------------------------
// Globe class
// ---------------------------------------------------------------------------

export class Globe {
  /** The root group — add this to the parent Scene. */
  public readonly group: Group;

  // Internal meshes
  private globeMesh: Mesh;
  private atmosphereMesh: Mesh;
  private globeMaterial: ShaderMaterial;
  private atmosphereMaterial: MeshBasicMaterial;

  // State tracking
  private currentHour = -1;
  private targetLitColor: Color;
  private currentLitColor: Color;
  private startLitColor: Color;
  private crossfadeProgress = 1; // 1 = complete, <1 = in progress
  private cumulativeRotation = 0;
  private continentTexture: Texture | null = null;

  constructor() {
    this.group = new Group();

    // Default colors from the palette
    const noonZenith = SIX_STATE_PALETTE.noon.zenith;
    const midnightZenith = SIX_STATE_PALETTE.midnight.zenith;

    this.targetLitColor = new Color(noonZenith);
    this.currentLitColor = new Color(noonZenith);
    this.startLitColor = new Color(noonZenith);

    // --- Globe mesh with custom shader ---
    const globeGeometry = new IcosahedronGeometry(GLOBE_RADIUS, SUBDIVISION);
    this.globeMaterial = new ShaderMaterial({
      vertexShader: globeVertexShader,
      fragmentShader: globeFragmentShader,
      uniforms: {
        uLitColor: { value: new Color(noonZenith) },
        uDarkColor: { value: new Color(midnightZenith) },
        uDuskHorizonColor: { value: new Color(SIX_STATE_PALETTE.dusk.horizon) },
        uDawnHorizonColor: { value: new Color(SIX_STATE_PALETTE.dawn.horizon) },
        uSunDirection: { value: { x: 0, y: 1, z: 0.3 } },
        uTerminatorWidth: { value: TERMINATOR_WIDTH_DEG },
        uContinentTexture: { value: null },
        uHasContinentTexture: { value: 0.0 },
      },
    });

    this.globeMesh = new Mesh(globeGeometry, this.globeMaterial);
    this.group.add(this.globeMesh);

    // --- Atmospheric rim glow ---
    const atmosphereGeometry = new SphereGeometry(
      GLOBE_RADIUS * ATMOSPHERE_SCALE,
      32,
      32,
    );
    this.atmosphereMaterial = new MeshBasicMaterial({
      color: new Color(noonZenith),
      transparent: true,
      opacity: ATMOSPHERE_OPACITY,
      blending: AdditiveBlending,
      side: BackSide,
      depthWrite: false,
    });
    this.atmosphereMesh = new Mesh(atmosphereGeometry, this.atmosphereMaterial);
    this.group.add(this.atmosphereMesh);

    // --- Load continent texture (gracefully handle missing file) ---
    this.loadContinentTexture();
  }

  // -------------------------------------------------------------------------
  // Texture loading
  // -------------------------------------------------------------------------

  private loadContinentTexture(): void {
    const loader = new TextureLoader();
    loader.load(
      CONTINENT_TEXTURE_PATH,
      (texture: Texture) => {
        this.continentTexture = texture;
        this.globeMaterial.uniforms.uContinentTexture.value = texture;
        this.globeMaterial.uniforms.uHasContinentTexture.value = 1.0;
        this.globeMaterial.needsUpdate = true;
      },
      undefined,
      () => {
        // Texture not found — continue without it (graceful degradation)
        this.continentTexture = null;
      },
    );
  }

  // -------------------------------------------------------------------------
  // Public update method — called every frame from the animation loop
  // -------------------------------------------------------------------------

  /**
   * Update the globe state for the current frame.
   *
   * @param displayedTime - The current Displayed Time (real time + scrub offset)
   * @param deltaTime - Time elapsed since last frame in seconds
   * @param scrubOffset - The current scrub offset in minutes (0 = live)
   */
  /**
   * @param liveSpinEnabled - When false and scrub is live, globe rotation does not advance (reduced motion / settings).
   */
  public update(
    displayedTime: Date,
    deltaTime: number,
    scrubOffset: number,
    liveSpinEnabled: boolean = true,
  ): void {
    this.updateRotation(displayedTime, deltaTime, scrubOffset, liveSpinEnabled);
    this.updateTerminator(displayedTime);
    this.updateHemisphereTint(displayedTime, deltaTime);
  }

  // -------------------------------------------------------------------------
  // Rotation
  // -------------------------------------------------------------------------

  /**
   * Globe rotation:
   * - When live (scrubOffset === 0): rotate continuously at 1 rev / 24 real seconds
   * - When scrubbed (scrubOffset !== 0): hold position corresponding to Displayed Time
   */
  private updateRotation(
    displayedTime: Date,
    deltaTime: number,
    scrubOffset: number,
    liveSpinEnabled: boolean,
  ): void {
    if (scrubOffset === 0 && liveSpinEnabled) {
      // Live mode: continuous rotation
      this.cumulativeRotation += ROTATION_SPEED * deltaTime;
      // Keep within 0..2π to avoid floating point drift
      this.cumulativeRotation %= 2 * Math.PI;
      this.group.rotation.y = this.cumulativeRotation;
    } else if (scrubOffset === 0 && !liveSpinEnabled) {
      // Live but spin disabled — hold current rotation (no delta applied)
      this.group.rotation.y = this.cumulativeRotation % (2 * Math.PI);
    } else {
      // Scrubbed mode: rotation corresponds to Displayed Time
      // Map the displayed time's fractional day to a rotation angle
      const hours = displayedTime.getUTCHours();
      const minutes = displayedTime.getUTCMinutes();
      const seconds = displayedTime.getUTCSeconds();
      const fractionOfDay =
        (hours * 3600 + minutes * 60 + seconds) / 86400;
      this.group.rotation.y = fractionOfDay * 2 * Math.PI;
      // Sync cumulative rotation so transition back to live is smooth
      this.cumulativeRotation = this.group.rotation.y;
    }
  }

  // -------------------------------------------------------------------------
  // Terminator (sun direction)
  // -------------------------------------------------------------------------

  /**
   * Compute the sun direction from the Displayed Time.
   * The sun direction determines the terminator position on the globe.
   *
   * We approximate the sun's position based on UTC hour:
   * - At UTC noon (12:00), the sun is directly overhead at the prime meridian
   * - The sun moves westward (negative X in our coordinate system) as time advances
   */
  private updateTerminator(displayedTime: Date): void {
    const hours = displayedTime.getUTCHours();
    const minutes = displayedTime.getUTCMinutes();
    const seconds = displayedTime.getUTCSeconds();
    const fractionOfDay = (hours * 3600 + minutes * 60 + seconds) / 86400;

    // Sun angle: at UTC noon the sun is at angle 0 (pointing toward +Z in our setup),
    // rotating through 2π over 24 hours
    const sunAngle = (fractionOfDay - 0.5) * 2 * Math.PI;

    // Sun direction in world space (simplified — no seasonal tilt)
    const sunX = Math.sin(sunAngle);
    const sunY = 0.3; // Slight elevation to avoid perfectly equatorial lighting
    const sunZ = Math.cos(sunAngle);

    // Normalize
    const len = Math.sqrt(sunX * sunX + sunY * sunY + sunZ * sunZ);
    this.globeMaterial.uniforms.uSunDirection.value = {
      x: sunX / len,
      y: sunY / len,
      z: sunZ / len,
    };
  }

  // -------------------------------------------------------------------------
  // Hemisphere tint with hour-boundary crossfade
  // -------------------------------------------------------------------------

  /**
   * Update the lit-hemisphere tint color based on the current hour.
   * When the hour changes, crossfade over 200ms.
   */
  private updateHemisphereTint(displayedTime: Date, deltaTime: number): void {
    // Use UTC hour for the globe's tint (the globe represents the whole Earth)
    const hour = displayedTime.getUTCHours();

    if (hour !== this.currentHour) {
      // Hour boundary crossed — start crossfade
      this.currentHour = hour;
      const paletteEntry = get24StatePaletteForHour(hour);
      this.startLitColor.copy(this.currentLitColor);
      this.targetLitColor.set(paletteEntry.bg);
      this.crossfadeProgress = 0;
    }

    // Advance crossfade
    if (this.crossfadeProgress < 1) {
      this.crossfadeProgress += (deltaTime * 1000) / CROSSFADE_DURATION_MS;
      if (this.crossfadeProgress >= 1) {
        this.crossfadeProgress = 1;
        this.currentLitColor.copy(this.targetLitColor);
      } else {
        // Linear interpolation from start color to target color
        this.currentLitColor.copy(this.startLitColor).lerp(
          this.targetLitColor,
          this.crossfadeProgress,
        );
      }

      // Update shader uniform
      this.globeMaterial.uniforms.uLitColor.value.copy(this.currentLitColor);

      // Update atmosphere color to match lit hemisphere
      this.atmosphereMaterial.color.copy(this.currentLitColor);
    }
  }

  // -------------------------------------------------------------------------
  // Cleanup
  // -------------------------------------------------------------------------

  /**
   * Dispose of all Three.js resources. Call when removing the globe from the scene.
   */
  public dispose(): void {
    this.globeMesh.geometry.dispose();
    this.globeMaterial.dispose();
    this.atmosphereMesh.geometry.dispose();
    this.atmosphereMaterial.dispose();
    if (this.continentTexture) {
      this.continentTexture.dispose();
    }
  }
}
