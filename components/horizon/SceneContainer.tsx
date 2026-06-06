import React, {
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
  useMemo,
  useState,
} from 'react';
import {
  WebGLRenderer,
  PerspectiveCamera,
  Scene,
  Color,
} from '../../utils/three-imports';
import { useAppSelector, useAppDispatch } from '../../store/store';
import { store } from '../../store/store';
import { setExpandedOrb } from '../../store/sessionSlice';
import SimpleObservationList from './SimpleObservationList';
import { removeOrb } from '../../store/orbSlice';
import OrbButton from './OrbButton';
import OrbLabel from './OrbLabel';
import { WireframeGlobe } from './WireframeGlobe';
import { HorizonRing } from './HorizonRing';
import { SceneLighting } from './SceneLighting';
import { ZoneOrb } from './ZoneOrb';
import { useSceneOrchestrator, type SceneRenderers } from '../../hooks/useSceneOrchestrator';
import { useCameraOrbit } from '../../hooks/useCameraOrbit';
import { computeCameraPosition } from '../../utils/cameraSpherical';

/** Camera field of view in degrees (tight, reduces ring distortion). */
const CAMERA_FOV = 35;
const CAMERA_NEAR = 0.1;
const CAMERA_FAR = 100;

const GLOBE_DIAMETER_RATIO = 0.18;
const RING_RADIUS_RATIO = 0.34;

/** Globe radius in world units (design spec: 0.63). */
export const GLOBE_RADIUS = 0.63;
/** Ring radius in world units (design spec: 1.19). */
export const RING_RADIUS = 1.19;

export interface SceneRefs {
  scene: Scene;
  camera: PerspectiveCamera;
  renderer: WebGLRenderer;
}

/**
 * SceneContainer — WebGL scene, orchestrator-driven globe / ring / orbs,
 * hold-to-orbit camera on the canvas, and projected orb overlay buttons.
 *
 * Requirements: 1.x, 5.3, 17.1 (camera orbit), 18.x, 19.1
 */
