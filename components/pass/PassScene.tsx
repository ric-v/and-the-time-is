'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useAppDispatch, useAppSelector } from '../../store/store';
import { setScrubOffset, setScrubbingInProgress } from '../../store/scrubSlice';
import { getLocalHour } from '../../utils/timeEngine';
import {
  PARALLAX_FACTORS,
  MAX_WORLD_SCROLL,
  GRIND_RADIUS,
  GOLDEN_START,
  GOLDEN_END,
  clampScrub,
  scrollFromScrub,
  scrubFromScroll,
  getLandmarkScrollX,
  getPassSkyWeights,
  countAwakeLandmarks,
} from '../../utils/passLayoutEngine';
import { hasGrindRail } from '../../utils/passLandmarkArt';
import { useDisplayedTime } from '../../hooks/useDisplayedTime';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import PassLandmark from './PassLandmark';
import PassDetailPanel from './PassDetailPanel';
import PassScrubBar from './PassScrubBar';
import PassTopBar from './PassTopBar';
import PassAtmosphere from './PassAtmosphere';
import PassEffectsCanvas from './PassEffectsCanvas';
import PassParallaxTrack from './PassParallaxTrack';
import PassDecorations from './PassDecorations';
import type { Orb } from '../../store/orbSlice';

const RIDER_SCREEN_X_RATIO = 0.5;

interface BirdState {
  x: number;
  y: number;
  lag: number;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

const MOUNTAIN_SVG = (
  <>
    <path fill="#3d3d5c" d="M0,200 L0,120 L120,60 L240,110 L380,40 L520,100 L660,55 L800,95 L960,35 L1100,90 L1240,50 L1380,105 L1520,45 L1660,100 L1800,60 L2000,110 L2000,200 Z" />
    <path fill="#1a1a2e" d="M0,200 L0,150 L200,100 L400,140 L600,90 L800,130 L1000,80 L1200,125 L1400,85 L1600,120 L1800,95 L2000,135 L2000,200 Z" opacity="0.65" />
  </>
);

const HILL_SVG = (
  <path fill="#2d2d44" d="M0,260 L0,180 L300,140 L600,190 L900,130 L1200,175 L1500,120 L1800,170 L2100,135 L2500,185 L2500,260 Z" />
);

const TREE_SVG = (
  <g fill="#1a1a2e">
    <polygon points="80,180 100,120 120,180" />
    <polygon points="200,180 225,100 250,180" />
    <polygon points="420,180 445,110 470,180" />
    <polygon points="580,180 600,130 620,180" />
    <polygon points="780,180 810,95 840,180" />
    <polygon points="950,180 970,125 990,180" />
    <polygon points="1150,180 1180,105 1210,180" />
    <polygon points="1320,180 1340,135 1360,180" />
    <polygon points="1520,180 1550,90 1580,180" />
    <polygon points="1700,180 1720,120 1740,180" />
    <polygon points="1900,180 1930,100 1960,180" />
    <polygon points="2080,180 2100,140 2120,180" />
  </g>
);

const SLOPE_SVG = (
  <>
    <path fill="#1a1a2e" d="M0,220 L0,160 Q500,140 1000,155 T2000,145 T3000,150 L3000,220 Z" />
    <path fill="#252538" d="M0,220 L0,175 Q750,160 1500,168 T3000,162 L3000,220 Z" opacity="0.55" />
  </>
);

const PassScene: React.FC = () => {
  const dispatch = useAppDispatch();
  const orbs = useAppSelector((s) => s.orbs.list);
  const scrubOffset = useAppSelector((s) => s.scrub.offset);
  const displayFormat = useAppSelector((s) => s.settings.displayFormat);
  const reducedMotion = useReducedMotion();
  const displayedTime = useDisplayedTime();

  const localIana = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    [],
  );

  const localOrb = useMemo(
    () => orbs.find((o) => o.isLocal) ?? orbs[0],
    [orbs],
  );
  const localLabel = localOrb?.label ?? 'Local';

  const sceneRef = useRef<HTMLDivElement>(null);
  const layerRefs = useRef<Record<keyof typeof PARALLAX_FACTORS, HTMLDivElement | null>>({
    mountains: null,
    mid: null,
    trees: null,
    ground: null,
  });

