'use client';

import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/store';
import { setCommandPaletteOpen } from '../../store/sessionSlice';
import { useDisplayedTime } from '../../hooks/useDisplayedTime';
import { generateShareText, generateShareLink, copyToClipboard } from '../../utils/shareGenerator';
import { showToast } from './Toast';
import { useIsMobile } from '../../hooks/useIsMobile';

/**
 * Bottom bar — Observatory instrument (horizon-observatory.html).
 */
const BottomBar: React.FC = () => {
  const dispatch = useAppDispatch();
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const shareMenuRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const orbs = useAppSelector((s) => s.orbs.list);
  const isFirstZoneState = orbs.length === 1;
  const anchorOrbId = useAppSelector((s) => s.settings.anchorOrbId);
  const scrubOffset = useAppSelector((s) => s.scrub.offset);
  const displayFormat = useAppSelector((s) => s.settings.displayFormat);
  const displayedTime = useDisplayedTime();

  const anchorLabel = useMemo(() => {
    const anchorOrb = anchorOrbId
      ? orbs.find((o) => o.id === anchorOrbId)
      : orbs.find((o) => o.isLocal);
    if (!anchorOrb) return 'Anchor: local';
    const suffix = anchorOrb.isLocal ? ' (local)' : '';
    return `Anchor: ${anchorOrb.label}${suffix}`;
  }, [orbs, anchorOrbId]);

  const handleAddZoneClick = () => {
    dispatch(setCommandPaletteOpen(true));
  };

  useEffect(() => {
    if (!shareMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(e.target as Node)) {
        setShareMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [shareMenuOpen]);

  useEffect(() => {
    if (!shareMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShareMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shareMenuOpen]);

  const handleCopyText = useCallback(async () => {
    const text = generateShareText(orbs, displayedTime, displayFormat, scrubOffset);
    const success = await copyToClipboard(text);
    if (success) {
      showToast('Moment copied');
    } else {
      showToast('Failed to copy', 'warning');
    }
    setShareMenuOpen(false);
  }, [orbs, displayedTime, displayFormat, scrubOffset]);

  const handleShareLink = useCallback(async () => {
    const { url, zonesIncluded } = generateShareLink(scrubOffset, orbs);
    const success = await copyToClipboard(url);
    if (success) {
      if (zonesIncluded) {
        showToast('Link copied to clipboard');
      } else {
        showToast('Link copied (zones omitted — URL too long)', 'warning');
      }
    } else {
      showToast('Failed to copy link', 'warning');
    }
    setShareMenuOpen(false);
  }, [scrubOffset, orbs]);

  const handleShareClick = () => {
    setShareMenuOpen((prev) => !prev);
  };

  return (
    <footer
      data-horizon-bottombar=""
      className="horizon-bottombar observatory-bottom-bar"
    >
      <div className="observatory-bottom-left">
        <button
          type="button"
          className={`observatory-control-btn primary${isFirstZoneState ? ' add-zone-pulse' : ''}`}
          onClick={handleAddZoneClick}
          aria-label="Add zone"
        >
          <svg
            viewBox="0 0 24 24"
            width={11}
            height={11}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            aria-hidden
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span className="add-zone-label">Add zone</span>
          {!isMobile && (
            <span className="add-zone-shortcut" aria-hidden>⌘K</span>
          )}
        </button>
        <span className="observatory-count-badge">
          <b>{orbs.length}</b> zones
        </span>
      </div>

      <div className="observatory-bottom-center">
        <span className="observatory-count-badge observatory-anchor-label">{anchorLabel}</span>
      </div>

      <div ref={shareMenuRef} className="observatory-bottom-right">
        <button
          type="button"
          className="observatory-control-btn ghost"
          onClick={handleShareClick}
          aria-label="Share moment"
          aria-expanded={shareMenuOpen}
          aria-haspopup="true"
        >
          <svg
            viewBox="0 0 24 24"
            width={11}
            height={11}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
          <span className="share-label">Share Moment</span>
        </button>

        {shareMenuOpen && (
          <div
            role="menu"
            aria-label="Share options"
            className="horizon-share-menu observatory-share-menu"
          >
            <ShareMenuItem icon="copy" label="Copy as text" onClick={handleCopyText} />
            <ShareMenuItem icon="link" label="Share as link" onClick={handleShareLink} />
          </div>
        )}
      </div>
    </footer>
  );
};

export default BottomBar;

interface ShareMenuItemProps {
  icon: 'copy' | 'link';
  label: string;
  onClick: () => void;
}

const ShareMenuItem: React.FC<ShareMenuItemProps> = ({ icon, label, onClick }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="observatory-share-menu-item"
      style={{
        background: hovered ? 'var(--paper-deep, #e8dfd0)' : 'transparent',
      }}
    >
      {icon === 'copy' ? (
        <svg
          width={14}
          height={14}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <rect x="9" y="9" width="13" height="13" rx="1" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      ) : (
        <svg
          width={14}
          height={14}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      )}
      {label}
    </button>
  );
};
