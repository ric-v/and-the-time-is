'use client';

import React, { useCallback, useEffect } from 'react';
import { useAppDispatch } from '../../store/store';
import { removeOrb } from '../../store/orbSlice';
import { formatTime, getLocalHour } from '../../utils/timeEngine';
import {
  getLanternState,
  getLanternLabel,
  getPassSkyLabel,
} from '../../utils/passLayoutEngine';
import type { Orb } from '../../store/orbSlice';
import type { DisplayFormat } from '../../store/settingsSlice';
import { showToast } from './Toast';

export interface PassDetailPanelProps {
  orb: Orb | null;
  displayedTime: Date;
  displayFormat: DisplayFormat;
  onClose: () => void;
}

const PassDetailPanel: React.FC<PassDetailPanelProps> = ({
  orb,
  displayedTime,
  displayFormat,
  onClose,
}) => {
  const dispatch = useAppDispatch();
  const isOpen = orb !== null;

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const handleRemove = useCallback(() => {
    if (!orb || orb.isLocal) return;
    dispatch(removeOrb(orb.id));
    showToast(`${orb.label} removed`);
    onClose();
  }, [dispatch, orb, onClose]);

  if (!orb) {
    return (
      <div
        className="pass-detail-panel"
        role="dialog"
        aria-labelledby="pass-detail-city"
        aria-hidden="true"
      />
    );
  }

  const localHour = getLocalHour(orb.ianaName, displayedTime);
  const lantern = getLanternState(localHour);
  const timeLabel = formatTime(orb.ianaName, displayedTime, displayFormat);

  return (
    <div
      className={`pass-detail-panel${isOpen ? ' open' : ''}`}
      role="dialog"
      aria-labelledby="pass-detail-city"
      aria-hidden={!isOpen}
    >
      <button
        type="button"
        className="pass-detail-close"
        onClick={onClose}
        aria-label="Close detail panel"
      >
        &times;
      </button>
      <div className="pass-detail-city" id="pass-detail-city">
        {orb.label}
      </div>
      <div className="pass-detail-iana">{orb.ianaName}</div>
      <div className="pass-detail-row">
        <div>
          <span>Time </span>
          <strong>{timeLabel}</strong>
        </div>
        <div>
          <span>Sky </span>
          <strong>{getPassSkyLabel(localHour)}</strong>
        </div>
        <div>
          <span>State </span>
          <strong>{getLanternLabel(lantern)}</strong>
        </div>
      </div>
      <div className="pass-detail-actions">
        <button
          type="button"
          className="pass-detail-remove"
          onClick={handleRemove}
          disabled={orb.isLocal}
          aria-label={orb.isLocal ? 'Cannot remove local zone' : `Remove ${orb.label}`}
        >
          Remove zone
        </button>
      </div>
    </div>
  );
};

export default React.memo(PassDetailPanel);
