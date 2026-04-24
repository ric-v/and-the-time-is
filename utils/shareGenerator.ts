/**
 * Share Generator
 *
 * Generates shareable text and link representations of the current
 * app state (Displayed Time + pinned orbs).
 *
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
 */

import type { Orb } from '../store/orbSlice';
import type { DisplayFormat } from '../store/settingsSlice';
import { formatTime, getUtcOffsetAtTime, getDisplayedTime } from './timeEngine';

// ---------------------------------------------------------------------------
// Scrub offset formatting (human-readable)
// ---------------------------------------------------------------------------

/**
 * Format a scrub offset (in minutes) as a human-readable signed string.
 * Examples: "+4h 30m ahead", "-2h behind", "live"
 */
function formatScrubOffset(offsetMinutes: number): string {
  if (offsetMinutes === 0) return '— live';

  const sign = offsetMinutes > 0 ? '+' : '-';
  const abs = Math.abs(offsetMinutes);
  const hours = Math.floor(abs / 60);
  const minutes = abs % 60;

  let result = '— ';
  if (hours > 0 && minutes > 0) {
    result += `${sign}${hours}h ${minutes}m`;
  } else if (hours > 0) {
    result += `${sign}${hours}h`;
  } else {
    result += `${sign}${minutes}m`;
  }

  result += offsetMinutes > 0 ? ' ahead' : ' behind';
  return result;
}

// ---------------------------------------------------------------------------
// Share text generation
// ---------------------------------------------------------------------------

/**
 * Generate a plain-text block for sharing the current view state.
 *
 * Format (Requirement 12.2):
 *   Displayed Time formatted per current format
 *   — live  (or signed offset if scrubbed)
 *
 *   {city label} — {local time} ({UTC offset})
 *   {city label} — {local time} ({UTC offset})
 *   ...
 *
 * @param orbs - The list of pinned orbs
 * @param displayedTime - The current Displayed Time
 * @param format - The active display format
 * @param scrubOffset - The current scrub offset in minutes
 * @returns The formatted plain-text block
 */
export function generateShareText(
  orbs: Orb[],
  displayedTime: Date,
  format: DisplayFormat,
  scrubOffset: number,
): string {
  // Find the local orb to use its timezone for the header time
  const localOrb = orbs.find((o) => o.isLocal);
  const headerTimezone = localOrb?.ianaName ?? Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Header: Displayed Time in the local timezone
  const headerTime = formatTime(headerTimezone, displayedTime, format);
  const offsetLabel = formatScrubOffset(scrubOffset);

  const lines: string[] = [];
  lines.push(`${headerTime} ${offsetLabel}`);
  lines.push('');

  // One line per pinned orb
  for (const orb of orbs) {
    const localTime = formatTime(orb.ianaName, displayedTime, format);
    const utcOffset = getUtcOffsetAtTime(orb.ianaName, displayedTime);
    lines.push(`${orb.label} — ${localTime} (UTC${utcOffset})`);
  }

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Share link generation
// ---------------------------------------------------------------------------

/** Maximum URL length per Requirement 12.5 */
const MAX_URL_LENGTH = 2000;

export interface ShareLinkResult {
  url: string;
  zonesIncluded: boolean;
}

/**
 * Generate a share link that reproduces the current view.
 *
 * URL format: `?offset=N&zones=iana1,iana2,...`
 *
 * If the full URL exceeds 2000 characters, only the offset is encoded
 * and `zonesIncluded` is set to false (Requirement 12.5).
 *
 * @param scrubOffset - The current scrub offset in minutes
 * @param orbs - The list of pinned orbs
 * @returns The share URL and whether zones were included
 */
export function generateShareLink(
  scrubOffset: number,
  orbs: Orb[],
): ShareLinkResult {
  // Use the current page origin + pathname as the base
  const base = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}`
    : '/';

  // Build the zones parameter from IANA names
  const zoneList = orbs.map((o) => o.ianaName).join(',');

  // Try full URL first
  const fullUrl = `${base}?offset=${scrubOffset}&zones=${encodeURIComponent(zoneList)}`;

  if (fullUrl.length <= MAX_URL_LENGTH) {
    return { url: fullUrl, zonesIncluded: true };
  }

  // Fallback: offset only
  const offsetOnlyUrl = `${base}?offset=${scrubOffset}`;
  return { url: offsetOnlyUrl, zonesIncluded: false };
}

/**
 * Copy text to the clipboard. Returns true on success, false on failure.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers or restricted contexts
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      textarea.style.top = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    } catch {
      return false;
    }
  }
}
