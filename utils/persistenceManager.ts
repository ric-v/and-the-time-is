/**
 * Persistence Manager
 *
 * Subscribes to Redux store changes and writes relevant state to
 * localStorage under the `horizon.*` namespace:
 *
 *   horizon.orbs       → JSON array of Orb objects
 *   horizon.settings   → JSON AppSettings object
 *   horizon.apiCache   → { data: TimezoneResult[], timestamp: number }
 *
 * Handles localStorage unavailability gracefully — the app continues
 * in session-only mode and a toast warning is surfaced once.
 *
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5
 */

import type { Orb } from '../store/orbSlice';
import type { AppSettings } from '../store/settingsSlice';
import type { RootState } from '../store/store';

// ---------------------------------------------------------------------------
// localStorage keys
// ---------------------------------------------------------------------------

export const STORAGE_KEYS = {
  orbs: 'horizon.orbs',
  settings: 'horizon.settings',
  apiCache: 'horizon.apiCache',
} as const;

// ---------------------------------------------------------------------------
// localStorage availability check
// ---------------------------------------------------------------------------

let _localStorageAvailable: boolean | null = null;

/**
 * Test whether localStorage is usable. Caches the result after the first
 * probe so subsequent calls are free.
 */
export function isLocalStorageAvailable(): boolean {
  if (_localStorageAvailable !== null) return _localStorageAvailable;

  try {
    const testKey = '__horizon_storage_test__';
    localStorage.setItem(testKey, '1');
    localStorage.removeItem(testKey);
    _localStorageAvailable = true;
  } catch {
    _localStorageAvailable = false;
  }
  return _localStorageAvailable;
}

/**
 * Reset the cached availability flag. Useful for testing.
 */
export function resetStorageAvailabilityCache(): void {
  _localStorageAvailable = null;
}

// ---------------------------------------------------------------------------
// Safe localStorage wrappers
// ---------------------------------------------------------------------------

/**
 * Read a value from localStorage, returning `null` if unavailable or on
 * any error.
 */
export function safeGetItem(key: string): string | null {
  if (!isLocalStorageAvailable()) return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Write a value to localStorage, silently swallowing errors (e.g. quota
 * exceeded in private browsing).
 */
export function safeSetItem(key: string, value: string): boolean {
  if (!isLocalStorageAvailable()) return false;
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Remove a key from localStorage, silently swallowing errors.
 */
export function safeRemoveItem(key: string): boolean {
  if (!isLocalStorageAvailable()) return false;
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Load persisted state
// ---------------------------------------------------------------------------

/**
 * Load the persisted orb list from localStorage.
 * Returns `null` if nothing is stored or the data is corrupt.
 */
export function loadOrbs(): Orb[] | null {
  const raw = safeGetItem(STORAGE_KEYS.orbs);
  if (raw === null) return null;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as Orb[];
    return null;
  } catch {
    return null;
  }
}

/**
 * Load persisted settings from localStorage.
 * Returns `null` if nothing is stored or the data is corrupt.
 * Partial settings are returned as-is — the caller should merge with
 * defaults.
 */
export function loadSettings(): Partial<AppSettings> | null {
  const raw = safeGetItem(STORAGE_KEYS.settings);
  if (raw === null) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Partial<AppSettings>;
    }
    return null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// API cache helpers
// ---------------------------------------------------------------------------

export interface ApiCacheEntry {
  data: unknown[];
  timestamp: number;
}

const API_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Load the cached API response if it exists and hasn't expired.
 */
export function loadApiCache(): ApiCacheEntry | null {
  const raw = safeGetItem(STORAGE_KEYS.apiCache);
  if (raw === null) return null;
  try {
    const parsed: ApiCacheEntry = JSON.parse(raw);
    if (
      parsed &&
      Array.isArray(parsed.data) &&
      typeof parsed.timestamp === 'number' &&
      Date.now() - parsed.timestamp < API_CACHE_TTL_MS
    ) {
      return parsed;
    }
    // Expired — clean up
    safeRemoveItem(STORAGE_KEYS.apiCache);
    return null;
  } catch {
    return null;
  }
}

/**
 * Save an API response to the cache with the current timestamp.
 */
export function saveApiCache(data: unknown[]): void {
  const entry: ApiCacheEntry = { data, timestamp: Date.now() };
  safeSetItem(STORAGE_KEYS.apiCache, JSON.stringify(entry));
}

// ---------------------------------------------------------------------------
// Store subscription (auto-persist)
// ---------------------------------------------------------------------------

/** Tracks the previous serialised values to avoid redundant writes. */
let _prevOrbsJson = '';
let _prevSettingsJson = '';

/**
 * Subscribe to a Redux store and auto-persist `orbs` and `settings`
 * slices to localStorage on every change.
 *
 * Returns an unsubscribe function.
 *
 * If localStorage is unavailable, the subscription is still created
 * (so the app works in session-only mode) but writes are silently
 * skipped. The caller should show a one-time toast warning.
 */
export function subscribeToPersistence(
  store: { getState: () => RootState; subscribe: (listener: () => void) => () => void },
): () => void {
  const handleChange = () => {
    const state = store.getState();

    // Persist orbs
    const orbsJson = JSON.stringify(state.orbs.list);
    if (orbsJson !== _prevOrbsJson) {
      _prevOrbsJson = orbsJson;
      safeSetItem(STORAGE_KEYS.orbs, orbsJson);
    }

    // Persist settings
    const settingsJson = JSON.stringify(state.settings);
    if (settingsJson !== _prevSettingsJson) {
      _prevSettingsJson = settingsJson;
      safeSetItem(STORAGE_KEYS.settings, settingsJson);
    }
  };

  return store.subscribe(handleChange);
}

// ---------------------------------------------------------------------------
// Reset (for "Reset all data" in settings)
// ---------------------------------------------------------------------------

/**
 * Clear all app-namespaced localStorage keys (`horizon.*`).
 * Used by the "Reset all data" action in the Settings Panel.
 */
export function clearAllHorizonData(): void {
  safeRemoveItem(STORAGE_KEYS.orbs);
  safeRemoveItem(STORAGE_KEYS.settings);
  safeRemoveItem(STORAGE_KEYS.apiCache);
  // Reset the dedup trackers so the next subscribe cycle writes fresh data
  _prevOrbsJson = '';
  _prevSettingsJson = '';
}