  const [worldScroll, setWorldScroll] = useState(() => scrollFromScrub(scrubOffset));
  const [isDragging, setIsDragging] = useState(false);
  const [selectedOrb, setSelectedOrb] = useState<Orb | null>(null);
  const [isJumping, setIsJumping] = useState(false);
  const [riderClass, setRiderClass] = useState('');
  const [showPassFlash, setShowPassFlash] = useState(false);
  const [jumpChain, setJumpChain] = useState(0);
  const [rideVelocity, setRideVelocity] = useState(0);
  const [ridePhase, setRidePhase] = useState(0);
  const [birds, setBirds] = useState<BirdState[]>([
    { x: 580, y: 280, lag: 0.05 },
    { x: 620, y: 250, lag: 0.07 },
    { x: 560, y: 310, lag: 0.09 },
  ]);

  const dragStartX = useRef(0);
  const dragStartScroll = useRef(0);
  const lastPointerX = useRef(0);
  const jumpChainTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const velocityDecayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const skyWeights = useMemo(
    () => getPassSkyWeights(getLocalHour(localIana, displayedTime)),
    [localIana, displayedTime],
  );

  const sunOpacity = Math.min(1, skyWeights.day + skyWeights.dawn * 0.45 + skyWeights.dusk * 0.25);
  const moonOpacity = Math.min(1, skyWeights.night + skyWeights.dusk * 0.35);
  const cloudOpacity = Math.min(1, skyWeights.day + skyWeights.dawn * 0.3);

  const landmarkPositions = useMemo(
    () =>
      orbs.map((orb, index) => ({
        orb,
        scrollX: getLandmarkScrollX(orb.ianaName, localIana, index, displayedTime),
      })),
    [orbs, localIana, displayedTime],
  );

  const awakeCount = useMemo(
    () => countAwakeLandmarks(orbs, displayedTime),
    [orbs, displayedTime],
  );

  const localHour = getLocalHour(localIana, displayedTime);
  const inGolden = localHour >= GOLDEN_START && localHour < GOLDEN_END;
  const showCombo = inGolden && jumpChain >= 2;
  const isRiding = isDragging || Math.abs(rideVelocity) > 1;

  const applyParallax = useCallback(
    (scroll: number) => {
      (Object.keys(PARALLAX_FACTORS) as Array<keyof typeof PARALLAX_FACTORS>).forEach((key) => {
        const el = layerRefs.current[key];
        if (!el) return;
        const factor = PARALLAX_FACTORS[key];
        const offset = reducedMotion ? -scrubOffset * 2 : -scroll * factor;
        const zDepth = key === 'mountains' ? -180 : key === 'mid' ? -60 : key === 'trees' ? 20 : 60;
        el.style.transform = `translate3d(${offset}px, 0, ${zDepth}px)`;
      });
    },
    [reducedMotion, scrubOffset],
  );

  const setScrub = useCallback(
    (min: number, fromScroll: boolean) => {
      const clamped = clampScrub(min);
      dispatch(setScrubOffset(clamped));
      if (!fromScroll) {
        setWorldScroll(scrollFromScrub(clamped));
      }
    },
    [dispatch],
  );

  useEffect(() => {
    if (!isDragging) {
      setWorldScroll(scrollFromScrub(scrubOffset));
    }
  }, [scrubOffset, isDragging]);

  useEffect(() => {
    applyParallax(worldScroll);
  }, [worldScroll, applyParallax]);

  const nearGrindRail = useCallback((): boolean => {
    const scene = sceneRef.current;
    if (!scene) return false;
    const riderScreenX = scene.clientWidth * RIDER_SCREEN_X_RATIO;
    return landmarkPositions.some(({ orb, scrollX }) => {
      if (!hasGrindRail(orb.ianaName)) return false;
      const landmarkScreen = scrollX - worldScroll * PARALLAX_FACTORS.mid;
      return Math.abs(landmarkScreen - riderScreenX) < GRIND_RADIUS;
    });
  }, [landmarkPositions, worldScroll]);

  const doJump = useCallback(() => {
    if (isJumping) return;
    setIsJumping(true);
    setRiderClass('jumping');

    const grind = nearGrindRail();
    if (grind) {
      window.setTimeout(() => {
        setRiderClass('grinding');
        setShowPassFlash(false);
        requestAnimationFrame(() => setShowPassFlash(true));
      }, 280);
    }

    setJumpChain((c) => c + 1);
    if (jumpChainTimer.current) clearTimeout(jumpChainTimer.current);
    jumpChainTimer.current = setTimeout(() => setJumpChain(0), 2000);

    window.setTimeout(() => {
      setRiderClass('');
      setIsJumping(false);
    }, grind ? 800 : 650);
  }, [isJumping, nearGrindRail]);

