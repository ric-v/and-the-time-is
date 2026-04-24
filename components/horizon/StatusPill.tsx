'use client';

import React, { useMemo } from 'react';
import { useAppSelector } from '../../store/store';
import { useDisplayedTime } from '../../hooks/useDisplayedTime';

/**
 * Format a scrub offset (in minutes) as a human-readable signed string.
 * Examples: "+4h 15m ahead", "-2h 30m ago", "+30m ahead", "-12h ago"
 */
function formatScrubOffset(offsetMinutes: number): string {
  const abs = Math.abs(offsetMinutes);
  const hours = Math.floor(abs / 60);
  const minutes = abs % 60;
  const direction = offsetMinutes > 0 ? 'ahead' : 'ago';

  if (hours === 0) {
    return `${offsetMinutes > 0 ? '+' : '-'}${minutes}m ${direction}`;
  }
  if (minutes === 0) {
    return `${offsetMinutes > 0 ? '+' : '-'}${hours}h ${direction}`;
  }
  return `${offsetMinutes > 0 ? '+' : '-'}${hours}h ${minutes}m ${direction}`;
}

/**
 * Format a Date as "Tue 24 Apr, 08:30" style short date with time.
 */
function formatDisplayedDate(date: Date): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}, ${h}:${m}`;
}

/**
 * StatusPill — shows "Live" with pulsing dot when offset is 0,
 * or signed offset readout with solid dot when scrubbed.
 *
 * Includes the Displayed Date in small text after a middle-dot separator.
 *
 * Specs:
 * - Glass styling: 28px tall, 18px border-radius, 12px horizontal padding
 * - Live dot: 2s pulse between 100% and 40% opacity, infinite, paused during scrub
 * - Scrubbed dot: solid, non-pulsing
 *
 * Requirements: 22.1, 22.2, 22.3
 * UI-UX-Spec: Section 5.2 — Bottom Bar center cluster, Section 10.4 — Micro-interactions
 */
const StatusPill: React.FC = () => {
  const scrubOffset = useAppSelector((s) => s.scrub.offset);
  const displayedTime = useDisplayedTime();
  const isLive = scrubOffset === 0;

  const statusText = useMemo(
    () => (isLive ? 'Live' : formatScrubOffset(scrubOffset)),
    [isLive, scrubOffset],
  );

  const dateText = useMemo(
    () => formatDisplayedDate(displayedTime),
    [displayedTime],
  );

  return (
    <div
      role="status"
      tabIndex={0}
      aria-label={`Status: ${statusText}. ${dateText}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        height: 28,
        borderRadius: 18,
        padding: '0 12px',
        background: 'var(--chrome-glass, rgba(12, 14, 28, 0.35))',
        backdropFilter: 'blur(12px) saturate(140%)',
        WebkitBackdropFilter: 'blur(12px) saturate(140%)',
        border: '1px solid var(--chrome-border, rgba(255,255,255,0.10))',
        whiteSpace: 'nowrap',
        outline: 'none',
      }}
      className="orb-button-focus"
    >
      {/* Status dot */}
      <span
        style={{
          display: 'inline-block',
          width: 6,
          height: 6,
          borderRadius: '50%',
          backgroundColor: isLive
            ? 'var(--accent, #f4c572)'
            : 'var(--chrome-text-secondary, rgba(255,255,255,0.62))',
          flexShrink: 0,
          animation: isLive ? 'statusPillPulse 2s ease-in-out infinite' : 'none',
        }}
        aria-hidden="true"
      />

      {/* Status text */}
      <span
        style={{
          fontSize: 13,
          lineHeight: 1.45,
          fontWeight: 500,
          color: isLive
            ? 'var(--accent, #f4c572)'
            : 'var(--chrome-text-primary, rgba(255,255,255,0.92))',
          letterSpacing: '0.01em',
          fontFeatureSettings: '"tnum"',
        }}
      >
        {statusText}
      </span>

      {/* Middle-dot separator */}
      <span
        style={{
          fontSize: 13,
          color: 'var(--chrome-text-muted, rgba(255,255,255,0.38))',
        }}
        aria-hidden="true"
      >
        ·
      </span>

      {/* Displayed date */}
      <span
        style={{
          fontSize: 11,
          lineHeight: 1.4,
          fontWeight: 400,
          color: 'var(--chrome-text-secondary, rgba(255,255,255,0.62))',
          fontFeatureSettings: '"tnum"',
          letterSpacing: '0.01em',
        }}
      >
        {dateText}
      </span>

      {/* Keyframe animation for the pulsing dot */}
      <style>{`
        @keyframes statusPillPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
};

export default StatusPill;
