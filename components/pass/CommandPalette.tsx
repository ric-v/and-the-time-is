'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/store';
import { setCommandPaletteOpen } from '../../store/sessionSlice';
import { addOrb, type Orb } from '../../store/orbSlice';
import { addRecentSearch } from '../../store/settingsSlice';
import { getDisplayedTime, getLocalHour, getUtcOffsetAtTime } from '../../utils/timeEngine';
import { getSkyState, SIX_STATE_PALETTE } from '../../utils/skyPaletteEngine';
import { getCurrentTime } from '../../utils/timeNow';
import { searchTimezones, isUsingFallback, type TimezoneResult } from '../../utils/timezoneCache';
import OverlayBackdrop from './OverlayBackdrop';
import { useIsMobile } from '../../hooks/useIsMobile';

/* ---------------------------------------------------------------------------
 * CommandPalette — keyboard-first add-zone overlay
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 15.1
 * UI-UX-Spec: Section 9.1 — Command Palette (Add zone)
 *
 * - 560px wide desktop, full-screen mobile (<768px)
 * - Search input: auto-focused, 48px tall, 150ms debounce, queries /api/timezones
 * - Result rows: city, country, IANA name, abbreviation, UTC offset, live sky swatch
 * - Arrow-key navigation + Enter-to-select
 * - Empty state: "Recent" (last 5) and "Popular" (IST, UTC, EST, PST, JST, CET, GMT, SGT)
 * - Already-pinned indicator (no-op on select, closes palette)
 * - Keyboard hint footer
 * -------------------------------------------------------------------------- */

/** Popular timezone abbreviations for the empty-state section */
const POPULAR_ABBREVIATIONS = ['IST', 'UTC', 'EST', 'PST', 'JST', 'CET', 'GMT', 'SGT'];

/** Map abbreviations to IANA names for the popular section */
const POPULAR_IANA_MAP: Record<string, string> = {
  IST: 'Asia/Kolkata',
  UTC: 'UTC',
  EST: 'America/New_York',
  PST: 'America/Los_Angeles',
  JST: 'Asia/Tokyo',
  CET: 'Europe/Paris',
  GMT: 'Europe/London',
  SGT: 'Asia/Singapore',
};

