'use client';

import React, { useEffect, useRef } from 'react';
import { useAppSelector } from '../../store/store';
import { useAriaAnnouncer } from '../../hooks/useAriaAnnouncer';
import type { Orb } from '../../store/orbSlice';
import type { DisplayFormat } from '../../store/settingsSlice';

/**
 * Formats a scrub offset (in minutes) into a human-readable string.
 * Examples: "+4h 30m", "-2h 15m", "0" (live).
 */
function formatOffset(minutes: number): string {
  if (minutes === 0) return 'now';
  const sign = minutes > 0 ? '+' : '-';
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  if (h === 0) return `${sign}${m}m`;
  if (m === 0) return `${sign}${h}h`;
  return `${sign}${h}h ${m}m`;
}

/**
 * Maps a display format key to a human-readable label.
 */
function formatLabel(fmt: DisplayFormat): string {
  switch (fmt) {
    case '24h':
      return '24-hour';
    case '12h':
      return '12-hour';
    case 'iso':
      return 'ISO 8601';
    case 'unix':
      return 'Unix timestamp';
    default:
      return fmt;
  }
}

/**
 * AriaLiveRegion — a visually hidden status region that announces
 * significant state changes to screen readers.
 *
 * Watches Redux state for:
 *   - Scrub offset commits (when scrubbing stops)
 *   - Zone additions / removals
 *   - Anchor orb changes
 *   - Display format changes
 *
 * Requirements: 13.4, 13.5
 * UI-UX-Spec: Section 14 — Accessibility specifics
 */
const AriaLiveRegion: React.FC = () => {
  const { message, announce } = useAriaAnnouncer();

  // Redux state selectors
  const scrubOffset = useAppSelector((s) => s.scrub.offset);
  const scrubbingInProgress = useAppSelector((s) => s.scrub.scrubbingInProgress);
  const orbList = useAppSelector((s) => s.orbs.list);
  const anchorOrbId = useAppSelector((s) => s.settings.anchorOrbId);
  const displayFormat = useAppSelector((s) => s.settings.displayFormat);

  // Refs to track previous values for diffing
  const prevScrubOffset = useRef(scrubOffset);
  const prevScrubbingInProgress = useRef(scrubbingInProgress);
  const prevOrbList = useRef<Orb[]>(orbList);
  const prevAnchorOrbId = useRef(anchorOrbId);
  const prevDisplayFormat = useRef(displayFormat);
  const isInitialMount = useRef(true);

  // -----------------------------------------------------------------------
  // Announce scrub offset commits (when user finishes scrubbing)
  // -----------------------------------------------------------------------
  useEffect(() => {
    // Skip initial mount
    if (isInitialMount.current) return;

    // Announce when scrubbing stops and offset changed
    const wasScrubbing = prevScrubbingInProgress.current;
    const offsetChanged = scrubOffset !== prevScrubOffset.current;

    if (wasScrubbing && !scrubbingInProgress && offsetChanged) {
      announce(`Scrub offset set to ${formatOffset(scrubOffset)}`);
    }

    // Also announce keyboard-driven offset changes (no scrubbing flag)
    if (!wasScrubbing && !scrubbingInProgress && offsetChanged) {
      announce(`Scrub offset set to ${formatOffset(scrubOffset)}`);
    }

    prevScrubOffset.current = scrubOffset;
    prevScrubbingInProgress.current = scrubbingInProgress;
  }, [scrubOffset, scrubbingInProgress, announce]);

  // -----------------------------------------------------------------------
  // Announce zone additions and removals
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (isInitialMount.current) return;

    const prevIds = new Set(prevOrbList.current.map((o) => o.id));
    const currIds = new Set(orbList.map((o) => o.id));

    // Find added orbs
    const added = orbList.filter((o) => !prevIds.has(o.id));
    // Find removed orbs
    const removed = prevOrbList.current.filter((o) => !currIds.has(o.id));

    if (added.length > 0) {
      announce(`${added.map((o) => o.label).join(', ')} added`);
    } else if (removed.length > 0) {
      announce(`${removed.map((o) => o.label).join(', ')} removed`);
    }

    prevOrbList.current = orbList;
  }, [orbList, announce]);

  // -----------------------------------------------------------------------
  // Announce anchor changes
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (isInitialMount.current) return;

    if (anchorOrbId !== prevAnchorOrbId.current) {
      if (anchorOrbId === null) {
        announce('Anchor reset to local timezone');
      } else {
        const anchorOrb = orbList.find((o) => o.id === anchorOrbId);
        const label = anchorOrb?.label ?? 'selected zone';
        announce(`Anchor set to ${label}`);
      }
    }

    prevAnchorOrbId.current = anchorOrbId;
  }, [anchorOrbId, orbList, announce]);

  // -----------------------------------------------------------------------
  // Announce format changes
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (isInitialMount.current) return;

    if (displayFormat !== prevDisplayFormat.current) {
      announce(`Format changed to ${formatLabel(displayFormat)}`);
    }

    prevDisplayFormat.current = displayFormat;
  }, [displayFormat, announce]);

  // -----------------------------------------------------------------------
  // Mark initial mount complete after first render cycle
  // -----------------------------------------------------------------------
  useEffect(() => {
    // Use a timeout to ensure all initial effects have run
    const id = setTimeout(() => {
      isInitialMount.current = false;
    }, 100);
    return () => clearTimeout(id);
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: 0,
      }}
    >
      {message}
    </div>
  );
};

export default AriaLiveRegion;
