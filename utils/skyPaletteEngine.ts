/**
 * Sky Palette Engine
 *
 * Provides the 6-state palette for orb fills and a 24-state palette API
 * for the globe tint and expanded orb detail view.
 *
 * Requirements: 4.2, 3.2, 3.3
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SkyStateName = 'midnight' | 'dawn' | 'day' | 'noon' | 'dusk' | 'night';

export type CelestialIcon =
  | 'sun'
  | 'sun-rising'
  | 'sun-bright'
  | 'sun-setting'
  | 'moon'
  | 'moon-full';

export interface SkyPaletteColors {
  zenith: string;
  horizon: string;
  textOnFill: string;
  celestialIcon: CelestialIcon;
}

// ---------------------------------------------------------------------------
// 6-State Palette (orb fills)
// ---------------------------------------------------------------------------

/**
 * The six canonical sky states used for Zone Orb body fills.
 * Colors from UI-UX-Spec Section 3.1.
 */
export const SIX_STATE_PALETTE: Record<SkyStateName, SkyPaletteColors> = {
  midnight: { zenith: '#0b1033', horizon: '#1a1f4a', textOnFill: '#e8eaff', celestialIcon: 'moon-full' },
  dawn:     { zenith: '#4a3a6e', horizon: '#e8a38a', textOnFill: '#fff8f0', celestialIcon: 'sun-rising' },
  day:      { zenith: '#6fb8e8', horizon: '#b8d8ee', textOnFill: '#1a2b3f', celestialIcon: 'sun' },
  noon:     { zenith: '#4a9fdb', horizon: '#e8e0c8', textOnFill: '#1a2b3f', celestialIcon: 'sun-bright' },
  dusk:     { zenith: '#3d2a5a', horizon: '#e8856e', textOnFill: '#fff4e8', celestialIcon: 'sun-setting' },
  night:    { zenith: '#1a1a3f', horizon: '#3a2f5a', textOnFill: '#e8eaff', celestialIcon: 'moon' },
};

/**
 * Determine the 6-state sky state name for a given local hour (0–23).
 *
 * Mapping (from Requirement 4.2):
 *   05:00–06:59 → dawn
 *   07:00–11:59 → day
 *   12:00–13:59 → noon
 *   14:00–17:59 → day
 *   18:00–19:59 → dusk
 *   20:00–22:59 → night
 *   23:00–04:59 → midnight
 */
export function getSkyState(localHour: number): SkyStateName {
  const h = ((localHour % 24) + 24) % 24; // normalise to 0–23
  if (h >= 5 && h < 7) return 'dawn';
  if (h >= 7 && h < 12) return 'day';
  if (h >= 12 && h < 14) return 'noon';
  if (h >= 14 && h < 18) return 'day';
  if (h >= 18 && h < 20) return 'dusk';
  if (h >= 20 && h < 23) return 'night';
  return 'midnight'; // 23:00–04:59
}

/**
 * Get the full 6-state palette colors for a given local hour.
 */
export function getSkyPaletteForHour(localHour: number): SkyPaletteColors {
  return SIX_STATE_PALETTE[getSkyState(localHour)];
}

// ---------------------------------------------------------------------------
// 24-State Palette (globe tint + detail view)
// ---------------------------------------------------------------------------

/**
 * A single entry in the 24-state palette, one per hour of the day.
 * Reuses the existing skyThemes structure but exposes only the colors
 * needed by the Horizon globe and detail view.
 */
export interface TwentyFourStatePaletteEntry {
  hour: number;       // 0–23
  id: string;
  name: string;
  bg: string;         // background / zenith equivalent
  horizon: string;    // horizon glow color
  text: string;       // primary text color
  accent: string;     // accent color for this hour
}

/**
 * The full 24-state palette, one entry per hour.
 *
 * Derived from the existing `old/utils/skyThemes.ts` SKY_THEMES array.
 * Each hour maps to the theme whose hourRange contains it.
 * The globe uses `bg` for the lit-hemisphere tint and `horizon` for
 * atmospheric effects. The Orb Detail View uses these for the expanded
 * orb's gradient fill.
 */
