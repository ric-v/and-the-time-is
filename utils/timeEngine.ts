/**
 * Time Engine
 *
 * Core time computation utilities for Horizon. Provides:
 * - Displayed Time computation from scrub offset
 * - Ring Angle calculation from IANA timezone + Displayed Time
 * - DST-aware UTC offset computation (fixes Requirement 16.1)
 * - ISO 8601 round-trip formatting (fixes Requirement 16.3)
 * - All four display format formatters (24h, 12h, ISO, Unix)
 *
 * Requirements: 3.2, 3.3, 4.2, 16.1, 16.2, 16.3, 16.4
 */

import { canonicalizeTimezoneId } from './timeNow';
import type { DisplayFormat } from '../store/settingsSlice';

// ---------------------------------------------------------------------------
// Displayed Time
// ---------------------------------------------------------------------------

/**
 * Compute the Displayed Time from the current scrub offset.
 * Scrub offset is in minutes (signed).
 */
export function getDisplayedTime(scrubOffset: number): Date {
  return new Date(Date.now() + scrubOffset * 60_000);
}

// ---------------------------------------------------------------------------
// Local time parts via Intl (DST-aware)
// ---------------------------------------------------------------------------

interface LocalDateTimeParts {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
  second: string;
}

/**
 * Extract the local date/time parts for a given IANA timezone at a specific
 * instant. Uses `Intl.DateTimeFormat` so the result is always DST-aware for
 * the provided `displayedTime` (fixes Requirement 16.1).
 */
function getLocalDateTimeParts(
  ianaName: string,
  displayedTime: Date,
): LocalDateTimeParts {
  const canonical = canonicalizeTimezoneId(ianaName);
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: canonical,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });

  const parts = dtf.formatToParts(displayedTime);
  const get = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((p) => p.type === type)?.value ?? '00';

  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
    second: get('second'),
  };
}

/**
 * Get the local hour (0–23) for a timezone at the given instant.
 */
export function getLocalHour(ianaName: string, displayedTime: Date): number {
  return Number.parseInt(getLocalDateTimeParts(ianaName, displayedTime).hour, 10);
}

/**
 * Get the local minute (0–59) for a timezone at the given instant.
 */
export function getLocalMinute(ianaName: string, displayedTime: Date): number {
  return Number.parseInt(getLocalDateTimeParts(ianaName, displayedTime).minute, 10);
}

/**
 * Get the local second (0–59) for a timezone at the given instant.
 */
export function getLocalSecond(ianaName: string, displayedTime: Date): number {
  return Number.parseInt(getLocalDateTimeParts(ianaName, displayedTime).second, 10);
}

// ---------------------------------------------------------------------------
// Ring Angle
// ---------------------------------------------------------------------------

/**
 * Compute the Ring Angle (in degrees) for a timezone at the Displayed Time.
 *
 * Mapping (Requirement 3.2):
 *   0°   = midnight (12-o'clock)
 *   90°  = 06:00   (3-o'clock)
 *   180° = noon    (6-o'clock)
 *   270° = 18:00   (9-o'clock)
 *
 * Includes fractional minutes (Requirement 3.3):
 *   09:30 → 142.5°
 */
export function computeRingAngle(ianaName: string, displayedTime: Date): number {
  const localHours = getLocalHour(ianaName, displayedTime);
  const localMinutes = getLocalMinute(ianaName, displayedTime);
  const totalMinutes = localHours * 60 + localMinutes;
  return (totalMinutes / 1440) * 360;
}

// ---------------------------------------------------------------------------
// DST-Aware UTC Offset (fixes Requirement 16.1)
// ---------------------------------------------------------------------------

/**
 * Compute the UTC offset string (e.g. "+05:30", "-08:00") for a timezone
 * at a specific instant. This uses the *displayedTime*, not Date.now(),
 * ensuring DST-correctness for historical and future times.
 */
export function getUtcOffsetAtTime(ianaName: string, displayedTime: Date): string {
  const canonical = canonicalizeTimezoneId(ianaName);
  try {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone: canonical,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    });

    const parts = dtf.formatToParts(displayedTime);
    const get = (type: Intl.DateTimeFormatPartTypes): string =>
      parts.find((p) => p.type === type)?.value ?? '00';

    // Reconstruct the local wall-clock time as a UTC timestamp
    const asUtcMs = Date.UTC(
      Number.parseInt(get('year'), 10),
      Number.parseInt(get('month'), 10) - 1,
      Number.parseInt(get('day'), 10),
      Number.parseInt(get('hour'), 10),
      Number.parseInt(get('minute'), 10),
      Number.parseInt(get('second'), 10),
    );

    const offsetMinutes = Math.round((asUtcMs - displayedTime.getTime()) / 60_000);
    const sign = offsetMinutes >= 0 ? '+' : '-';
    const abs = Math.abs(offsetMinutes);
    const hours = String(Math.floor(abs / 60)).padStart(2, '0');
    const minutes = String(abs % 60).padStart(2, '0');

    return `${sign}${hours}:${minutes}`;
  } catch {
    return '+00:00';
  }
}

// ---------------------------------------------------------------------------
// ISO 8601 Formatting (fixes Requirement 16.3)
// ---------------------------------------------------------------------------

/**
 * Format a Displayed Time as an ISO 8601 string with the correct DST-aware
 * UTC offset suffix for the given timezone.
 *
 * Output: YYYY-MM-DDTHH:MM:SS±HH:MM
 * Must be round-trippable through Date.parse().
 */
export function formatISO8601(ianaName: string, displayedTime: Date): string {
  const p = getLocalDateTimeParts(ianaName, displayedTime);
  const offset = getUtcOffsetAtTime(ianaName, displayedTime);
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}${offset}`;
}

// ---------------------------------------------------------------------------
// Display Format Formatters
// ---------------------------------------------------------------------------

/**
 * Format time in 24-hour format: HH:MM:SS
 */
export function format24h(ianaName: string, displayedTime: Date): string {
  const p = getLocalDateTimeParts(ianaName, displayedTime);
  return `${p.hour}:${p.minute}:${p.second}`;
}

/**
 * Format time in 12-hour format: h:MM:SS AM/PM
 */
export function format12h(ianaName: string, displayedTime: Date): string {
  const p = getLocalDateTimeParts(ianaName, displayedTime);
  const hour24 = Number.parseInt(p.hour, 10);
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
  return `${hour12}:${p.minute}:${p.second} ${period}`;
}

/**
 * Format time as a Unix timestamp (integer seconds).
 * Zone-independent — same value for all orbs at the same Displayed Time
 * (fixes Requirement 16.4).
 */
export function formatUnix(displayedTime: Date): number {
  return Math.floor(displayedTime.getTime() / 1000);
}

/**
 * Format a Displayed Time according to the active display format.
 *
 * For Unix format, the ianaName is ignored because Unix timestamps are
 * zone-independent (Requirement 16.4).
 */
export function formatTime(
  ianaName: string,
  displayedTime: Date,
  format: DisplayFormat,
): string {
  switch (format) {
    case '24h':
      return format24h(ianaName, displayedTime);
    case '12h':
      return format12h(ianaName, displayedTime);
    case 'iso':
      return formatISO8601(ianaName, displayedTime);
    case 'unix':
      return String(formatUnix(displayedTime));
  }
}
