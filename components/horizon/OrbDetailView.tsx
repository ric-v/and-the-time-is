'use client';

/**
 * OrbDetailView — Expanded orb detail panel overlay (Orrery almanac card).
 *
 * Requirements: 7.1–7.10
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/store';
import { setExpandedOrb } from '../../store/sessionSlice';
import { renameOrb, removeOrb } from '../../store/orbSlice';
import { setAnchorOrb } from '../../store/settingsSlice';
import type { DisplayFormat } from '../../store/settingsSlice';
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

const MAX_LABEL_LENGTH = 30;
const CHAR_COUNTER_THRESHOLD = 25;

function isClockDisplayFormat(fmt: DisplayFormat): boolean {
  return fmt === '24h' || fmt === '12h' || fmt === 'local';
}

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

function isDstInEffect(ianaName: string, time: Date): boolean {
  try {
    const jan = new Date(time.getFullYear(), 0, 1);
    const jul = new Date(time.getFullYear(), 6, 1);
    const offsetNow = getUtcOffsetAtTime(ianaName, time);
    const offsetJan = getUtcOffsetAtTime(ianaName, jan);
    const offsetJul = getUtcOffsetAtTime(ianaName, jul);
    if (offsetJan === offsetJul) return false;
    return offsetNow !== offsetJan && offsetNow !== offsetJul
      ? false
      : offsetNow !== offsetJan
        ? offsetJan === offsetJul
          ? false
          : true
        : false;
  } catch {
    return false;
  }
}

function computeRelativeOffset(
  orbIana: string,
  anchorIana: string,
  time: Date,
): string {
  const orbOffset = getUtcOffsetAtTime(orbIana, time);
  const anchorOffset = getUtcOffsetAtTime(anchorIana, time);

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

const OrbDetailView: React.FC = () => {
  const dispatch = useAppDispatch();
  const expandedOrbId = useAppSelector((s) => s.session.expandedOrbId);
  const orbs = useAppSelector((s) => s.orbs.list);
  const displayFormat = useAppSelector((s) => s.settings.displayFormat);
  const anchorOrbId = useAppSelector((s) => s.settings.anchorOrbId);
  const displayedTime = useDisplayedTime();

  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const orb = useMemo(
    () => orbs.find((o) => o.id === expandedOrbId) ?? null,
    [orbs, expandedOrbId],
  );

  const anchorOrb = useMemo(() => {
    if (anchorOrbId) return orbs.find((o) => o.id === anchorOrbId) ?? null;
    return orbs.find((o) => o.isLocal) ?? null;
  }, [orbs, anchorOrbId]);

  const isOpen = orb !== null;

  useFocusTrap(panelRef, isOpen);

  const isLocal = orb?.isLocal ?? false;
  const isCurrentAnchor = orb?.id === (anchorOrbId ?? orbs.find((o) => o.isLocal)?.id);

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

  const handleClose = useCallback(() => {
    setIsRenaming(false);
    setShowRemoveConfirm(false);
    dispatch(setExpandedOrb(null));
  }, [dispatch]);

  useEffect(() => {
    setIsRenaming(false);
    setShowRemoveConfirm(false);
  }, [expandedOrbId]);

  const startRename = useCallback(() => {
    if (!orb) return;
    setRenameValue(orb.label);
    setIsRenaming(true);
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

  const handleSetAnchor = useCallback(() => {
    if (!orb) return;
    if (isCurrentAnchor) {
      dispatch(setAnchorOrb(null));
      showToast('Anchor reset to local');
    } else {
      dispatch(setAnchorOrb(orb.id));
      showToast(`Anchor set to ${orb.label}`);
    }
  }, [dispatch, orb, isCurrentAnchor]);

  const handleRemoveClick = useCallback(() => {
    setShowRemoveConfirm(true);
  }, []);

  const handleRemoveConfirm = useCallback(() => {
    if (!orb) return;
    dispatch(removeOrb(orb.id));
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

  if (!isOpen) return null;

  const clockDisplay = isClockDisplayFormat(displayFormat);

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
      >
        <div className="orb-detail-panel-inner">
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close detail view"
            className="orb-detail-close"
          >
            ×
          </button>

          <div className="orb-detail-disc-wrap">
            <div className="orb-detail-pedestal" aria-hidden />
            <div
              className={`orb-detail-disc${isLocal ? ' is-local' : ''}`}
              style={{
                background: `linear-gradient(180deg, ${palette.bg} 0%, ${palette.horizon} 100%)`,
              }}
              aria-hidden
            />
          </div>

          <header className="orb-detail-header">
            {isRenaming ? (
              <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
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
                  className="orb-detail-rename-input"
                  aria-label="Rename timezone"
                />
                {renameValue.length > CHAR_COUNTER_THRESHOLD && (
                  <span
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: 10,
                      color: 'var(--ink-3)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {renameValue.length}/{MAX_LABEL_LENGTH}
                  </span>
                )}
              </div>
            ) : (
              <>
                <h2 id="orb-detail-city-label" className="orb-detail-city">
                  {orb!.label}
                </h2>
                <button
                  type="button"
                  onClick={startRename}
                  aria-label="Rename timezone"
                  className="orb-detail-edit"
                >
                  ✎
                </button>
              </>
            )}
          </header>

          <p className="orb-detail-meta">
            {abbreviation && <span>{abbreviation}</span>}
            {abbreviation && <span className="orb-detail-meta-sep">·</span>}
            <span>UTC{utcOffset}</span>
            {dstActive && (
              <>
                <span className="orb-detail-meta-sep">·</span>
                <span className="orb-detail-meta-dst">DST</span>
              </>
            )}
          </p>

          <div className="orb-detail-time-block">
            <TimeDisplay
              formattedTime={formattedTime}
              displayFormat={displayFormat}
              fontSize={clockDisplay ? 56 : 15}
              fontWeight={400}
              color="var(--ink)"
              className={`orb-detail-time-display${clockDisplay ? '' : ' orb-detail-time-display--long'}`}
              style={clockDisplay ? undefined : { whiteSpace: 'normal' }}
            />
          </div>

          <p className="orb-detail-date">{localDate}</p>
          <p className="orb-detail-iana">{orb!.ianaName}</p>

          {relativeOffset && (
            <div className="orb-detail-offset">
              <span className="orb-detail-offset-chip">
                {relativeOffset} from {anchorLabel}
              </span>
            </div>
          )}

          {showRemoveConfirm && (
            <div className="orb-detail-remove-strip">
              <span className="orb-detail-remove-text">
                Remove {orb!.label}?
              </span>
              <button
                type="button"
                onClick={handleRemoveCancel}
                className="orb-detail-btn orb-detail-btn--ghost"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRemoveConfirm}
                className="orb-detail-btn orb-detail-btn--danger"
              >
                Yes, remove
              </button>
            </div>
          )}

          <div className="orb-detail-actions">
            <div className="orb-detail-actions-row">
              <button
                type="button"
                className="orb-detail-btn"
                onClick={startRename}
                disabled={isRenaming}
              >
                {isRenaming ? 'Editing…' : 'Rename'}
              </button>
              <button
                type="button"
                className={`orb-detail-btn${isCurrentAnchor ? ' orb-detail-btn--primary' : ''}`}
                onClick={handleSetAnchor}
              >
                {isCurrentAnchor ? 'Anchor: this zone' : 'Set as Anchor'}
              </button>
            </div>
            <div className="orb-detail-actions-row">
              <button
                type="button"
                className="orb-detail-btn"
                onClick={handleCopyTime}
              >
                Copy Time
              </button>
              <button
                type="button"
                className="orb-detail-btn"
                onClick={handleCopyFull}
              >
                Copy Full
              </button>
            </div>
            {!isLocal && (
              <div className="orb-detail-actions-row">
                <button
                  type="button"
                  className="orb-detail-btn orb-detail-btn--danger"
                  onClick={handleRemoveClick}
                  disabled={showRemoveConfirm}
                >
                  Remove zone
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </OverlayBackdrop>
  );
};

export default React.memo(OrbDetailView);
