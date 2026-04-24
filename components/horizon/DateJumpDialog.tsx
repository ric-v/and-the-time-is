'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/store';
import { setDateJumpOpen } from '../../store/sessionSlice';
import { setScrubOffset } from '../../store/scrubSlice';
import { formatTime, getDisplayedTime } from '../../utils/timeEngine';
import type { Orb } from '../../store/orbSlice';
import type { DisplayFormat } from '../../store/settingsSlice';
import OverlayBackdrop from './OverlayBackdrop';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import TimeDisplay from './TimeDisplay';

/**
 * DateJumpDialog — overlay dialog for jumping to an arbitrary date/time.
 *
 * Three input tabs:
 *   1. Picker — native date + time inputs
 *   2. ISO 8601 — monospace input with live validation
 *   3. Unix — integer input with seconds/milliseconds toggle
 *
 * Features:
 *   - "Interpret in:" timezone picker defaulting to Local Orb
 *   - Live preview pane showing resulting Displayed Time in all pinned zones
 *   - On submit: compute signed minute difference from real time, dispatch to scrubSlice
 *   - Close on Escape, backdrop click, or successful submission
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8
 * UI-UX-Spec: Section 9.2 — Date Jump dialog
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TabId = 'picker' | 'iso' | 'unix';
type UnixUnit = 'seconds' | 'milliseconds';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format a Date to YYYY-MM-DD for the date input */
function toDateInputValue(date: Date, ianaName: string): string {
  const dtf = new Intl.DateTimeFormat('en-CA', {
    timeZone: ianaName,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return dtf.format(date);
}

/** Format a Date to HH:MM for the time input */
function toTimeInputValue(date: Date, ianaName: string): string {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: ianaName,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  return dtf.format(date);
}

/**
 * Parse a date string + time string interpreted in a given timezone
 * and return a UTC Date object.
 */
function parseDateTimeInTimezone(
  dateStr: string,
  timeStr: string,
  ianaName: string,
): Date | null {
  if (!dateStr || !timeStr) return null;
  try {
    // Build an ISO-like string and use Intl to figure out the offset
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hour, minute] = timeStr.split(':').map(Number);
    if (
      isNaN(year) || isNaN(month) || isNaN(day) ||
      isNaN(hour) || isNaN(minute)
    ) {
      return null;
    }

    // Create a date in UTC, then adjust for the timezone offset
    // We use a binary search approach: create a candidate UTC date,
    // check what local time it maps to in the target timezone, and adjust.
    const candidateUtc = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone: ianaName,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    });

    const parts = dtf.formatToParts(candidateUtc);
    const get = (type: Intl.DateTimeFormatPartTypes): number =>
      Number.parseInt(parts.find((p) => p.type === type)?.value ?? '0', 10);

    const localH = get('hour');
    const localM = get('minute');
    const localDay = get('day');
    const localMonth = get('month');

    // Compute the difference between what we wanted and what we got
    const wantedMinutes = hour * 60 + minute;
    const gotMinutes = localH * 60 + localM;
    let diffMinutes = wantedMinutes - gotMinutes;

    // Handle day boundary crossings
    if (day !== localDay || month !== localMonth) {
      // Rough correction: if the local day is different, adjust by ±24h
      if (localDay < day || localMonth < month) {
        diffMinutes += 1440;
      } else {
        diffMinutes -= 1440;
      }
    }

    return new Date(candidateUtc.getTime() + diffMinutes * 60_000);
  } catch {
    return null;
  }
}

/** Validate an ISO 8601 string and return a Date or null */
function parseISO8601(input: string): Date | null {
  if (!input.trim()) return null;
  const ms = Date.parse(input.trim());
  if (isNaN(ms)) return null;
  return new Date(ms);
}

/** Parse a Unix timestamp string, auto-detecting seconds vs milliseconds */
function parseUnixTimestamp(
  input: string,
  unit: UnixUnit,
): Date | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const num = Number(trimmed);
  if (isNaN(num) || !Number.isFinite(num)) return null;
  const ms = unit === 'milliseconds' ? num : num * 1000;
  return new Date(ms);
}

