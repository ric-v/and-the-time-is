/**
 * FormatControl — preset selector for global display format.
 *
 * Renders multiple presets, including locale-default and date+time variants.
 * Dispatches setDisplayFormat to settingsSlice on selection.
 * When Unix is selected, shows a small "UTC-referenced" hint.
 *
 * Used in:
 * - Settings Panel (primary)
 * - Scrub Control area (secondary mirror)
 *
 * Requirements: 10.1, 10.2, 10.3, 10.5
 */

import React from 'react';
import { useAppDispatch, useAppSelector } from '../../store/store';
import { setDisplayFormat } from '../../store/settingsSlice';
import type { DisplayFormat } from '../../store/settingsSlice';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FormatOption {
  value: DisplayFormat;
  label: string;
}

export interface FormatControlProps {
  /** Compact mode hides labels and uses shorter text. Used in Scrub Control. */
  compact?: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FORMAT_OPTIONS: FormatOption[] = [
  { value: 'local', label: 'Local (default)' },
  { value: '24h', label: '24h' },
  { value: '12h', label: '12h' },
  { value: 'iso', label: 'ISO' },
  { value: 'unix', label: 'Unix' },
  { value: 'ymd24', label: 'YYYY-MM-DD HH:MM:SS' },
  { value: 'ymd12', label: 'YYYY-MM-DD hh:MM:SS AM/PM' },
  { value: 'mdy24', label: 'MM/DD/YYYY HH:MM:SS' },
  { value: 'mdy12', label: 'MM/DD/YYYY hh:MM:SS AM/PM' },
  { value: 'readable', label: 'Readable (weekday + date + time)' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const FormatControl: React.FC<FormatControlProps> = ({ compact = false }) => {
  const dispatch = useAppDispatch();
  const displayFormat = useAppSelector((s) => s.settings.displayFormat);

  const handleSelect = (format: DisplayFormat) => {
    dispatch(setDisplayFormat(format));
  };

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 6, minWidth: compact ? 220 : 280 }}>
      <select
        aria-label="Time display format"
        value={displayFormat}
        onChange={(e) => handleSelect(e.target.value as DisplayFormat)}
        style={{
          appearance: 'none',
          padding: compact ? '6px 10px' : '8px 12px',
          borderRadius: 10,
          border: '1px solid var(--chrome-border, rgba(255,255,255,0.10))',
          background: 'var(--chrome-glass, rgba(255,255,255,0.03))',
          color: 'var(--chrome-text-primary, rgba(255,255,255,0.92))',
          fontSize: compact ? 12 : 13,
          lineHeight: 1.4,
          fontFamily: 'var(--font-ibm-mono, ui-monospace, monospace)',
          cursor: 'pointer',
        }}
      >
        {FORMAT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {displayFormat === 'unix' && (
        <span
          style={{
            fontSize: 10,
            fontWeight: 400,
            lineHeight: 1.4,
            color: 'var(--chrome-text-muted, rgba(255,255,255,0.38))',
            letterSpacing: '0.02em',
            paddingLeft: 4,
          }}
          aria-live="polite"
        >
          UTC-referenced
        </span>
      )}
    </div>
  );
};

export default React.memo(FormatControl);
