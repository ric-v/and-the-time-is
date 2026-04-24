/**
 * FormatControl — Segmented control for switching the global display format.
 *
 * Renders four options: 24h, 12h, ISO, Unix.
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
  { value: '24h', label: '24h' },
  { value: '12h', label: '12h' },
  { value: 'iso', label: 'ISO' },
  { value: 'unix', label: 'Unix' },
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
    <div
      role="radiogroup"
      aria-label="Time display format"
      style={{ display: 'inline-flex', flexDirection: 'column', gap: 6 }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0,
          padding: 2,
          borderRadius: 10,
          background: 'rgba(255, 255, 255, 0.06)',
          border: '1px solid var(--chrome-border, rgba(255,255,255,0.10))',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      >
        {FORMAT_OPTIONS.map((option) => {
          const isSelected = displayFormat === option.value;

          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`${option.label} format`}
              onClick={() => handleSelect(option.value)}
              style={{
                position: 'relative',
                padding: compact ? '4px 10px' : '6px 14px',
                fontSize: compact ? 11 : 13,
                fontWeight: isSelected ? 500 : 400,
                lineHeight: 1.4,
                color: isSelected
                  ? 'var(--format-on-accent, var(--chrome-text-primary, rgba(255,255,255,0.92)))'
                  : 'var(--chrome-text-secondary, rgba(255,255,255,0.62))',
                background: isSelected
                  ? 'var(--accent, #f4c572)'
                  : 'transparent',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'all 150ms ease-out',
                whiteSpace: 'nowrap',
                fontFamily:
                  option.value === 'iso' || option.value === 'unix'
                    ? 'var(--font-mono, ui-monospace, monospace)'
                    : 'var(--font-inter, ui-sans-serif, system-ui, sans-serif)',
                // Selected segment uses dark text on accent background
                ...(isSelected && {
                  color: 'rgba(20, 18, 14, 0.9)',
                }),
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  (e.currentTarget as HTMLElement).style.background =
                    'rgba(255, 255, 255, 0.08)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  (e.currentTarget as HTMLElement).style.background =
                    'transparent';
                }
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {/* "UTC-referenced" hint when Unix format is selected */}
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