const SceneContainer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<WebGLRenderer | null>(null);
  const cameraRef = useRef<PerspectiveCamera | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const renderersRef = useRef<SceneRenderers>({
    globe: null,
    horizonRing: null,
    sceneLighting: null,
    zoneOrbs: new Map(),
  });

  const isRunningRef = useRef(false);
  const rafIdRef = useRef<number>(0);
  const lastAnimTimeRef = useRef<number>(performance.now());

  const dispatch = useAppDispatch();
  const orbs = useAppSelector((s) => s.orbs.list);
  const horizonViewMode = useAppSelector((s) => s.session.horizonViewMode);
  const themeMode = useAppSelector((s) => s.settings.themeMode);

  const { orbLabelData, updateScene, clusterHover } = useSceneOrchestrator();

  /** Forces React overlay reprojection every animation frame (camera orbit / drift). */
  const [, setOverlayTick] = useState(0);

  useCameraOrbit(canvasRef, cameraRef);

  const plateData = useMemo(() => {
    return orbs
      .map((o) => orbLabelData.get(o.id))
      .filter((d): d is NonNullable<typeof d> => !!d)
      .sort((a, b) => a.ringAngleDeg - b.ringAngleDeg);
  }, [orbs, orbLabelData]);

  const handleOrbActivate = useCallback(
    (orbId: string) => {
      dispatch(setExpandedOrb(orbId));
    },
    [dispatch],
  );

  const handleOrbRemove = useCallback(
    (orbId: string) => {
      dispatch(removeOrb(orbId));
    },
    [dispatch],
  );

  const handleOrbArrowNav = useCallback(
    (orbId: string, direction: -1 | 1) => {
      const visibleOrbs = plateData.filter((o) => o.visible);
      const currentIndex = visibleOrbs.findIndex((o) => o.orbId === orbId);
      if (currentIndex === -1 || visibleOrbs.length === 0) return;

      const nextIndex =
        (currentIndex + direction + visibleOrbs.length) % visibleOrbs.length;
      const nextOrbId = visibleOrbs[nextIndex].orbId;

      const nextButton = document.querySelector(
        `[data-orb-button="${nextOrbId}"]`,
      ) as HTMLButtonElement | null;
      nextButton?.focus();
    },
    [plateData],
  );

  const handleResize = useCallback((width: number, height: number) => {
    const renderer = rendererRef.current;
    const camera = cameraRef.current;
    if (!renderer || !camera) return;

    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }, []);

  const updateSceneRef = useRef(updateScene);
  updateSceneRef.current = updateScene;

  const animate = useCallback(() => {
    if (!isRunningRef.current) return;

    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    if (!renderer || !scene || !camera) return;

    const now = performance.now();
    const deltaTime = Math.min((now - lastAnimTimeRef.current) / 1000, 0.1);
    lastAnimTimeRef.current = now;

    const w = renderer.domElement.width;
    const h = renderer.domElement.height;

    camera.updateMatrixWorld(true);
    updateSceneRef.current(deltaTime, renderersRef.current, w, h, camera);

    renderer.render(scene, camera);

    if (store.getState().session.horizonViewMode === 'full') {
      setOverlayTick((t) => (t + 1) % 1_000_000);
    }

    rafIdRef.current = requestAnimationFrame(animate);
  }, []);

  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === 'visible') {
      if (!isRunningRef.current) {
        isRunningRef.current = true;
        lastAnimTimeRef.current = performance.now();
        rafIdRef.current = requestAnimationFrame(animate);
      }
    } else {
      isRunningRef.current = false;
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = 0;
      }
    }
  }, [animate]);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const renderer = new WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'default',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(new Color(0x000000), 0);
    rendererRef.current = renderer;

    const { width, height } = container.getBoundingClientRect();
    const camera = new PerspectiveCamera(
      CAMERA_FOV,
      width / height || 1,
      CAMERA_NEAR,
      CAMERA_FAR,
    );
    const { azimuth, elevation } = store.getState().settings.cameraAngle;
    const pos = computeCameraPosition(
      (azimuth * Math.PI) / 180,
      (elevation * Math.PI) / 180,
    );
    camera.position.set(pos.x, pos.y, pos.z);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const scene = new Scene();
    sceneRef.current = scene;

    const globe = new WireframeGlobe();
    globe.setTheme(themeMode);
    const horizonRing = new HorizonRing();
    const sceneLighting = new SceneLighting();
    scene.add(sceneLighting.group);
    scene.add(globe.group);
    scene.add(horizonRing.group);

    const zoneOrbs = new Map<string, ZoneOrb>();
    renderersRef.current = {
      globe,
      horizonRing,
      sceneLighting,
      zoneOrbs,
    };

    handleResize(width, height);

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0) {
          handleResize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    isRunningRef.current = true;
    lastAnimTimeRef.current = performance.now();
    rafIdRef.current = requestAnimationFrame(animate);

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isRunningRef.current = false;
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      resizeObserver.disconnect();

      for (const z of zoneOrbs.values()) {
        scene.remove(z.group);
        z.dispose();
      }
      zoneOrbs.clear();

      scene.remove(globe.group);
      scene.remove(horizonRing.group);
      scene.remove(sceneLighting.group);
      globe.dispose();
      horizonRing.dispose();
      sceneLighting.dispose();

      renderer.dispose();
      rendererRef.current = null;
      cameraRef.current = null;
      sceneRef.current = null;
      renderersRef.current = {
        globe: null,
        horizonRing: null,
        sceneLighting: null,
        zoneOrbs: new Map(),
      };
    };
  }, [animate, handleResize, handleVisibilityChange, themeMode]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const map = renderersRef.current.zoneOrbs;

    for (const [id, z] of map) {
      if (!orbs.find((o) => o.id === id)) {
        scene.remove(z.group);
        z.dispose();
        map.delete(id);
      }
    }

    for (const orb of orbs) {
      if (!map.has(orb.id)) {
        const z = new ZoneOrb(orb.id, orb.isLocal);
        map.set(orb.id, z);
        scene.add(z.group);
      }
    }
  }, [orbs]);

  useEffect(() => {
    const globe = renderersRef.current.globe;
    if (!globe) return;
    globe.setTheme(themeMode);
  }, [themeMode]);

  useEffect(() => {
    if (horizonViewMode !== 'full') return;
    const container = containerRef.current;
    const renderer = rendererRef.current;
    if (!container || !renderer) return;
    const { width, height } = container.getBoundingClientRect();
    if (width > 0 && height > 0) {
      handleResize(width, height);
    }
  }, [horizonViewMode, handleResize]);

  return (
    <div
      ref={containerRef}
      role="application"
      aria-label="And the time is — world timezone globe"
      className={`horizon-scene observatory-stage${horizonViewMode === 'simple' ? ' observatory-simple-stage' : ''}`}
      onMouseMove={clusterHover.onMouseMove}
      onMouseLeave={clusterHover.onMouseLeave}
      style={{
        position: 'relative',
        width: '100%',
        flex: 1,
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      <div className="observatory-ground-rings" aria-hidden>
        <svg viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid meet" className="observatory-ground-svg">
          <g fill="none" stroke="var(--ink, #141414)" opacity={0.14} strokeWidth={0.5}>
            <circle cx={500} cy={500} r={120} />
            <circle cx={500} cy={500} r={200} strokeDasharray="2 4" />
            <circle cx={500} cy={500} r={320} />
            <circle cx={500} cy={500} r={430} strokeDasharray="2 4" />
          </g>
          <g fill="var(--ink, #141414)" opacity={0.35} fontSize={10} letterSpacing="1.2" style={{ fontFamily: 'var(--font-ibm-mono), monospace' }}>
            <text x={500} y={65} textAnchor="middle">
              00
            </text>
            <text x={940} y={505} textAnchor="middle">
              06
            </text>
            <text x={500} y={950} textAnchor="middle">
              12
            </text>
            <text x={60} y={505} textAnchor="middle">
              18
            </text>
          </g>
          <g stroke="var(--ink, #141414)" opacity={0.25} strokeWidth={0.5}>
            <line x1={500} y1={65} x2={500} y2={80} />
            <line x1={925} y1={500} x2={940} y2={500} />
            <line x1={500} y1={935} x2={500} y2={920} />
            <line x1={75} y1={500} x2={60} y2={500} />
          </g>
        </svg>
      </div>
      <div className="observatory-corner tl" aria-hidden />
      <div className="observatory-corner tr" aria-hidden />
      <div className="observatory-corner bl" aria-hidden />
      <div className="observatory-corner br" aria-hidden />

      <canvas
        ref={canvasRef}
        className="horizon-three-canvas"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'block',
          zIndex: 2,
        }}
      />

      <div
        className="orb-label-layer"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          overflow: 'hidden',
          zIndex: 6,
        }}
      >
        {horizonViewMode === 'full' &&
          plateData.map((p) => (
            <React.Fragment key={p.orbId}>
              <OrbLabel
                orbId={p.orbId}
                screenX={p.screenX}
                screenY={p.screenY}
                cityLabel={p.cityLabel}
                formattedTime={p.formattedTime}
                displayFormat={p.displayFormat}
                relativeOffset={p.relativeOffset}
                skyState={p.skyState}
                isLocal={p.isLocal}
                isAnchor={p.isAnchor}
                ringAngleDeg={p.ringAngleDeg}
                visible={p.visible}
                totalOrbs={orbs.length}
                layout="observatory"
              />
              <OrbButton
                orbId={p.orbId}
                screenX={p.screenX}
                screenY={p.screenY}
                cityLabel={p.cityLabel}
                formattedTime={p.formattedTime}
                isLocal={p.isLocal}
                visible={p.visible}
                tabIndex={0}
                onActivate={handleOrbActivate}
                onRemove={handleOrbRemove}
                onArrowNav={handleOrbArrowNav}
              />
            </React.Fragment>
          ))}
      </div>

      {horizonViewMode === 'simple' && (
        <>
          <SimpleObservationList labelByOrb={orbLabelData} />
        </>
      )}
    </div>
  );
};

export default SceneContainer;

export function computeSceneDimensions(containerWidth: number, containerHeight: number) {
  const minDim = Math.min(containerWidth, containerHeight);
  return {
    globeDiameterPx: minDim * GLOBE_DIAMETER_RATIO,
    ringRadiusPx: minDim * RING_RADIUS_RATIO,
    minDimension: minDim,
  };
}
