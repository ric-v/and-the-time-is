/**
 * useFirstRunSeeding
 *
 * Runs once on app mount to:
 * 1. Migrate legacy localStorage data (pre-Horizon format)
 * 2. Restore persisted orbs and settings from localStorage
 * 3. Seed the ring with the Local Orb + UTC + 2 geographically opposite
 *    popular zones when no persisted orb list exists
 * 4. Subscribe to Redux store changes for auto-persistence
 *
 * Requirements: 9.1, 9.2, 11.1, 11.6
 */

import { useEffect, useRef } from 'react';
import { useAppDispatch } from '../store/store';
import { store } from '../store/store';
import { setOrbList, type Orb } from '../store/orbSlice';
import { loadSettings as loadSettingsAction, type HorizonSettings } from '../store/settingsSlice';
import { setScrubOffset } from '../store/scrubSlice';
import { setDateJumpOpen } from '../store/sessionSlice';
import { migrateLegacyData } from '../utils/migrationManager';
import {
  loadOrbs,
  loadSettings,
  subscribeToPersistence,
} from '../utils/persistenceManager';
import { parseHorizonUrlSearch, stripHorizonUrlParamsFromLocation } from '../utils/horizonUrlParams';

// ---------------------------------------------------------------------------
// Popular zone mapping — geographically opposite seeds per region
// ---------------------------------------------------------------------------

/**
 * For a given local IANA timezone, returns two "geographically opposite"
 * popular zones to seed alongside UTC. The goal is to give the user a
 * useful spread across the globe on first visit.
 *
 * Mapping logic (from PRD Requirement 9.2 examples):
 *   IST user  → EST, JST
 *   EST user  → IST, JST
 *   PST user  → IST, CET
 *   JST user  → EST, CET
 *   CET user  → JST, EST
 *   SGT user  → EST, CET
 *   GMT/UTC   → IST, JST
 *   Default   → EST, JST
 */
interface SeedZone {
  ianaName: string;
  label: string;
}

const SEED_ZONES: Record<string, SeedZone> = {
  EST: { ianaName: 'America/New_York', label: 'New York' },
  PST: { ianaName: 'America/Los_Angeles', label: 'Los Angeles' },
  IST: { ianaName: 'Asia/Kolkata', label: 'Kolkata' },
  JST: { ianaName: 'Asia/Tokyo', label: 'Tokyo' },
  CET: { ianaName: 'Europe/Berlin', label: 'Berlin' },
  SGT: { ianaName: 'Asia/Singapore', label: 'Singapore' },
  GMT: { ianaName: 'Europe/London', label: 'London' },
};

/**
 * Region buckets — maps IANA timezone prefixes and known zones to a
 * region key used for seed selection.
 */
type RegionKey = 'americas-east' | 'americas-west' | 'europe' | 'south-asia' | 'east-asia' | 'southeast-asia' | 'oceania' | 'africa' | 'default';

function classifyTimezone(ianaName: string): RegionKey {
  const name = ianaName.toLowerCase();

  // Americas — East
  if (
    name.startsWith('america/new_york') ||
    name.startsWith('america/toronto') ||
    name.startsWith('america/chicago') ||
    name.startsWith('america/detroit') ||
    name.startsWith('america/indiana') ||
    name.startsWith('america/kentucky') ||
    name.startsWith('us/eastern') ||
    name.startsWith('us/central')
  ) {
    return 'americas-east';
  }

  // Americas — West
  if (
    name.startsWith('america/los_angeles') ||
    name.startsWith('america/denver') ||
    name.startsWith('america/phoenix') ||
    name.startsWith('america/vancouver') ||
    name.startsWith('us/pacific') ||
    name.startsWith('us/mountain')
  ) {
    return 'americas-west';
  }

  // Catch remaining Americas
  if (name.startsWith('america/') || name.startsWith('us/') || name.startsWith('canada/')) {
    return 'americas-east';
  }

  // South Asia
  if (
    name.startsWith('asia/kolkata') ||
    name.startsWith('asia/calcutta') ||
    name.startsWith('asia/colombo') ||
    name.startsWith('asia/dhaka') ||
    name.startsWith('asia/karachi') ||
    name.startsWith('asia/kathmandu')
  ) {
    return 'south-asia';
  }

  // East Asia
  if (
    name.startsWith('asia/tokyo') ||
    name.startsWith('asia/seoul') ||
    name.startsWith('asia/shanghai') ||
    name.startsWith('asia/hong_kong') ||
    name.startsWith('asia/taipei')
  ) {
    return 'east-asia';
  }

  // Southeast Asia
  if (
    name.startsWith('asia/singapore') ||
    name.startsWith('asia/bangkok') ||
    name.startsWith('asia/jakarta') ||
    name.startsWith('asia/kuala_lumpur') ||
    name.startsWith('asia/manila') ||
    name.startsWith('asia/ho_chi_minh')
  ) {
    return 'southeast-asia';
  }

  // Remaining Asia (Middle East, Central Asia) — treat as south-asia bucket
  if (name.startsWith('asia/')) {
    return 'south-asia';
  }

  // Europe
  if (
    name.startsWith('europe/') ||
    name.startsWith('gmt') ||
    name === 'utc' ||
    name === 'etc/utc' ||
    name === 'etc/gmt'
  ) {
    return 'europe';
  }

  // Oceania
  if (
    name.startsWith('australia/') ||
    name.startsWith('pacific/') ||
    name.startsWith('nz')
  ) {
    return 'oceania';
  }

  // Africa
  if (name.startsWith('africa/')) {
    return 'africa';
  }

  return 'default';
}

