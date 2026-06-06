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
import { setDateJumpOpen } from '../../store/sessionSlice';
import { formatTime } from '../../utils/timeEngine';
import type { DisplayFormat } from '../../store/settingsSlice';
import TimeDisplay from './TimeDisplay';
import { useDisplayedTime } from '../../hooks/useDisplayedTime';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Total scrub range in minutes (±24 h) */
const MAX_OFFSET = 1440; // 24 * 60
const MIN_OFFSET = -1440;

/** Minutes per 15-min tick */
const SNAP_INTERVAL = 15;

/** Pixels within which we snap to a 15-min tick on release */
const SNAP_THRESHOLD_PX = 3;

/** Duration of snap animation in ms */
const SNAP_DURATION = 100;

/** Duration of "return to now" animation in ms */
const NOW_RETURN_DURATION = 400;

/** Minutes per mouse-wheel detent */
const WHEEL_STEP = 15;

/** Major tick positions in hours relative to now */
const MAJOR_TICK_HOURS = [-24, -18, -12, -6, 6, 12, 18, 24];

/** Labels for major ticks */
const MAJOR_TICK_LABELS: Record<number, string> = {
  [-24]: '-24h',
  [-18]: '-18h',
  [-12]: '-12h',
  [-6]: '-6h',
  6: '+6h',
  12: '+12h',
  18: '+18h',
  24: '+24h',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convert a minute offset to a fraction [0, 1] along the track */
function offsetToFraction(offset: number): number {
  return (offset - MIN_OFFSET) / (MAX_OFFSET - MIN_OFFSET);
}

/** Convert a fraction [0, 1] to a minute offset */
function fractionToOffset(fraction: number): number {
  return MIN_OFFSET + fraction * (MAX_OFFSET - MIN_OFFSET);
}

/** Clamp a value between min and max */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Find the nearest 15-min tick offset for a given offset */
function nearestSnapOffset(offset: number): number {
  return Math.round(offset / SNAP_INTERVAL) * SNAP_INTERVAL;
}

/** Format the aria-valuetext for the slider */
function formatAriaValueText(offset: number): string {
  if (offset === 0) return 'Now';
  const absMinutes = Math.abs(offset);
  const hours = Math.floor(absMinutes / 60);
  const minutes = absMinutes % 60;
  const direction = offset > 0 ? 'ahead of now' : 'behind now';
  if (hours === 0) return `${minutes} minutes ${direction}`;
  if (minutes === 0) return `${hours} hour${hours !== 1 ? 's' : ''} ${direction}`;
  return `${hours} hour${hours !== 1 ? 's' : ''} and ${minutes} minute${minutes !== 1 ? 's' : ''} ${direction}`;
}

/** Easing function: cubic ease-out */
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

const pad2 = (n: number) => String(n).padStart(2, '0');

function formatLongScrubDateLine(
  displayedTime: Date,
  localIana: string,
  cityLabel: string,
): string {
  try {
    const line = new Intl.DateTimeFormat('en-GB', {
      timeZone: localIana,
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(displayedTime);
    return cityLabel ? `${line} · ${cityLabel}` : line;
  } catch {
    return displayedTime.toDateString();
  }
}

function scrubStatusFromOffset(offset: number): { paused: boolean; label: string } {
  if (offset === 0) {
    return { paused: false, label: 'Live' };
  }
  const sign = offset > 0 ? 'Forward ' : 'Reverse ';
  const h2 = Math.floor(Math.abs(offset) / 60);
  const m2 = Math.abs(offset) % 60;
  return {
    paused: true,
    label: `${sign}${h2}H${m2 ? ` ${pad2(m2)}M` : ''} · Offset`,
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function isClockOnlyDisplayFormat(fmt: DisplayFormat): boolean {
  return fmt === '24h' || fmt === '12h';
}

export default function ScrubControl() {
  const dispatch = useAppDispatch();
  const offset = useAppSelector((s) => s.scrub.offset);
  const displayFormat = useAppSelector((s) => s.settings.displayFormat);
  const orbs = useAppSelector((s) => s.orbs.list);

  const trackRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  // Far-range state: offset is outside ±24h (set via Date Jump)
  const isFarRange = offset > MAX_OFFSET || offset < MIN_OFFSET;

  const displayedTime = useDisplayedTime();

  /** Live readout uses Date.now(); SSR and hydration can be seconds apart — defer until mounted. */
  const [timeReadoutMounted, setTimeReadoutMounted] = useState(false);
  useEffect(() => {
    setTimeReadoutMounted(true);
  }, []);
  const localIana = useMemo(() => {
    const localOrb = orbs.find((o) => o.isLocal);
    return localOrb?.ianaName ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC';
  }, [orbs]);

  const localCityLabel = useMemo(() => {
    const localOrb = orbs.find((o) => o.isLocal);
    if (localOrb) return localOrb.label;
    try {
      const iana = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const parts = iana.split('/');
      return parts[parts.length - 1].replace(/_/g, ' ');
    } catch {
      return '';
    }
  }, [orbs]);

  const formattedTime = useMemo(
    () => formatTime(localIana, displayedTime, displayFormat),
    [localIana, displayedTime, displayFormat],
  );

  const clockOnlyReadout = isClockOnlyDisplayFormat(displayFormat);

  const scrubDateLine = useMemo(
    () => formatLongScrubDateLine(displayedTime, localIana, localCityLabel),
    [displayedTime, localIana, localCityLabel],
  );

  const tooltipTime = useMemo(
    () => formatTime(localIana, displayedTime, '24h').slice(0, 5),
    [localIana, displayedTime],
  );

  const scrubStatus = useMemo(() => scrubStatusFromOffset(offset), [offset]);

  const localHms = useMemo(() => {
    const dtf = new Intl.DateTimeFormat('en-GB', {
      timeZone: localIana,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    });
    const parts = dtf.formatToParts(displayedTime);
    const g = (t: Intl.DateTimeFormatPartTypes) =>
      parts.find((p) => p.type === t)?.value ?? '00';
    const hh = parseInt(g('hour'), 10);
    const mm = g('minute');
    const ss = g('second');
    if (displayFormat === '12h') {
      const ap = hh >= 12 ? 'PM' : 'AM';
      const h12 = hh % 12 || 12;
      return { main: `${h12}`, colon1: ':', m: mm, colon2: ':', s: ss, ap };
    }
    if (
      displayFormat === 'iso' ||
      displayFormat === 'unix' ||
      displayFormat === 'local' ||
      displayFormat === 'ymd24' ||
      displayFormat === 'ymd12' ||
      displayFormat === 'mdy24' ||
      displayFormat === 'mdy12' ||
      displayFormat === 'readable'
    ) {
      return { main: null as string | null, colon1: '', m: '', colon2: '', s: '', ap: '' };
    }
    return {
      main: pad2(hh),
      colon1: ':',
      m: mm,
      colon2: ':',
      s: ss,
      ap: '',
    };
  }, [localIana, displayedTime, displayFormat]);

  // Handle fraction (position on track)
  const handleFraction = useMemo(() => {
    if (isFarRange) {
      return offset > MAX_OFFSET ? 1 : 0;
    }
    return offsetToFraction(clamp(offset, MIN_OFFSET, MAX_OFFSET));
  }, [offset, isFarRange]);

  // ------------------------------------------------------------------
  // Track geometry helpers
  // ------------------------------------------------------------------

  const getTrackRect = useCallback(() => {
    return trackRef.current?.getBoundingClientRect() ?? null;
  }, []);

  const clientXToFraction = useCallback(
    (clientX: number): number => {
      const rect = getTrackRect();
      if (!rect) return 0.5;
      return clamp((clientX - rect.left) / rect.width, 0, 1);
    },
    [getTrackRect],
  );

  // ------------------------------------------------------------------
  // Snap logic
  // ------------------------------------------------------------------

  const shouldSnap = useCallback(
    (currentOffset: number): boolean => {
      const snapTarget = nearestSnapOffset(currentOffset);
      const rect = getTrackRect();
      if (!rect) return false;
      const currentPx = offsetToFraction(currentOffset) * rect.width;
      const snapPx = offsetToFraction(snapTarget) * rect.width;
      return Math.abs(currentPx - snapPx) <= SNAP_THRESHOLD_PX;
    },
    [getTrackRect],
  );

  // ------------------------------------------------------------------
  // Animated offset transitions
  // ------------------------------------------------------------------

  const animateOffset = useCallback(
    (from: number, to: number, duration: number) => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      const start = performance.now();
      const tick = (now: number) => {
        const elapsed = now - start;
        const t = Math.min(elapsed / duration, 1);
        const eased = easeOutCubic(t);
        const current = from + (to - from) * eased;
        dispatch(setScrubOffset(current));
        if (t < 1) {
          animationRef.current = requestAnimationFrame(tick);
        } else {
          animationRef.current = null;
        }
      };
      animationRef.current = requestAnimationFrame(tick);
    },
    [dispatch],
  );

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  // ------------------------------------------------------------------
  // Drag interaction
  // ------------------------------------------------------------------

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (isFarRange) return;
      e.preventDefault();
      const ruler = trackRef.current;
      if (!ruler) return;
      ruler.setPointerCapture(e.pointerId);
      setIsDragging(true);
      dispatch(setScrubbingInProgress(true));

      const frac = clientXToFraction(e.clientX);
      const newOffset = clamp(
        fractionToOffset(frac),
        MIN_OFFSET,
        MAX_OFFSET,
      );
      dispatch(setScrubOffset(newOffset));
    },
    [dispatch, clientXToFraction, isFarRange],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      const frac = clientXToFraction(e.clientX);
      const newOffset = clamp(
        fractionToOffset(frac),
        MIN_OFFSET,
        MAX_OFFSET,
      );
      dispatch(setScrubOffset(newOffset));
    },
    [isDragging, dispatch, clientXToFraction],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      const ruler = trackRef.current;
      ruler?.releasePointerCapture(e.pointerId);
      setIsDragging(false);
      dispatch(setScrubbingInProgress(false));

      if (shouldSnap(offset)) {
        const snapTarget = nearestSnapOffset(offset);
        animateOffset(offset, snapTarget, SNAP_DURATION);
      }
    },
    [isDragging, dispatch, offset, shouldSnap, animateOffset],
  );

  // ------------------------------------------------------------------
  // Mouse wheel
  // ------------------------------------------------------------------

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      const direction = e.deltaY > 0 ? 1 : -1;
      const newOffset = clamp(
        offset + direction * WHEEL_STEP,
        MIN_OFFSET,
        MAX_OFFSET,
      );
      dispatch(setScrubOffset(newOffset));
    };
    el.addEventListener('wheel', handler, { passive: true });
    return () => el.removeEventListener('wheel', handler);
  }, [dispatch, offset]);

  // ------------------------------------------------------------------
  // "Now" button
  // ------------------------------------------------------------------

  const handleNowClick = useCallback(() => {
    animateOffset(offset, 0, NOW_RETURN_DURATION);
  }, [offset, animateOffset]);

  // ------------------------------------------------------------------
  // "Jump" button
  // ------------------------------------------------------------------

  const handleJumpClick = useCallback(() => {
    dispatch(setDateJumpOpen(true));
  }, [dispatch]);

  // ------------------------------------------------------------------
  // Keyboard interaction (handled on the handle element)
  // ------------------------------------------------------------------

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      let newOffset = offset;
      let handled = true;

      switch (e.key) {
        case 'ArrowLeft':
          newOffset = e.shiftKey ? offset - 60 : offset - 15;
          break;
        case 'ArrowRight':
          newOffset = e.shiftKey ? offset + 60 : offset + 15;
          break;
        case 'Home':
          newOffset = 0;
          break;
        case 'End':
          newOffset = MAX_OFFSET;
          break;
        case 'PageUp':
          newOffset = offset - 360; // 6 hours
          break;
        case 'PageDown':
          newOffset = offset + 360; // 6 hours
          break;
        default:
          handled = false;
      }

      if (handled) {
        e.preventDefault();
        dispatch(setScrubOffset(clamp(newOffset, MIN_OFFSET, MAX_OFFSET)));
      }
    },
    [dispatch, offset],
  );

  // ------------------------------------------------------------------
  // Tick marks
  // ------------------------------------------------------------------

  /** Generate hourly tick marks (25 ticks: -24h to +24h) */
  const hourlyTicks = useMemo(() => {
    const ticks: Array<{
      offsetMinutes: number;
      fraction: number;
      isMajor: boolean;
      isNow: boolean;
      label?: string;
    }> = [];

    for (let h = -24; h <= 24; h++) {
      const mins = h * 60;
      const frac = offsetToFraction(mins);
      const isMajor = MAJOR_TICK_HOURS.includes(h);
      const isNow = h === 0;
      ticks.push({
        offsetMinutes: mins,
        fraction: frac,
        isMajor,
        isNow,
        label: isNow ? 'NOW' : isMajor ? MAJOR_TICK_LABELS[h] : undefined,
      });
    }
    return ticks;
  }, []);

  // ------------------------------------------------------------------
  // Filled portion (accent gradient from Now to handle)
  // ------------------------------------------------------------------

  const nowFraction = offsetToFraction(0); // 0.5

  const fillStyle = useMemo(() => {
    if (offset === 0) return { left: '50%', width: '0%' };
    const hf = handleFraction;
    const left = Math.min(nowFraction, hf);
    const right = Math.max(nowFraction, hf);
    return {
      left: `${left * 100}%`,
      width: `${(right - left) * 100}%`,
      background: 'var(--ember-soft, rgba(212, 80, 44, 0.10))',
    };
  }, [offset, handleFraction, nowFraction]);

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------

  return (
    <div data-horizon-scrub="" className="horizon-scrub observatory-scrub-bar relative w-full select-none">
      <div className="observatory-scrub-header">
        <div>
          <div className="observatory-scrub-eyebrow">
            <span
              className={`observatory-scrub-status-dot${scrubStatus.paused ? ' is-paused' : ''}`}
              aria-hidden
            />
            <span>{scrubStatus.label}</span>
          </div>
          {!timeReadoutMounted ? (
            <>
              <div
                className="observatory-scrub-time-display observatory-scrub-time-placeholder"
                style={{ marginTop: 6 }}
                aria-hidden
              >
                ——:——:——
              </div>
              <div className="horizon-scrub-readout-date observatory-scrub-date-line observatory-scrub-time-placeholder">
                ——
              </div>
            </>
          ) : (
            <>
              <div
                className={`observatory-scrub-time-display${clockOnlyReadout ? '' : ' is-full-datetime-readout'}`}
                style={{ marginTop: 6 }}
              >
                {!clockOnlyReadout ? (
                  <TimeDisplay
                    formattedTime={formattedTime}
                    displayFormat={displayFormat}
                    fontSize={displayFormat === 'unix' ? 14 : 13}
                    fontWeight={450}
                    color="var(--ink, #141414)"
                    style={{
                      maxWidth: '100%',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      display: 'block',
                    }}
                  />
                ) : (
                  <>
                    <span>{localHms.main}</span>
                    <span className="observatory-time-colon">{localHms.colon1}</span>
                    <span>{localHms.m}</span>
                    <span className="observatory-time-colon">{localHms.colon2}</span>
                    <span className="observatory-time-sec">{localHms.s}</span>
                    {localHms.ap ? (
                      <span className="observatory-time-ampm">{` ${localHms.ap}`}</span>
                    ) : null}
                  </>
                )}
              </div>
              <div className="horizon-scrub-readout-date observatory-scrub-date-line">
                {scrubDateLine}
              </div>
            </>
          )}
        </div>
        <div className="observatory-scrub-actions">
          <button
            type="button"
            className={`observatory-control-btn primary observatory-now-btn${offset !== 0 ? ' is-visible' : ''}`}
            onClick={() => {
              if (offset !== 0) handleNowClick();
            }}
            aria-label="Return to now"
          >
            <svg
              viewBox="0 0 24 24"
              width={10}
              height={10}
              fill="currentColor"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              aria-hidden
            >
              <polygon points="5 3 19 12 5 21" />
            </svg>
            RETURN TO NOW
          </button>
          <button
            type="button"
            className="observatory-control-btn ghost"
            onClick={handleJumpClick}
            aria-label="Open date jump dialog"
          >
            <svg
              viewBox="0 0 24 24"
              width={11}
              height={11}
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              aria-hidden
            >
              <rect x="3" y="4" width="18" height="18" rx="1" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
            Jump
          </button>
        </div>
      </div>

      <div className="observatory-ruler-wrap">
        <div
          ref={trackRef}
          className="observatory-ruler"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          {offset !== 0 && !isFarRange && (
            <div className="observatory-scrub-fill" style={fillStyle} />
          )}
          {isFarRange && (
            <div
              className="absolute inset-0"
              style={{
                background:
                  offset > MAX_OFFSET
                    ? 'linear-gradient(90deg, transparent 70%, var(--accent) 100%)'
                    : 'linear-gradient(90deg, var(--accent) 0%, transparent 30%)',
                opacity: 0.45,
                pointerEvents: 'none',
              }}
            />
          )}

          {hourlyTicks.map((tick) => {
            const h = tick.offsetMinutes / 60;
            const tickClass = tick.isNow
              ? 'now'
              : h % 6 === 0
                ? 'major'
                : h % 3 === 0
                  ? 'mid'
                  : 'minor';
            return (
              <div
                key={tick.offsetMinutes}
                className={`observatory-ruler-tick ${tickClass}`}
                style={{ left: `${tick.fraction * 100}%` }}
              />
            );
          })}

          {hourlyTicks
            .filter((t) => Boolean(t.label))
            .map((tick) => (
              <div
                key={`lab-${tick.offsetMinutes}`}
                className={`observatory-ruler-num${tick.isNow ? ' now' : ''}`}
                style={{ left: `${tick.fraction * 100}%` }}
              >
                {tick.label}
              </div>
            ))}

          <div
            role="slider"
            tabIndex={0}
            aria-valuemin={MIN_OFFSET}
            aria-valuemax={MAX_OFFSET}
            aria-valuenow={offset}
            aria-valuetext={formatAriaValueText(offset)}
            aria-label="Time scrub control"
            className={`horizon-scrub-handle observatory-scrub-handle${isDragging ? ' horizon-scrub-handle--drag is-dragging' : ''}${isFarRange ? ' horizon-scrub-handle--far' : ''}`}
            style={{
              left: `${handleFraction * 100}%`,
              transform: `translate(-50%, -50%) scale(${isDragging ? 1.25 : isHovering ? 1.15 : 1})`,
              top: '50%',
            }}
            onKeyDown={handleKeyDown}
          >
            {!isFarRange && (
              <div className="observatory-scrub-tooltip">{tooltipTime}</div>
            )}
            {isFarRange && (
              <span className="observatory-scrub-handle-far" aria-hidden>
                {offset > MAX_OFFSET ? '›' : '‹'}
              </span>
            )}
          </div>
        </div>
      </div>

      {isFarRange && (
        <button
          type="button"
          onClick={() => {
            const target = offset > MAX_OFFSET ? MAX_OFFSET : MIN_OFFSET;
            animateOffset(offset, target, NOW_RETURN_DURATION);
          }}
          className="observatory-far-range-link"
          aria-label="Return to 24 hour window"
        >
          Return to ±24h window
        </button>
      )}
    </div>
  );
}