const CommandPalette: React.FC = () => {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((s) => s.session.commandPaletteOpen);
  const pinnedOrbs = useAppSelector((s) => s.orbs.list);
  const recentSearches = useAppSelector((s) => s.settings.recentSearches);
  const scrubOffset = useAppSelector((s) => s.scrub.offset);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TimezoneResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMobile = useIsMobile();

  const pinnedIanaNames = useMemo(
    () => new Set(pinnedOrbs.map((o) => o.ianaName)),
    [pinnedOrbs],
  );

  const displayedTime = useMemo(() => getDisplayedTime(scrubOffset), [scrubOffset]);

  // -------------------------------------------------------------------------
  // Reset state when palette opens/closes
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      setIsLoading(false);
      setIsOffline(false);
      // Auto-focus the input after a brief delay for the overlay animation
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // -------------------------------------------------------------------------
  // Debounced search (uses timezoneCache for caching + offline fallback)
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!query.trim()) {
      setResults([]);
      setSelectedIndex(0);
      return;
    }

    setIsLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await searchTimezones(query.trim());
        setResults(data);
        setSelectedIndex(0);
        setIsOffline(isUsingFallback());
      } catch {
        setResults([]);
        setIsOffline(true);
      } finally {
        setIsLoading(false);
      }
    }, 150);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // -------------------------------------------------------------------------
  // Build the empty-state lists (recent + popular)
  // -------------------------------------------------------------------------
  const recentItems = useMemo<TimezoneResult[]>(() => {
    return recentSearches
      .slice(0, 5)
      .map((ianaName) => buildTimezoneStub(ianaName))
      .filter(Boolean) as TimezoneResult[];
  }, [recentSearches]);

  const popularItems = useMemo<TimezoneResult[]>(() => {
    return POPULAR_ABBREVIATIONS.map((abbr) => {
      const iana = POPULAR_IANA_MAP[abbr];
      if (!iana) return null;
      return buildTimezoneStub(iana);
    }).filter(Boolean) as TimezoneResult[];
  }, []);

  // -------------------------------------------------------------------------
  // Determine which items to display
  // -------------------------------------------------------------------------
  const isEmptyState = !query.trim();
  const displayItems = isEmptyState ? [] : results;

  // For the empty state, we show sections separately
  const totalEmptyItems = recentItems.length + popularItems.length;
  const allEmptyItems = [...recentItems, ...popularItems];

  // The navigable items list (for arrow keys)
  const navigableItems = isEmptyState ? allEmptyItems : displayItems;

  // -------------------------------------------------------------------------
  // Keyboard navigation
  // -------------------------------------------------------------------------
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const count = navigableItems.length;
      if (count === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % count);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + count) % count);
          break;
        case 'Enter':
          e.preventDefault();
          if (navigableItems[selectedIndex]) {
            handleSelect(navigableItems[selectedIndex]);
          }
          break;
      }
    },
    [navigableItems, selectedIndex],
  );

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const selectedEl = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
    if (selectedEl) {
      selectedEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

  // -------------------------------------------------------------------------
  // Select a timezone
  // -------------------------------------------------------------------------
  const handleSelect = useCallback(
    (tz: TimezoneResult) => {
      const ianaName = tz.name || tz.timezone;

      // If already pinned, just close the palette (no-op)
      if (pinnedIanaNames.has(ianaName)) {
        dispatch(setCommandPaletteOpen(false));
        return;
      }

      // Create a new orb
      const newOrb: Orb = {
        id: crypto.randomUUID(),
        ianaName,
        label: tz.city,
        isLocal: false,
        createdAt: Date.now(),
        displayOrder: pinnedOrbs.length,
      };

      dispatch(addOrb(newOrb));
      dispatch(addRecentSearch(ianaName));
      dispatch(setCommandPaletteOpen(false));
    },
    [dispatch, pinnedIanaNames, pinnedOrbs.length],
  );

  // -------------------------------------------------------------------------
  // Close handler
  // -------------------------------------------------------------------------
  const handleClose = useCallback(() => {
    dispatch(setCommandPaletteOpen(false));
  }, [dispatch]);

  // -------------------------------------------------------------------------
  // Render a single result row
  // -------------------------------------------------------------------------
  const renderRow = (tz: TimezoneResult, index: number, isSelected: boolean) => {
    const ianaName = tz.name || tz.timezone;
    const isPinned = pinnedIanaNames.has(ianaName);
    const localHour = getLocalHour(ianaName, displayedTime);
    const skyState = getSkyState(localHour);
    const palette = SIX_STATE_PALETTE[skyState];
    const utcOffset = getUtcOffsetAtTime(ianaName, displayedTime);

    // Get abbreviation from the API's currentTime or compute it
    let abbreviation = '';
    try {
      abbreviation = getCurrentTime(ianaName, '%Z');
    } catch {
      abbreviation = '';
    }

    return (
      <button
        key={`${ianaName}-${index}`}
        data-index={index}
        type="button"
        onClick={() => handleSelect(tz)}
        onMouseEnter={() => setSelectedIndex(index)}
        aria-label={`${tz.city}, ${tz.country}, ${ianaName}${isPinned ? ' (already added)' : ''}`}
        className={`command-palette-row${isSelected ? ' is-selected' : ''}${isPinned ? ' is-pinned' : ''}`}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: palette.zenith,
            flexShrink: 0,
            border: '0.5px solid var(--rule-soft)',
          }}
          aria-hidden="true"
        />

        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <div
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 15,
              lineHeight: 1.5,
              fontWeight: 500,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {tz.city}
            <span style={{ color: 'var(--ink-muted)' }}>
              {' · '}
            </span>
            <span style={{ color: 'var(--ink-soft)' }}>
              {tz.country}
            </span>
            {isPinned && (
              <span
                style={{
                  marginLeft: 8,
                  fontSize: 11,
                  fontWeight: 500,
                  color: 'var(--ember)',
                  letterSpacing: '0.04em',
                }}
              >
                Added
              </span>
            )}
          </div>
          <div
            style={{
              fontSize: 11,
              lineHeight: 1.4,
              fontFamily: 'var(--font-meta)',
              color: 'var(--ink-muted)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {ianaName}
          </div>
        </div>

        <div
          style={{
            textAlign: 'right',
            flexShrink: 0,
            fontSize: 13,
            lineHeight: 1.45,
            fontFamily: 'var(--font-meta)',
            color: 'var(--ink-soft)',
            whiteSpace: 'nowrap',
          }}
        >
          {abbreviation && (
            <span style={{ marginRight: 6 }}>{abbreviation}</span>
          )}
          <span style={{ color: 'var(--ink-muted)' }}>
            UTC{utcOffset}
          </span>
        </div>
      </button>
    );
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <OverlayBackdrop
      isOpen={isOpen}
      onClose={handleClose}
      ariaLabel="Command palette — add timezone"
      panelClassName="command-palette-panel"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Add timezone"
        onKeyDown={handleKeyDown}
        className="obs-panel command-palette-dialog"
      >
        <div className="command-palette-search">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--ink-muted)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              style={{ flexShrink: 0 }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search city, IANA zone, UTC offset, abbreviation…"
              aria-label="Search timezones"
              autoComplete="off"
              spellCheck={false}
              className="command-palette-input"
            />
          </div>
        </div>

        {/* Results / Empty state */}
        <div
          ref={listRef}
          role="listbox"
          aria-label="Timezone results"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '4px 8px',
          }}
        >
          {isEmptyState ? (
            <>
              {/* Recent section */}
              {recentItems.length > 0 && (
                <div style={{ marginBottom: 4 }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-meta)',
                      fontSize: 11,
                      lineHeight: 1.4,
                      fontWeight: 500,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: 'var(--ink-muted)',
                      padding: '8px 12px 4px',
                    }}
                  >
                    Recent
                  </div>
                  {recentItems.map((tz, i) =>
                    renderRow(tz, i, selectedIndex === i),
                  )}
                </div>
              )}

              {/* Popular section */}
              <div>
                <div
                  style={{
                    fontSize: 11,
                    lineHeight: 1.4,
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--chrome-text-muted, rgba(255,255,255,0.38))',
                    padding: '8px 12px 4px',
                  }}
                >
                  Popular
                </div>
                {popularItems.map((tz, i) => {
                  const globalIndex = recentItems.length + i;
                  return renderRow(tz, globalIndex, selectedIndex === globalIndex);
                })}
              </div>
            </>
          ) : results.length > 0 ? (
            results.map((tz, i) => renderRow(tz, i, selectedIndex === i))
          ) : isLoading ? (
            <div
              style={{
                padding: '24px 12px',
                textAlign: 'center',
                fontSize: 13,
                color: 'var(--ink-muted)',
              }}
            >
              Searching…
            </div>
          ) : query.trim() ? (
            <div
              style={{
                padding: '24px 12px',
                textAlign: 'center',
                fontSize: 13,
                color: 'var(--ink-muted)',
              }}
            >
              No timezones found for &ldquo;{query}&rdquo;
            </div>
          ) : null}
        </div>

        {/* Offline search indicator */}
        {isOffline && (
          <div
            style={{
              padding: '6px 16px',
              borderTop: '0.5px solid var(--rule-soft)',
              fontFamily: 'var(--font-meta)',
              fontSize: 11,
              lineHeight: 1.4,
              fontWeight: 500,
              color: 'var(--ember)',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              letterSpacing: '0.02em',
            }}
            role="status"
            aria-live="polite"
          >
            {/* Offline icon */}
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="1" y1="1" x2="23" y2="23" />
              <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
              <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
              <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
              <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
              <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
              <line x1="12" y1="20" x2="12.01" y2="20" />
            </svg>
            <span>Offline search — using bundled timezone list</span>
          </div>
        )}

        {!isMobile && (
          <div className="command-palette-footer">
            <span>↑↓ to navigate</span>
            <span style={{ margin: '0 12px', opacity: 0.4 }}>·</span>
            <span>↵ to add</span>
            <span style={{ margin: '0 12px', opacity: 0.4 }}>·</span>
            <span>esc to close</span>
          </div>
        )}
      </div>
    </OverlayBackdrop>
  );
};

/* ---------------------------------------------------------------------------
 * Helper: build a TimezoneResult stub from an IANA name
 * Used for recent searches and popular items where we don't have full API data.
 * -------------------------------------------------------------------------- */
function buildTimezoneStub(ianaName: string): TimezoneResult {
  const city = ianaName.split('/').pop()?.replace(/_/g, ' ') || ianaName;
  // Derive a rough country from the region prefix
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

export default CommandPalette;