  const bumpVelocity = useCallback((dx: number) => {
    setRideVelocity((v) => Math.max(-24, Math.min(24, v + dx * 0.15)));
    if (velocityDecayTimer.current) clearTimeout(velocityDecayTimer.current);
    velocityDecayTimer.current = setTimeout(() => setRideVelocity(0), 180);
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.closest('.pass-scrub-bar, .pass-detail-panel, .pass-landmark, .pass-top-actions, .pass-brand')
      ) {
        return;
      }
      setIsDragging(true);
      dragStartX.current = e.clientX;
      lastPointerX.current = e.clientX;
      dragStartScroll.current = worldScroll;
      sceneRef.current?.classList.add('dragging');
      sceneRef.current?.setPointerCapture(e.pointerId);
      dispatch(setScrubbingInProgress(true));
    },
    [worldScroll, dispatch],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartX.current;
      const frameDx = e.clientX - lastPointerX.current;
      lastPointerX.current = e.clientX;
      bumpVelocity(-frameDx);
      const nextScroll = Math.max(0, Math.min(MAX_WORLD_SCROLL, dragStartScroll.current - dx));
      setWorldScroll(nextScroll);
      applyParallax(nextScroll);
      setScrub(scrubFromScroll(nextScroll), true);
    },
    [isDragging, applyParallax, setScrub, bumpVelocity],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      setIsDragging(false);
      sceneRef.current?.classList.remove('dragging');
      try {
        sceneRef.current?.releasePointerCapture(e.pointerId);
      } catch {
        /* pointer already released */
      }
      dispatch(setScrubbingInProgress(false));
    },
    [isDragging, dispatch],
  );

  const handleSceneClick = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.closest('.pass-landmark, .pass-scrub-bar, .pass-detail-panel, .pass-top-actions, .pass-brand')
      ) {
        return;
      }
      doJump();
    },
    [doJump],
  );

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        doJump();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        bumpVelocity(-8);
        setScrub(scrubOffset - 15, false);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        bumpVelocity(8);
        setScrub(scrubOffset + 15, false);
      } else if (e.code === 'Escape') {
        setSelectedOrb(null);
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [doJump, setScrub, scrubOffset, bumpVelocity]);

  /* ── Ride bob + birds ── */
  useEffect(() => {
    if (reducedMotion) return;
    let frame: number;
    const animate = (t: number) => {
      setRidePhase(t / 1000);
      const scene = sceneRef.current;
      if (scene) {
        const riderScreenX = scene.clientWidth * RIDER_SCREEN_X_RATIO;
        const riderScreenY = scene.clientHeight * 0.62;
        setBirds((prev) =>
          prev.map((b, i) => ({
            ...b,
            x: lerp(b.x, riderScreenX - 70 - i * 38, b.lag),
            y: lerp(
              b.y,
              riderScreenY - 200 - i * 28 + Math.sin(t / 400 + i * 1.2) * 10,
              b.lag,
            ),
          })),
        );
      }
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [reducedMotion]);

  const riderBob = reducedMotion ? 0 : Math.sin(ridePhase * 4) * (isRiding ? 2 : 4);
  const riderLean = reducedMotion ? 0 : Math.max(-14, Math.min(14, rideVelocity * 0.6));

  return (
    <div
      ref={sceneRef}
      className={`pass-scene${isRiding ? ' is-riding' : ''}`}
      role="application"
      aria-label="The Pass — timezone ride through the day"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onClick={handleSceneClick}
    >
      <div className="pass-scene-viewport">
        {/* Sky */}
        <div className="pass-sky pass-sky-dawn" style={{ opacity: skyWeights.dawn }} aria-hidden />
        <div className="pass-sky pass-sky-day" style={{ opacity: skyWeights.day }} aria-hidden />
        <div className="pass-sky pass-sky-dusk" style={{ opacity: skyWeights.dusk }} aria-hidden />
        <div className="pass-sky pass-sky-night" style={{ opacity: skyWeights.night }} aria-hidden />

        <PassAtmosphere
          sunOpacity={sunOpacity}
          moonOpacity={moonOpacity}
          cloudOpacity={cloudOpacity}
          scrollOffset={worldScroll}
          reducedMotion={reducedMotion}
        />

        <div className={`pass-aurora${awakeCount >= 3 ? ' on' : ''}`} aria-hidden />

        <PassEffectsCanvas
          skyWeights={skyWeights}
          rideVelocity={rideVelocity}
          reducedMotion={reducedMotion}
        />

        {/* Far mountains */}
        <div
          className="pass-layer pass-layer-mountains"
          ref={(el) => { layerRefs.current.mountains = el; }}
        >
          <PassParallaxTrack
            className="pass-track-inner"
            stripClassName="pass-mountain-strip"
            stripWidth={2000}
            tileCount={5}
          >
            <svg viewBox="0 0 2000 200" preserveAspectRatio="none" aria-hidden>
              {MOUNTAIN_SVG}
            </svg>
          </PassParallaxTrack>
        </div>

        {/* Mid hills */}
        <div
          className="pass-layer pass-layer-mid"
          ref={(el) => { layerRefs.current.mid = el; }}
        >
          <PassParallaxTrack
            className="pass-track-inner"
            stripClassName="pass-hill-strip"
            stripWidth={2500}
            tileCount={4}
          >
            <svg viewBox="0 0 2500 260" preserveAspectRatio="none" aria-hidden>
              {HILL_SVG}
            </svg>
          </PassParallaxTrack>
        </div>

        {/* Near trees + decor */}
        <div
          className="pass-layer pass-layer-trees"
          ref={(el) => { layerRefs.current.trees = el; }}
        >
          <PassParallaxTrack
            className="pass-track-inner"
            stripClassName="pass-tree-strip"
            stripWidth={2250}
            tileCount={4}
          >
            <svg viewBox="0 0 2250 180" preserveAspectRatio="none" aria-hidden>
              {TREE_SVG}
            </svg>
          </PassParallaxTrack>
          <PassDecorations layer="trees" />
        </div>

        {/* Ground + slope + landmarks + decor */}
        <div
          className="pass-layer pass-layer-ground"
          ref={(el) => { layerRefs.current.ground = el; }}
        >
          <PassParallaxTrack
            className="pass-track-inner"
            stripClassName="pass-slope-strip"
            stripWidth={3000}
            tileCount={4}
          >
            <svg viewBox="0 0 3000 220" preserveAspectRatio="none" aria-hidden>
              {SLOPE_SVG}
            </svg>
          </PassParallaxTrack>
          <PassDecorations layer="ground" />
          <div className="pass-landmarks-container">
            {landmarkPositions.map(({ orb, scrollX }) => (
              <PassLandmark
                key={orb.id}
                orb={orb}
                scrollX={scrollX}
                displayedTime={displayedTime}
                displayFormat={displayFormat}
                onSelect={setSelectedOrb}
              />
            ))}
          </div>
        </div>

        {/* Rider */}
        <div className="pass-rider-wrap">
          <div className="pass-rider-shadow" aria-hidden />
          <div
            className={`pass-rider${riderClass ? ` ${riderClass}` : ''}${isRiding ? ' riding' : ''}`}
            style={{
              transform: `translate3d(0, ${riderBob}px, 80px) rotate(${riderLean}deg)`,
            }}
            aria-hidden
          >
            <svg viewBox="0 0 48 56" aria-hidden>
              <ellipse cx="24" cy="8" rx="7" ry="8" fill="#1a1a2e" />
              <path fill="#2d2d44" d="M16,16 Q24,14 32,16 L34,28 L30,32 L18,32 L14,28 Z" />
              <path fill="#1a1a2e" d="M8,32 L40,34 L42,38 L6,36 Z" />
              <rect x="10" y="36" width="6" height="14" rx="2" fill="#2d2d44" />
              <rect x="32" y="36" width="6" height="14" rx="2" fill="#2d2d44" />
              <path fill="#1a1a2e" d="M4,38 Q24,42 44,38 L46,42 Q24,48 2,42 Z" />
            </svg>
          </div>
        </div>

        {/* Birds */}
        {birds.map((bird, i) => (
          <div
            key={i}
            className="pass-bird"
            style={{ transform: `translate3d(${bird.x}px, ${bird.y}px, 100px)` }}
            aria-hidden
          >
            <svg viewBox="0 0 28 16">
              <path
                fill={i === 2 ? '#1a1a2e' : '#2d2d44'}
                d="M2,8 Q7,2 14,8 Q21,2 26,8 Q21,10 14,8 Q7,10 2,8 Z"
              />
            </svg>
          </div>
        ))}
      </div>

      <div className={`pass-flash${showPassFlash ? ' show' : ''}`} aria-live="polite">
        PASS
      </div>

      <div className={`pass-combo-badge${showCombo ? ' on' : ''}`} aria-live="polite">
        {showCombo ? `×${Math.min(jumpChain, 3)}` : ''}
      </div>

      <PassTopBar />
      <PassScrubBar localIana={localIana} localLabel={localLabel} />
      <PassDetailPanel
        orb={selectedOrb}
        displayedTime={displayedTime}
        displayFormat={displayFormat}
        onClose={() => setSelectedOrb(null)}
      />
    </div>
  );
};

export default PassScene;
