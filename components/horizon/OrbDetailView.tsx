'use client';

/**
 * OrbDetailView — Expanded orb detail panel overlay.
 *
 * This is the HTML panel that appears when a user clicks a Zone Orb.
 * The 3D expand/collapse animation of the orb itself is handled by
 * useSceneOrchestrator — this component renders the metadata panel,
 * action buttons, and inline rename/remove flows.
 *
 * Layout (UI-UX-Spec Section 8):
 *   - 480px wide on desktop, full-width on mobile
 *   - Glass-chrome panel with 20px border-radius, backdrop-blur 28px
 *   - City label (text-xl, weight 400) with pencil edit icon
 *   - Meta line: IANA abbreviation · UTC offset (text-xs uppercase)
 *   - Time readout: display-2 (88px), tabular-nums, weight 100
 *   - Local date, relative offset chip
 *   - Action buttons: Copy Time, Copy Full, Rename, Set as Anchor, Remove, Close
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.9, 7.10
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/store';
import { setExpandedOrb } from '../../store/sessionSlice';
import { renameOrb, removeOrb } from '../../store/orbSlice';
import { setAnchorOrb } from '../../store/settingsSlice';
import { useDisplayedTime } from '../../hooks/useDisplayedTime';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import {
  formatTime,
  getUtcOffsetAtTime,
  getLocalHour,
} from '../../utils/timeEngine';
import { get24StatePaletteForHour } from '../../utils/skyPaletteEngine';
import TimeDisplay from './TimeDisplay';
import OverlayBackdrop from './OverlayBackdrop';
import { showToast } from './Toast';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_LABEL_LENGTH = 30;
const CHAR_COUNTER_THRESHOLD = 25;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Get the timezone abbreviation for a given IANA name at a specific time.
 */
function getTimezoneAbbreviation(ianaName: string, time: Date): string {
  try {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone: ianaName,
      timeZoneName: 'short',
    });
    const parts = dtf.formatToParts(time);
    return parts.find((p) => p.type === 'timeZoneName')?.value ?? '';
  } catch {
    return '';
  }
}

/**
 * Format the local date for a timezone at a given time.
 */
function formatLocalDate(ianaName: string, time: Date): string {
  try {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone: ianaName,
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    return dtf.format(time);
  } catch {
    return '';
  }
}

/**
 * Check if DST is in effect for a timezone at a given time.
 */
function isDstInEffect(ianaName: string, time: Date): boolean {
  try {
    // Compare the offset at this time vs January 1 and July 1
    const jan = new Date(time.getFullYear(), 0, 1);
    const jul = new Date(time.getFullYear(), 6, 1);
    const offsetNow = getUtcOffsetAtTime(ianaName, time);
    const offsetJan = getUtcOffsetAtTime(ianaName, jan);
    const offsetJul = getUtcOffsetAtTime(ianaName, jul);
    // If all three are the same, no DST
    if (offsetJan === offsetJul) return false;
    // DST is in effect if current offset differs from the "standard" offset
    // Standard is typically the one with the smaller absolute offset
    return offsetNow !== offsetJan && offsetNow !== offsetJul
      ? false // edge case
      : offsetNow !== offsetJan
        ? offsetJan === offsetJul
          ? false
          : true
        : false;
  } catch {
    return false;
  }
}

/**
 * Compute relative offset string between two timezones.
 */
