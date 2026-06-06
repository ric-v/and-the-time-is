/**
 * Shared 3D → screen projection and mobile viewport fit helpers.
 */

import { PerspectiveCamera } from './three-imports';
import { computeCameraPosition, CAMERA_DISTANCE } from './cameraSpherical';

/** PRD / UI-UX-Spec §12.2 — ring radius as a fraction of viewport width on mobile. */
export const MOBILE_RING_RADIUS_RATIO = 0.4;

/** PRD / UI-UX-Spec §12.2 — globe diameter as a fraction of viewport width on mobile. */
export const MOBILE_GLOBE_DIAMETER_RATIO = 0.28;

/** Ring radius in world units (design spec). */
export const RING_WORLD_RADIUS = 1.19;

/** Default camera FOV (degrees). */
export const SCENE_CAMERA_FOV = 35;

/** Default locked isometric elevation on mobile (radians). */
export const MOBILE_DEFAULT_ELEVATION_RAD = (12 * Math.PI) / 180;

/** Inset margin when clamping HTML orb overlays on mobile (px). */
export const MOBILE_ORB_SCREEN_INSET_PX = 24;

type CameraMatrices = {
  matrixWorldInverse: { elements: number[] };
  projectionMatrix: { elements: number[] };
};

/**
 * Project a world-space point to canvas pixel coordinates.
 * Equivalent to Three.js Vector3.project(camera).
 */
export function projectWorldToScreen(
  worldX: number,
  worldY: number,
  worldZ: number,
  camera: CameraMatrices,
  canvasWidth: number,
  canvasHeight: number,
): { x: number; y: number } {
  const mvi = camera.matrixWorldInverse.elements;
  const pm = camera.projectionMatrix.elements;

  const vx = mvi[0] * worldX + mvi[4] * worldY + mvi[8] * worldZ + mvi[12];
  const vy = mvi[1] * worldX + mvi[5] * worldY + mvi[9] * worldZ + mvi[13];
  const vz = mvi[2] * worldX + mvi[6] * worldY + mvi[10] * worldZ + mvi[14];
  const vw = mvi[3] * worldX + mvi[7] * worldY + mvi[11] * worldZ + mvi[15];

  const px = pm[0] * vx + pm[4] * vy + pm[8] * vz + pm[12] * vw;
  const py = pm[1] * vx + pm[5] * vy + pm[9] * vz + pm[13] * vw;
  const pw = pm[3] * vx + pm[7] * vy + pm[11] * vz + pm[15] * vw;

  const ndcX = px / pw;
  const ndcY = py / pw;

  return {
    x: (ndcX * 0.5 + 0.5) * canvasWidth,
    y: (-ndcY * 0.5 + 0.5) * canvasHeight,
  };
}

function measureRingRadiusPx(
  camera: PerspectiveCamera,
  canvasWidth: number,
  canvasHeight: number,
  worldX: number,
  worldY: number,
): number {
  const center = projectWorldToScreen(0, 0, 0, camera, canvasWidth, canvasHeight);
  const edge = projectWorldToScreen(worldX, worldY, 0, camera, canvasWidth, canvasHeight);
  const dx = edge.x - center.x;
  const dy = edge.y - center.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Compute camera distance so the ring fits within PRD mobile targets.
 * Uses the tighter of horizontal (width × ratio) and vertical constraints.
 */
export function fitCameraDistanceForMobile(
  canvasWidth: number,
  canvasHeight: number,
  ringRadiusRatio = MOBILE_RING_RADIUS_RATIO,
): number {
  if (canvasWidth <= 0 || canvasHeight <= 0) return CAMERA_DISTANCE;

  const camera = new PerspectiveCamera(
    SCENE_CAMERA_FOV,
    canvasWidth / canvasHeight,
    0.1,
    100,
  );

  const targetHorizPx = canvasWidth * ringRadiusRatio * 0.94;
  const targetVertPx = canvasHeight * ringRadiusRatio * 0.88;

  const distanceForTarget = (targetPx: number, worldX: number, worldY: number): number => {
    let lo = CAMERA_DISTANCE;
    let hi = CAMERA_DISTANCE * 3.5;

    for (let i = 0; i < 28; i++) {
      const mid = (lo + hi) / 2;
      const pos = computeCameraPosition(0, MOBILE_DEFAULT_ELEVATION_RAD, mid);
      camera.position.set(pos.x, pos.y, pos.z);
      camera.lookAt(0, 0, 0);
      camera.updateMatrixWorld(true);

      const radiusPx = measureRingRadiusPx(camera, canvasWidth, canvasHeight, worldX, worldY);
      if (radiusPx > targetPx) {
        lo = mid;
      } else {
        hi = mid;
      }
    }

    return hi;
  };

  const distHoriz = distanceForTarget(targetHorizPx, RING_WORLD_RADIUS, 0);
  const distVert = distanceForTarget(targetVertPx, 0, RING_WORLD_RADIUS);

  return Math.max(distHoriz, distVert);
}

/** Clamp projected orb center so HTML discs stay inside the scene on narrow viewports. */
export function clampOrbScreenPosition(
  x: number,
  y: number,
  canvasWidth: number,
  canvasHeight: number,
  inset = MOBILE_ORB_SCREEN_INSET_PX,
): { x: number; y: number } {
  if (canvasWidth <= 0 || canvasHeight <= 0) return { x, y };

  const insetX = Math.max(inset, canvasWidth * 0.05);
  const insetY = Math.max(inset, canvasHeight * 0.04);

  return {
    x: Math.max(insetX, Math.min(canvasWidth - insetX, x)),
    y: Math.max(insetY, Math.min(canvasHeight - insetY, y)),
  };
}