/** Auto-detect if a Unix value is in seconds or milliseconds */
function detectUnixUnit(input: string): UnixUnit {
  const num = Number(input.trim());
  if (isNaN(num)) return 'seconds';
  return Math.abs(num) > 1e12 ? 'milliseconds' : 'seconds';
}

/** Compute scrub offset in minutes from a target Date */
function computeScrubOffset(targetDate: Date): number {
  return (targetDate.getTime() - Date.now()) / 60_000;
}

// ---------------------------------------------------------------------------
// Tab Button
// ---------------------------------------------------------------------------

const TabButton: React.FC<{
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, isActive, onClick }) => (
  <button
    type="button"
    role="tab"
    aria-selected={isActive}
    onClick={onClick}
    style={{
      flex: 1,
      height: 36,
      padding: '0 16px',
      fontSize: 13,
      fontWeight: isActive ? 500 : 400,
      lineHeight: 1.4,
      color: isActive
        ? 'rgba(20, 18, 14, 0.9)'
        : 'var(--chrome-text-secondary, rgba(255,255,255,0.62))',
      background: isActive ? 'var(--accent, #f4c572)' : 'transparent',
      border: 'none',
      borderRadius: 8,
      cursor: 'pointer',
      transition: 'all 150ms ease-out',
      whiteSpace: 'nowrap',
    }}
  >
    {label}
  </button>
);

// ---------------------------------------------------------------------------
// Preview Pane
// ---------------------------------------------------------------------------

const PreviewPane: React.FC<{
  targetDate: Date | null;
  orbs: Orb[];
  displayFormat: DisplayFormat;
}> = ({ targetDate, orbs, displayFormat }) => {
  if (!targetDate || orbs.length === 0) {
    return (
      <div
        style={{
          padding: '12px 0',
          fontSize: 13,
          color: 'var(--chrome-text-muted, rgba(255,255,255,0.38))',
          textAlign: 'center',
        }}
      >
        {targetDate === null
          ? 'Enter a valid date/time to see preview'
          : 'No pinned zones'}
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
      }}
    >
      {orbs.map((orb, i) => {
        const formatted = formatTime(orb.ianaName, targetDate, displayFormat);
        return (
          <div
            key={orb.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 8px',
              borderRadius: 6,
              background:
                i % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'transparent',
            }}
          >
            <span
              style={{
                fontSize: 13,
                fontWeight: 400,
                color: 'var(--chrome-text-primary, rgba(255,255,255,0.92))',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {orb.label}
              {orb.isLocal && (
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--accent, #f4c572)',
                    background: 'var(--accent-soft, rgba(244,197,114,0.18))',
                    padding: '1px 5px',
                    borderRadius: 6,
                  }}
                >
                  YOU
                </span>
              )}
            </span>
            <TimeDisplay
              formattedTime={formatted}
              displayFormat={displayFormat}
              fontSize={13}
              fontWeight={400}
              color="var(--chrome-text-primary, rgba(255,255,255,0.92))"
            />
          </div>
        );
      })}
    </div>
  );
};


// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const DateJumpDialog: React.FC = () => {
  const dispatch = useAppDispatch();
  const dateJumpOpen = useAppSelector((s) => s.session.dateJumpOpen);
  const orbs = useAppSelector((s) => s.orbs.list);
  const displayFormat = useAppSelector((s) => s.settings.displayFormat);
  const scrubOffset = useAppSelector((s) => s.scrub.offset);

  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef, dateJumpOpen);

  // -----------------------------------------------------------------------
  // Local Orb detection
  // -----------------------------------------------------------------------
  const localOrb = useMemo(
    () => orbs.find((o) => o.isLocal) ?? null,
    [orbs],
  );
  const localIana = useMemo(
    () =>
      localOrb?.ianaName ??
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    [localOrb],
  );

  // -----------------------------------------------------------------------
  // Tab state
  // -----------------------------------------------------------------------
  const [activeTab, setActiveTab] = useState<TabId>('picker');

  // -----------------------------------------------------------------------
  // Picker tab state
  // -----------------------------------------------------------------------
  const now = useMemo(() => getDisplayedTime(scrubOffset), [scrubOffset]);
  const [pickerDate, setPickerDate] = useState(() =>
    toDateInputValue(now, localIana),
  );
  const [pickerTime, setPickerTime] = useState(() =>
    toTimeInputValue(now, localIana),
  );
  const [interpretInZone, setInterpretInZone] = useState(localIana);

  // -----------------------------------------------------------------------
  // ISO tab state
  // -----------------------------------------------------------------------
  const [isoInput, setIsoInput] = useState('');
  const [isoValid, setIsoValid] = useState<boolean | null>(null);

  // -----------------------------------------------------------------------
  // Unix tab state
  // -----------------------------------------------------------------------
  const [unixInput, setUnixInput] = useState('');
  const [unixUnit, setUnixUnit] = useState<UnixUnit>('seconds');

  // -----------------------------------------------------------------------
  // Reset state when dialog opens
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (dateJumpOpen) {
      const current = getDisplayedTime(scrubOffset);
      setPickerDate(toDateInputValue(current, localIana));
      setPickerTime(toTimeInputValue(current, localIana));
      setInterpretInZone(localIana);
      setIsoInput('');
      setIsoValid(null);
      setUnixInput('');
      setUnixUnit('seconds');
      setActiveTab('picker');
    }
  }, [dateJumpOpen, scrubOffset, localIana]);

  // -----------------------------------------------------------------------
  // Compute target date from current tab
  // -----------------------------------------------------------------------
  const targetDate = useMemo((): Date | null => {
    switch (activeTab) {
      case 'picker':
        return parseDateTimeInTimezone(pickerDate, pickerTime, interpretInZone);
      case 'iso':
        return parseISO8601(isoInput);
      case 'unix':
        return parseUnixTimestamp(unixInput, unixUnit);
    }
  }, [activeTab, pickerDate, pickerTime, interpretInZone, isoInput, unixInput, unixUnit]);

  // -----------------------------------------------------------------------
  // ISO validation effect
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (activeTab !== 'iso') return;
    if (!isoInput.trim()) {
      setIsoValid(null);
      return;
    }
    const parsed = parseISO8601(isoInput);
    setIsoValid(parsed !== null);
  }, [isoInput, activeTab]);

  // -----------------------------------------------------------------------
  // Unix auto-detect effect
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (activeTab !== 'unix') return;
    if (!unixInput.trim()) return;
    setUnixUnit(detectUnixUnit(unixInput));
  }, [unixInput, activeTab]);

  // -----------------------------------------------------------------------
  // Handlers
  // -----------------------------------------------------------------------
  const handleClose = useCallback(() => {
    dispatch(setDateJumpOpen(false));
  }, [dispatch]);

  const handleJump = useCallback(() => {
    if (!targetDate) return;
    const offsetMinutes = computeScrubOffset(targetDate);
    dispatch(setScrubOffset(offsetMinutes));
    dispatch(setDateJumpOpen(false));
  }, [dispatch, targetDate]);

  // -----------------------------------------------------------------------
  // Timezone options for "Interpret in:" picker
  // -----------------------------------------------------------------------
  const timezoneOptions = useMemo(() => {
    const seen = new Set<string>();
    const options: Array<{ ianaName: string; label: string }> = [];
    for (const orb of orbs) {
      if (!seen.has(orb.ianaName)) {
        seen.add(orb.ianaName);
        options.push({ ianaName: orb.ianaName, label: orb.label });
      }
    }
    return options;
  }, [orbs]);

  // -----------------------------------------------------------------------
  // Don't render when closed
  // -----------------------------------------------------------------------
  if (!dateJumpOpen) return null;

  const isValid = targetDate !== null;

  return (
    <OverlayBackdrop
      isOpen={dateJumpOpen}
      onClose={handleClose}
      ariaLabel="Date jump dialog"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Jump to date"
        style={{
          width: 640,
          maxWidth: '100vw',
          maxHeight: 640,
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--chrome-glass, rgba(12, 14, 28, 0.35))',
          backdropFilter: 'blur(28px) saturate(140%)',
          WebkitBackdropFilter: 'blur(28px) saturate(140%)',
          borderRadius: 20,
          border: '1px solid var(--chrome-border, rgba(255,255,255,0.10))',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px 12px',
            borderBottom:
              '1px solid var(--chrome-border, rgba(255,255,255,0.10))',
            flexShrink: 0,
          }}
        >
          <h2
            style={{
              fontSize: 22,
              lineHeight: 1.35,
              fontWeight: 400,
              color:
                'var(--chrome-text-primary, rgba(255,255,255,0.92))',
              margin: 0,
            }}
          >
            Jump to Date
          </h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close date jump dialog"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28,
              borderRadius: 8,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color:
                'var(--chrome-text-secondary, rgba(255,255,255,0.62))',
              fontSize: 18,
              lineHeight: 1,
              transition: 'background 100ms ease-out',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background =
                'rgba(255,255,255,0.06)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background =
                'transparent';
            }}
          >
            ×
          </button>
        </div>

        {/* Scrollable content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {/* Tab bar */}
          <div
            role="tablist"
            aria-label="Input format"
            style={{
              display: 'flex',
              gap: 0,
              padding: 2,
              borderRadius: 10,
              background: 'rgba(255, 255, 255, 0.06)',
              border:
                '1px solid var(--chrome-border, rgba(255,255,255,0.10))',
            }}
          >
            <TabButton
              label="Picker"
              isActive={activeTab === 'picker'}
              onClick={() => setActiveTab('picker')}
            />
            <TabButton
              label="ISO 8601"
              isActive={activeTab === 'iso'}
              onClick={() => setActiveTab('iso')}
            />
            <TabButton
              label="Unix"
              isActive={activeTab === 'unix'}
              onClick={() => setActiveTab('unix')}
            />
          </div>

          {/* Tab content */}
          <div
            role="tabpanel"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            {activeTab === 'picker' && (
              <PickerTab
                pickerDate={pickerDate}
                pickerTime={pickerTime}
                interpretInZone={interpretInZone}
                timezoneOptions={timezoneOptions}
                onDateChange={setPickerDate}
                onTimeChange={setPickerTime}
                onZoneChange={setInterpretInZone}
              />
            )}

            {activeTab === 'iso' && (
              <ISOTab
                value={isoInput}
                isValid={isoValid}
                onChange={setIsoInput}
              />
            )}

            {activeTab === 'unix' && (
              <UnixTab
                value={unixInput}
                unit={unixUnit}
                onChange={setUnixInput}
                onUnitChange={setUnixUnit}
              />
            )}
          </div>

          {/* Preview pane */}
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color:
                  'var(--chrome-text-secondary, rgba(255,255,255,0.62))',
                marginBottom: 8,
              }}
            >
              Preview — Resulting time in pinned zones
            </div>
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: 10,
                border:
                  '1px solid var(--chrome-border, rgba(255,255,255,0.10))',
                padding: '4px 4px',
                maxHeight: 200,
                overflowY: 'auto',
              }}
            >
              <PreviewPane
                targetDate={targetDate}
                orbs={orbs}
                displayFormat={displayFormat}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 8,
            padding: '12px 20px 16px',
            borderTop:
              '1px solid var(--chrome-border, rgba(255,255,255,0.10))',
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={handleClose}
            style={{
              height: 36,
              padding: '0 16px',
              borderRadius: 18,
              border:
                '1px solid var(--chrome-border, rgba(255,255,255,0.10))',
              background: 'transparent',
              color:
                'var(--chrome-text-primary, rgba(255,255,255,0.92))',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background 100ms ease-out',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background =
                'rgba(255,255,255,0.06)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background =
                'transparent';
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleJump}
            disabled={!isValid}
            style={{
              height: 36,
              padding: '0 20px',
              borderRadius: 18,
              border: 'none',
              background: isValid
                ? 'var(--accent, #f4c572)'
                : 'rgba(255,255,255,0.08)',
              color: isValid
                ? 'rgba(20, 18, 14, 0.9)'
                : 'var(--chrome-text-muted, rgba(255,255,255,0.38))',
              fontSize: 13,
              fontWeight: 600,
              cursor: isValid ? 'pointer' : 'not-allowed',
              transition: 'all 150ms ease-out',
              opacity: isValid ? 1 : 0.6,
            }}
          >
            Jump
          </button>
        </div>
      </div>
    </OverlayBackdrop>
  );
};


