/**
 * Pass Layout Engine
 *
 * Positioning, sky weights, and lantern state for The Pass UI.
 * Ports logic from wireframes/radical-6-the-pass.html.
 */

import { getLocalHour, getUtcOffsetAtTime } from './timeEngine';
import { getSkyState, type SkyStateName } from './skyPaletteEngine';
import type { Orb } from '../store/orbSlice';

export type LanternState = 'awake' | 'winding' | 'sleep';
export type PassSkyPhase = 'dawn' | 'day' | 'dusk' | 'night';

export const SCRUB_MIN = -720;
export const SCRUB_MAX = 720;
export const SCRUB_STEP = 5;
export const MAX_WORLD_SCROLL = 4800;
export const GRIND_RADIUS = 120;
export const GOLDEN_START = 14;
export const GOLDEN_END = 18;
export const LANDMARK_BASE_X = 800;
export const PIXELS_PER_OFFSET_HOUR = 80;
export const PARALLAX_FACTORS = {
  mountains: 0.2,
  mid: 0.5,
  trees: 0.8,
  ground: 1.0,
} as const;

/** Parse UTC offset string (+HH:MM) to signed minutes. */
export function getUtcOffsetMinutes(ianaName: string, displayedTime: Date): number {
  const offsetStr = getUtcOffsetAtTime(ianaName, displayedTime);
  const match = offsetStr.match(/^([+-])(\d{2}):(\d{2})$/);
  if (!match) return 0;
  const sign = match[1] === '+' ? 1 : -1;
  return sign * (Number.parseInt(match[2], 10) * 60 + Number.parseInt(match[3], 10));
}

/**
 * Position a landmark along the slope from UTC offset delta vs local zone.
 */
export function getLandmarkScrollX(
  orbIana: string,
  localIana: string,
  orbIndex: number,
  displayedTime: Date,
): number {
  const localOffset = getUtcOffsetMinutes(localIana, displayedTime);
  const orbOffset = getUtcOffsetMinutes(orbIana, displayedTime);
  const deltaHours = (orbOffset - localOffset) / 60;
  const tiebreaker = orbIndex * 40;
  return LANDMARK_BASE_X + deltaHours * PIXELS_PER_OFFSET_HOUR + tiebreaker;
}

/** Lantern glow state from local hour (wireframe thresholds). */
export function getLanternState(localHour: number): LanternState {
  if (localHour >= 7 && localHour < 21) return 'awake';
  if ((localHour >= 6 && localHour < 7) || (localHour >= 21 && localHour < 22)) return 'winding';
  return 'sleep';
}

/** Cross-fade sky layer opacity weights (wireframe updateSky). */
export function getPassSkyWeights(localHour: number): Record<PassSkyPhase, number> {
  const weights: Record<PassSkyPhase, number> = { dawn: 0, day: 0, dusk: 0, night: 0 };
  const hour = ((localHour % 24) + 24) % 24;

  if (hour >= 4 && hour < 9) {
    const t = (hour - 4) / 5;
    if (t < 0.5) {
      weights.night = 1 - t * 2;
      weights.dawn = t * 2;
    } else {
      weights.dawn = 1 - (t - 0.5) * 2;
      weights.day = (t - 0.5) * 2;
    }
  } else if (hour >= 9 && hour < 16) {
    weights.day = 1;
  } else if (hour >= 16 && hour < 21) {
    const t = (hour - 16) / 5;
    if (t < 0.5) {
      weights.day = 1 - t * 2;
      weights.dusk = t * 2;
    } else {
      weights.dusk = 1 - (t - 0.5) * 2;
      weights.night = (t - 0.5) * 2;
    }
  } else {
    weights.night = 1;
    if (hour >= 3 && hour < 5) {
      const t = (hour - 3) / 2;
      weights.night = 1 - t * 0.5;
      weights.dawn = t * 0.5;
    }
  }

  return weights;
}

/** Count landmarks in awake lantern state (aurora threshold: 3+). */
export function countAwakeLandmarks(
  orbs: Orb[],
  displayedTime: Date,
): number {
  return orbs.reduce((count, orb) => {
    const hour = getLocalHour(orb.ianaName, displayedTime);
    return count + (getLanternState(hour) === 'awake' ? 1 : 0);
  }, 0);
}

export function scrollFromScrub(min: number): number {
  return ((min - SCRUB_MIN) / (SCRUB_MAX - SCRUB_MIN)) * MAX_WORLD_SCROLL;
}

export function scrubFromScroll(scroll: number): number {
  const t = scroll / MAX_WORLD_SCROLL;
  return SCRUB_MIN + t * (SCRUB_MAX - SCRUB_MIN);
}

export function clampScrub(min: number): number {
  return Math.max(SCRUB_MIN, Math.min(SCRUB_MAX, Math.round(min / SCRUB_STEP) * SCRUB_STEP));
}

/** Human-readable scrub offset label. */
export function formatScrubOffset(min: number): string {
  if (min === 0) return '+0m from now';
  const sign = min > 0 ? '+' : '';
  const h = Math.floor(Math.abs(min) / 60);
  const m = Math.abs(min) % 60;
  if (h === 0) return `${sign}${min}m from now`;
  return `${sign}${min > 0 ? h : -h}h ${m ? `${m}m` : ''} from now`.trim();
}

/** Map 6-state sky to Pass 4-phase label for detail panel. */
export function getPassSkyLabel(localHour: number): string {
  const state = getSkyState(localHour);
  const labels: Record<SkyStateName, string> = {
    midnight: 'Night',
    dawn: 'Dawn',
    day: 'Day',
    noon: 'Day',
    dusk: 'Dusk',
    night: 'Night',
  };
  return labels[state];
}

export function getLanternLabel(state: LanternState): string {
  if (state === 'awake') return 'Awake';
  if (state === 'winding') return 'Winding down';
  return 'Sleeping';
}