/**
 * Returns two geographically opposite seed zone keys for a given region.
 */
function getOppositeSeedKeys(region: RegionKey): [string, string] {
  switch (region) {
    case 'americas-east':
      return ['IST', 'JST'];
    case 'americas-west':
      return ['IST', 'CET'];
    case 'europe':
      return ['JST', 'EST'];
    case 'south-asia':
      return ['EST', 'JST'];
    case 'east-asia':
      return ['EST', 'CET'];
    case 'southeast-asia':
      return ['EST', 'CET'];
    case 'oceania':
      return ['EST', 'CET'];
    case 'africa':
      return ['JST', 'EST'];
    case 'default':
      return ['EST', 'JST'];
  }
}

// ---------------------------------------------------------------------------
// City label extraction from IANA name
// ---------------------------------------------------------------------------

/**
 * Extract a human-readable city label from an IANA timezone name.
 * e.g. "America/New_York" → "New York", "Asia/Kolkata" → "Kolkata"
 */
function cityLabelFromIana(ianaName: string): string {
  const parts = ianaName.split('/');
  const city = parts[parts.length - 1];
  return city.replace(/_/g, ' ');
}

// ---------------------------------------------------------------------------
// Orb ID generation
// ---------------------------------------------------------------------------

function generateOrbId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useFirstRunSeeding(): void {
  const dispatch = useAppDispatch();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    // 1. Run localStorage migration before anything else
    migrateLegacyData();

    // 2. Load persisted orbs and/or URL share state
    const persistedOrbs = loadOrbs();
    const urlState = parseHorizonUrlSearch();

    if (urlState?.orbsFromUrl && urlState.orbsFromUrl.length > 0) {
      dispatch(setOrbList(urlState.orbsFromUrl));
    } else if (persistedOrbs && persistedOrbs.length > 0) {
      dispatch(setOrbList(persistedOrbs));
    } else {
      // First-time user — detect local timezone and seed the ring
      const localIana = detectLocalTimezone();
      const region = classifyTimezone(localIana);
      const [seedKey1, seedKey2] = getOppositeSeedKeys(region);
      const seed1 = SEED_ZONES[seedKey1];
      const seed2 = SEED_ZONES[seedKey2];

      const now = Date.now();

      const localOrb: Orb = {
        id: generateOrbId(),
        ianaName: localIana,
        label: cityLabelFromIana(localIana),
        isLocal: true,
        createdAt: now,
        displayOrder: 0,
      };

      const utcOrb: Orb = {
        id: generateOrbId(),
        ianaName: 'Etc/UTC',
        label: 'UTC',
        isLocal: false,
        createdAt: now + 1,
        displayOrder: 1,
      };

      const seedOrbs: Orb[] = [localOrb, utcOrb];

      // Only add seed zones that aren't the same as the local timezone
      if (seed1 && seed1.ianaName !== localIana) {
        seedOrbs.push({
          id: generateOrbId(),
          ianaName: seed1.ianaName,
          label: seed1.label,
          isLocal: false,
          createdAt: now + 2,
          displayOrder: 2,
        });
      }

      if (seed2 && seed2.ianaName !== localIana) {
        seedOrbs.push({
          id: generateOrbId(),
          ianaName: seed2.ianaName,
          label: seed2.label,
          isLocal: false,
          createdAt: now + 3,
          displayOrder: 3,
        });
      }

      dispatch(setOrbList(seedOrbs));
    }

    if (urlState?.scrubOffsetMinutes !== undefined) {
      dispatch(setScrubOffset(urlState.scrubOffsetMinutes));
    }
    if (urlState?.openDateJump) {
      dispatch(setDateJumpOpen(true));
    }
    if (urlState) {
      stripHorizonUrlParamsFromLocation();
    }

    // 3. Load persisted settings and merge with defaults
    const persistedSettings = loadSettings();
    if (persistedSettings) {
      // The loadSettings action in settingsSlice replaces the entire state,
      // so we merge with the current (default) state to fill any missing keys.
      const currentDefaults = store.getState().settings;
      const merged: HorizonSettings = { ...currentDefaults, ...persistedSettings };
      dispatch(loadSettingsAction(merged));
    }

    // 4. Subscribe to store changes for auto-persistence
    subscribeToPersistence(store);
  }, [dispatch]);
}

// ---------------------------------------------------------------------------
// Local timezone detection
// ---------------------------------------------------------------------------

/**
 * Detect the user's local timezone via the Intl API.
 * Falls back to 'UTC' if detection fails.
 */
function detectLocalTimezone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return tz || 'UTC';
  } catch {
    return 'UTC';
  }
}