// ---------------------------------------------------------------------------
// Picker Tab
// ---------------------------------------------------------------------------

const PickerTab: React.FC<{
  pickerDate: string;
  pickerTime: string;
  interpretInZone: string;
  timezoneOptions: Array<{ ianaName: string; label: string }>;
  onDateChange: (v: string) => void;
  onTimeChange: (v: string) => void;
  onZoneChange: (v: string) => void;
}> = ({
  pickerDate,
  pickerTime,
  interpretInZone,
  timezoneOptions,
  onDateChange,
  onTimeChange,
  onZoneChange,
}) => {
  const inputStyle: React.CSSProperties = {
    height: 40,
    padding: '0 12px',
    borderRadius: 8,
    border: '1px solid var(--chrome-border, rgba(255,255,255,0.10))',
    background: 'rgba(255, 255, 255, 0.06)',
    color: 'var(--chrome-text-primary, rgba(255,255,255,0.92))',
    fontSize: 15,
    fontFamily:
      'var(--font-inter, ui-sans-serif, system-ui, -apple-system, sans-serif)',
    outline: 'none',
    transition: 'border-color 150ms ease-out',
    colorScheme: 'dark',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label
            style={{
              fontSize: 11,
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--chrome-text-secondary, rgba(255,255,255,0.62))',
            }}
          >
            Date
          </label>
          <input
            type="date"
            value={pickerDate}
            onChange={(e) => onDateChange(e.target.value)}
            style={inputStyle}
            aria-label="Date"
          />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label
            style={{
              fontSize: 11,
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--chrome-text-secondary, rgba(255,255,255,0.62))',
            }}
          >
            Time
          </label>
          <input
            type="time"
            value={pickerTime}
            onChange={(e) => onTimeChange(e.target.value)}
            style={inputStyle}
            aria-label="Time"
          />
        </div>
      </div>

      {/* Interpret in: timezone picker */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label
          style={{
            fontSize: 11,
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--chrome-text-secondary, rgba(255,255,255,0.62))',
          }}
        >
          Interpret in
        </label>
        <select
          value={interpretInZone}
          onChange={(e) => onZoneChange(e.target.value)}
          style={{
            ...inputStyle,
            cursor: 'pointer',
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3 5l3 3 3-3' fill='none' stroke='rgba(255,255,255,0.62)' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 12px center',
            paddingRight: 32,
          }}
          aria-label="Interpret in timezone"
        >
          {timezoneOptions.map((opt) => (
            <option key={opt.ianaName} value={opt.ianaName}>
              {opt.label} ({opt.ianaName})
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// ISO 8601 Tab
// ---------------------------------------------------------------------------

const ISOTab: React.FC<{
  value: string;
  isValid: boolean | null;
  onChange: (v: string) => void;
}> = ({ value, isValid, onChange }) => {
  const borderColor =
    isValid === null
      ? 'var(--chrome-border, rgba(255,255,255,0.10))'
      : isValid
        ? 'rgba(120, 210, 160, 0.6)'
        : 'rgba(230, 120, 120, 0.6)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label
        style={{
          fontSize: 11,
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--chrome-text-secondary, rgba(255,255,255,0.62))',
        }}
      >
        ISO 8601 String
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="2025-12-25T09:00:00+05:30"
        autoComplete="off"
        spellCheck={false}
        style={{
          height: 48,
          padding: '0 14px',
          borderRadius: 8,
          border: `2px solid ${borderColor}`,
          background: 'rgba(255, 255, 255, 0.06)',
          color: 'var(--chrome-text-primary, rgba(255,255,255,0.92))',
          fontSize: 15,
          fontFamily:
            'var(--font-mono, ui-monospace, "SF Mono", Menlo, monospace)',
          outline: 'none',
          transition: 'border-color 150ms ease-out',
        }}
        aria-label="ISO 8601 date-time string"
        aria-invalid={isValid === false ? 'true' : undefined}
      />
      {isValid === false && (
        <span
          style={{
            fontSize: 11,
            color: 'var(--danger-text, #f2a8a8)',
            lineHeight: 1.4,
          }}
        >
          Invalid ISO 8601 format. Expected: YYYY-MM-DDTHH:MM:SS±HH:MM
        </span>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Unix Tab
// ---------------------------------------------------------------------------

const UnixTab: React.FC<{
  value: string;
  unit: UnixUnit;
  onChange: (v: string) => void;
  onUnitChange: (u: UnixUnit) => void;
}> = ({ value, unit, onChange, onUnitChange }) => {
  const isValid = value.trim() === '' || !isNaN(Number(value.trim()));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label
        style={{
          fontSize: 11,
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--chrome-text-secondary, rgba(255,255,255,0.62))',
        }}
      >
        Unix Timestamp
      </label>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="1735113600"
        autoComplete="off"
        spellCheck={false}
        style={{
          height: 48,
          padding: '0 14px',
          borderRadius: 8,
          border: `2px solid ${
            !isValid
              ? 'rgba(230, 120, 120, 0.6)'
              : 'var(--chrome-border, rgba(255,255,255,0.10))'
          }`,
          background: 'rgba(255, 255, 255, 0.06)',
          color: 'var(--chrome-text-primary, rgba(255,255,255,0.92))',
          fontSize: 15,
          fontFamily:
            'var(--font-mono, ui-monospace, "SF Mono", Menlo, monospace)',
          outline: 'none',
          transition: 'border-color 150ms ease-out',
        }}
        aria-label="Unix timestamp"
      />

      {/* Seconds / Milliseconds toggle */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--chrome-text-secondary, rgba(255,255,255,0.62))',
          }}
        >
          Unit:
        </span>
        <div
          style={{
            display: 'inline-flex',
            gap: 0,
            padding: 2,
            borderRadius: 8,
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid var(--chrome-border, rgba(255,255,255,0.10))',
          }}
        >
          {(['seconds', 'milliseconds'] as const).map((u) => {
            const isActive = unit === u;
            return (
              <button
                key={u}
                type="button"
                onClick={() => onUnitChange(u)}
                style={{
                  padding: '4px 10px',
                  fontSize: 12,
                  fontWeight: isActive ? 500 : 400,
                  color: isActive
                    ? 'rgba(20, 18, 14, 0.9)'
                    : 'var(--chrome-text-secondary, rgba(255,255,255,0.62))',
                  background: isActive
                    ? 'var(--accent, #f4c572)'
                    : 'transparent',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  transition: 'all 150ms ease-out',
                  textTransform: 'capitalize',
                }}
              >
                {u}
              </button>
            );
          })}
        </div>
        {value.trim() && (
          <span
            style={{
              fontSize: 11,
              color: 'var(--chrome-text-muted, rgba(255,255,255,0.38))',
              fontStyle: 'italic',
            }}
          >
            {unit === 'milliseconds' ? '(auto-detected: >10¹²)' : '(auto-detected: ≤10¹²)'}
          </span>
        )}
      </div>
    </div>
  );
};

export default React.memo(DateJumpDialog);
