/**
 * Tree-shaken Three.js imports for Horizon.
 *
 * All Horizon components MUST import Three.js classes from this file
 * instead of importing directly from 'three'. This ensures only the
 * modules listed here are included in the client bundle, keeping us
 * within the 180 KB gzip budget (Requirement 21.7 / NFR 7.1).
 *
 * To add a new Three.js class, add it to the import and re-export below.
 */

// --- Core ---
export { WebGLRenderer } from 'three';
export { Scene } from 'three';
export { PerspectiveCamera } from 'three';
export { Group } from 'three';
export { Mesh } from 'three';
export { Sprite } from 'three';

// --- Geometries ---
export { IcosahedronGeometry } from 'three';
export { SphereGeometry } from 'three';
export { TubeGeometry } from 'three';
export { RingGeometry } from 'three';

// --- Materials ---
export { MeshPhongMaterial } from 'three';
export { MeshPhysicalMaterial } from 'three';
export { MeshBasicMaterial } from 'three';
export { ShaderMaterial } from 'three';
export { SpriteMaterial } from 'three';

// --- Curves ---
export { CatmullRomCurve3 } from 'three';
export { EllipseCurve } from 'three';

// --- Line primitives (Observatory wireframe globe) ---
export { Line } from 'three';
export { LineBasicMaterial } from 'three';
export { BufferGeometry } from 'three';

// --- Lights ---
export { AmbientLight } from 'three';
export { DirectionalLight } from 'three';

// --- Loaders ---
export { TextureLoader } from 'three';
export { CanvasTexture } from 'three';

// --- Math ---
export { Vector3 } from 'three';
export { Color } from 'three';

// --- Constants ---
export { BackSide, FrontSide, AdditiveBlending, NormalBlending, DoubleSide } from 'three';

// --- Additional types re-exported for convenience ---
export type { WebGLRendererParameters } from 'three';
export type { Texture } from 'three';