function computeRelativeOffset(
  orbIana: string,
  anchorIana: string,
  time: Date,
): string {
  const orbOffset = getUtcOffsetAtTime(orbIana, time);
  const anchorOffset = getUtcOffsetAtTime(anchorIana, time);

  // Parse offset strings to minutes
  const parseOffset = (s: string): number => {
    const match = s.match(/^([+-])(\d{2}):(\d{2})$/);
    if (!match) return 0;
    const sign = match[1] === '+' ? 1 : -1;
    return sign * (parseInt(match[2], 10) * 60 + parseInt(match[3], 10));
  };

  const diffMinutes = parseOffset(orbOffset) - parseOffset(anchorOffset);
  if (diffMinutes === 0) return 'Same time';

  const sign = diffMinutes > 0 ? '+' : '-';
  const abs = Math.abs(diffMinutes);
  const hours = Math.floor(abs / 60);
  const mins = abs % 60;

  let result = sign;
  if (hours > 0) result += `${hours}h`;
  if (mins > 0) result += `${hours > 0 ? ' ' : ''}${mins}m`;

  return result;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Pill-style action button */
const ActionButton: React.FC<{
  label: string;
  onClick: () => void;
  variant?: 'accent' | 'ghost' | 'danger';
  disabled?: boolean;
  title?: string;
}> = ({ label, onClick, variant = 'ghost', disabled = false, title }) => {
  const [hovered, setHovered] = useState(false);

  const bgColor =
    variant === 'accent'
      ? 'var(--accent-soft)'
      : hovered && variant === 'danger'
        ? 'var(--danger-soft)'
        : hovered
          ? 'rgba(255, 255, 255, 0.06)'
          : 'transparent';

  const textColor =
    variant === 'accent'
      ? 'var(--accent)'
      : hovered && variant === 'danger'
        ? 'var(--danger-text)'
        : 'var(--chrome-text-primary)';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        height: 36,
        padding: '0 14px',
        borderRadius: 18,
        border: '1px solid var(--chrome-border)',
        background: bgColor,
        color: textColor,
        fontSize: 13,
        fontWeight: 500,
        lineHeight: 1.45,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'background 100ms ease-out, color 100ms ease-out',
        whiteSpace: 'nowrap',
        fontFamily: 'var(--font-inter)',
      }}
    >
      {label}
    </button>
  );
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const OrbDetailView: React.FC = () => {
  const dispatch = useAppDispatch();
  const expandedOrbId = useAppSelector((s) => s.session.expandedOrbId);
  const orbs = useAppSelector((s) => s.orbs.list);
  const displayFormat = useAppSelector((s) => s.settings.displayFormat);
  const anchorOrbId = useAppSelector((s) => s.settings.anchorOrbId);
  const displayedTime = useDisplayedTime();

  // Local state
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Find the expanded orb
  const orb = useMemo(
    () => orbs.find((o) => o.id === expandedOrbId) ?? null,
    [orbs, expandedOrbId],
  );

  // Find the anchor orb (defaults to Local Orb)
  const anchorOrb = useMemo(() => {
    if (anchorOrbId) return orbs.find((o) => o.id === anchorOrbId) ?? null;
    return orbs.find((o) => o.isLocal) ?? null;
  }, [orbs, anchorOrbId]);

  const isOpen = orb !== null;

  // Focus trap: traps Tab/Shift+Tab within the dialog panel,
  // and restores focus to the originating orb on dismissal.
  // Requirements: 7.8, 13.1
  useFocusTrap(panelRef, isOpen);

  const isLocal = orb?.isLocal ?? false;
  const isCurrentAnchor = orb?.id === (anchorOrbId ?? orbs.find((o) => o.isLocal)?.id);

  // Computed values for the expanded orb
  const localHour = orb ? getLocalHour(orb.ianaName, displayedTime) : 0;
  const palette = get24StatePaletteForHour(localHour);
  const formattedTime = orb
    ? formatTime(orb.ianaName, displayedTime, displayFormat)
    : '';
  const utcOffset = orb ? getUtcOffsetAtTime(orb.ianaName, displayedTime) : '';
  const abbreviation = orb
    ? getTimezoneAbbreviation(orb.ianaName, displayedTime)
    : '';
  const localDate = orb ? formatLocalDate(orb.ianaName, displayedTime) : '';
  const dstActive = orb ? isDstInEffect(orb.ianaName, displayedTime) : false;
  const relativeOffset =
    orb && anchorOrb && orb.id !== anchorOrb.id
      ? computeRelativeOffset(orb.ianaName, anchorOrb.ianaName, displayedTime)
      : '';
  const anchorLabel = anchorOrb
    ? `${anchorOrb.label}${anchorOrb.isLocal ? ' (you)' : ''}`
    : '';

  // -------------------------------------------------------------------------
  // Close handler
  // -------------------------------------------------------------------------
  const handleClose = useCallback(() => {
    setIsRenaming(false);
    setShowRemoveConfirm(false);
    dispatch(setExpandedOrb(null));
  }, [dispatch]);

  // -------------------------------------------------------------------------
  // Reset local state when orb changes
  // -------------------------------------------------------------------------
  useEffect(() => {
    setIsRenaming(false);
    setShowRemoveConfirm(false);
  }, [expandedOrbId]);

  // -------------------------------------------------------------------------
  // Inline rename
  // -------------------------------------------------------------------------
  const startRename = useCallback(() => {
    if (!orb) return;
    setRenameValue(orb.label);
    setIsRenaming(true);
    // Focus the input after render
    requestAnimationFrame(() => {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    });
  }, [orb]);

  const commitRename = useCallback(() => {
    if (!orb) return;
    const trimmed = renameValue.trim();
    if (trimmed.length > 0 && trimmed.length <= MAX_LABEL_LENGTH) {
      dispatch(renameOrb({ id: orb.id, label: trimmed }));
    }
    setIsRenaming(false);
  }, [dispatch, orb, renameValue]);

  const cancelRename = useCallback(() => {
    setIsRenaming(false);
  }, []);

  const handleRenameKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        commitRename();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelRename();
      }
    },
    [commitRename, cancelRename],
  );

  // -------------------------------------------------------------------------
  // Copy actions
  // -------------------------------------------------------------------------
  const handleCopyTime = useCallback(() => {
    if (!orb) return;
    navigator.clipboard.writeText(formattedTime).then(() => {
      showToast('Time copied');
    });
  }, [orb, formattedTime]);

  const handleCopyFull = useCallback(() => {
    if (!orb) return;
    const text = `${orb.label} — ${formattedTime} (UTC${utcOffset})`;
    navigator.clipboard.writeText(text).then(() => {
      showToast('Full details copied');
    });
  }, [orb, formattedTime, utcOffset]);

  // -------------------------------------------------------------------------
  // Set as Anchor
  // -------------------------------------------------------------------------
  const handleSetAnchor = useCallback(() => {
    if (!orb) return;
    if (isCurrentAnchor) {
      // Reset to Local Orb
      dispatch(setAnchorOrb(null));
      showToast('Anchor reset to local');
    } else {
      dispatch(setAnchorOrb(orb.id));
      showToast(`Anchor set to ${orb.label}`);
    }
  }, [dispatch, orb, isCurrentAnchor]);

  // -------------------------------------------------------------------------
  // Remove Zone
  // -------------------------------------------------------------------------
  const handleRemoveClick = useCallback(() => {
    setShowRemoveConfirm(true);
  }, []);

  const handleRemoveConfirm = useCallback(() => {
    if (!orb) return;
    dispatch(removeOrb(orb.id));
    // If this was the anchor, reset
    if (anchorOrbId === orb.id) {
      dispatch(setAnchorOrb(null));
    }
    setShowRemoveConfirm(false);
    dispatch(setExpandedOrb(null));
    showToast(`${orb.label} removed`);
  }, [dispatch, orb, anchorOrbId]);

  const handleRemoveCancel = useCallback(() => {
    setShowRemoveConfirm(false);
  }, []);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  if (!isOpen) return null;

  return (
    <OverlayBackdrop
      isOpen={isOpen}
      onClose={handleClose}
      ariaLabel="Orb detail view"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="orb-detail-city-label"
        className="orb-detail-panel"
        style={{
          width: 480,
          maxWidth: '100vw',
          background: 'var(--chrome-glass)',
          backdropFilter: 'blur(28px) saturate(140%)',
          WebkitBackdropFilter: 'blur(28px) saturate(140%)',
          border: '1px solid var(--chrome-border)',
          borderRadius: 20,
          padding: '32px 24px 24px',
          position: 'relative',
          color: 'var(--chrome-text-primary)',
        }}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          aria-label="Close detail view"
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            width: 28,
            height: 28,
            borderRadius: 14,
            border: '1px solid var(--chrome-border)',
            background: 'transparent',
            color: 'var(--chrome-text-secondary)',
            fontSize: 16,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
            transition: 'background 100ms ease-out',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              'rgba(255, 255, 255, 0.06)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
          }}
        >
          ×
        </button>

        {/* Expanded orb color swatch */}
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: `linear-gradient(180deg, ${palette.bg} 0%, ${palette.horizon} 100%)`,
            margin: '0 auto 16px',
            border: isLocal ? '2px solid var(--accent)' : '1px solid var(--chrome-border)',
          }}
        />

        {/* City label + pencil edit */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginBottom: 4,
          }}
        >
          {isRenaming ? (
            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
              <input
                ref={renameInputRef}
                type="text"
                value={renameValue}
                onChange={(e) =>
                  setRenameValue(e.target.value.slice(0, MAX_LABEL_LENGTH))
                }
                onKeyDown={handleRenameKeyDown}
                onBlur={commitRename}
                maxLength={MAX_LABEL_LENGTH}
                style={{
                  fontSize: 32,
                  fontWeight: 400,
                  lineHeight: 1.2,
                  color: 'var(--chrome-text-primary)',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid var(--accent)',
                  borderRadius: 8,
                  padding: '4px 8px',
                  outline: 'none',
                  textAlign: 'center',
                  fontFamily: 'var(--font-inter)',
                  width: '100%',
                  maxWidth: 360,
                }}
                aria-label="Rename timezone"
              />
              {renameValue.length > CHAR_COUNTER_THRESHOLD && (
                <span
                  style={{
                    position: 'absolute',
                    right: -40,
                    fontSize: 11,
                    color: 'var(--chrome-text-muted)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {renameValue.length}/{MAX_LABEL_LENGTH}
                </span>
              )}
            </div>
          ) : (
            <>
              <h2
                id="orb-detail-city-label"
                style={{
                  fontSize: 32,
                  fontWeight: 400,
                  lineHeight: 1.2,
                  color: 'var(--chrome-text-primary)',
                  margin: 0,
                  fontFamily: 'var(--font-inter)',
                }}
              >
                {orb!.label}
              </h2>
              <button
                onClick={startRename}
                aria-label="Rename timezone"
                style={{
                  width: 24,
                  height: 24,
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--chrome-text-muted)',
                  cursor: 'pointer',
                  fontSize: 14,
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'color 100ms ease-out',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color =
                    'var(--chrome-text-primary)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color =
                    'var(--chrome-text-muted)';
                }}
              >
                ✎
              </button>
            </>
          )}
        </div>

        {/* Meta line: abbreviation · UTC offset · IANA name */}
        <div
          style={{
            textAlign: 'center',
            fontSize: 11,
            fontWeight: 500,
            lineHeight: 1.4,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--chrome-text-secondary)',
            marginBottom: 16,
          }}
        >
          {abbreviation && <span>{abbreviation}</span>}
          {abbreviation && <span style={{ margin: '0 6px', opacity: 0.5 }}>·</span>}
          <span>UTC{utcOffset}</span>
          {dstActive && (
            <>
              <span style={{ margin: '0 6px', opacity: 0.5 }}>·</span>
              <span style={{ color: 'var(--accent)' }}>DST</span>
            </>
          )}
        </div>

        {/* Time readout — display-2 (88px) */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: 4,
          }}
        >
          <TimeDisplay
            formattedTime={formattedTime}
            displayFormat={displayFormat}
            fontSize={88}
            fontWeight={100}
            color={palette.text}
          />
        </div>

        {/* Local date */}
        <div
          style={{
            textAlign: 'center',
            fontSize: 13,
            fontWeight: 400,
            lineHeight: 1.45,
            color: 'var(--chrome-text-secondary)',
            marginBottom: 12,
          }}
        >
          {localDate}
        </div>

        {/* IANA name */}
        <div
          style={{
            textAlign: 'center',
            fontSize: 11,
            fontWeight: 400,
            lineHeight: 1.4,
            color: 'var(--chrome-text-muted)',
            fontFamily: 'var(--font-mono)',
            marginBottom: 12,
          }}
        >
          {orb!.ianaName}
        </div>

        {/* Relative offset chip */}
        {relativeOffset && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: 20,
            }}
          >
            <div
              style={{
                height: 28,
                padding: '0 12px',
                borderRadius: 12,
                background: 'var(--chrome-glass)',
                border: '1px solid var(--chrome-border)',
                display: 'inline-flex',
                alignItems: 'center',
                fontSize: 13,
                fontWeight: 400,
                lineHeight: 1.45,
                color: 'var(--chrome-text-muted)',
              }}
            >
              {relativeOffset} from {anchorLabel}
            </div>
          </div>
        )}

        {/* Remove confirm strip */}
        {showRemoveConfirm && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '8px 12px',
              marginBottom: 12,
              borderRadius: 12,
              background: 'var(--danger-soft)',
              border: '1px solid rgba(230, 120, 120, 0.25)',
            }}
          >
            <span
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--danger-text)',
              }}
            >
              Remove {orb!.label}?
            </span>
            <button
              onClick={handleRemoveCancel}
              style={{
                height: 28,
                padding: '0 10px',
                borderRadius: 14,
                border: '1px solid var(--chrome-border)',
                background: 'transparent',
                color: 'var(--chrome-text-primary)',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleRemoveConfirm}
              style={{
                height: 28,
                padding: '0 10px',
                borderRadius: 14,
                border: '1px solid rgba(230, 120, 120, 0.3)',
                background: 'var(--danger-soft)',
                color: 'var(--danger-text)',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Yes, remove
            </button>
          </div>
        )}

        {/* Action buttons — grouped by intent */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Primary: edit actions */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <ActionButton
              label={isRenaming ? 'Editing…' : 'Rename'}
              onClick={startRename}
              disabled={isRenaming}
            />
            <ActionButton
              label={isCurrentAnchor ? 'Anchor: this zone' : 'Set as Anchor'}
              onClick={handleSetAnchor}
              variant={isCurrentAnchor ? 'accent' : 'ghost'}
            />
          </div>
          {/* Secondary: copy actions */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <ActionButton
              label="Copy Time"
              onClick={handleCopyTime}
            />
            <ActionButton
              label="Copy Full"
              onClick={handleCopyFull}
            />
          </div>
          {/* Danger: remove */}
          {!isLocal && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 4 }}>
              <ActionButton
                label="Remove zone"
                onClick={handleRemoveClick}
                variant="danger"
                disabled={showRemoveConfirm}
              />
            </div>
          )}
        </div>
      </div>
    </OverlayBackdrop>
  );
};

export default React.memo(OrbDetailView);
