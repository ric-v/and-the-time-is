/**
 * TimeDisplay — Renders formatted time with proper digit hierarchy.
 *
 * Digit hierarchy (Requirement 16.6, UI-UX-Spec Section 4.3):
 * - Hours: highest emphasis (full opacity, heavier weight)
 * - Minutes: medium emphasis (slightly reduced opacity)
 * - Seconds: lowest emphasis (most reduced opacity)
 * - Colon separators: 40% opacity
 *
 * Text treatment (UI-UX-Spec Section 4.3):
 * - Always tabular-nums
 * - Letter-spacing 0.02em
 * - Colon separators at 40% opacity
 *
 * Handles all display formats:
 * - 24h: HH:MM:SS — digit hierarchy applied
 * - 12h: h:MM:SS AM/PM — digit hierarchy applied, AM/PM at seconds emphasis
 * - ISO/Unix + preset date formats: rendered as full string in monospace
 *
 * Requirements: 10.1, 10.2, 10.4, 10.5, 16.3, 16.4, 16.6
 */

import React from 'react';
import type { DisplayFormat } from '../../store/settingsSlice';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TimeDisplayProps {
  /** The pre-formatted time string from formatTime(). */
  formattedTime: string;
  /** The active display format (determines parsing strategy). */
  displayFormat: DisplayFormat;
  /** Base font size in pixels. */
  fontSize?: number;
  /** Base font weight. */
  fontWeight?: number;
  /** Base text color. */
  color?: string;
  /** Additional className. */
  className?: string;
  /** Additional inline styles. */
  style?: React.CSSProperties;
}

// ---------------------------------------------------------------------------
// Opacity levels for digit hierarchy
// ---------------------------------------------------------------------------

/** Hours: full emphasis */
const HOUR_OPACITY = 1.0;
/** Minutes: medium emphasis */
const MINUTE_OPACITY = 0.78;
/** Seconds: lowest emphasis */
const SECOND_OPACITY = 0.52;
/** Colon separators: 40% opacity per spec */
const COLON_OPACITY = 0.4;
/** AM/PM indicator: same as seconds */
const PERIOD_OPACITY = SECOND_OPACITY;

// ---------------------------------------------------------------------------
// Parsers
// ---------------------------------------------------------------------------

interface TimePart {
  text: string;
  opacity: number;
  isColon?: boolean;
  isMono?: boolean;
}

/**
 * Parse a 24h formatted time "HH:MM:SS" into parts with hierarchy.
 */
function parse24h(formatted: string): TimePart[] {
  const parts = formatted.split(':');
  if (parts.length < 2) return [{ text: formatted, opacity: HOUR_OPACITY }];

  const result: TimePart[] = [
    { text: parts[0], opacity: HOUR_OPACITY },
    { text: ':', opacity: COLON_OPACITY, isColon: true },
    { text: parts[1], opacity: MINUTE_OPACITY },
  ];

  if (parts.length >= 3) {
    result.push(
      { text: ':', opacity: COLON_OPACITY, isColon: true },
      { text: parts[2], opacity: SECOND_OPACITY },
    );
  }

  return result;
}

/**
 * Parse a 12h formatted time "h:MM:SS AM/PM" into parts with hierarchy.
 */
function parse12h(formatted: string): TimePart[] {
  // Split off the AM/PM suffix
  const match = formatted.match(/^(.+)\s+(AM|PM)$/i);
  if (!match) return parse24h(formatted);

  const timePart = match[1];
  const period = match[2];
  const parts = timePart.split(':');

  const result: TimePart[] = [
    { text: parts[0], opacity: HOUR_OPACITY },
    { text: ':', opacity: COLON_OPACITY, isColon: true },
    { text: parts[1], opacity: MINUTE_OPACITY },
  ];

  if (parts.length >= 3) {
    result.push(
      { text: ':', opacity: COLON_OPACITY, isColon: true },
      { text: parts[2], opacity: SECOND_OPACITY },
    );
  }

  // AM/PM at seconds-level emphasis
  result.push(
    { text: ' ', opacity: COLON_OPACITY, isColon: true },
    { text: period, opacity: PERIOD_OPACITY },
  );

  return result;
}

/**
 * Parse an ISO 8601 string — rendered as-is in monospace, no hierarchy.
 */
function parseISO(formatted: string): TimePart[] {
  return [{ text: formatted, opacity: HOUR_OPACITY, isMono: true }];
}

/**
 * Parse a Unix timestamp — rendered as-is in monospace, no hierarchy.
 */
function parseUnix(formatted: string): TimePart[] {
  return [{ text: formatted, opacity: HOUR_OPACITY, isMono: true }];
}

/**
 * Parse a formatted time string into parts based on the display format.
 */
function parseFormattedTime(
  formatted: string,
  format: DisplayFormat,
): TimePart[] {
  switch (format) {
    case 'local':
      return parse24h(formatted);
    case '24h':
      return parse24h(formatted);
    case '12h':
      return parse12h(formatted);
    case 'iso':
    case 'ymd24':
    case 'ymd12':
    case 'mdy24':
    case 'mdy12':
    case 'readable':
      return parseISO(formatted);
    case 'unix':
      return parseUnix(formatted);
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const TimeDisplay: React.FC<TimeDisplayProps> = ({
  formattedTime,
  displayFormat,
  fontSize = 18,
  fontWeight = 500,
  color = 'rgba(255, 255, 255, 0.92)',
  className,
  style,
}) => {
  const parts = parseFormattedTime(formattedTime, displayFormat);

  // For ISO and Unix, use a slightly smaller font to accommodate length
  const isMonoFormat = displayFormat === 'iso' || displayFormat === 'unix';
  const effectiveFontSize = isMonoFormat
    ? Math.max(fontSize * 0.75, 10)
    : fontSize;

  return (
    <span
      className={className}
      style={{
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: '0.02em',
        fontFamily: isMonoFormat
          ? 'var(--font-mono, ui-monospace, "SF Mono", Menlo, monospace)'
          : undefined,
        fontSize: effectiveFontSize,
        fontWeight,
        lineHeight: 1.4,
        whiteSpace: 'nowrap',
        display: 'inline-flex',
        alignItems: 'baseline',
        ...style,
      }}
      aria-label={formattedTime}
    >
      {parts.map((part, i) => (
        <span
          key={i}
          style={{
            color,
            opacity: part.opacity,
            fontFamily: part.isMono
              ? 'var(--font-mono, ui-monospace, "SF Mono", Menlo, monospace)'
              : undefined,
            // Colons get slightly tighter spacing
            ...(part.isColon && {
              margin: '0 -0.5px',
            }),
          }}
        >
          {part.text}
        </span>
      ))}
    </span>
  );
};

export default React.memo(TimeDisplay);
