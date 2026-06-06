/**
 * Migration Manager
 *
 * Detects legacy localStorage keys (`timezones`, `dateFormat`) from the
 * pre-Horizon app and migrates them to the new `horizon.*` namespace.
 *
 * Legacy keys are preserved for a 2-week rollback window — they are
 * never deleted by this module.
 *
 * Requirements: 11.6, 15.2
 */

import type { Orb } from '../store/orbSlice';
import type { DisplayFormat, AppSettings } from '../store/settingsSlice';
import { canonicalizeTimezoneId, type Timezones } from './timeNow';
import { isLocalStorageAvailable, safeGetItem, safeSetItem } from './persistenceManager';

// ---------------------------------------------------------------------------
// Legacy format → new format mapping
// ---------------------------------------------------------------------------

const LEGACY_FORMAT_MAP: Record<string, DisplayFormat> = {
  '%H:%M:%S': '24h',
  '%I:%M:%S %p': '12h',
  '%Y-%m-%dT%H:%M:%S%z': 'iso',
  '%s': 'unix',
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Detect and migrate legacy localStorage data to the Horizon namespace.
 *
 * Algorithm:
 * 1. If `horizon.orbs` already exists, skip — migration was already done.
 * 2. If the legacy `timezones` key is absent, skip — nothing to migrate.
 * 3. Parse legacy entries, map each to the new Orb shape with IANA
 *    canonicalization, and write to `horizon.orbs`.
 * 4. Migrate `dateFormat` to the settings object if present.
 * 5. Legacy keys are NOT deleted — kept for 2-week rollback window.
 *
 * Returns `true` if migration was performed, `false` otherwise.
 */
export function migrateLegacyData(): boolean {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  // Already migrated — horizon.orbs exists
  const existingOrbs = safeGetItem('horizon.orbs');
  if (existingOrbs !== null) {
    return false;
  }

  // No legacy data to migrate
  const legacyRaw = safeGetItem('timezones');
  if (legacyRaw === null) {
    return false;
  }

  let legacyTimezones: Timezones[];
  try {
    legacyTimezones = JSON.parse(legacyRaw);
    if (!Array.isArray(legacyTimezones)) {
      return false;
    }
  } catch {
    // Corrupt legacy data — skip migration
    return false;
  }

  // Map legacy entries to new Orb shape
  const orbs: Orb[] = legacyTimezones.map((tz, index) => ({
    id: generateId(),
    ianaName: canonicalizeTimezoneId(tz.name),
    label: tz.customname || tz.city,
    isLocal: false,
    createdAt: Date.now() - (legacyTimezones.length - index),
    displayOrder: index,
  }));

  safeSetItem('horizon.orbs', JSON.stringify(orbs));

  // Migrate display format if present
  const legacyFormat = safeGetItem('dateFormat');
  if (legacyFormat) {
    const newFormat: DisplayFormat = LEGACY_FORMAT_MAP[legacyFormat] || '24h';

    // Read existing settings (if any) and merge the format
    const existingSettingsRaw = safeGetItem('horizon.settings');
    let settings: Partial<AppSettings> = {};
    if (existingSettingsRaw) {
      try {
        settings = JSON.parse(existingSettingsRaw);
      } catch {
        // Ignore corrupt settings
      }
    }
    settings.displayFormat = newFormat;
    safeSetItem('horizon.settings', JSON.stringify(settings));
  }

  // Legacy keys are intentionally NOT deleted — kept for rollback
  return true;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Generate a UUID v4 string. Uses `crypto.randomUUID()` when available,
 * falls back to a simple Math.random-based implementation for older
 * environments.
 */
function generateId(): string {
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
