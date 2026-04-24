/**
 * Timezone Cache — API caching and offline fallback for Command Palette
 *
 * Provides a three-tier caching strategy for timezone search:
 *   1. In-memory session cache (Map) — instant, per-session
 *   2. localStorage cache via persistenceManager — 24h TTL
 *   3. Bundled static fallback — 50 most common IANA zones
 *
 * When the API is unreachable and the fallback is used, the `isOffline`
 * flag is set so the UI can show an "offline search" indicator.
 *
 * Requirements: 15.3, 15.4
 */

import { loadApiCache, saveApiCache } from './persistenceManager';

// ---------------------------------------------------------------------------
// TimezoneResult shape (matches /api/timezones response)
// ---------------------------------------------------------------------------

export interface TimezoneResult {
  code: string;
  name: string;
  city: string;
  country: string;
  timezone: string;
  offset: string;
  currentTime: string;
  customname: string;
}

// ---------------------------------------------------------------------------
// In-memory session cache
// ---------------------------------------------------------------------------

const sessionCache = new Map<string, TimezoneResult[]>();

/**
 * Clear the in-memory session cache. Useful for testing.
 */
export function clearSessionCache(): void {
  sessionCache.clear();
}

// ---------------------------------------------------------------------------
// Offline state tracking
// ---------------------------------------------------------------------------

let _isOffline = false;

/**
 * Returns true when the last search fell back to the bundled static list
 * because the API was unreachable.
 */
export function isUsingFallback(): boolean {
  return _isOffline;
}

// ---------------------------------------------------------------------------
// Bundled static fallback — 50 most common IANA zones
// ---------------------------------------------------------------------------

export const BUNDLED_ZONES: TimezoneResult[] = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Moscow',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Kolkata',
  'Asia/Dubai',
  'Asia/Singapore',
  'Australia/Sydney',
  'Pacific/Auckland',
  'Africa/Cairo',
  'Africa/Lagos',
  'America/Sao_Paulo',
  'America/Toronto',
  'America/Mexico_City',
  'Asia/Seoul',
  'Asia/Hong_Kong',
  'Asia/Bangkok',
  'Asia/Jakarta',
  'Asia/Karachi',
  'Asia/Dhaka',
  'Asia/Tehran',
  'Europe/Istanbul',
  'Europe/Rome',
  'Europe/Madrid',
  'Europe/Amsterdam',
  'Europe/Stockholm',
  'Europe/Warsaw',
  'Europe/Zurich',
  'Europe/Vienna',
  'Europe/Prague',
  'Europe/Helsinki',
  'America/Bogota',
  'America/Lima',
  'America/Santiago',
  'America/Buenos_Aires',
  'Africa/Johannesburg',
  'Africa/Nairobi',
  'Asia/Taipei',
  'Asia/Manila',
  'Pacific/Fiji',
  'America/Phoenix',
].map(buildFallbackEntry);

// ---------------------------------------------------------------------------
// Search function with caching
// ---------------------------------------------------------------------------

/**
 * Search timezones with a three-tier caching strategy:
 *
 *   1. Check in-memory session cache for this exact query
 *   2. Fetch from `/api/timezones` — on success, cache in memory and
 *      (for the popular/empty query) in localStorage
 *   3. On API failure, check localStorage cache
 *   4. On localStorage miss, filter the bundled static fallback list
 *
 * @param query  The search string (empty string returns popular zones)
 * @returns      The matching timezone results
 */
export async function searchTimezones(query: string): Promise<TimezoneResult[]> {
  const cacheKey = query.trim().toLowerCase();

  // 1. Check in-memory session cache
  const cached = sessionCache.get(cacheKey);
  if (cached) {
    _isOffline = false;
    return cached;
  }

  // 2. Try the API
  try {
    const url = cacheKey
      ? `/api/timezones?search=${encodeURIComponent(cacheKey)}`
      : '/api/timezones';

    const res = await fetch(url);
    if (!res.ok) throw new Error(`API returned ${res.status}`);

    const data: TimezoneResult[] = await res.json();

    // Store in session cache
    sessionCache.set(cacheKey, data);

    // For the popular/empty query, also persist to localStorage (24h TTL)
    if (!cacheKey) {
      saveApiCache(data);
    }

    _isOffline = false;
    return data;
  } catch {
    // API failed — fall through to localStorage / fallback
  }

  // 3. Check localStorage cache (popular zones only, since that's what we cache)
  if (!cacheKey) {
    const localCached = loadApiCache();
    if (localCached && Array.isArray(localCached.data) && localCached.data.length > 0) {
      const results = localCached.data as TimezoneResult[];
      sessionCache.set(cacheKey, results);
      _isOffline = false;
      return results;
    }
  }

  // 4. Fall back to bundled static list
  _isOffline = true;
  const results = cacheKey
    ? filterBundledZones(cacheKey)
    : BUNDLED_ZONES;

  return results;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a TimezoneResult stub from an IANA name for the bundled fallback.
 */
function buildFallbackEntry(ianaName: string): TimezoneResult {
  const city = ianaName === 'UTC'
    ? 'UTC'
    : (ianaName.split('/').pop()?.replace(/_/g, ' ') || ianaName);

  const region = ianaName.split('/')[0] || '';
  let country = 'Universal';
  if (region === 'Asia') country = 'Asia';
  else if (region === 'Europe') country = 'Europe';
  else if (region === 'America') country = 'Americas';
  else if (region === 'Africa') country = 'Africa';
  else if (region === 'Australia') country = 'Oceania';
  else if (region === 'Pacific') country = 'Pacific';

  return {
    code: ianaName,
    name: ianaName,
    city,
    country,
    timezone: ianaName,
    offset: '',
    currentTime: '',
    customname: city,
  };
}

/**
 * Filter the bundled zones by a search query, matching against
 * city name, IANA name, and country.
 */
function filterBundledZones(query: string): TimezoneResult[] {
  const q = query.toLowerCase();
  return BUNDLED_ZONES.filter((tz) =>
    tz.name.toLowerCase().includes(q) ||
    tz.city.toLowerCase().includes(q) ||
    tz.country.toLowerCase().includes(q),
  );
}
