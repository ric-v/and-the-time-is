/**
 * Spherical camera placement for Horizon (shared by SceneContainer init and useCameraOrbit).
 */

/** Camera distance from scene center (matches SceneContainer CAMERA_POSITION.z). */
export const CAMERA_DISTANCE = 4.8;

/** Base Y offset (matches SceneContainer CAMERA_POSITION.y). */
export const BASE_Y_OFFSET = 0.25;

export interface CameraCartesian {
  x: number;
  y: number;
  z: number;
}

/**
 * @param azimuthRad - rotation around Y, 0 = default forward
 * @param elevationRad - pitch, 0 = horizon, positive = above
 */
export function computeCameraPosition(
  azimuthRad: number,
  elevationRad: number,
): CameraCartesian {
  const cosElev = Math.cos(elevationRad);
  const sinElev = Math.sin(elevationRad);
  const sinAz = Math.sin(azimuthRad);
  const cosAz = Math.cos(azimuthRad);

  return {
    x: CAMERA_DISTANCE * sinAz * cosElev,
    y: CAMERA_DISTANCE * sinElev + BASE_Y_OFFSET,
    z: CAMERA_DISTANCE * cosAz * cosElev,
  };
}