export const TWENTY_FOUR_STATE_PALETTE: TwentyFourStatePaletteEntry[] = [
  { hour: 0,  id: 'midnight',       name: 'Dead of night',    bg: '#050d1a', horizon: 'rgba(10, 25, 60, 0)',       text: '#c8d8f0', accent: '#4a90d9' },
  { hour: 1,  id: 'midnight',       name: 'Dead of night',    bg: '#050d1a', horizon: 'rgba(10, 25, 60, 0)',       text: '#c8d8f0', accent: '#4a90d9' },
  { hour: 2,  id: 'midnight',       name: 'Dead of night',    bg: '#050d1a', horizon: 'rgba(10, 25, 60, 0)',       text: '#c8d8f0', accent: '#4a90d9' },
  { hour: 3,  id: 'midnight',       name: 'Dead of night',    bg: '#050d1a', horizon: 'rgba(10, 25, 60, 0)',       text: '#c8d8f0', accent: '#4a90d9' },
  { hour: 4,  id: 'predawn',        name: 'Before dawn',      bg: '#0d1635', horizon: 'rgba(60, 40, 120, 0.6)',    text: '#c0b8e8', accent: '#8866cc' },
  { hour: 5,  id: 'predawn',        name: 'Before dawn',      bg: '#0d1635', horizon: 'rgba(60, 40, 120, 0.6)',    text: '#c0b8e8', accent: '#8866cc' },
  { hour: 6,  id: 'sunrise',        name: 'Sunrise',          bg: '#1a1535', horizon: 'rgba(255, 110, 40, 0.95)',   text: '#ffe8d0', accent: '#ff6a28' },
  { hour: 7,  id: 'earlymorning',   name: 'Early morning',    bg: '#1e3060', horizon: 'rgba(255, 170, 60, 0.7)',   text: '#ffeedd', accent: '#ffaa40' },
  { hour: 8,  id: 'earlymorning',   name: 'Early morning',    bg: '#1e3060', horizon: 'rgba(255, 170, 60, 0.7)',   text: '#ffeedd', accent: '#ffaa40' },
  { hour: 9,  id: 'morning',        name: 'Morning',          bg: '#1a4a7a', horizon: 'rgba(120, 200, 255, 0.5)',  text: '#e8f4ff', accent: '#60c0f0' },
  { hour: 10, id: 'morning',        name: 'Morning',          bg: '#1a4a7a', horizon: 'rgba(120, 200, 255, 0.5)',  text: '#e8f4ff', accent: '#60c0f0' },
  { hour: 11, id: 'midday',         name: 'Midday',           bg: '#0a3a6a', horizon: 'rgba(80, 180, 255, 0.4)',   text: '#e0f0ff', accent: '#40b0f0' },
  { hour: 12, id: 'midday',         name: 'Midday',           bg: '#0a3a6a', horizon: 'rgba(80, 180, 255, 0.4)',   text: '#e0f0ff', accent: '#40b0f0' },
  { hour: 13, id: 'midday',         name: 'Midday',           bg: '#0a3a6a', horizon: 'rgba(80, 180, 255, 0.4)',   text: '#e0f0ff', accent: '#40b0f0' },
  { hour: 14, id: 'afternoon',      name: 'Afternoon',        bg: '#0c3c72', horizon: 'rgba(90, 190, 255, 0.5)',   text: '#dceeff', accent: '#50b8f8' },
  { hour: 15, id: 'afternoon',      name: 'Afternoon',        bg: '#0c3c72', horizon: 'rgba(90, 190, 255, 0.5)',   text: '#dceeff', accent: '#50b8f8' },
  { hour: 16, id: 'afternoon',      name: 'Afternoon',        bg: '#0c3c72', horizon: 'rgba(90, 190, 255, 0.5)',   text: '#dceeff', accent: '#50b8f8' },
  { hour: 17, id: 'lateafternoon',  name: 'Late afternoon',   bg: '#1a2a5a', horizon: 'rgba(255, 160, 60, 0.8)',   text: '#ffe8c8', accent: '#f09050' },
  { hour: 18, id: 'sunset',         name: 'Sunset',           bg: '#1c1230', horizon: 'rgba(220, 70, 30, 1)',      text: '#ffe0c8', accent: '#ff5520' },
  { hour: 19, id: 'sunset',         name: 'Sunset',           bg: '#1c1230', horizon: 'rgba(220, 70, 30, 1)',      text: '#ffe0c8', accent: '#ff5520' },
  { hour: 20, id: 'dusk',           name: 'Dusk',             bg: '#0e0a28', horizon: 'rgba(120, 40, 160, 0.9)',   text: '#ddc8f8', accent: '#9955dd' },
  { hour: 21, id: 'dusk',           name: 'Dusk',             bg: '#0e0a28', horizon: 'rgba(120, 40, 160, 0.9)',   text: '#ddc8f8', accent: '#9955dd' },
  { hour: 22, id: 'latenight',      name: 'Late night',       bg: '#080e22', horizon: 'rgba(15, 30, 80, 0)',       text: '#b8cce8', accent: '#5580c0' },
  { hour: 23, id: 'latenight',      name: 'Late night',       bg: '#080e22', horizon: 'rgba(15, 30, 80, 0)',       text: '#b8cce8', accent: '#5580c0' },
];

/**
 * Get the 24-state palette entry for a given hour (0–23).
 */
export function get24StatePaletteForHour(hour: number): TwentyFourStatePaletteEntry {
  const h = ((hour % 24) + 24) % 24;
  return TWENTY_FOUR_STATE_PALETTE[h];
}
