'use client';

import React, { useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/store';
import { setHorizonViewMode, setSettingsOpen } from '../../store/sessionSlice';
import type { HorizonViewMode } from '../../store/sessionSlice';
import { useDisplayedTime } from '../../hooks/useDisplayedTime';

function formatTopDate(date: Date): string {
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const months = [
    'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
    'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
  ];
  return `${days[date.getDay()]} · ${months[date.getMonth()]} ${date.getDate()}`;
}

/**
 * Top bar — Observatory edition (horizon-observatory.html).
 */
const TopBar: React.FC = () => {
  const dispatch = useAppDispatch();
  const displayedTime = useDisplayedTime();
  const orbs = useAppSelector((s) => s.orbs.list);
  const horizonViewMode = useAppSelector((s) => s.session.horizonViewMode);

  const localCityName = useMemo(() => {
    const localOrb = orbs.find((o) => o.isLocal);
    if (localOrb) return localOrb.label.toUpperCase();
    try {
      const iana = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const parts = iana.split('/');
      return parts[parts.length - 1].replace(/_/g, ' ').toUpperCase();
    } catch {
      return '';
    }
  }, [orbs]);

  const topDate = useMemo(() => formatTopDate(displayedTime), [displayedTime]);

  const setView = (mode: HorizonViewMode) => {
    dispatch(setHorizonViewMode(mode));
  };

  return (
    <header data-horizon-topbar="" className="observatory-topbar">
      <div className="observatory-topbar-brand">
        <div className="observatory-brand-mark" aria-hidden>
          <svg viewBox="0 0 28 28" width={28} height={28}>
            <circle cx="14" cy="14" r="11" fill="none" stroke="currentColor" strokeWidth={0.7} />
            <line x1="2" y1="14" x2="26" y2="14" stroke="currentColor" strokeWidth={0.7} />
            <circle cx="14" cy="14" r="2.5" fill="var(--ember, #d4502c)" />
          </svg>
        </div>
        <div className="observatory-brand-word">
          <span className="observatory-brand-accent">A</span>
          nd the time is
        </div>
      </div>

      <div className="observatory-topbar-meta">
        <span>{topDate}</span>
        {localCityName && (
          <>
            <span className="observatory-meta-sep">—</span>
            <span>{localCityName}</span>
          </>
        )}
      </div>

      <div className="observatory-topbar-actions">
        <div className="observatory-view-seg" role="tablist" aria-label="View mode">
          <button
            type="button"
            className={`observatory-view-seg-btn${horizonViewMode === 'full' ? ' active' : ''}`}
            aria-selected={horizonViewMode === 'full'}
            onClick={() => setView('full')}
            aria-label="Full view"
          >
            <svg viewBox="0 0 24 24" width={11} height={11} fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="12" cy="12" r="9" />
              <path d="M3 12h18" />
              <path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18" />
            </svg>
            <span className="view-seg-label">Full</span>
          </button>
          <button
            type="button"
            className={`observatory-view-seg-btn${horizonViewMode === 'simple' ? ' active' : ''}`}
            aria-selected={horizonViewMode === 'simple'}
            onClick={() => setView('simple')}
            aria-label="Simple view"
          >
            <svg viewBox="0 0 24 24" width={11} height={11} fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span className="view-seg-label">Simple</span>
          </button>
        </div>
        <button
          type="button"
          className="observatory-icon-btn"
          onClick={() => dispatch(setSettingsOpen(true))}
          aria-label="Open settings"
        >
          <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="12" cy="12" r="2.5" />
            <path d="M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6l1.4 1.4m10 10 1.4 1.4M5.6 18.4l1.4-1.4m10-10 1.4-1.4" />
          </svg>
        </button>
      </div>
    </header>
  );
};

export default TopBar;
