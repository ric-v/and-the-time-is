/**
 * Parse Horizon URL query params (?jump=open, ?offset=&zones=) for share links
 * and legacy Time Was entry.
 *
 * Requirements: 20.2, 20.3, 12.4
 */

import { canonicalizeTimezoneId } from './timeNow';
import type { Orb } from '../store/orbSlice';

/** Popular abbreviations from share examples / Command Palette. */
const ZONE_TOKEN_TO_IANA: Record<string, string> = {
  ist: 'Asia/Kolkata',
  utc: 'Etc/UTC',
  est: 'America/New_York',
  pst: 'America/Los_Angeles',
  jst: 'Asia/Tokyo',
  cet: 'Europe/Berlin',
  gmt: 'Europe/London',
  sgt: 'Asia/Singapore',
};

function generateOrbId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function cityLabelFromIana(ianaName: string): string {
  const parts = ianaName.split('/');
  const city = parts[parts.length - 1];
  return city.replace(/_/g, ' ');
}

function resolveZoneToken(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  const lower = t.toLowerCase();
  if (ZONE_TOKEN_TO_IANA[lower]) {
    return canonicalizeTimezoneId(ZONE_TOKEN_TO_IANA[lower]);
  }
  if (t.includes('/')) {
    return canonicalizeTimezoneId(t);
  }
  return canonicalizeTimezoneId(t);
}

export interface ParsedHorizonUrl {
  openDateJump: boolean;
  /** Set only when `offset` query key is present (may be 0). */
  scrubOffsetMinutes?: number;
  /** When present, replaces pinned orbs (after migration, before default seed). */
  orbsFromUrl: Orb[] | null;
}

/**
 * Build orb list from a zones query value. Ensures the browser's local zone
 * exists as the Local Orb; prepends it if missing.
 */
export function orbsFromZonesParam(zonesParam: string, localIana: string): Orb[] {
  const localCanonical = canonicalizeTimezoneId(localIana);
  const tokens = zonesParam.split(',').map((s) => s.trim()).filter(Boolean);
  const resolved: string[] = [];
  for (const tok of tokens) {
    const iana = resolveZoneToken(tok);
    if (iana && !resolved.includes(iana)) {
      resolved.push(iana);
    }
  }

  const now = Date.now();
  const orbs: Orb[] = [];
  let order = 0;

  if (!resolved.includes(localCanonical)) {
    orbs.push({
      id: generateOrbId(),
      ianaName: localCanonical,
      label: cityLabelFromIana(localCanonical),
      isLocal: true,
      createdAt: now,
      displayOrder: order++,
    });
  }

  for (const iana of resolved) {
    const isLocal = iana === localCanonical;
    if (isLocal && orbs.some((o) => o.isLocal)) continue;
    orbs.push({
      id: generateOrbId(),
      ianaName: iana,
      label: cityLabelFromIana(iana),
      isLocal,
      createdAt: now + order,
      displayOrder: order++,
    });
  }

  return orbs;
}

/**
 * Read the current window URL (client-only). Returns null during SSR.
 */
export function parseHorizonUrlSearch(): ParsedHorizonUrl | null {
  if (typeof window === 'undefined') return null;

  const params = new URLSearchParams(window.location.search);
  if (!params.has('jump') && !params.has('offset') && !params.has('zones')) {
    return null;
  }

  const jump = params.get('jump');
  const openDateJump = jump === 'open';

  let scrubOffsetMinutes: number | undefined;
  if (params.has('offset')) {
    const n = Number.parseInt(params.get('offset') ?? '', 10);
    scrubOffsetMinutes = Number.isNaN(n) ? 0 : n;
  }

  const zonesRaw = params.get('zones');
  let orbsFromUrl: Orb[] | null = null;
  if (zonesRaw && zonesRaw.trim()) {
    let localIana: string;
    try {
      localIana = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
      localIana = 'UTC';
    }
    const built = orbsFromZonesParam(zonesRaw, localIana);
    orbsFromUrl = built.length > 0 ? built : null;
  }

  return { openDateJump, scrubOffsetMinutes, orbsFromUrl };
}

/**
 * Remove Horizon-specific query keys after hydration so reload stays clean.
 */
export function stripHorizonUrlParamsFromLocation(): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  const keys = ['jump', 'offset', 'zones'];
  let changed = false;
  for (const k of keys) {
    if (url.searchParams.has(k)) {
      url.searchParams.delete(k);
      changed = true;
    }
  }
  if (changed) {
    const next = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState({}, '', next);
  }
}
